// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RuntimeDetector } from "./runtimeDetector.js";

describe("RuntimeDetector non-browser runtimes", function () {
    beforeEach(function () {
        RuntimeDetector.resetInstance();
    });

    afterEach(function () {
        RuntimeDetector.resetInstance();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it("detects the node runtime", function () {
        const detector = RuntimeDetector.getInstance();
        expect(detector.isBrowser).toBe(false);
        expect(detector.isWails).toBe(false);
        expect(detector.isNode).toBe(true);
        expect(detector.isWorker).toBe(false);
        expect(detector.hasDOM).toBe(false);
        expect(detector.hasLocalStorage).toBe(false);
        expect(detector.describe()).toBe("node");
    });

    it("detects a worker runtime", function () {
        vi.stubGlobal("process", undefined);
        vi.stubGlobal("self", { importScripts: function (): void { return; } });
        try {
            RuntimeDetector.resetInstance();
            const detector = RuntimeDetector.getInstance();
            expect(detector.isNode).toBe(false);
            expect(detector.isWorker).toBe(true);
            expect(detector.describe()).toBe("worker");
        } finally {
            vi.unstubAllGlobals();
            RuntimeDetector.resetInstance();
        }
    });

    it("reports unknown when no runtime matches", function () {
        vi.stubGlobal("process", undefined);
        try {
            RuntimeDetector.resetInstance();
            const detector = RuntimeDetector.getInstance();
            expect(detector.isNode).toBe(false);
            expect(detector.isWorker).toBe(false);
            expect(detector.describe()).toBe("unknown");
        } finally {
            vi.unstubAllGlobals();
            RuntimeDetector.resetInstance();
        }
    });

    it("treats throwing localStorage access as unavailable", function () {
        Object.defineProperty(globalThis, "localStorage", {
            get: function (): never {
                throw new Error("denied");
            },
            configurable: true,
        });
        try {
            RuntimeDetector.resetInstance();
            expect(RuntimeDetector.getInstance().hasLocalStorage).toBe(false);
        } finally {
            delete (globalThis as unknown as Record<string, unknown>)["localStorage"];
            RuntimeDetector.resetInstance();
        }
    });
});
