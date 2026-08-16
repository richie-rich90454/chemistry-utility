import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RuntimeDetector } from "./runtimeDetector.js";
describe("RuntimeDetector", function () {
    beforeEach(function () {
        RuntimeDetector.resetInstance();
    });
    afterEach(function () {
        RuntimeDetector.resetInstance();
        const anyWindow = window as unknown as { __wails__?: unknown };
        delete anyWindow.__wails__;
    });
    it("getInstance returns the same singleton instance on repeated calls", function () {
        const first = RuntimeDetector.getInstance();
        const second = RuntimeDetector.getInstance();
        expect(first).toBe(second);
    });
    it("detects browser environment in jsdom", function () {
        const detector = RuntimeDetector.getInstance();
        expect(detector.isBrowser).toBe(true);
        expect(detector.hasDOM).toBe(true);
        expect(detector.hasLocalStorage).toBe(true);
        expect(detector.hasFetch).toBe(true);
        expect(detector.hasNavigator).toBe(true);
    });
    it("detects node environment in vitest", function () {
        const detector = RuntimeDetector.getInstance();
        expect(detector.isNode).toBe(true);
    });
    it("isWails is false when __wails__ is not on window", function () {
        const detector = RuntimeDetector.getInstance();
        expect(detector.isWails).toBe(false);
    });
    it("isWorker is false in jsdom environment", function () {
        const detector = RuntimeDetector.getInstance();
        expect(detector.isWorker).toBe(false);
    });
    it("describe returns a non-empty string containing browser or node", function () {
        const detector = RuntimeDetector.getInstance();
        const description = detector.describe();
        expect(typeof description).toBe("string");
        expect(description.length).toBeGreaterThan(0);
        expect(description).toMatch(/browser|node/);
    });
    it("isWails is true when __wails__ is set on window", function () {
        const anyWindow = window as unknown as { __wails__?: unknown };
        anyWindow.__wails__ = {};
        RuntimeDetector.resetInstance();
        const detector = RuntimeDetector.getInstance();
        expect(detector.isWails).toBe(true);
        expect(detector.describe()).toBe("browser+wails");
    });
});
