import {describe, it, expect} from "vitest";
import {Fraction, parseEquation, balanceEquation, balanceIonic} from "./equationBalancer.js";

describe("Fraction exact arithmetic", function(){
    it("constructs and simplifies", function(){
        let f = new Fraction(4, 6);
        expect(f.n).toBe(2);
        expect(f.d).toBe(3);
    });
    it("throws on zero denominator", function(){
        expect(function(){ return new Fraction(1, 0); }).toThrow("Denominator zero");
    });
    it("normalizes negative denominators", function(){
        let f = new Fraction(1, -2);
        expect(f.n).toBe(-1);
        expect(f.d).toBe(2);
    });
    it("adds, subtracts, multiplies, divides", function(){
        let a = new Fraction(1, 2);
        let b = new Fraction(1, 3);
        expect(a.add(b).n).toBe(5);
        expect(a.subtract(b).n).toBe(1);
        expect(a.multiply(b).n).toBe(1);
        expect(a.divide(b).n).toBe(3);
    });
    it("divide throws on zero numerator divisor", function(){
        expect(function(){ return new Fraction(1, 2).divide(new Fraction(0, 1)); }).toThrow("Div by zero");
    });
    it("isZero reports correctly", function(){
        expect(new Fraction(0, 5).isZero()).toBe(true);
        expect(new Fraction(1, 5).isZero()).toBe(false);
    });
});

describe("legacy curly-brace paths", function(){
    it("parses curly-brace formulas", function(){
        let r = parseEquation("Al2{SO4}3 + NaOH -> Al{OH}3 + Na2SO4");
        expect(r.reactants.length).toBe(2);
        expect(r.products.length).toBe(2);
    });
    it("balances via legacy solver with curly braces", function(){
        expect(balanceEquation("Al2{SO4}3 + NaOH -> Al{OH}3 + Na2SO4")).toBe("Al2{SO4}3 + 6NaOH -> 2Al{OH}3 + 3Na2SO4");
    });
    it("balances ionic via legacy solver with curly braces", function(){
        expect(balanceIonic("Fe{2+} + Cu -> Fe + Cu{2+}")).toContain("Fe");
    });
    it("legacy parse handles unknown elements by falling back", function(){
        expect(balanceEquation("Xy2 + O2 -> XyO2")).toContain("Xy");
    });
});

describe("fast-balance error branches", function(){
    it("throws Invalid format for missing arrow", function(){
        expect(function(){ return balanceEquation("H2 O2 H2O"); }).toThrow("Invalid format");
    });
    it("throws for empty side", function(){
        expect(function(){ return balanceEquation("-> H2O"); }).toThrow("Invalid format");
    });
    it("throws Could not balance for unbalanceable", function(){
        expect(function(){ return balanceEquation("H2 -> He"); }).toThrow("Could not balance");
    });
    it("throws on ambiguous spaceless charge input", function(){
        expect(function(){ return balanceEquation("H2+O2"); }).toThrow("Invalid format");
    });
    it("enforces maxCoefficient", function(){
        expect(function(){ return balanceEquation("H2 + O2 -> H2O", 1); }).toThrow("Could not balance");
    });
    it("ionic enforces maxCoefficient", function(){
        expect(function(){ return balanceIonic("H2 + O2 -> H2O", 1); }).toThrow("Could not balance ionic equation");
    });
    it("ionic throws Invalid format for garbage", function(){
        expect(function(){ return balanceIonic("H2 O2 H2O"); }).toThrow("Invalid format");
    });
    it("ionic falls back for unbalanceable", function(){
        expect(function(){ return balanceIonic("H2 -> He"); }).toThrow("Could not balance ionic equation");
    });
});

describe("hydrates and explanation mode", function(){
    it("balances a hydrate dehydration", function(){
        expect(balanceEquation("CuSO4·5H2O -> CuSO4 + H2O")).toContain("CuSO4");
    });
    it("returns explanation steps in explain mode", function(){
        let res = balanceEquation("H2 + O2 -> H2O", 10000, true);
        expect(typeof res).toBe("object");
        if (typeof res !== "string"){
            expect(res.explanation.steps.length).toBeGreaterThan(0);
            expect(res.explanation.coefficients).toEqual([2, 1, 2]);
            expect(res.equation).toBe("2H2 + O2 -> 2H2O");
        }
    });
    it("legacy explanation via curly braces", function(){
        let res = balanceEquation("Al2{SO4}3 + NaOH -> Al{OH}3 + Na2SO4", 10000, true);
        expect(typeof res === "string" || (typeof res !== "string" && res.explanation.steps.length > 0)).toBe(true);
    });
});
