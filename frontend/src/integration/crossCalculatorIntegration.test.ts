import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createContainer, createInput, createSelect, createResultDiv, cleanupDOM, getResultText } from "../test/helpers.js";
import { balanceEquation } from "../modules/equationBalancer.js";
import { calculateMolarMass } from "../modules/formulaParser.js";
import { predictBondType } from "../modules/bondPredictor.js";
import { calculateDilution, calculateMassPercent, calculateMixing } from "../modules/solutionCalculators.js";
import {
    calculateIdealGasLaw,
    calculateCombinedGasLaw,
    calculateVanDerWaals,
    calculateHalfLife,
} from "../modules/gasLawCalculators.js";
import {
    calculateCellPotential,
    calculateNernst,
    calculateElectrolysis,
} from "../modules/electrochemistryCalculators.js";

const testElements = [
    { symbol: "H", name: "Hydrogen", atomicMass: 1.008, type: "non-metal", electronegativity: 2.20 },
    { symbol: "O", name: "Oxygen", atomicMass: 15.999, type: "non-metal", electronegativity: 3.44 },
    { symbol: "C", name: "Carbon", atomicMass: 12.011, type: "non-metal", electronegativity: 2.55 },
    { symbol: "Na", name: "Sodium", atomicMass: 22.990, type: "alkali metal", electronegativity: 0.93 },
    { symbol: "Cl", name: "Chlorine", atomicMass: 35.453, type: "non-metal", electronegativity: 3.16 },
    { symbol: "N", name: "Nitrogen", atomicMass: 14.007, type: "non-metal", electronegativity: 3.04 },
    { symbol: "Fe", name: "Iron", atomicMass: 55.845, type: "transition metal", electronegativity: 1.83 },
    { symbol: "Cu", name: "Copper", atomicMass: 63.546, type: "transition metal", electronegativity: 1.90 },
    { symbol: "Zn", name: "Zinc", atomicMass: 65.38, type: "transition metal", electronegativity: 1.65 },
];

