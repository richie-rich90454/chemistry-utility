import { describe, it, expect } from "vitest";
import {
    calculateMolarMass,
    formatFormula,
    parseElement,
    parseNumber,
} from "./formulaParser.js";
import { ChemicalElement } from "../types";

// Minimal element data for testing
const testElements: ChemicalElement[] = [
    { symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1, type: "nonmetal" },
    { symbol: "O", name: "Oxygen", atomicMass: 15.999, atomicNumber: 8, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2, type: "nonmetal" },
    { symbol: "Na", name: "Sodium", atomicMass: 22.990, atomicNumber: 11, valenceElectrons: 1, totalElectrons: 11, group: 1, period: 3, type: "alkali metal" },
    { symbol: "Cl", name: "Chlorine", atomicMass: 35.45, atomicNumber: 17, valenceElectrons: 7, totalElectrons: 17, group: 17, period: 3, type: "halogen" },
    { symbol: "C", name: "Carbon", atomicMass: 12.011, atomicNumber: 6, valenceElectrons: 4, totalElectrons: 6, group: 14, period: 2, type: "nonmetal" },
    { symbol: "Mg", name: "Magnesium", atomicMass: 24.305, atomicNumber: 12, valenceElectrons: 2, totalElectrons: 12, group: 2, period: 3, type: "alkaline earth metal" },
    { symbol: "Ba", name: "Barium", atomicMass: 137.327, atomicNumber: 56, valenceElectrons: 2, totalElectrons: 56, group: 2, period: 6, type: "alkaline earth metal" },
    { symbol: "N", name: "Nitrogen", atomicMass: 14.007, atomicNumber: 7, valenceElectrons: 5, totalElectrons: 7, group: 15, period: 2, type: "nonmetal" },
    { symbol: "Al", name: "Aluminium", atomicMass: 26.982, atomicNumber: 13, valenceElectrons: 3, totalElectrons: 13, group: 13, period: 3, type: "post-transition metal" },
    { symbol: "S", name: "Sulfur", atomicMass: 32.06, atomicNumber: 16, valenceElectrons: 6, totalElectrons: 16, group: 16, period: 3, type: "nonmetal" },
    { symbol: "Fe", name: "Iron", atomicMass: 55.845, atomicNumber: 26, valenceElectrons: 2, totalElectrons: 26, group: 8, period: 4, type: "transition metal" },
];

describe("calculateMolarMass", () => {
    it("calculates molar mass of H2O", () => {
        const mass = calculateMolarMass("H2O", testElements);
        expect(mass).toBeCloseTo(2 * 1.008 + 15.999, 2);
    });

    it("calculates molar mass of NaCl", () => {
        const mass = calculateMolarMass("NaCl", testElements);
        expect(mass).toBeCloseTo(22.990 + 35.45, 2);
    });

    it("calculates molar mass of CO2", () => {
        const mass = calculateMolarMass("CO2", testElements);
        expect(mass).toBeCloseTo(12.011 + 2 * 15.999, 2);
    });

    it("calculates molar mass of Mg(OH)2", () => {
        const mass = calculateMolarMass("Mg(OH)2", testElements);
        expect(mass).toBeCloseTo(24.305 + 2 * (15.999 + 1.008), 2);
    });

    it("calculates molar mass of Ba(NO3)2", () => {
        const mass = calculateMolarMass("Ba(NO3)2", testElements);
        expect(mass).toBeCloseTo(137.327 + 2 * (14.007 + 3 * 15.999), 2);
    });

    it("calculates molar mass of Al2(SO4)3", () => {
        const mass = calculateMolarMass("Al2(SO4)3", testElements);
        expect(mass).toBeCloseTo(2 * 26.982 + 3 * (32.06 + 4 * 15.999), 2);
    });

    it("calculates molar mass of Fe2(SO4)3", () => {
        const mass = calculateMolarMass("Fe2(SO4)3", testElements);
        expect(mass).toBeCloseTo(2 * 55.845 + 3 * (32.06 + 4 * 15.999), 2);
    });

    it("calculates molar mass of O2", () => {
        const mass = calculateMolarMass("O2", testElements);
        expect(mass).toBeCloseTo(2 * 15.999, 2);
    });

    it("calculates molar mass of Fe (single element)", () => {
        const mass = calculateMolarMass("Fe", testElements);
        expect(mass).toBeCloseTo(55.845, 2);
    });

    it("returns 0 for empty string", () => {
        const mass = calculateMolarMass("", testElements);
        expect(mass).toBe(0);
    });

    it("throws for unmatched opening parenthesis", () => {
        expect(() => calculateMolarMass("Mg(OH", testElements)).toThrow('Unmatched "("');
    });

    it("throws for unmatched closing parenthesis", () => {
        expect(() => calculateMolarMass("Mg)OH", testElements)).toThrow('Unmatched ")"');
    });

    it("throws for invalid characters", () => {
        expect(() => calculateMolarMass("H2O!", testElements)).toThrow("Invalid character");
    });

    it("throws for unknown element", () => {
        expect(() => calculateMolarMass("XyZ", testElements)).toThrow("Element not found");
    });

    it("throws for lowercase start of element", () => {
        expect(() => calculateMolarMass("h2O", testElements)).toThrow();
    });
});

