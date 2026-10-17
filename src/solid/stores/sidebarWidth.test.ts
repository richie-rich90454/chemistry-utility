import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {
    sidebarWidth,
    setSidebarWidth,
    resetSidebarWidth,
    setSidebarResizing,
    isResizingSidebar,
    maxSidebarWidth,
    clampSidebarWidthToViewport,
    initSidebarWidth
} from "./sidebarWidth";

const CSS_VARIABLE = "--app-nav-width";

function cssWidth(): string {
    return document.documentElement.style.getPropertyValue(CSS_VARIABLE);
}

function setViewport(width: number): void {
    Object.defineProperty(window, "innerWidth", {"configurable": true, "writable": true, "value": width});
}

describe("sidebarWidth store", function (): void {
    beforeEach(function (): void {
        localStorage.clear();
        resetSidebarWidth();
        setSidebarResizing(false);
        document.documentElement.style.removeProperty(CSS_VARIABLE);
        setViewport(1024);
    });

    afterEach(function (): void {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        setViewport(1024);
    });

    it("starts on the stylesheet default", function (): void {
        expect(sidebarWidth()).toBeNull();
        expect(cssWidth()).toBe("");
    });

    it("pins, applies, and persists a width", function (): void {
        setSidebarWidth(300);
        expect(sidebarWidth()).toBe(300);
        expect(cssWidth()).toBe("300px");
        expect(localStorage.getItem("chemutil:sidebar-width")).toBe("300");
    });

    it("clamps a width to the viewport maximum", function (): void {
        setSidebarWidth(5000);
        expect(sidebarWidth()).toBe(maxSidebarWidth());
        expect(cssWidth()).toBe(maxSidebarWidth() + "px");
    });

    it("clamps a width up to the minimum", function (): void {
        setSidebarWidth(10);
        expect(sidebarWidth()).toBe(200);
    });

    it("resets to the stylesheet default and clears storage", function (): void {
        setSidebarWidth(300);
        resetSidebarWidth();
        expect(sidebarWidth()).toBeNull();
        expect(cssWidth()).toBe("");
        expect(localStorage.getItem("chemutil:sidebar-width")).toBeNull();
    });

    it("reports the drag state", function (): void {
        expect(isResizingSidebar()).toBe(false);
        setSidebarResizing(true);
        expect(isResizingSidebar()).toBe(true);
    });

    it("reports the viewport maximum", function (): void {
        expect(maxSidebarWidth()).toBe(409);
    });

    describe("clampSidebarWidthToViewport", function (): void {
        it("does nothing when no width is pinned", function (): void {
            clampSidebarWidthToViewport();
            expect(sidebarWidth()).toBeNull();
        });

        it("leaves an in-range width untouched", function (): void {
            setSidebarWidth(300);
            clampSidebarWidthToViewport();
            expect(sidebarWidth()).toBe(300);
        });

        it("re-clamps a width that no longer fits", function (): void {
            setSidebarWidth(409);
            setViewport(700);
            clampSidebarWidthToViewport();
            expect(sidebarWidth()).toBe(280);
            expect(cssWidth()).toBe("280px");
        });
    });

    describe("initSidebarWidth", function (): void {
        it("registers a resize listener and removes it on dispose", function (): void {
            let addSpy = vi.spyOn(window, "addEventListener");
            let removeSpy = vi.spyOn(window, "removeEventListener");
            let dispose = initSidebarWidth();
            expect(addSpy).toHaveBeenCalledWith("resize", clampSidebarWidthToViewport);
            dispose();
            expect(removeSpy).toHaveBeenCalledWith("resize", clampSidebarWidthToViewport);
        });

        it("restores and clamps a stored width", function (): void {
            localStorage.setItem("chemutil:sidebar-width", "9000");
            initSidebarWidth();
            expect(sidebarWidth()).toBe(maxSidebarWidth());
            expect(cssWidth()).toBe(maxSidebarWidth() + "px");
        });

        it("ignores an unparseable stored width", function (): void {
            localStorage.setItem("chemutil:sidebar-width", "not-a-number");
            initSidebarWidth();
            expect(sidebarWidth()).toBeNull();
        });

        it("returns a no-op disposer without a window", function (): void {
            localStorage.setItem("chemutil:sidebar-width", "300");
            vi.stubGlobal("window", undefined);
            let dispose = initSidebarWidth();
            expect(sidebarWidth()).toBe(300);
            expect(function (): void { dispose(); }).not.toThrow();
        });
    });

    describe("storage failures", function (): void {
        it("survives a throwing read", function (): void {
            vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (): never {
                throw new Error("blocked");
            });
            expect(function (): void { initSidebarWidth(); }).not.toThrow();
            expect(sidebarWidth()).toBeNull();
        });

        it("survives a throwing write", function (): void {
            vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (): never {
                throw new Error("quota");
            });
            expect(function (): void { setSidebarWidth(300); }).not.toThrow();
            expect(sidebarWidth()).toBe(300);
        });

        it("survives a throwing remove", function (): void {
            vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (): never {
                throw new Error("blocked");
            });
            setSidebarWidth(300);
            expect(function (): void { resetSidebarWidth(); }).not.toThrow();
            expect(sidebarWidth()).toBeNull();
        });
    });
});
