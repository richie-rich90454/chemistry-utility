import { describe, it, expect } from "vitest";
import { calculateMolarMass } from "./formulaParser.js";
import { balanceEquation } from "./equationBalancer.js";
import type { ChemicalElement } from "../types.js";

// Smoke-level timing budgets for the parser/balancer hot paths. These are
// regression guards (fail loudly on 10x slowdowns), not micro-benchmarks:
// budgets are generous enough to pass on shared CI runners.
const SINGLE_MOLAR_MASS_BUDGET_MS = 100;
const SINGLE_BALANCE_BUDGET_MS = 2000;
const BATCH_MOLAR_MASS_BUDGET_MS = 2000;
const BATCH_BALANCE_BUDGET_MS = 10000;

const TEST_ELEMENTS = [
    { symbol: "H", name: "Hydrogen", atomicMass: 1.008, atomicNumber: 1, valenceElectrons: 1, totalElectrons: 1, group: 1, period: 1, type: "nonmetal" },
    { symbol: "C", name: "Carbon", atomicMass: 12.011, atomicNumber: 6, valenceElectrons: 4, totalElectrons: 6, group: 14, period: 2, type: "nonmetal" },
    { symbol: "N", name: "Nitrogen", atomicMass: 14.007, atomicNumber: 7, valenceElectrons: 5, totalElectrons: 7, group: 15, period: 2, type: "nonmetal" },
    { symbol: "O", name: "Oxygen", atomicMass: 15.999, atomicNumber: 8, valenceElectrons: 6, totalElectrons: 8, group: 16, period: 2, type: "nonmetal" },
    { symbol: "Na", name: "Sodium", atomicMass: 22.99, atomicNumber: 11, valenceElectrons: 1, totalElectrons: 11, group: 1, period: 3, type: "metal" },
    { symbol: "S", name: "Sulfur", atomicMass: 32.06, atomicNumber: 16, valenceElectrons: 6, totalElectrons: 16, group: 16, period: 3, type: "nonmetal" },
    { symbol: "Cl", name: "Chlorine", atomicMass: 35.45, atomicNumber: 17, valenceElectrons: 7, totalElectrons: 17, group: 17, period: 3, type: "nonmetal" }
] as unknown as ChemicalElement[];

function now(): number {
    return performance.now();
}

describe("parser/balancer timing budgets", () => {
    it("parses a single molar-mass formula within budget", () => {
        const start = now();
        const mass = calculateMolarMass("H2O", TEST_ELEMENTS);
        const elapsed = now() - start;
        expect(mass).toBeCloseTo(18.015, 2);
        console.log(`molar-mass single: ${elapsed.toFixed(2)}ms (budget ${SINGLE_MOLAR_MASS_BUDGET_MS}ms)`);
        expect(elapsed).toBeLessThan(SINGLE_MOLAR_MASS_BUDGET_MS);
    });

    it("balances a simple equation within budget", () => {
        const start = now();
        const balanced = balanceEquation("H2 + O2 -> H2O") as string;
        const elapsed = now() - start;
        expect(balanced).toContain("->");
        console.log(`balancer single: ${elapsed.toFixed(2)}ms (budget ${SINGLE_BALANCE_BUDGET_MS}ms)`);
        expect(elapsed).toBeLessThan(SINGLE_BALANCE_BUDGET_MS);
    });

    it("parses a batch of 200 formulas within budget", () => {
        const formulas = ["H2O", "CO2", "NaCl", "C6H12O6", "H2SO4", "NaOH", "Na2SO4", "CH3COOH", "NH4NO3", "C12H22O11"];
        const start = now();
        for (let i = 0; i < 20; i++) {
            for (const formula of formulas) {
                calculateMolarMass(formula, TEST_ELEMENTS);
            }
        }
        const elapsed = now() - start;
        console.log(`molar-mass batch(200): ${elapsed.toFixed(2)}ms (budget ${BATCH_MOLAR_MASS_BUDGET_MS}ms)`);
        expect(elapsed).toBeLessThan(BATCH_MOLAR_MASS_BUDGET_MS);
    });

    it("balances a batch of simple equations within budget", () => {
        const equations = [
            "H2 + O2 -> H2O",
            "N2 + H2 -> NH3",
            "CH4 + O2 -> CO2 + H2O",
            "Na + Cl2 -> NaCl",
            "C + O2 -> CO2"
        ];
        const start = now();
        for (let i = 0; i < 2; i++) {
            for (const equation of equations) {
                balanceEquation(equation);
            }
        }
        const elapsed = now() - start;
        console.log(`balancer batch(10): ${elapsed.toFixed(2)}ms (budget ${BATCH_BALANCE_BUDGET_MS}ms)`);
        expect(elapsed).toBeLessThan(BATCH_BALANCE_BUDGET_MS);
    });
});
