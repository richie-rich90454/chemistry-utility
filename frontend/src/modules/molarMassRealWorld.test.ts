import { describe, it, expect } from "vitest";
import { parseElement, parseNumber, calculateMolarMass, formatFormula } from "./formulaParser.js";

interface ChemicalElement {
    symbol: string;
    name: string;
    atomicMass: number;
    type: string;
    electronegativity: number | null;
}

const testElements: ChemicalElement[] = [
    { symbol: "H", name: "Hydrogen", atomicMass: 1.008, type: "non-metal", electronegativity: 2.20 },
    { symbol: "C", name: "Carbon", atomicMass: 12.011, type: "non-metal", electronegativity: 2.55 },
    { symbol: "O", name: "Oxygen", atomicMass: 15.999, type: "non-metal", electronegativity: 3.44 },
    { symbol: "N", name: "Nitrogen", atomicMass: 14.007, type: "non-metal", electronegativity: 3.04 },
    { symbol: "Na", name: "Sodium", atomicMass: 22.990, type: "alkali metal", electronegativity: 0.93 },
    { symbol: "Cl", name: "Chlorine", atomicMass: 35.453, type: "non-metal", electronegativity: 3.16 },
    { symbol: "Ca", name: "Calcium", atomicMass: 40.078, type: "alkaline earth metal", electronegativity: 1.00 },
    { symbol: "Fe", name: "Iron", atomicMass: 55.845, type: "transition metal", electronegativity: 1.83 },
    { symbol: "S", name: "Sulfur", atomicMass: 32.06, type: "non-metal", electronegativity: 2.58 },
    { symbol: "Mg", name: "Magnesium", atomicMass: 24.305, type: "alkaline earth metal", electronegativity: 1.31 },
    { symbol: "K", name: "Potassium", atomicMass: 39.098, type: "alkali metal", electronegativity: 0.82 },
    { symbol: "P", name: "Phosphorus", atomicMass: 30.974, type: "non-metal", electronegativity: 2.19 },
    { symbol: "Al", name: "Aluminum", atomicMass: 26.982, type: "metal", electronegativity: 1.61 },
];

describe("Molar mass - real world compounds", () => {
    it("calculates NaCl molar mass", () => {
        expect(calculateMolarMass("NaCl", testElements)).toBeCloseTo(58.443, 1);
    });

    it("calculates H2SO4 molar mass", () => {
        expect(calculateMolarMass("H2SO4", testElements)).toBeCloseTo(98.079, 0);
    });

    it("calculates Ca(OH)2 molar mass", () => {
        expect(calculateMolarMass("Ca(OH)2", testElements)).toBeCloseTo(74.093, 0);
    });

    it("calculates KCl molar mass", () => {
        expect(calculateMolarMass("KCl", testElements)).toBeCloseTo(74.551, 0);
    });

    it("calculates CH4 molar mass", () => {
        expect(calculateMolarMass("CH4", testElements)).toBeCloseTo(16.043, 1);
    });

    it("calculates Fe2O3 molar mass", () => {
        expect(calculateMolarMass("Fe2O3", testElements)).toBeCloseTo(159.687, 0);
    });

    it("calculates Mg(OH)2 molar mass", () => {
        expect(calculateMolarMass("Mg(OH)2", testElements)).toBeCloseTo(58.32, 0);
    });
});

describe("formatFormula - real world formulas", () => {
    it("expands Ca(OH)2", () => {
        expect(formatFormula("Ca(OH)2")).toBe("CaOHOH");
    });

    it("expands Al2(SO4)3", () => {
        expect(formatFormula("Al2(SO4)3")).toBe("Al2SO4SO4SO4");
    });

    it("preserves simple formula NaCl", () => {
        expect(formatFormula("NaCl")).toBe("NaCl");
    });

    it("preserves formula without parens H2SO4", () => {
        expect(formatFormula("H2SO4")).toBe("H2SO4");
    });

    it("expands double nested (Mg(OH)2)2", () => {
        expect(formatFormula("(Mg(OH)2)2")).toBe("MgOHOHMgOHOH");
    });
});
