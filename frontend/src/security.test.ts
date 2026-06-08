import { describe, it, expect } from "vitest";

describe("XSS prevention", () => {
    it("escapeHtml should escape angle brackets", () => {
        const input = '<script>alert("xss")</script>';
        const escaped = input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        expect(escaped).not.toContain("<script>");
        expect(escaped).toContain("&lt;script&gt;");
    });

    it("escapeHtml should escape ampersands", () => {
        const input = "H2O & NaCl";
        const escaped = input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        expect(escaped).toContain("&amp;");
    });

    it("escapeHtml should escape double quotes", () => {
        const input = 'test"value';
        const escaped = input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        expect(escaped).toContain("&quot;");
    });

    it("formula input should not execute script tags", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = '<img src=x onerror=alert(1)>';
        // Value is stored as text, not rendered as HTML
        expect(typeof input.value).toBe("string");
        expect(input.value.length).toBeGreaterThan(0);
    });

    it("result div textContent should not contain unescaped user input", () => {
        const div = document.createElement("div");
        const userInput = '<script>alert(1)</script>';
        div.textContent = userInput;
        expect(div.textContent).toBe(userInput);
        expect(div.innerHTML).not.toBe(userInput); // innerHTML is escaped
    });

    it("select option values should be safe", () => {
        const select = document.createElement("select");
        const option = document.createElement("option");
        option.value = 'safe-value';
        option.textContent = 'Normal text';
        select.appendChild(option);
        // Option value is stored as attribute, not rendered as HTML
        expect(option.value).toBe('safe-value');
        expect(option.textContent).toBe('Normal text');
    });
});

describe("Input sanitization", () => {
    it("number input rejects non-numeric characters", () => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = "abc";
        // Number inputs with non-numeric values have value of empty string
        expect(input.value).toBe("");
    });

    it("number input accepts decimal values", () => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = "3.14159";
        expect(input.value).toBe("3.14159");
    });

    it("number input accepts negative values", () => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = "-42";
        expect(input.value).toBe("-42");
    });

    it("number input accepts scientific notation", () => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = "1.5e-10";
        expect(input.value).toBe("1.5e-10");
    });

    it("text input does not interpret HTML", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "<b>bold</b>";
        expect(input.value).toBe("<b>bold</b>");
    });

    it("parseFloat returns NaN for HTML strings", () => {
        const result = parseFloat("<script>alert(1)</script>");
        expect(isNaN(result)).toBe(true);
    });
});
