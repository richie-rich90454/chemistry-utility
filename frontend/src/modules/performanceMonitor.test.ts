import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PerformanceMonitor } from "./performanceMonitor.js";

describe("PerformanceMonitor", () => {
    let originalPerformance: typeof performance;
    let originalPerformanceObserver: typeof PerformanceObserver;

    beforeEach(() => {
        PerformanceMonitor.resetInstance();
        originalPerformance = globalThis.performance;
        originalPerformanceObserver = globalThis.PerformanceObserver;
    });

    afterEach(() => {
        PerformanceMonitor.resetInstance();
        globalThis.performance = originalPerformance;
        if (originalPerformanceObserver) {
            globalThis.PerformanceObserver = originalPerformanceObserver;
        }
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(PerformanceMonitor.getInstance()).toBe(PerformanceMonitor.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = PerformanceMonitor.getInstance();
        PerformanceMonitor.resetInstance();
        const second = PerformanceMonitor.getInstance();
        expect(first).not.toBe(second);
    });

    describe("report", () => {
        it("returns an empty object before measure is called", () => {
            expect(PerformanceMonitor.getInstance().report()).toEqual({});
        });

        it("returns a new object instance each call (not a reference)", () => {
            const monitor = PerformanceMonitor.getInstance();
            const report1 = monitor.report();
            const report2 = monitor.report();
            expect(report1).not.toBe(report2);
        });
    });

    describe("measure", () => {
        it("does not throw when called with default environment", () => {
            expect(() => PerformanceMonitor.getInstance().measure()).not.toThrow();
        });

        it("measures TTFB from navigation timing entries", () => {
            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([
                    { responseStart: 200, requestStart: 100 }
                ])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;

            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            expect(monitor.report()["ttfb"]).toBe(100);
        });

        it("does not set ttfb when there are no navigation entries", () => {
            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;

            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            expect(monitor.report()["ttfb"]).toBeUndefined();
        });

        it("does not throw when performance.getEntriesByType throws", () => {
            const mockPerformance = {
                getEntriesByType: vi.fn().mockImplementation(() => {
                    throw new Error("not available");
                })
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;

            const monitor = PerformanceMonitor.getInstance();
            expect(() => monitor.measure()).not.toThrow();
            expect(monitor.report()["ttfb"]).toBeUndefined();
        });
    });

    describe("measure with PerformanceObserver", () => {
        let observeSpy: ReturnType<typeof vi.fn>;
        let disconnectSpy: ReturnType<typeof vi.fn>;
        let observerCallbacks: Array<(entryList: PerformanceObserverEntryList) => void>;

        beforeEach(() => {
            observeSpy = vi.fn();
            disconnectSpy = vi.fn();
            observerCallbacks = [];

            function MockPerformanceObserver(this: { observe: typeof observeSpy; disconnect: typeof disconnectSpy }, callback: (entryList: PerformanceObserverEntryList) => void): void {
                this.observe = observeSpy;
                this.disconnect = disconnectSpy;
                observerCallbacks.push(callback);
            }

            // @ts-expect-error - overriding for test
            globalThis.PerformanceObserver = MockPerformanceObserver;

            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;
        });

        it("creates 3 observers for LCP, CLS, and INP", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            // 3 observers: LCP, CLS, INP
            expect(observerCallbacks.length).toBe(3);
            expect(observeSpy).toHaveBeenCalledTimes(3);
            expect(observeSpy).toHaveBeenCalledWith({ type: "largest-contentful-paint", buffered: true });
            expect(observeSpy).toHaveBeenCalledWith({ type: "layout-shift", buffered: true });
            expect(observeSpy).toHaveBeenCalledWith({ type: "event", buffered: true });
        });

        it("captures LCP entry via observer callback", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            // First callback is for LCP
            const lcpCallback = observerCallbacks[0];
            const mockEntryList = {
                getEntries: () => [
                    { startTime: 2500 },
                    { startTime: 3200 }
                ]
            } as unknown as PerformanceObserverEntryList;
            lcpCallback(mockEntryList);
            expect(monitor.report()["lcp"]).toBe(3200);
        });

        it("does not set lcp when entries are empty", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            const lcpCallback = observerCallbacks[0];
            const mockEntryList = {
                getEntries: () => []
            } as unknown as PerformanceObserverEntryList;
            lcpCallback(mockEntryList);
            expect(monitor.report()["lcp"]).toBeUndefined();
        });

        it("accumulates CLS values from layout-shift entries", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            // Second callback is for CLS
            const clsCallback = observerCallbacks[1];
            const mockEntryList = {
                getEntries: () => [
                    { hadRecentInput: false, value: 0.1 },
                    { hadRecentInput: false, value: 0.05 },
                    { hadRecentInput: true, value: 0.5 }
                ]
            } as unknown as PerformanceObserverEntryList;
            clsCallback(mockEntryList);
            expect(monitor.report()["cls"]).toBeCloseTo(0.15, 5);
        });

        it("captures INP as the maximum interaction duration", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            // Third callback is for INP
            const inpCallback = observerCallbacks[2];
            const mockEntryList = {
                getEntries: () => [
                    { duration: 50 },
                    { duration: 200 },
                    { duration: 100 }
                ]
            } as unknown as PerformanceObserverEntryList;
            inpCallback(mockEntryList);
            expect(monitor.report()["inp"]).toBe(200);
        });
    });

    describe("measure with PerformanceObserver that throws", () => {
        beforeEach(() => {
            // Mock PerformanceObserver constructor that throws
            function ThrowingObserver(): void {
                throw new Error("not supported");
            }
            // @ts-expect-error - overriding for test
            globalThis.PerformanceObserver = ThrowingObserver;

            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;
        });

        it("does not throw when PerformanceObserver constructor throws", () => {
            const monitor = PerformanceMonitor.getInstance();
            expect(() => monitor.measure()).not.toThrow();
            // TTFB still gets measured
            // (navigation entries are empty in this mock, so ttfb is undefined)
        });
    });

    describe("trackCalculation", () => {
        it("stores calculation duration with calc: prefix in report", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackCalculation("molar-mass", 42);
            expect(monitor.report()["calc:molar-mass"]).toBe(42);
        });

        it("overwrites previous value when called with same name", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackCalculation("molar-mass", 42);
            monitor.trackCalculation("molar-mass", 100);
            expect(monitor.report()["calc:molar-mass"]).toBe(100);
        });

        it("does not affect core metrics keys", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackCalculation("molar-mass", 42);
            expect(monitor.report()["ttfb"]).toBeUndefined();
            expect(monitor.report()["lcp"]).toBeUndefined();
        });
    });

    describe("trackApiCall", () => {
        it("stores API call duration with api: prefix in report", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackApiCall("/api/v1/compounds", 150);
            expect(monitor.report()["api:/api/v1/compounds"]).toBe(150);
        });

        it("overwrites previous value when called with same endpoint", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackApiCall("/api/v1/compounds", 150);
            monitor.trackApiCall("/api/v1/compounds", 200);
            expect(monitor.report()["api:/api/v1/compounds"]).toBe(200);
        });

        it("tracks multiple endpoints independently", () => {
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackApiCall("/api/v1/compounds", 150);
            monitor.trackApiCall("/api/v1/elements", 80);
            expect(monitor.report()["api:/api/v1/compounds"]).toBe(150);
            expect(monitor.report()["api:/api/v1/elements"]).toBe(80);
        });
    });

    describe("reportToConsole", () => {
        it("calls console.info with metrics in dev mode", () => {
            const infoSpy = vi.spyOn(console, "info").mockImplementation(function (): void {});
            const monitor = PerformanceMonitor.getInstance();
            monitor.trackCalculation("test-calc", 50);
            monitor.reportToConsole();
            expect(infoSpy).toHaveBeenCalled();
            expect(infoSpy).toHaveBeenCalledWith("[Performance] Metrics:", expect.objectContaining({ "calc:test-calc": 50 }));
        });

        it("does not call console.info in production mode", () => {
            // detectProduction reads import.meta.env.PROD (the Vite build flag).
            const env = import.meta.env as { PROD: boolean };
            const originalProd = env.PROD;
            env.PROD = true;
            try {
                PerformanceMonitor.resetInstance();
                const infoSpy = vi.spyOn(console, "info").mockImplementation(function (): void {});
                const monitor = PerformanceMonitor.getInstance();
                monitor.reportToConsole();
                expect(infoSpy).not.toHaveBeenCalled();
            } finally {
                env.PROD = originalProd;
                PerformanceMonitor.resetInstance();
            }
        });
    });

    describe("pageLoad metric", () => {
        it("sets pageLoad when loadEventEnd is available and positive", () => {
            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([
                    { responseStart: 200, requestStart: 100, loadEventEnd: 1500, startTime: 0 }
                ])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;

            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            expect(monitor.report()["pageLoad"]).toBe(1500);
        });

        it("does not set pageLoad when loadEventEnd is zero", () => {
            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([
                    { responseStart: 200, requestStart: 100, loadEventEnd: 0, startTime: 0 }
                ])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;

            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            expect(monitor.report()["pageLoad"]).toBeUndefined();
        });

        it("does not set pageLoad when loadEventEnd is undefined", () => {
            const mockPerformance = {
                getEntriesByType: vi.fn().mockReturnValue([
                    { responseStart: 200, requestStart: 100 }
                ])
            };
            // @ts-expect-error - overriding for test
            globalThis.performance = mockPerformance;

            const monitor = PerformanceMonitor.getInstance();
            monitor.measure();
            expect(monitor.report()["pageLoad"]).toBeUndefined();
        });
    });
});
