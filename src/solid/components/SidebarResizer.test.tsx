import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {SidebarResizer} from "./SidebarResizer";
import {resetSidebarWidth, setSidebarResizing, sidebarWidth, maxSidebarWidth} from "../stores/sidebarWidth";

const CSS_VARIABLE = "--app-nav-width";

function cssWidth(): string {
    return document.documentElement.style.getPropertyValue(CSS_VARIABLE);
}

function pointerEvent(type: string, clientX: number, button: number): MouseEvent {
    return new MouseEvent(type, {"bubbles": true, "cancelable": true, "clientX": clientX, "button": button});
}

describe("SidebarResizer", function (): void {
    beforeEach(function (): void {
        localStorage.clear();
        resetSidebarWidth();
        setSidebarResizing(false);
        document.documentElement.style.removeProperty(CSS_VARIABLE);
        Object.defineProperty(Element.prototype, "setPointerCapture", {"configurable": true, "writable": true, "value": vi.fn()});
        Object.defineProperty(Element.prototype, "releasePointerCapture", {"configurable": true, "writable": true, "value": vi.fn()});
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    });

    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });

    it("renders a focusable vertical separator with the width bounds", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        expect(handle.getAttribute("aria-orientation")).toBe("vertical");
        expect(handle.getAttribute("aria-label")).toBe("Resize sidebar");
        expect(handle.getAttribute("aria-valuemin")).toBe("200");
        expect(handle.getAttribute("tabindex")).toBe("0");
        expect(handle.getAttribute("aria-valuemax")).toBe(String(maxSidebarWidth()));
    });

    it("resizes while dragging and restores the body when released", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        handle.dispatchEvent(pointerEvent("pointerdown", 120, 0));
        expect(handle.hasAttribute("data-resizing")).toBe(true);
        expect(document.body.style.cursor).toBe("col-resize");
        expect(document.body.style.userSelect).toBe("none");
        handle.dispatchEvent(pointerEvent("pointermove", 420, 0));
        expect(cssWidth()).toBe("300px");
        handle.dispatchEvent(pointerEvent("pointerup", 420, 0));
        expect(handle.hasAttribute("data-resizing")).toBe(false);
        expect(document.body.style.cursor).toBe("");
        expect(document.body.style.userSelect).toBe("");
    });

    it("ignores a non-primary button", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        handle.dispatchEvent(pointerEvent("pointerdown", 120, 2));
        handle.dispatchEvent(pointerEvent("pointermove", 420, 2));
        expect(cssWidth()).toBe("");
    });

    it("ignores a move that did not start with a press", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        handle.dispatchEvent(pointerEvent("pointermove", 420, 0));
        expect(cssWidth()).toBe("");
    });

    it("ignores a release that did not start with a press", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        expect(function (): void { handle.dispatchEvent(pointerEvent("pointerup", 420, 0)); }).not.toThrow();
    });

    it("resizes with the arrow keys and jumps to the bounds", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        fireEvent.keyDown(handle, {"key": "ArrowRight"});
        expect(cssWidth()).toBe("200px");
        fireEvent.keyDown(handle, {"key": "ArrowLeft"});
        expect(cssWidth()).toBe("200px");
        fireEvent.keyDown(handle, {"key": "End"});
        expect(cssWidth()).toBe(maxSidebarWidth() + "px");
        fireEvent.keyDown(handle, {"key": "Home"});
        expect(cssWidth()).toBe("200px");
    });

    it("leaves other keys alone", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        fireEvent.keyDown(handle, {"key": "End"});
        let after = cssWidth();
        fireEvent.keyDown(handle, {"key": "a"});
        expect(cssWidth()).toBe(after);
    });

    it("resets to the stylesheet default on a double press", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        fireEvent.keyDown(handle, {"key": "End"});
        expect(sidebarWidth()).toBe(maxSidebarWidth());
        handle.dispatchEvent(pointerEvent("pointerdown", 120, 0));
        handle.dispatchEvent(pointerEvent("pointerup", 120, 0));
        handle.dispatchEvent(pointerEvent("pointerdown", 120, 0));
        expect(sidebarWidth()).toBeNull();
        expect(cssWidth()).toBe("");
    });

    it("re-measures when the window resizes", function (): void {
        let result = render(function () { return <SidebarResizer />; });
        let handle = result.getByRole("separator");
        window.dispatchEvent(new Event("resize"));
        expect(handle.getAttribute("aria-valuemax")).toBe(String(maxSidebarWidth()));
    });
});
