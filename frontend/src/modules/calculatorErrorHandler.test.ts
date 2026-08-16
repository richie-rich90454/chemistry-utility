import { describe, it, expect, vi, beforeEach } from "vitest";
import { CalculatorErrorHandler } from "./calculatorErrorHandler.js";
import type { ResultDisplay } from "./resultDisplay.js";

function createMockResultDisplay(): ResultDisplay & { showError: ReturnType<typeof vi.fn> } {
    return {
        showError: vi.fn(),
    } as unknown as ResultDisplay & { showError: ReturnType<typeof vi.fn> };
}

describe("CalculatorErrorHandler", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(CalculatorErrorHandler.getInstance()).toBe(CalculatorErrorHandler.getInstance());
    });

    it("returns an instance with getInstance after first call", () => {
        const instance = CalculatorErrorHandler.getInstance();
        expect(instance).toBeDefined();
        expect(typeof instance.handle).toBe("function");
        expect(typeof instance.setResultDisplay).toBe("function");
    });

    it("does not call showError when no display is registered for the calculator id", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display = createMockResultDisplay();
        handler.setResultDisplay("calc-registered", display);

        handler.handle(new Error("boom"), "calc-not-registered");
        expect(display.showError).not.toHaveBeenCalled();
    });

    it("shows the error message via the registered display", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display = createMockResultDisplay();
        handler.setResultDisplay("molar-mass", display);

        handler.handle(new Error("Invalid formula"), "molar-mass");
        expect(display.showError).toHaveBeenCalledWith("Invalid formula");
    });

    it("shows the message of the most recent error", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display = createMockResultDisplay();
        handler.setResultDisplay("calc-id", display);

        handler.handle(new Error("first"), "calc-id");
        handler.handle(new Error("second"), "calc-id");

        expect(display.showError).toHaveBeenCalledTimes(2);
        expect(display.showError).toHaveBeenNthCalledWith(1, "first");
        expect(display.showError).toHaveBeenNthCalledWith(2, "second");
    });

    it("overwrites the registered display when setResultDisplay is called again", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display1 = createMockResultDisplay();
        const display2 = createMockResultDisplay();
        handler.setResultDisplay("override-calc", display1);
        handler.setResultDisplay("override-calc", display2);

        handler.handle(new Error("err"), "override-calc");
        expect(display1.showError).not.toHaveBeenCalled();
        expect(display2.showError).toHaveBeenCalledWith("err");
    });

    it("handles errors with empty messages", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display = createMockResultDisplay();
        handler.setResultDisplay("empty-msg-calc", display);

        handler.handle(new Error(""), "empty-msg-calc");
        expect(display.showError).toHaveBeenCalledWith("");
    });

    it("handles errors that carry a stack trace without crashing", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display = createMockResultDisplay();
        handler.setResultDisplay("stack-calc", display);

        const error = new Error("with stack");
        // error.stack is populated automatically by the JS engine.
        handler.handle(error, "stack-calc");
        expect(display.showError).toHaveBeenCalledWith("with stack");
    });

    it("uses the same display for multiple calculator ids when registered separately", () => {
        const handler = CalculatorErrorHandler.getInstance();
        const display = createMockResultDisplay();
        handler.setResultDisplay("calc-a", display);
        handler.setResultDisplay("calc-b", display);

        handler.handle(new Error("a-err"), "calc-a");
        handler.handle(new Error("b-err"), "calc-b");

        expect(display.showError).toHaveBeenCalledTimes(2);
        expect(display.showError).toHaveBeenCalledWith("a-err");
        expect(display.showError).toHaveBeenCalledWith("b-err");
    });

    it("does not throw when handling an error for an unknown calculator id", () => {
        const handler = CalculatorErrorHandler.getInstance();
        expect(() => handler.handle(new Error("unknown"), "totally-unknown-id")).not.toThrow();
    });
});
