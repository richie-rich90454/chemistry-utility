import { describe, it, expect, afterEach } from "vitest";
import { createContainer, createInput, createSelect, createResultDiv, cleanupDOM, getResultHTML, getResultText } from "./test/helpers.js";

describe("Calculator UI Helpers", () => {
    afterEach(() => {
        cleanupDOM();
    });

    it("createContainer creates a div with the given id", () => {
        const container = createContainer("test-container");
        expect(container).toBeTruthy();
        expect(container.id).toBe("test-container");
        expect(document.getElementById("test-container")).toBeTruthy();
    });

    it("createInput creates an input with the given id and value", () => {
        createContainer("input-test");
        const input = createInput("my-input", "42", "input-test");
        expect(input).toBeTruthy();
        expect(input.id).toBe("my-input");
        expect(input.value).toBe("42");
    });

    it("createInput with type creates correct input type", () => {
        createContainer("type-test");
        const input = createInput("text-input", "hello", "type-test", "text");
        expect(input.type).toBe("text");
    });

    it("createSelect creates a select with options", () => {
        createContainer("select-test");
        const select = createSelect("my-select", "B", ["A", "B", "C"], "select-test");
        expect(select).toBeTruthy();
        expect(select.id).toBe("my-select");
        expect(select.value).toBe("B");
        expect(select.options.length).toBe(3);
    });

    it("createResultDiv creates a div with result id", () => {
        createContainer("result-test");
        const result = createResultDiv("my-result", "result-test");
        expect(result).toBeTruthy();
        expect(result.id).toBe("my-result");
    });

    it("getResultHTML returns innerHTML of result div", () => {
        createContainer("html-test");
        createResultDiv("html-result", "html-test");
        const el = document.getElementById("html-result")!;
        el.innerHTML = "<p>42.0</p>";
        expect(getResultHTML("html-result")).toContain("42.0");
    });

    it("getResultText returns textContent of result div", () => {
        createContainer("text-test");
        createResultDiv("text-result", "text-test");
        const el = document.getElementById("text-result")!;
        el.innerHTML = "<p>Hello World</p>";
        expect(getResultText("text-result")).toContain("Hello World");
    });

    it("cleanupDOM removes all test containers", () => {
        createContainer("cleanup-test");
        expect(document.getElementById("cleanup-test")).toBeTruthy();
        cleanupDOM();
        expect(document.getElementById("cleanup-test")).toBeNull();
    });

    it("multiple containers can coexist", () => {
        createContainer("container-a");
        createContainer("container-b");
        expect(document.getElementById("container-a")).toBeTruthy();
        expect(document.getElementById("container-b")).toBeTruthy();
    });

    it("input value can be changed after creation", () => {
        createContainer("change-test");
        void createInput("change-input", "10", "change-test");
        (document.getElementById("change-input") as HTMLInputElement).value = "20";
        expect((document.getElementById("change-input") as HTMLInputElement).value).toBe("20");
    });

    it("select value can be changed after creation", () => {
        createContainer("sel-change-test");
        void createSelect("change-select", "A", ["A", "B", "C"], "sel-change-test");
        (document.getElementById("change-select") as HTMLSelectElement).value = "C";
        expect((document.getElementById("change-select") as HTMLSelectElement).value).toBe("C");
    });

    it("result div can be updated with HTML content", () => {
        createContainer("update-test");
        createResultDiv("update-result", "update-test");
        const el = document.getElementById("update-result")!;
        el.innerHTML = "<p>Result: 99.99</p>";
        expect(getResultHTML("update-result")).toContain("99.99");
    });
});
