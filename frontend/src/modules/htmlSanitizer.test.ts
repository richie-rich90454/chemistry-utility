import { describe, it, expect } from "vitest";
import { HtmlSanitizer } from "./htmlSanitizer.js";

describe("HtmlSanitizer", () => {
    it("escapes ampersand character", () => {
        expect(HtmlSanitizer.escape("a&b")).toBe("a&amp;b");
    });

    it("escapes less-than character", () => {
        expect(HtmlSanitizer.escape("a<b")).toBe("a&lt;b");
    });

    it("escapes greater-than character", () => {
        expect(HtmlSanitizer.escape("a>b")).toBe("a&gt;b");
    });

    it("escapes double quote character", () => {
        expect(HtmlSanitizer.escape('a"b')).toBe("a&quot;b");
    });

    it("escapes single quote character", () => {
        expect(HtmlSanitizer.escape("a'b")).toBe("a&#39;b");
    });

    it("escapes all special characters in a single string", () => {
        expect(HtmlSanitizer.escape('<script>alert("x" & \'y\')</script>')).toBe(
            "&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;"
        );
    });

    it("returns empty string unchanged", () => {
        expect(HtmlSanitizer.escape("")).toBe("");
    });

    it("returns string without special characters unchanged", () => {
        expect(HtmlSanitizer.escape("Hello World 123")).toBe("Hello World 123");
    });

    it("escapes ampersand first to avoid double-escaping", () => {
        expect(HtmlSanitizer.escape("&lt;")).toBe("&amp;lt;");
    });

    it("handles multiple occurrences of the same character", () => {
        expect(HtmlSanitizer.escape("<<>>")).toBe("&lt;&lt;&gt;&gt;");
    });

    it("escapes a realistic chemical formula with HTML", () => {
        expect(HtmlSanitizer.escape("H2O <b>bold</b>")).toBe("H2O &lt;b&gt;bold&lt;/b&gt;");
    });
});