describe("Cross-Calculator Integration", () => {
    afterEach(() => {
        cleanupDOM();
    });

    it("balances H2 + O2 -> H2O, then verifies molar mass of H2O", () => {
        const balanced = balanceEquation("H2 + O2 -> H2O");
        expect(balanced).toBe("2H2 + O2 -> 2H2O");

        const molarMassH2O = calculateMolarMass("H2O", testElements as any);
        expect(molarMassH2O).toBeCloseTo(18.015, 1);
    });

    it("balances CH4 + O2 -> CO2 + H2O and verifies balanced coefficients", () => {
        const balanced = balanceEquation("CH4 + O2 -> CO2 + H2O");
        expect(balanced).toBe("CH4 + 2O2 -> CO2 + 2H2O");

        const molarMassCO2 = calculateMolarMass("CO2", testElements as any);
        expect(molarMassCO2).toBeCloseTo(44.009, 1);

        const molarMassH2O = calculateMolarMass("H2O", testElements as any);
        expect(molarMassH2O).toBeCloseTo(18.015, 1);
    });

    it("calculates molar mass of NaCl, then predicts bond type Na-Cl", () => {
        const molarMassNaCl = calculateMolarMass("NaCl", testElements as any);
        expect(molarMassNaCl).toBeCloseTo(58.443, 1);

        createContainer("bond-type-predictor");
        createInput("element1-input", "Na", "bond-type-predictor", "text");
        createInput("element2-input", "Cl", "bond-type-predictor", "text");
        createResultDiv("bond-type-result", "bond-type-predictor");

        predictBondType(testElements as any);
        const result = getResultText("bond-type-result");
        expect(result).toContain("Ionic");
    });

    it("calculates molar mass of H2O and verifies it is approximately 18.015", () => {
        const molarMass = calculateMolarMass("H2O", testElements as any);
        expect(molarMass).toBeCloseTo(18.015, 1);
    });

    it("calculates molar mass of C6H12O6 and verifies it is approximately 180.156", () => {
        const molarMass = calculateMolarMass("C6H12O6", testElements as any);
        expect(molarMass).toBeCloseTo(180.156, 0);
    });

    it("dilution: M1=2, V1=1, M2=0.5, solves for V2", () => {
        createContainer("dilution-calc");
        createSelect("dilution-solve-for", "V2", ["M1", "V1", "M2", "V2"], "dilution-calc");
        createInput("dilution-M1", "2", "dilution-calc");
        createInput("dilution-V1", "1", "dilution-calc");
        createInput("dilution-M2", "0.5", "dilution-calc");
        createInput("dilution-V2", "", "dilution-calc");
        createResultDiv("dilution-result", "dilution-calc");

        calculateDilution();
        const result = getResultText("dilution-result");
        // V2 = M1*V1/M2 = 2*1/0.5 = 4
        expect(result).toContain("4.0000");
        expect(result).toContain("L");
    });

    it("mass percent: solute=10, solution=100, verifies 10%", () => {
        createContainer("mass-percent-calc");
        createInput("mass-solute", "10", "mass-percent-calc");
        createInput("mass-solution", "100", "mass-percent-calc");
        createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
        createResultDiv("mass-percent-result", "mass-percent-calc");

        calculateMassPercent();
        const result = getResultText("mass-percent-result");
        expect(result).toContain("10.0000");
        expect(result).toContain("%");
    });

    it("solution mixing: C1=1, V1=1, C2=2, V2=1, verifies final concentration", () => {
        createContainer("solution-mixing-calc");
        createInput("mix-C1", "1", "solution-mixing-calc");
        createInput("mix-V1", "1", "solution-mixing-calc");
        createInput("mix-C2", "2", "solution-mixing-calc");
        createInput("mix-V2", "1", "solution-mixing-calc");
        createResultDiv("mixing-result", "solution-mixing-calc");

        calculateMixing();
        const result = getResultText("mixing-result");
        // (1*1 + 2*1) / (1+1) = 1.5
        expect(result).toContain("1.5000");
        expect(result).toContain("M");
    });

    it("ideal gas law: P=1, V=22.4, n=1, T=273.15, solves for P, verifies ~1 atm", () => {
        createContainer("ideal-gas-law");
        createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
        createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
        createInput("ideal-P", "", "ideal-gas-law");
        createInput("ideal-V", "22.4", "ideal-gas-law");
        createInput("ideal-n", "1", "ideal-gas-law");
        createInput("ideal-T", "273.15", "ideal-gas-law");
        createResultDiv("ideal-result", "ideal-gas-law");

        calculateIdealGasLaw();
        const result = getResultText("ideal-result");
        // P = nRT/V = 1 * 0.08206 * 273.15 / 22.4 ≈ 1.0003
        expect(result).toContain("1.000");
        expect(result).toContain("atm");
    });

    it("cell potential: E1=0.34, E2=-0.76, verifies E_cell=1.10", () => {
        createContainer("cell-potential");
        createInput("E1", "0.34", "cell-potential");
        createInput("E2", "-0.76", "cell-potential");
        createResultDiv("cell-potential-result", "cell-potential");

        calculateCellPotential();
        const result = getResultText("cell-potential-result");
        expect(result).toContain("1.100");
        expect(result).toContain("V");
    });

    it("Nernst: E_std=1.10, T=298, n=2, Q=1, verifies E≈1.10", () => {
        createContainer("nernst-equation");
        createInput("E-standard", "1.10", "nernst-equation");
        createInput("temperature", "298", "nernst-equation");
        createInput("n-electrons", "2", "nernst-equation");
        createInput("Q-reaction", "1", "nernst-equation");
        createResultDiv("nernst-result", "nernst-equation");

        calculateNernst();
        const result = getResultText("nernst-result");
        // When Q=1, ln(Q)=0, so E = E_std = 1.10
        expect(result).toContain("1.100");
        expect(result).toContain("V");
    });

    it("electrolysis: I=2, t=3600, z=1, M=63.546, solves for mass", () => {
        createContainer("electrolysis");
        createSelect("electrolysis-solve-for", "mass", ["mass", "current", "time"], "electrolysis");
        createInput("electrolysis-m", "", "electrolysis");
        createInput("electrolysis-I", "2", "electrolysis");
        createInput("electrolysis-t", "3600", "electrolysis");
        createInput("electrolysis-z", "1", "electrolysis");
        createInput("electrolysis-M", "63.546", "electrolysis");
        createResultDiv("electrolysis-result", "electrolysis");

        calculateElectrolysis();
        const result = getResultText("electrolysis-result");
        // n = I*t/(F*z) = 2*3600/(96485*1) = 0.07462 mol
        // mass = n*M = 0.07462 * 63.546 = 4.742 g
        expect(result).toContain("g");
        expect(result).not.toContain("Error");
    });

    it("half-life: N0=100, t=10, t_half=5, verifies remaining ≈25", () => {
        createContainer("half-life-calc");
        createSelect("half-life-solve-for", "remaining", ["remaining", "time", "half-life"], "half-life-calc");
        createInput("initial-quantity", "100", "half-life-calc");
        createInput("time-input", "10", "half-life-calc");
        createInput("half-life-input", "5", "half-life-calc");
        createInput("remaining-quantity", "", "half-life-calc");
        createResultDiv("half-life-result", "half-life-calc");

        calculateHalfLife();
        const result = getResultText("half-life-result");
        // N = 100 * 0.5^(10/5) = 100 * 0.25 = 25
        expect(result).toContain("25.0000");
    });

    it("combined gas law: P1=1, V1=1, T1=273, P2=2, V2=1, solves for T2", () => {
        createContainer("combined-gas-law");
        createSelect("combined-solve-for", "T2", ["P1", "V1", "T1", "P2", "V2", "T2"], "combined-gas-law");
        createInput("combined-P1", "1", "combined-gas-law");
        createInput("combined-V1", "1", "combined-gas-law");
        createInput("combined-T1", "273", "combined-gas-law");
        createInput("combined-P2", "2", "combined-gas-law");
        createInput("combined-V2", "1", "combined-gas-law");
        createInput("combined-T2", "", "combined-gas-law");
        createResultDiv("combined-result", "combined-gas-law");

        calculateCombinedGasLaw();
        const result = getResultText("combined-result");
        // T2 = P2*V2*T1/(P1*V1) = 2*1*273/(1*1) = 546
        expect(result).toContain("546.0000");
        expect(result).toContain("K");
    });

    it("Van der Waals with valid inputs produces positive pressure", () => {
        createContainer("van-der-waals");
        createInput("vdw-V", "22.4", "van-der-waals");
        createInput("vdw-n", "1", "van-der-waals");
        createInput("vdw-T", "273", "van-der-waals");
        createInput("vdw-a", "1.36", "van-der-waals");
        createInput("vdw-b", "0.0318", "van-der-waals");
        createResultDiv("vdw-result", "van-der-waals");

        calculateVanDerWaals();
        const result = getResultText("vdw-result");
        expect(result).toContain("atm");
        expect(result).not.toContain("Error");

        // Extract the pressure value and verify it is positive
        const match = result.match(/P=([\d.-]+)\s+atm/);
        expect(match).toBeTruthy();
        const pressure = parseFloat(match![1]);
        expect(pressure).toBeGreaterThan(0);
    });

    it("balances Na + Cl2 -> NaCl, then verifies molar mass of NaCl", () => {
        const balanced = balanceEquation("Na + Cl2 -> NaCl");
        expect(balanced).toBe("2Na + Cl2 -> 2NaCl");

        const molarMassNaCl = calculateMolarMass("NaCl", testElements as any);
        expect(molarMassNaCl).toBeCloseTo(58.443, 1);
    });

    it("calculates molar mass of Fe2O3, then predicts bond type Fe-O", () => {
        const molarMass = calculateMolarMass("Fe2O3", testElements as any);
        expect(molarMass).toBeCloseTo(159.687, 0);

        createContainer("bond-type-predictor");
        createInput("element1-input", "Fe", "bond-type-predictor", "text");
        createInput("element2-input", "O", "bond-type-predictor", "text");
        createResultDiv("bond-type-result", "bond-type-predictor");
        predictBondType(testElements as any);
        const result = getResultText("bond-type-result");
        expect(result).toContain("Ionic");
    });

    it("dilution: M1=6, V1=0.5, M2=1, solves for V2 = 3L", () => {
        createContainer("dilution-calc");
        createSelect("dilution-solve-for", "V2", ["M1", "V1", "M2", "V2"], "dilution-calc");
        createInput("dilution-M1", "6", "dilution-calc");
        createInput("dilution-V1", "0.5", "dilution-calc");
        createInput("dilution-M2", "1", "dilution-calc");
        createInput("dilution-V2", "", "dilution-calc");
        createResultDiv("dilution-result", "dilution-calc");
        calculateDilution();
        const result = getResultText("dilution-result");
        expect(result).toContain("3.0000");
    });

    it("mass percent in ppm: 0.005g solute in 1000g solution", () => {
        createContainer("mass-percent-calc");
        createInput("mass-solute", "0.005", "mass-percent-calc");
        createInput("mass-solution", "1000", "mass-percent-calc");
        createSelect("concentration-unit", "ppm", ["percent", "ppm", "ppb"], "mass-percent-calc");
        createResultDiv("mass-percent-result", "mass-percent-calc");
        calculateMassPercent();
        const result = getResultText("mass-percent-result");
        expect(result).toContain("ppm");
    });

    it("cell potential: E1=1.50, E2=-0.74, verifies E_cell=2.24", () => {
        createContainer("cell-potential");
        createInput("E1", "1.50", "cell-potential");
        createInput("E2", "-0.74", "cell-potential");
        createResultDiv("cell-potential-result", "cell-potential");
        calculateCellPotential();
        const result = getResultText("cell-potential-result");
        expect(result).toContain("2.240");
    });
});
