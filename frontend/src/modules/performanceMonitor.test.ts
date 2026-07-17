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
        let observerCallbacks: Array<(entryList: PerformanceObserverEntryList) => void>;

        beforeEach(() => {
            observeSpy = vi.fn();
            observerCallbacks = [];

            function MockPerformanceObserver(this: { observe: typeof observeSpy }, callback: (entryList: PerformanceObserverEntryList) => void): void {
                this.observe = observeSpy;
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
});
