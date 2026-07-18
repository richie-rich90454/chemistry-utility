import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WebModeGuard } from "./webModeGuard.js";
import { RuntimeDetector } from "./runtimeDetector.js";

describe("WebModeGuard", function () {
    beforeEach(function () {
        WebModeGuard.resetInstance();
        RuntimeDetector.resetInstance();
        const anyWindow = window as unknown as { __wails__?: unknown };
        delete anyWindow.__wails__;
        document.documentElement.classList.remove("web-mode");
    });
    afterEach(function () {
        WebModeGuard.resetInstance();
        RuntimeDetector.resetInstance();
        const anyWindow = window as unknown as { __wails__?: unknown };
        delete anyWindow.__wails__;
        document.documentElement.classList.remove("web-mode");
    });
    it("getInstance returns the same singleton instance on repeated calls", function () {
        const first = WebModeGuard.getInstance();
        const second = WebModeGuard.getInstance();
        expect(first).toBe(second);
    });
    it("resetInstance clears the singleton so subsequent calls return a new instance", function () {
        const first = WebModeGuard.getInstance();
        WebModeGuard.resetInstance();
        const second = WebModeGuard.getInstance();
        expect(first).not.toBe(second);
    });
    it("isWebMode is true in jsdom without __wails__", function () {
        const guard = WebModeGuard.getInstance();
        expect(guard.isWebMode).toBe(true);
    });
    it("isWebMode is false when __wails__ is present on window", function () {
        const anyWindow = window as unknown as { __wails__?: unknown };
        anyWindow.__wails__ = {};
        WebModeGuard.resetInstance();
        RuntimeDetector.resetInstance();
        const guard = WebModeGuard.getInstance();
        expect(guard.isWebMode).toBe(false);
    });
    it("apply adds the web-mode class to the document root in web mode", function () {
        const guard = WebModeGuard.getInstance();
        guard.apply();
        expect(document.documentElement.classList.contains("web-mode")).toBe(true);
    });
    it("apply does not add the web-mode class when __wails__ is present", function () {
        const anyWindow = window as unknown as { __wails__?: unknown };
        anyWindow.__wails__ = {};
        WebModeGuard.resetInstance();
        RuntimeDetector.resetInstance();
        const guard = WebModeGuard.getInstance();
        guard.apply();
        expect(document.documentElement.classList.contains("web-mode")).toBe(false);
    });
    it("apply is idempotent — calling twice only applies the class once", function () {
        const guard = WebModeGuard.getInstance();
        guard.apply();
        guard.apply();
        expect(document.documentElement.classList.contains("web-mode")).toBe(true);
    });
    it("apply is a no-op when not in web mode even if called multiple times", function () {
        const anyWindow = window as unknown as { __wails__?: unknown };
        anyWindow.__wails__ = {};
        WebModeGuard.resetInstance();
        RuntimeDetector.resetInstance();
        const guard = WebModeGuard.getInstance();
        guard.apply();
        guard.apply();
        expect(document.documentElement.classList.contains("web-mode")).toBe(false);
    });
});