describe("formatFormula", () => {
    it("formats H2O", () => {
        expect(formatFormula("H2O")).toBe("H2O");
    });

    it("formats NaCl", () => {
        expect(formatFormula("NaCl")).toBe("NaCl");
    });

    it("formats Mg(OH)2 by expanding parentheses", () => {
        expect(formatFormula("Mg(OH)2")).toBe("MgOHOH");
    });

    it("formats O2", () => {
        expect(formatFormula("O2")).toBe("O2");
    });

    it("formats single element without number", () => {
        expect(formatFormula("Fe")).toBe("Fe");
    });

    it("formats Ba(NO3)2 by expanding parentheses", () => {
        expect(formatFormula("Ba(NO3)2")).toBe("BaNO3NO3");
    });

    it("formats Al2(SO4)3 by expanding parentheses", () => {
        expect(formatFormula("Al2(SO4)3")).toBe("Al2SO4SO4SO4");
    });

    it("throws for empty string", () => {
        expect(() => formatFormula("")).toThrow("Bad formula");
    });

    it("throws for formula with only parentheses", () => {
        expect(() => formatFormula("()")).toThrow("Bad formula");
    });
});

describe("parseElement", () => {
    it("parses a single uppercase element", () => {
        const [symbol, newIndex] = parseElement("H2O", 0);
        expect(symbol).toBe("H");
        expect(newIndex).toBe(1);
    });

    it("parses a two-letter element symbol", () => {
        const [symbol, newIndex] = parseElement("NaCl", 0);
        expect(symbol).toBe("Na");
        expect(newIndex).toBe(2);
    });

    it("parses element at a non-zero index", () => {
        const [symbol, newIndex] = parseElement("NaCl", 2);
        expect(symbol).toBe("Cl");
        expect(newIndex).toBe(4);
    });

    it("throws for lowercase starting character", () => {
        expect(() => parseElement("abc", 0)).toThrow("Invalid element");
    });
});

describe("parseNumber", () => {
    it("parses a single digit", () => {
        const [value, newIndex] = parseNumber("H2O", 1);
        expect(value).toBe(2);
        expect(newIndex).toBe(2);
    });

    it("parses a multi-digit number", () => {
        const [value, newIndex] = parseNumber("C12H22", 1);
        expect(value).toBe(12);
        expect(newIndex).toBe(3);
    });

    it("returns 1 when no number follows", () => {
        const [value, newIndex] = parseNumber("NaCl", 2);
        expect(value).toBe(1);
        expect(newIndex).toBe(2);
    });

    it("returns 1 at end of string", () => {
        const [value, newIndex] = parseNumber("Fe", 2);
        expect(value).toBe(1);
        expect(newIndex).toBe(2);
    });
});
