import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { slideDown, slideUp } from "./animationUtils";

describe("animationUtils", () => {
    let element: HTMLElement;
    let rafCallbacks: FrameRequestCallback[];

    beforeEach(() => {
        vi.useFakeTimers();
        // Capture requestAnimationFrame callbacks so we can trigger them manually
        rafCallbacks = [];
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            rafCallbacks.push(cb);
            return 1;
        });

        element = document.createElement("div");
        element.style.display = "none";
        // Mock scrollHeight since jsdom doesn't compute layout
        Object.defineProperty(element, "scrollHeight", {
            value: 200,
            configurable: true,
        });
        document.body.appendChild(element);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        element.remove();
    });

    /** Trigger all queued requestAnimationFrame callbacks */
    function flushRaf() {
        const callbacks = [...rafCallbacks];
        rafCallbacks.length = 0;
        callbacks.forEach(cb => cb(0));
    }

    describe("slideDown", () => {
        it("sets display to block and height to 0px initially", () => {
            slideDown(element, 300);
            expect(element.style.display).toBe("block");
            expect(element.style.height).toBe("0px");
        });

        it("sets overflow to hidden", () => {
            slideDown(element, 300);
            expect(element.style.overflow).toBe("hidden");
        });

        it("sets transition to height duration in ms", () => {
            slideDown(element, 300);
            expect(element.style.transition).toBe("height 300ms");
        });

        it("sets height to scrollHeight after requestAnimationFrame fires", () => {
            slideDown(element, 300);
            flushRaf();
            expect(element.style.height).toBe("200px");
        });

        it("resets height, overflow, and transition after duration timeout", () => {
            slideDown(element, 300);
            flushRaf();
            vi.advanceTimersByTime(300);
            expect(element.style.height).toBe("");
            expect(element.style.overflow).toBe("");
            expect(element.style.transition).toBe("");
        });

        it("works with zero duration", () => {
            slideDown(element, 0);
            flushRaf();
            vi.advanceTimersByTime(0);
            expect(element.style.height).toBe("");
            expect(element.style.overflow).toBe("");
        });
    });

    describe("slideUp", () => {
        it("sets height to scrollHeight initially", () => {
            slideUp(element, 300);
            expect(element.style.height).toBe("200px");
        });

        it("sets overflow to hidden", () => {
            slideUp(element, 300);
            expect(element.style.overflow).toBe("hidden");
        });

        it("sets transition to height duration in ms", () => {
            slideUp(element, 300);
            expect(element.style.transition).toBe("height 300ms");
        });

        it("sets height to 0px after requestAnimationFrame fires", () => {
            slideUp(element, 300);
            flushRaf();
            expect(element.style.height).toBe("0px");
        });

        it("sets display to none and resets styles after duration timeout", () => {
            slideUp(element, 300);
            flushRaf();
            vi.advanceTimersByTime(300);
            expect(element.style.display).toBe("none");
            expect(element.style.height).toBe("");
            expect(element.style.overflow).toBe("");
            expect(element.style.transition).toBe("");
        });

        it("works with zero duration", () => {
            slideUp(element, 0);
            flushRaf();
            vi.advanceTimersByTime(0);
            expect(element.style.display).toBe("none");
            expect(element.style.height).toBe("");
            expect(element.style.overflow).toBe("");
        });
    });
});
