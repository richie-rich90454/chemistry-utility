import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateInputs } from "./validation.js";

describe("validateInputs", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("does not throw when all values are valid numbers", () => {
        expect(() => validateInputs([1, 2.5, 0], ["a", "b", "c"])).not.toThrow();
    });

    it("throws when a NaN value is present", () => {
        expect(() => validateInputs([1, NaN, 3], ["a", "b", "c"])).toThrow();
    });

    it("adds .error class to the corresponding input when NaN", () => {
        const input = document.createElement("input");
        input.id = "field-b";
        document.body.appendChild(input);

        expect(() => validateInputs([1, NaN, 3], ["field-a", "field-b", "field-c"])).toThrow();
        expect(input.classList.contains("error")).toBe(true);
    });

    it("does not add .error class to valid inputs", () => {
        const inputA = document.createElement("input");
        inputA.id = "field-a";
        document.body.appendChild(inputA);

        const inputB = document.createElement("input");
        inputB.id = "field-b";
        document.body.appendChild(inputB);

        try {
            validateInputs([1, NaN], ["field-a", "field-b"]);
        } catch {
            // expected
        }

        expect(inputA.classList.contains("error")).toBe(false);
        expect(inputB.classList.contains("error")).toBe(true);
    });

    it("throws but does not crash with empty ids array", () => {
        expect(() => validateInputs([1, NaN], [])).toThrow();
    });

    it("throws and only marks existing elements when ids is shorter than inputs", () => {
        const input = document.createElement("input");
        input.id = "field-0";
        document.body.appendChild(input);

        // ids has only 1 entry but inputs has 2; second is NaN
        expect(() => validateInputs([1, NaN], ["field-0"])).toThrow();
        // field-0 should not have error since its value (1) is valid
        expect(input.classList.contains("error")).toBe(false);
    });

    it("throws but does not crash with null ids", () => {
        expect(() => validateInputs([1, NaN], null as unknown as string[])).toThrow();
    });

    it("handles single valid value", () => {
        expect(() => validateInputs([42], ["x"])).not.toThrow();
    });

    it("handles single NaN value", () => {
        const input = document.createElement("input");
        input.id = "x";
        document.body.appendChild(input);

        expect(() => validateInputs([NaN], ["x"])).toThrow();
        expect(input.classList.contains("error")).toBe(true);
    });

    it("throws error with correct message", () => {
        const input = document.createElement("input");
        input.id = "x";
        document.body.appendChild(input);

        try {
            validateInputs([NaN], ["x"]);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect((e as Error).message).toBe("Please fill all required fields with valid numbers");
            return;
        }
        // Should not reach here
        expect.unreachable("Expected an error to be thrown");
    });

    it("does not throw for zero values", () => {
        expect(() => validateInputs([0, 0.0], ["a", "b"])).not.toThrow();
    });

    it("does not throw for negative values", () => {
        expect(() => validateInputs([-1, -3.5], ["a", "b"])).not.toThrow();
    });
});
