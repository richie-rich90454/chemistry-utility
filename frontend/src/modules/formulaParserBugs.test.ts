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

describe("formulaParser square bracket support", () => {
    it("calculateMolarMass supports [Fe(CN)6] notation", () => {
        // K4[Fe(CN)6]: 4*K + Fe + 6*(C+N)
        // 4*39.098 + 55.845 + 6*(12.011 + 14.007) = 156.392 + 55.845 + 156.108 = 368.345
        const mass = calculateMolarMass("K4[Fe(CN)6]", testElements);
        expect(mass).toBeCloseTo(368.345, 1);
    });

    it("calculateMolarMass supports nested [Mg(OH)2] notation", () => {
        // [Mg(OH)2]: Mg + 2*(O+H) = 24.305 + 2*(15.999+1.008) = 24.305 + 34.014 = 58.319
        const mass = calculateMolarMass("[Mg(OH)2]", testElements);
        expect(mass).toBeCloseTo(58.319, 1);
    });

    it("calculateMolarMass supports [Fe(CN)6]3 multiplier", () => {
        // [Fe(CN)6]3 = 3 * (Fe + 6*(C+N)) = 3 * (55.845 + 6*26.018) = 3 * 211.953 = 635.859
        const mass = calculateMolarMass("[Fe(CN)6]3", testElements);
        expect(mass).toBeCloseTo(635.859, 1);
    });
});

describe("formulaParser curly brace support", () => {
    it("calculateMolarMass supports {Mg(OH)2} notation", () => {
        const mass = calculateMolarMass("{Mg(OH)2}", testElements);
        expect(mass).toBeCloseTo(58.319, 1);
    });

    it("calculateMolarMass supports {Fe(CN)6}3 multiplier", () => {
        const mass = calculateMolarMass("{Fe(CN)6}3", testElements);
        expect(mass).toBeCloseTo(635.859, 1);
    });
});

describe("formulaParser hydrate notation support", () => {
    it("calculateMolarMass supports CuSO4·5H2O notation", () => {
        // CuSO4: not in test elements, use CaCl2·6H2O instead
        // CaCl2·6H2O: Ca + 2*Cl + 6*(2*H+O) = 40.078 + 2*35.453 + 6*18.015
        // = 40.078 + 70.906 + 108.09 = 219.074
        const mass = calculateMolarMass("CaCl2·6H2O", testElements);
        expect(mass).toBeCloseTo(219.074, 1);
    });

    it("calculateMolarMass supports CaCl2*6H2O notation (asterisk)", () => {
        const mass = calculateMolarMass("CaCl2*6H2O", testElements);
        expect(mass).toBeCloseTo(219.074, 1);
    });

    it("calculateMolarMass supports Na2CO3·10H2O notation", () => {
        // Na2CO3·10H2O: 2*Na + C + 3*O + 10*(2*H+O)
        // = 2*22.990 + 12.011 + 3*15.999 + 10*18.015
        // = 45.980 + 12.011 + 47.997 + 180.15 = 286.138
        const mass = calculateMolarMass("Na2CO3·10H2O", testElements);
        expect(mass).toBeCloseTo(286.138, 1);
    });
});

describe("formulaParser charge notation support", () => {
    it("calculateMolarMass strips caret charge notation: SO4^2-", () => {
        // SO4^2- = S + 4*O = 32.06 + 4*15.999 = 32.06 + 63.996 = 96.056
        const mass = calculateMolarMass("SO4^2-", testElements);
        expect(mass).toBeCloseTo(96.056, 1);
    });

    it("calculateMolarMass strips caret charge notation: Fe^3+", () => {
        // Fe^3+ = Fe = 55.845
        const mass = calculateMolarMass("Fe^3+", testElements);
        expect(mass).toBeCloseTo(55.845, 1);
    });

    it("calculateMolarMass strips caret charge notation: Cl^-", () => {
        // Cl^- = Cl = 35.453
        const mass = calculateMolarMass("Cl^-", testElements);
        expect(mass).toBeCloseTo(35.453, 1);
    });

    it("calculateMolarMass strips caret charge notation: H^+", () => {
        // H^+ = H = 1.008
        const mass = calculateMolarMass("H^+", testElements);
        expect(mass).toBeCloseTo(1.008, 1);
    });

    it("calculateMolarMass handles brackets with charge: [Fe(CN)6]^4-", () => {
        // [Fe(CN)6]^4- = Fe + 6*(C+N) = 55.845 + 6*(12.011+14.007) = 55.845 + 156.108 = 211.953
        const mass = calculateMolarMass("[Fe(CN)6]^4-", testElements);
        expect(mass).toBeCloseTo(211.953, 1);
    });
});

