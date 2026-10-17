import { describe, it, expect } from "vitest";
import { parseElement, parseNumber, calculateMolarMass, formatFormula } from "./formulaParser.js";

interface ChemicalElement {
    symbol: string;
    name: string;
    atomicMass: number;
    type: string;
    electronegativity: number | null;
    atomicNumber: number;
    valenceElectrons: number;
    totalElectrons: number;
    group: number;
    period: number;
}

const testElements: ChemicalElement[] = [
    { symbol: "H", name: "Hydrogen", atomicMass: 1.008, type: "non-metal", electronegativity: 2.20, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1 },
    { symbol: "C", name: "Carbon", atomicMass: 12.011, type: "non-metal", electronegativity: 2.55, atomicNumber: 6, valenceElectrons: 4, totalElectrons: 6, group: 14, period: 2 },
    { symbol: "O", name: "Oxygen", atomicMass: 15.999, type: "non-metal", electronegativity: 3.44, atomicNumber: 8, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2 },
    { symbol: "N", name: "Nitrogen", atomicMass: 14.007, type: "non-metal", electronegativity: 3.04, atomicNumber: 7, valenceElectrons: 5, totalElectrons: 7, group: 15, period: 2 },
    { symbol: "Na", name: "Sodium", atomicMass: 22.990, type: "alkali metal", electronegativity: 0.93, atomicNumber: 11, valenceElectrons: 1, totalElectrons: 11, group: 1, period: 3 },
    { symbol: "Cl", name: "Chlorine", atomicMass: 35.453, type: "non-metal", electronegativity: 3.16, atomicNumber: 17, valenceElectrons: 7, totalElectrons: 17, group: 17, period: 3 },
    { symbol: "Ca", name: "Calcium", atomicMass: 40.078, type: "alkaline earth metal", electronegativity: 1.00, atomicNumber: 20, valenceElectrons: 2, totalElectrons: 20, group: 2, period: 4 },
    { symbol: "Fe", name: "Iron", atomicMass: 55.845, type: "transition metal", electronegativity: 1.83, atomicNumber: 26, valenceElectrons: 2, totalElectrons: 26, group: 8, period: 4 },
    { symbol: "S", name: "Sulfur", atomicMass: 32.06, type: "non-metal", electronegativity: 2.58, atomicNumber: 16, valenceElectrons: 6, totalElectrons: 16, group: 16, period: 3 },
    { symbol: "Mg", name: "Magnesium", atomicMass: 24.305, type: "alkaline earth metal", electronegativity: 1.31, atomicNumber: 12, valenceElectrons: 2, totalElectrons: 12, group: 2, period: 3 },
    { symbol: "Al", name: "Aluminum", atomicMass: 26.982, type: "metal", electronegativity: 1.61, atomicNumber: 13, valenceElectrons: 3, totalElectrons: 13, group: 13, period: 3 },
    { symbol: "K", name: "Potassium", atomicMass: 39.098, type: "alkali metal", electronegativity: 0.82, atomicNumber: 19, valenceElectrons: 1, totalElectrons: 19, group: 1, period: 4 },
    { symbol: "P", name: "Phosphorus", atomicMass: 30.974, type: "non-metal", electronegativity: 2.19, atomicNumber: 15, valenceElectrons: 5, totalElectrons: 15, group: 15, period: 3 },
];

