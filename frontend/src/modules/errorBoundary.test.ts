import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary } from "./errorBoundary.js";
import type { ResultDisplay } from "./resultDisplay.js";

function createMockResultDisplay(): ResultDisplay & { showError: ReturnType<typeof vi.fn> } {
    return {
        showError: vi.fn(),
    } as unknown as ResultDisplay & { showError: ReturnType<typeof vi.fn> };
}

describe("ErrorBoundary", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        errorSpy.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the result of the wrapped function on success", () => {
        const boundary = ErrorBoundary.getInstance();
        const result = boundary.wrap(() => 42, "calc-id");
        expect(result).toBe(42);
    });

    it("returns the result of a wrapped function returning a string", () => {
        const boundary = ErrorBoundary.getInstance();
        const result = boundary.wrap(() => "hello", "calc-id");
        expect(result).toBe("hello");
    });

    it("returns the result of a wrapped function returning an object", () => {
        const boundary = ErrorBoundary.getInstance();
        const obj = { value: 1 };
        const result = boundary.wrap(() => obj, "calc-id");
        expect(result).toBe(obj);
    });

    it("returns undefined (void) when the wrapped function throws", () => {
        const boundary = ErrorBoundary.getInstance();
        const result = boundary.wrap(() => {
            throw new Error("boom");
        }, "calc-id");
        expect(result).toBeUndefined();
    });

    it("logs the error to the console when the function throws", () => {
        const boundary = ErrorBoundary.getInstance();
        boundary.wrap(() => {
            throw new Error("boom");
        }, "my-calc");
        expect(errorSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("my-calc"), expect.anything());
    });

    it("displays the error message via the result display when provided", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        boundary.wrap(() => {
            throw new Error("custom message");
        }, "calc-id", display);
        expect(display.showError).toHaveBeenCalledWith("custom message");
    });

    it("does not call showError when no result display is provided", () => {
        const boundary = ErrorBoundary.getInstance();
        boundary.wrap(() => {
            throw new Error("err");
        }, "calc-id");
        // No assertion error means success; we just ensure no crash.
        expect(errorSpy).toHaveBeenCalled();
    });

    it("uses fallback message when thrown value is not an Error", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        boundary.wrap(() => {
            throw "string error";
        }, "calc-id", display);
        expect(display.showError).toHaveBeenCalledWith("Something went wrong. Please try again.");
    });

    it("uses fallback message when thrown Error has empty message", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        boundary.wrap(() => {
            throw new Error("");
        }, "calc-id", display);
        expect(display.showError).toHaveBeenCalledWith("Something went wrong. Please try again.");
    });

    it("uses fallback message when a number is thrown", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        boundary.wrap(() => {
            throw 42;
        }, "calc-id", display);
        expect(display.showError).toHaveBeenCalledWith("Something went wrong. Please try again.");
    });

    it("uses fallback message when null is thrown", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        boundary.wrap(() => {
            throw null;
        }, "calc-id", display);
        expect(display.showError).toHaveBeenCalledWith("Something went wrong. Please try again.");
    });

    it("uses fallback message when an object is thrown", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        boundary.wrap(() => {
            throw { code: 500 };
        }, "calc-id", display);
        expect(display.showError).toHaveBeenCalledWith("Something went wrong. Please try again.");
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(ErrorBoundary.getInstance()).toBe(ErrorBoundary.getInstance());
    });

    it("includes the calculator id in the logged error message", () => {
        const boundary = ErrorBoundary.getInstance();
        boundary.wrap(() => {
            throw new Error("x");
        }, "special-calculator-42");
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("special-calculator-42"), expect.anything());
    });

    it("does not swallow the error from reaching showError with the real Error message", () => {
        const boundary = ErrorBoundary.getInstance();
        const display = createMockResultDisplay();
        const message = "Validation failed: molarity must be positive";
        boundary.wrap(() => {
            throw new Error(message);
        }, "calc", display);
        expect(display.showError).toHaveBeenCalledTimes(1);
        expect(display.showError).toHaveBeenCalledWith(message);
    });
});
