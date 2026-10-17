import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InputValidator } from "./validation.js";
import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";

describe("InputValidator.validate (class-based API)", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("does not throw when all InputElements have valid values", () => {
        const input1 = document.createElement("input");
        input1.value = "10";
        document.body.appendChild(input1);
        const input2 = document.createElement("input");
        input2.value = "20";
        document.body.appendChild(input2);

        const elements = [new InputElement("", input1), new InputElement("", input2)];
        expect(() => InputValidator.validate(elements)).not.toThrow();
    });

    it("throws when any InputElement has NaN value", () => {
        const input1 = document.createElement("input");
        input1.value = "10";
        document.body.appendChild(input1);
        const input2 = document.createElement("input");
        input2.value = "";
        document.body.appendChild(input2);

        const elements = [new InputElement("", input1), new InputElement("", input2)];
        expect(() => InputValidator.validate(elements)).toThrow("Please fill all required fields with valid numbers");
    });

    it("marks the error class on invalid InputElements", () => {
        const input1 = document.createElement("input");
        input1.value = "10";
        document.body.appendChild(input1);
        const input2 = document.createElement("input");
        input2.value = "";
        document.body.appendChild(input2);

        const elements = [new InputElement("", input1), new InputElement("", input2)];
        try {
            InputValidator.validate(elements);
        } catch {
            // expected
        }
        expect(input1.classList.contains("error")).toBe(false);
        expect(input2.classList.contains("error")).toBe(true);
    });

    it("does not throw for an empty array of InputElements", () => {
        expect(() => InputValidator.validate([])).not.toThrow();
    });

    it("marks all invalid elements before throwing", () => {
        const input1 = document.createElement("input");
        input1.value = "";
        document.body.appendChild(input1);
        const input2 = document.createElement("input");
        input2.value = "";
        document.body.appendChild(input2);

        const elements = [new InputElement("", input1), new InputElement("", input2)];
        try {
            InputValidator.validate(elements);
        } catch {
            // expected
        }
        expect(input1.classList.contains("error")).toBe(true);
        expect(input2.classList.contains("error")).toBe(true);
    });
});

describe("InputElement", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("returns the parsed numeric value via getValue", () => {
        const input = document.createElement("input");
        input.value = "42.5";
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        expect(el.getValue()).toBe(42.5);
    });

    it("returns NaN when value is empty", () => {
        const input = document.createElement("input");
        input.value = "";
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        expect(isNaN(el.getValue())).toBe(true);
    });

    it("returns the raw string value via getStringValue", () => {
        const input = document.createElement("input");
        input.value = "hello";
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        expect(el.getStringValue()).toBe("hello");
    });

    it("clears the value via clear", () => {
        const input = document.createElement("input");
        input.value = "data";
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        el.clear();
        expect(input.value).toBe("");
    });

    it("adds error class via markError", () => {
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        el.markError();
        expect(input.classList.contains("error")).toBe(true);
    });

    it("removes error class via clearError", () => {
        const input = document.createElement("input");
        input.classList.add("error");
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        el.clearError();
        expect(input.classList.contains("error")).toBe(false);
    });

    it("returns the underlying DOM element via getElement", () => {
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.id = "test-input";
        const el = new InputElement("test-input");
        expect(el.getElement()).toBe(input);
    });

    it("accepts a pre-existing element in the constructor", () => {
        const input = document.createElement("input");
        input.value = "99";
        const el = new InputElement("", input);
        expect(el.getValue()).toBe(99);
        expect(el.getElement()).toBe(input);
    });
});

describe("ResultDisplay", () => {
    let resultEl: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = "";
        resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("sets innerHTML and adds show class via showResult", () => {
        const display = new ResultDisplay("result");
        display.showResult("<p>42</p>");
        expect(resultEl.innerHTML).toBe("<p>42</p>");
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("renders an error message via showError", () => {
        const display = new ResultDisplay("result");
        display.showError("Something went wrong");
        expect(resultEl.innerHTML).toContain("Error: Something went wrong");
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("renders a formula and result via showFormula", () => {
        const display = new ResultDisplay("result");
        display.showFormula("H2O", 18.015, "g/mol");
        expect(resultEl.innerHTML).toContain("H2O");
        expect(resultEl.innerHTML).toContain("Result:");
        expect(resultEl.innerHTML).toContain("g/mol");
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("clears innerHTML and removes show class via clear", () => {
        const display = new ResultDisplay("result");
        display.showResult("<p>data</p>");
        display.clear();
        expect(resultEl.innerHTML).toBe("");
        expect(resultEl.classList.contains("show")).toBe(false);
    });

    it("adds show class via show", () => {
        const display = new ResultDisplay("result");
        display.show();
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("removes show class via hide", () => {
        const display = new ResultDisplay("result");
        display.show();
        display.hide();
        expect(resultEl.classList.contains("show")).toBe(false);
    });

    it("returns the underlying element via getElement", () => {
        const display = new ResultDisplay("result");
        expect(display.getElement()).toBe(resultEl);
    });
});