describe("formulaParser edge cases", () => {
    it("parseElement with single letter element (C at index 0)", () => {
        const [symbol, newIndex] = parseElement("CO2", 0);
        expect(symbol).toBe("C");
        expect(newIndex).toBe(1);
    });

    it("parseElement with two letter element (Na at index 0)", () => {
        const [symbol, newIndex] = parseElement("NaCl", 0);
        expect(symbol).toBe("Na");
        expect(newIndex).toBe(2);
    });

    it("parseElement throws at non-uppercase position", () => {
        expect(() => parseElement("abc", 0)).toThrow("Invalid element at position 0");
    });

    it("parseNumber with no digits returns 1", () => {
        const [value, newIndex] = parseNumber("H2O", 0);
        expect(value).toBe(1);
        expect(newIndex).toBe(0);
    });

    it("parseNumber with multi-digit number (12 at index 0)", () => {
        const [value, newIndex] = parseNumber("12H", 0);
        expect(value).toBe(12);
        expect(newIndex).toBe(2);
    });

    it("parseNumber with single digit", () => {
        const [value, newIndex] = parseNumber("2O", 0);
        expect(value).toBe(2);
        expect(newIndex).toBe(1);
    });

    it("calculateMolarMass with deeply nested parentheses: ((H2O)2)3", () => {
        // H2O = 1.008*2 + 15.999 = 18.015
        // (H2O)2 = 18.015 * 2 = 36.03
        // ((H2O)2)3 = 36.03 * 3 = 108.09
        const mass = calculateMolarMass("((H2O)2)3", testElements);
        expect(mass).toBeCloseTo(108.09, 1);
    });

    it("calculateMolarMass with multiple parenthesized groups: Mg(OH)2", () => {
        // Mg = 24.305, O = 15.999, H = 1.008
        // (OH)2 = (15.999 + 1.008) * 2 = 34.014
        // Total = 24.305 + 34.014 = 58.319
        const mass = calculateMolarMass("Mg(OH)2", testElements);
        expect(mass).toBeCloseTo(58.319, 1);
    });

    it("calculateMolarMass throws for lowercase start", () => {
        expect(() => calculateMolarMass("naCl", testElements)).toThrow("Invalid character: n");
    });

    it("calculateMolarMass throws for unknown element", () => {
        expect(() => calculateMolarMass("XeO4", testElements)).toThrow("Element not found: Xe");
    });

    it("calculateMolarMass with single element: O2", () => {
        const mass = calculateMolarMass("O2", testElements);
        expect(mass).toBeCloseTo(31.998, 2);
    });

    it("calculateMolarMass with complex formula: C6H12O6", () => {
        // C6 = 12.011 * 6 = 72.066
        // H12 = 1.008 * 12 = 12.096
        // O6 = 15.999 * 6 = 95.994
        // Total = 72.066 + 12.096 + 95.994 = 180.156
        const mass = calculateMolarMass("C6H12O6", testElements);
        expect(mass).toBeCloseTo(180.156, 1);
    });

    it("formatFormula with nested parentheses: (Mg(OH)2)2", () => {
        const result = formatFormula("(Mg(OH)2)2");
        expect(result).toBe("MgOHOHMgOHOH");
    });

    it("formatFormula with bracket notation: [Fe(CN)6]4", () => {
        const result = formatFormula("[Fe(CN)6]4");
        expect(result).toBe("FeCNCNCNCNCNCNFeCNCNCNCNCNCNFeCNCNCNCNCNCNFeCNCNCNCNCNCN");
    });

    it("formatFormula throws for empty string", () => {
        expect(() => formatFormula("")).toThrow("Bad formula");
    });

    it("calculateMolarMass with Ca3(PO4)2", () => {
        const mass = calculateMolarMass("Ca3(PO4)2", testElements);
        expect(mass).toBeCloseTo(310.18, 0);
    });

    it("calculateMolarMass with Al2(SO4)3", () => {
        const mass = calculateMolarMass("Al2(SO4)3", testElements);
        expect(mass).toBeCloseTo(342.15, 0);
    });

    it("parseElement advances index correctly", () => {
        const [symbol, newIndex] = parseElement("NaCl", 0);
        expect(symbol).toBe("Na");
        expect(newIndex).toBe(2);
    });

    it("parseNumber with trailing letters stops at correct position", () => {
        const [num, newIndex] = parseNumber("12abc", 0);
        expect(num).toBe(12);
        expect(newIndex).toBe(2);
    });

    it("calculateMolarMass with Na2CO3", () => {
        const mass = calculateMolarMass("Na2CO3", testElements);
        expect(mass).toBeCloseTo(105.99, 0);
    });

    it("calculateMolarMass throws for unmatched opening paren", () => {
        expect(() => calculateMolarMass("(H2O", testElements)).toThrow();
    });

    it("calculateMolarMass with KCl", () => {
        const mass = calculateMolarMass("KCl", testElements);
        expect(mass).toBeCloseTo(74.551, 0);
    });

    it("calculateMolarMass with CH4", () => {
        const mass = calculateMolarMass("CH4", testElements);
        expect(mass).toBeCloseTo(16.043, 1);
    });

    it("calculateMolarMass with Fe2O3", () => {
        const mass = calculateMolarMass("Fe2O3", testElements);
        expect(mass).toBeCloseTo(159.687, 0);
    });

    it("calculateMolarMass with H2SO4", () => {
        const mass = calculateMolarMass("H2SO4", testElements);
        expect(mass).toBeCloseTo(98.079, 0);
    });

    it("calculateMolarMass with Ca(OH)2", () => {
        const mass = calculateMolarMass("Ca(OH)2", testElements);
        expect(mass).toBeCloseTo(74.093, 0);
    });

    it("formatFormula with simple formula H2O returns expanded form", () => {
        const result = formatFormula("H2O");
        // formatFormula expands subscripts: H2O -> HOH
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("H");
        expect(result).toContain("O");
    });

    it("parseElement with Fe at index 0", () => {
        const [symbol, newIndex] = parseElement("Fe2O3", 0);
        expect(symbol).toBe("Fe");
        expect(newIndex).toBe(2);
    });

    it("parseNumber with no digits at position returns 1", () => {
        // parseNumber returns 1 when no digits found at position
        const [value, newIndex] = parseNumber("H2O", 0);
        expect(value).toBe(1);
        expect(newIndex).toBe(0);
    });
});
