import { describe, it, expect, beforeEach } from "vitest";
import { InputElement } from "./inputElement.js";

describe("InputElement", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    function addInput(id: string, value: string): HTMLInputElement {
        const input = document.createElement("input");
        input.id = id;
        input.value = value;
        document.body.appendChild(input);
        return input;
    }

    it("reads a numeric value via getValue", () => {
        addInput("n", "12.5");
        expect(new InputElement("n").getValue()).toBe(12.5);
    });

    it("returns NaN for empty input", () => {
        addInput("n", "");
        expect(new InputElement("n").getValue()).toBeNaN();
    });

    it("returns NaN for whitespace-only input", () => {
        addInput("n", "   ");
        expect(new InputElement("n").getValue()).toBeNaN();
    });

    it("rejects trailing garbage and hex as NaN", () => {
        addInput("a", "12abc");
        expect(new InputElement("a").getValue()).toBeNaN();
        document.body.innerHTML = "";
        addInput("b", "0x10");
        expect(new InputElement("b").getValue()).toBeNaN();
    });

    it("parses signed, decimal and exponent forms", () => {
        addInput("a", "+3");
        expect(new InputElement("a").getValue()).toBe(3);
        document.body.innerHTML = "";
        addInput("b", "-.5");
        expect(new InputElement("b").getValue()).toBe(-0.5);
        document.body.innerHTML = "";
        addInput("c", "1e3");
        expect(new InputElement("c").getValue()).toBe(1000);
    });

    it("wraps an explicitly provided element", () => {
        const el = addInput("n", "7");
        const wrapped = new InputElement("other-id", el);
        expect(wrapped.getElement()).toBe(el);
        expect(wrapped.getStringValue()).toBe("7");
    });

    it("getStringValue returns the raw value", () => {
        addInput("n", "  hello ");
        expect(new InputElement("n").getStringValue()).toBe("  hello ");
    });

    it("clear resets the value to empty string", () => {
        const el = addInput("n", "42");
        const wrapped = new InputElement("n");
        wrapped.clear();
        expect(el.value).toBe("");
    });

    it("markError and clearError toggle the error class", () => {
        const el = addInput("n", "1");
        const wrapped = new InputElement("n");
        wrapped.markError();
        expect(el.classList.contains("error")).toBe(true);
        wrapped.clearError();
        expect(el.classList.contains("error")).toBe(false);
    });

    it("getElement returns the underlying DOM element", () => {
        const el = addInput("n", "1");
        expect(new InputElement("n").getElement()).toBe(el);
    });
});