describe("formulaParser formatFormula braces and hydrate", () => {
    it("formatFormula handles curly braces: {Mg(OH)2}2", () => {
        const result = formatFormula("{Mg(OH)2}2");
        expect(result).toBe("MgOHOHMgOHOH");
    });

    it("formatFormula handles hydrate dot notation: H2O·5H2O", () => {
        const result = formatFormula("H2O·5H2O");
        // Hydrate expands: H2O followed by 5x H2O (subscripts preserved)
        expect(result).toBe("H2OH2OH2OH2OH2OH2O");
    });

    it("formatFormula handles hydrate asterisk notation: H2O*5H2O", () => {
        const result = formatFormula("H2O*5H2O");
        expect(result).toBe("H2OH2OH2OH2OH2OH2O");
    });
});

describe("formulaParser whitespace handling", () => {
    it("calculateMolarMass ignores whitespace in formula", () => {
        // "H2 O" should be same as "H2O"
        const mass = calculateMolarMass("H2 O", testElements);
        expect(mass).toBeCloseTo(18.015, 1);
    });

    it("calculateMolarMass handles leading/trailing whitespace", () => {
        const mass = calculateMolarMass("  H2O  ", testElements);
        expect(mass).toBeCloseTo(18.015, 1);
    });
});

describe("formulaParser empty input", () => {
    it("calculateMolarMass throws for empty string", () => {
        expect(() => calculateMolarMass("", testElements)).toThrow();
    });

    it("calculateMolarMass throws for whitespace-only string", () => {
        expect(() => calculateMolarMass("   ", testElements)).toThrow();
    });
});

describe("formulaParser lowercase two-letter element lookup", () => {
    it("parseElement correctly handles single uppercase followed by non-letter", () => {
        // "H2O" - parseElement at index 0 should return "H" and index 1
        const [symbol, newIndex] = parseElement("H2O", 0);
        expect(symbol).toBe("H");
        expect(newIndex).toBe(1);
    });

    it("parseElement handles element at end of string", () => {
        // "Na" - parseElement at index 0 should return "Na" and index 2 (end of string)
        const [symbol, newIndex] = parseElement("Na", 0);
        expect(symbol).toBe("Na");
        expect(newIndex).toBe(2);
    });

    it("parseNumber handles very large numbers", () => {
        const [value, newIndex] = parseNumber("123456789H", 0);
        expect(value).toBe(123456789);
        expect(newIndex).toBe(9);
    });
});

describe("formulaParser deeply nested edge cases", () => {
    it("calculateMolarMass handles 3-level nesting: (((H2O)2)3)4", () => {
        // H2O = 18.015
        // (H2O)2 = 36.03
        // ((H2O)2)3 = 108.09
        // (((H2O)2)3)4 = 432.36
        const mass = calculateMolarMass("(((H2O)2)3)4", testElements);
        expect(mass).toBeCloseTo(432.36, 1);
    });

    it("calculateMolarMass handles bracket-then-paren nesting: [Fe(CN)6]3", () => {
        const mass = calculateMolarMass("[Fe(CN)6]3", testElements);
        expect(mass).toBeCloseTo(635.859, 1);
    });

    it("calculateMolarMass handles mixed bracket types: {[Fe(CN)6]2}3", () => {
        // [Fe(CN)6]2 = 2 * (55.845 + 6*26.018) = 2 * 211.953 = 423.906
        // {[Fe(CN)6]2}3 = 3 * 423.906 = 1271.718
        const mass = calculateMolarMass("{[Fe(CN)6]2}3", testElements);
        expect(mass).toBeCloseTo(1271.718, 0);
    });
});

describe("formulaParser unmatched bracket edge cases", () => {
    it("calculateMolarMass throws for unmatched closing bracket ]", () => {
        expect(() => calculateMolarMass("H2O]", testElements)).toThrow();
    });

    it("calculateMolarMass throws for unmatched closing brace }", () => {
        expect(() => calculateMolarMass("H2O}", testElements)).toThrow();
    });

    it("calculateMolarMass throws for unmatched opening [", () => {
        expect(() => calculateMolarMass("[H2O", testElements)).toThrow();
    });

    it("calculateMolarMass throws for unmatched opening {", () => {
        expect(() => calculateMolarMass("{H2O", testElements)).toThrow();
    });
});
