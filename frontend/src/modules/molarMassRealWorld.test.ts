import { describe, it, expect } from "vitest";
import { calculateMolarMass, formatFormula } from "./formulaParser.js";

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

    it("calculates Al2(SO4)3 molar mass", () => {
        expect(calculateMolarMass("Al2(SO4)3", testElements)).toBeCloseTo(342.15, 0);
    });

    it("calculates H3PO4 molar mass", () => {
        expect(calculateMolarMass("H3PO4", testElements)).toBeCloseTo(97.994, 0);
    });

    it("calculates NaOH molar mass", () => {
        expect(calculateMolarMass("NaOH", testElements)).toBeCloseTo(39.997, 0);
    });

    it("calculates CaCO3 molar mass", () => {
        expect(calculateMolarMass("CaCO3", testElements)).toBeCloseTo(100.087, 0);
    });

	it("calculates K2SO4 molar mass", () => {
		expect(calculateMolarMass("K2SO4", testElements)).toBeCloseTo(174.259, 0);
	});

	it("calculates Na2SO4 molar mass", () => {
		expect(calculateMolarMass("Na2SO4", testElements)).toBeCloseTo(142.042, 0);
	});

	it("calculates FeCl3 molar mass", () => {
		expect(calculateMolarMass("FeCl3", testElements)).toBeCloseTo(162.204, 0);
	});

	it("calculates CaCl2 molar mass", () => {
		expect(calculateMolarMass("CaCl2", testElements)).toBeCloseTo(110.984, 0);
	});

	it("calculates MgSO4 molar mass", () => {
		expect(calculateMolarMass("MgSO4", testElements)).toBeCloseTo(120.366, 0);
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
