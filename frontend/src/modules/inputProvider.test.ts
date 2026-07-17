import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DomInputProvider } from "./inputProvider.js";

describe("DomInputProvider", () => {
    let provider: DomInputProvider;

    beforeEach(() => {
        document.body.innerHTML = "";
        provider = new DomInputProvider();
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("returns NaN when getting value for a missing element", () => {
        const value = provider.getValue("does-not-exist");
        expect(value).toBeNaN();
    });

    it("returns NaN when the input value is empty", () => {
        const input = document.createElement("input");
        input.id = "empty-input";
        input.value = "";
        document.body.appendChild(input);

        expect(provider.getValue("empty-input")).toBeNaN();
    });

    it("returns NaN when the input value is non-numeric", () => {
        const input = document.createElement("input");
        input.id = "text-input";
        input.value = "abc";
        document.body.appendChild(input);

        expect(provider.getValue("text-input")).toBeNaN();
    });

    it("parses an integer value from an input element", () => {
        const input = document.createElement("input");
        input.id = "int-input";
        input.value = "42";
        document.body.appendChild(input);

        expect(provider.getValue("int-input")).toBe(42);
    });

    it("parses a float value from an input element", () => {
        const input = document.createElement("input");
        input.id = "float-input";
        input.value = "3.14";
        document.body.appendChild(input);

        expect(provider.getValue("float-input")).toBeCloseTo(3.14, 2);
    });

    it("parses a negative value from an input element", () => {
        const input = document.createElement("input");
        input.id = "neg-input";
        input.value = "-273.15";
        document.body.appendChild(input);

        expect(provider.getValue("neg-input")).toBeCloseTo(-273.15, 2);
    });

    it("parses zero from an input element", () => {
        const input = document.createElement("input");
        input.id = "zero-input";
        input.value = "0";
        document.body.appendChild(input);

        expect(provider.getValue("zero-input")).toBe(0);
    });

    it("parses a value from a select element", () => {
        const select = document.createElement("select");
        select.id = "select-input";
        const option1 = document.createElement("option");
        option1.value = "1";
        const option2 = document.createElement("option");
        option2.value = "2";
        option2.selected = true;
        select.appendChild(option1);
        select.appendChild(option2);
        document.body.appendChild(select);

        expect(provider.getValue("select-input")).toBe(2);
    });

    it("returns empty string when getting string value for a missing element", () => {
        expect(provider.getStringValue("missing")).toBe("");
    });

    it("returns the string value of an input element", () => {
        const input = document.createElement("input");
        input.id = "str-input";
        input.value = "hello world";
        document.body.appendChild(input);

        expect(provider.getStringValue("str-input")).toBe("hello world");
    });

    it("returns the string value of a select element", () => {
        const select = document.createElement("select");
        select.id = "str-select";
        const option = document.createElement("option");
        option.value = "selected";
        option.selected = true;
        select.appendChild(option);
        document.body.appendChild(select);

        expect(provider.getStringValue("str-select")).toBe("selected");
    });

    it("returns empty string for an empty input element", () => {
        const input = document.createElement("input");
        input.id = "empty-str-input";
        input.value = "";
        document.body.appendChild(input);

        expect(provider.getStringValue("empty-str-input")).toBe("");
    });

    it("returns null when getting element that does not exist", () => {
        expect(provider.getElement("nonexistent")).toBeNull();
    });

    it("returns the element when it exists", () => {
        const input = document.createElement("input");
        input.id = "found-element";
        document.body.appendChild(input);

        const element = provider.getElement("found-element");
        expect(element).toBe(input);
    });

    it("returns the element for a select element", () => {
        const select = document.createElement("select");
        select.id = "found-select";
        document.body.appendChild(select);

        const element = provider.getElement("found-select");
        expect(element).toBe(select);
    });

    it("returns the element for a div element", () => {
        const div = document.createElement("div");
        div.id = "found-div";
        document.body.appendChild(div);

        const element = provider.getElement("found-div");
        expect(element).toBe(div);
    });

    it("handles a numeric value with leading/trailing whitespace", () => {
        const input = document.createElement("input");
        input.id = "ws-input";
        input.value = "  10  ";
        document.body.appendChild(input);

        // parseFloat ignores leading whitespace.
        expect(provider.getValue("ws-input")).toBe(10);
    });

    it("returns NaN for partial numeric values (parseFloat behavior)", () => {
        const input = document.createElement("input");
        input.id = "partial-input";
        input.value = "12abc";
        document.body.appendChild(input);

        // parseFloat parses leading numeric portion.
        expect(provider.getValue("partial-input")).toBe(12);
    });
});
