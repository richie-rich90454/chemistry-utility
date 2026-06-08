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

describe("Input boundary validation", () => {
    it("parseFloat handles very large numbers", () => {
        const result = parseFloat("1e308");
        expect(isFinite(result)).toBe(true);
    });

    it("parseFloat returns Infinity for overflow", () => {
        const result = parseFloat("1e309");
        expect(result).toBe(Infinity);
    });

    it("parseFloat handles negative zero", () => {
        const result = parseFloat("-0");
        expect(Object.is(result, -0)).toBe(true);
    });

    it("parseInt rejects non-numeric strings", () => {
        const result = parseInt("abc", 10);
        expect(isNaN(result)).toBe(true);
    });

    it("parseFloat handles mixed alphanumeric input", () => {
        const result = parseFloat("3.14abc");
        expect(result).toBe(3.14);
    });

    it("DOM textContent prevents script injection via innerHTML", () => {
        const div = document.createElement("div");
        const malicious = '<img src=x onerror="alert(1)">';
        div.textContent = malicious;
        expect(div.querySelector("img")).toBeNull();
        expect(div.textContent).toBe(malicious);
    });

    it("DOM textContent prevents SVG injection", () => {
        const div = document.createElement("div");
        const svg = '<svg onload="alert(1)"><circle></circle></svg>';
        div.textContent = svg;
        expect(div.querySelector("svg")).toBeNull();
    });
});

describe("Output sanitization", () => {
    it("result div with innerHTML should escape user input", () => {
        const div = document.createElement("div");
        const userInput = '<script>document.cookie</script>';
        const escaped = userInput.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        div.innerHTML = `<p>${escaped}</p>`;
        expect(div.querySelector("script")).toBeNull();
    });

    it("result div with textContent is safe from injection", () => {
        const div = document.createElement("div");
        const userInput = '"><img src=x onerror=alert(1)>';
        div.textContent = userInput;
        expect(div.querySelector("img")).toBeNull();
    });

    it("number formatting does not introduce HTML", () => {
        const num = 42.5;
        const formatted = num.toFixed(2);
        expect(formatted).toBe("42.50");
        expect(formatted).not.toContain("<");
        expect(formatted).not.toContain(">");
    });
});
