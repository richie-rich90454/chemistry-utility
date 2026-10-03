import { describe, it, expect } from "vitest";
import { parseSide, parseBalancedEquation, sanitizeId } from "./equationFormatter.js";

describe("parseSide", () => {
    it("keeps spaced plus inside a single term (separator needs no space)", () => {
        expect(parseSide("H2 + O2")).toEqual([
            { coefficient: "", formula: "H2 + O2" },
        ]);
    });

    it("splits spaceless terms on plus followed by uppercase", () => {
        expect(parseSide("H2+O2")).toEqual([
            { coefficient: "", formula: "H2" },
            { coefficient: "", formula: "O2" },
        ]);
    });

    it("splits on plus followed by a digit", () => {
        expect(parseSide("X+2Y")).toEqual([
            { coefficient: "", formula: "X" },
            { coefficient: "", formula: "2Y" },
        ]);
    });

    it("splits on plus followed by an opening bracket", () => {
        expect(parseSide("A+(B)")).toEqual([
            { coefficient: "", formula: "A" },
            { coefficient: "", formula: "(B)" },
        ]);
        expect(parseSide("A+[B]")).toEqual([
            { coefficient: "", formula: "A" },
            { coefficient: "", formula: "[B]" },
        ]);
    });

    it("keeps ionic charges such as Fe2+ intact", () => {
        expect(parseSide("Fe2+")).toEqual([{ coefficient: "", formula: "Fe2+" }]);
    });

    it("keeps trailing plus when no next term follows", () => {
        expect(parseSide("A+")).toEqual([{ coefficient: "", formula: "A+" }]);
    });

    it("keeps plus followed by lowercase intact", () => {
        expect(parseSide("a+b")).toEqual([{ coefficient: "", formula: "a+b" }]);
    });

    it("parses leading coefficients with space separator", () => {
        expect(parseSide("2 H2")).toEqual([
            { coefficient: "2", formula: "H2" },
        ]);
        expect(parseSide("2 H2 + 3 O2")).toEqual([
            { coefficient: "2", formula: "H2 + 3 O2" },
        ]);
    });

    it("keeps stray spaced separators inside the term", () => {
        expect(parseSide("H2 +  + O2")).toEqual([
            { coefficient: "", formula: "H2 +  + O2" },
        ]);
    });

    it("returns empty array for empty input", () => {
        expect(parseSide("")).toEqual([]);
    });

    it("drops empty terms from a leading separator", () => {
        expect(parseSide("+H2")).toEqual([{ coefficient: "", formula: "H2" }]);
    });
});

describe("parseBalancedEquation", () => {
    it("parses equations with spaced arrow", () => {
        const res = parseBalancedEquation("2 H2+O2 -> 2 H2O");
        expect(res.reactants.length).toBe(2);
        expect(res.products).toEqual([{ coefficient: "2", formula: "H2O" }]);
    });

    it("parses equations with compact arrow", () => {
        const res = parseBalancedEquation("H2+O2->H2O");
        expect(res.reactants.length).toBe(2);
        expect(res.products.length).toBe(1);
    });

    it("parses equations with spaced equals", () => {
        const res = parseBalancedEquation("H2+O2 = H2O");
        expect(res.reactants.length).toBe(2);
        expect(res.products.length).toBe(1);
    });

    it("parses equations with compact equals", () => {
        const res = parseBalancedEquation("H2+O2=H2O");
        expect(res.reactants.length).toBe(2);
        expect(res.products.length).toBe(1);
    });

    it("falls back to a single reactant when no separator exists", () => {
        const res = parseBalancedEquation("H2O");
        expect(res).toEqual({ reactants: [{ coefficient: "", formula: "H2O" }], products: [] });
    });
});

describe("sanitizeId", () => {
    it("keeps alphanumerics, dash and underscore", () => {
        expect(sanitizeId("H2O-1_x")).toBe("H2O-1_x");
    });

    it("replaces special chars and collapses dashes", () => {
        expect(sanitizeId("H2O (l)")).toBe("H2O-l");
    });

    it("trims leading and trailing dashes", () => {
        expect(sanitizeId("(H2)")).toBe("H2");
    });

    it("returns fallback for strings with no safe chars", () => {
        expect(sanitizeId("+++")).toBe("formula");
        expect(sanitizeId("")).toBe("formula");
    });
});
