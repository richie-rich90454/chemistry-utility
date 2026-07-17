import { describe, it, expect } from "vitest";
import { SafeHtmlBuilder } from "./safeHtmlBuilder.js";

describe("SafeHtmlBuilder", () => {
    it("builds empty string when no parts are added", () => {
        expect(new SafeHtmlBuilder().build()).toBe("");
    });

    it("appends escaped plain text", () => {
        const result = new SafeHtmlBuilder().text("Hello").build();
        expect(result).toBe("Hello");
    });

    it("escapes special characters in plain text", () => {
        const result = new SafeHtmlBuilder().text("<script>alert(1)</script>").build();
        expect(result).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    });

    it("appends bold text wrapped in strong tags", () => {
        const result = new SafeHtmlBuilder().bold("important").build();
        expect(result).toBe("<strong>important</strong>");
    });

    it("escapes content inside bold tags", () => {
        const result = new SafeHtmlBuilder().bold("a<b").build();
        expect(result).toBe("<strong>a&lt;b</strong>");
    });

    it("appends italic text wrapped in em tags", () => {
        const result = new SafeHtmlBuilder().italic("note").build();
        expect(result).toBe("<em>note</em>");
    });

    it("escapes content inside italic tags", () => {
        const result = new SafeHtmlBuilder().italic("a&b").build();
        expect(result).toBe("<em>a&amp;b</em>");
    });

    it("appends subscript text wrapped in sub tags", () => {
        const result = new SafeHtmlBuilder().sub("2").build();
        expect(result).toBe("<sub>2</sub>");
    });

    it("appends superscript text wrapped in sup tags", () => {
        const result = new SafeHtmlBuilder().sup("2+").build();
        expect(result).toBe("<sup>2+</sup>");
    });

    it("appends span with class and escaped content", () => {
        const result = new SafeHtmlBuilder().span("value", "unit").build();
        expect(result).toBe('<span class="unit">value</span>');
    });

    it("escapes both class name and content in span", () => {
        const result = new SafeHtmlBuilder().span("a<b", 'c"d').build();
        expect(result).toBe('<span class="c&quot;d">a&lt;b</span>');
    });

    it("supports fluent chaining of multiple methods", () => {
        const result = new SafeHtmlBuilder()
            .text("Result: ")
            .bold("42")
            .text(" ")
            .italic("mol/L")
            .build();
        expect(result).toBe("Result: <strong>42</strong> <em>mol/L</em>");
    });

    it("builds a chemical formula with subscripts and superscripts", () => {
        const result = new SafeHtmlBuilder()
            .text("H")
            .sub("2")
            .text("O")
            .text(" (")
            .sup("2+")
            .text(")")
            .build();
        expect(result).toBe("H<sub>2</sub>O (<sup>2+</sup>)");
    });

    it("escapes ampersand in all builder methods consistently", () => {
        const result = new SafeHtmlBuilder()
            .text("a&b")
            .bold("c&d")
            .italic("e&f")
            .sub("g&h")
            .sup("i&j")
            .span("k&l", "m&n")
            .build();
        expect(result).toBe(
            "a&amp;b" +
            "<strong>c&amp;d</strong>" +
            "<em>e&amp;f</em>" +
            "<sub>g&amp;h</sub>" +
            "<sup>i&amp;j</sup>" +
            '<span class="m&amp;n">k&amp;l</span>'
        );
    });

    it("returns independent builder instances", () => {
        const builder1 = new SafeHtmlBuilder().text("one");
        const builder2 = new SafeHtmlBuilder().text("two");
        expect(builder1.build()).toBe("one");
        expect(builder2.build()).toBe("two");
    });
});
