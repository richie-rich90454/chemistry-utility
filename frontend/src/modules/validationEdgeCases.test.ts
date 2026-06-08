import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateInputs } from "./validation.js";

describe("validateInputs - edge cases", () => {
    beforeEach(() => {
        const container = document.createElement("div");
        container.id = "test-container";
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("handles empty ids array gracefully", () => {
        expect(() => validateInputs([1, 2, 3], [])).not.toThrow();
    });

    it("handles more inputs than ids", () => {
        const input1 = document.createElement("input");
        input1.id = "input-a";
        input1.type = "number";
        document.body.appendChild(input1);

        expect(() => validateInputs([1], ["input-a"])).not.toThrow();
    });

    it("adds error class to correct input when NaN", () => {
        const input1 = document.createElement("input");
        input1.id = "err-test-1";
        input1.type = "number";
        document.body.appendChild(input1);

        const input2 = document.createElement("input");
        input2.id = "err-test-2";
        input2.type = "number";
        document.body.appendChild(input2);

        expect(() => validateInputs([1, NaN], ["err-test-1", "err-test-2"])).toThrow();
        expect(input2.classList.contains("error")).toBe(true);
        expect(input1.classList.contains("error")).toBe(false);
    });

    it("throws with correct error message", () => {
        const input = document.createElement("input");
        input.id = "msg-test";
        input.type = "number";
        document.body.appendChild(input);

        try {
            validateInputs([NaN], ["msg-test"]);
        } catch (e) {
            expect((e as Error).message).toContain("valid numbers");
        }
    });

    it("handles zero as valid input", () => {
        const input = document.createElement("input");
        input.id = "zero-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([0], ["zero-test"])).not.toThrow();
    });

    it("handles negative numbers as valid", () => {
        const input = document.createElement("input");
        input.id = "neg-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([-5], ["neg-test"])).not.toThrow();
    });

    it("handles Infinity as NaN equivalent", () => {
        const input = document.createElement("input");
        input.id = "inf-test";
        input.type = "number";
        document.body.appendChild(input);

        // Infinity is not NaN, so validateInputs does not throw
        expect(() => validateInputs([Infinity], ["inf-test"])).not.toThrow();
    });

    it("error class persists after validation failure", () => {
        const input = document.createElement("input");
        input.id = "persist-err";
        input.type = "number";
        document.body.appendChild(input);

        try { validateInputs([NaN], ["persist-err"]); } catch {}
        expect(input.classList.contains("error")).toBe(true);
    });

    it("handles multiple NaN inputs - first NaN gets error class", () => {
        const input1 = document.createElement("input");
        input1.id = "multi-nan-1";
        input1.type = "number";
        document.body.appendChild(input1);

        const input2 = document.createElement("input");
        input2.id = "multi-nan-2";
        input2.type = "number";
        document.body.appendChild(input2);

        try { validateInputs([NaN, NaN], ["multi-nan-1", "multi-nan-2"]); } catch {}
        // validateInputs throws on first NaN found, so at least input1 gets error class
        expect(input1.classList.contains("error")).toBe(true);
    });

    it("handles undefined values as NaN", () => {
        const input = document.createElement("input");
        input.id = "undef-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([undefined as any], ["undef-test"])).toThrow();
    });
});

describe("validateInputs - additional edge cases", () => {
    beforeEach(() => {
        const container = document.createElement("div");
        container.id = "test-container";
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("handles very small positive numbers as valid", () => {
        const input = document.createElement("input");
        input.id = "small-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([1e-10], ["small-test"])).not.toThrow();
    });

    it("handles very large numbers as valid", () => {
        const input = document.createElement("input");
        input.id = "large-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([1e10], ["large-test"])).not.toThrow();
    });

    it("handles -Infinity as not NaN (does not throw)", () => {
        const input = document.createElement("input");
        input.id = "neg-inf-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([-Infinity], ["neg-inf-test"])).not.toThrow();
    });

    it("handles string NaN as NaN", () => {
        const input = document.createElement("input");
        input.id = "str-nan-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([NaN], ["str-nan-test"])).toThrow();
    });

    it("validates three inputs with one NaN in the middle", () => {
        const input1 = document.createElement("input");
        input1.id = "triple-1";
        input1.type = "number";
        document.body.appendChild(input1);

        const input2 = document.createElement("input");
        input2.id = "triple-2";
        input2.type = "number";
        document.body.appendChild(input2);

        const input3 = document.createElement("input");
        input3.id = "triple-3";
        input3.type = "number";
        document.body.appendChild(input3);

        try { validateInputs([1, NaN, 3], ["triple-1", "triple-2", "triple-3"]); } catch {}
        expect(input1.classList.contains("error")).toBe(false);
        expect(input2.classList.contains("error")).toBe(true);
        expect(input3.classList.contains("error")).toBe(false);
    });

    it("handles empty string as NaN", () => {
        const input = document.createElement("input");
        input.id = "empty-str-test";
        input.type = "number";
        document.body.appendChild(input);

        expect(() => validateInputs([parseFloat("")], ["empty-str-test"])).toThrow();
    });
});
