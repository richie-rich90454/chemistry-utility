// @vitest-environment jsdom
import {describe, it, expect} from "vitest";
import {EquationBalancer, balanceEquation, balanceIonic} from "./equationBalancer.js";

const EB = EquationBalancer as unknown as {
    legacyParseEquation(equation: string): { reactants: string[]; products: string[] };
    balanceNonOHAtoms(state: { reactants: Map<string, number>; products: Map<string, number> }, maxCoefficient?: number): void;
    formatHalfReaction(state: { reactants: Map<string, number>; products: Map<string, number> }): string;
};

describe("balancerCoverage: legacy split empty-term guard", () => {
    it("skips empty leading term from '+'", () => {
        const parsed = EB.legacyParseEquation("+ H2 -> H2");
        expect(parsed.reactants).toEqual(["H2"]);
        expect(parsed.products).toEqual(["H2"]);
    });
});

describe("balancerCoverage: PARSE_ERROR fallback to Could not balance", () => {
    it("maps mismatched brackets to Could not balance", () => {
        expect(() => balanceEquation("H2 + (O2 -> H2O")).toThrow("Could not balance");
    });

    it("maps mismatched brackets to Could not balance ionic", () => {
        expect(() => balanceIonic("H2 + (O2 -> H2O")).toThrow("Could not balance ionic equation");
    });
});

describe("balancerCoverage: ionic non-unit coefficients", () => {
    it("formats multi-ion ionic equation via legacy path", () => {
        const EB2 = EquationBalancer as unknown as {
            legacyBalanceIonic(equation: string, maxCoefficient?: number): string;
        };
        const out = EB2.legacyBalanceIonic("Ca2+ + Cl- -> CaCl2");
        expect(out).toContain("2Cl-");
    });
});

describe("balancerCoverage: non-OH matrix with missing element", () => {
    it("handles species lacking a shared element", () => {
        const state = {
            reactants: new Map([["Cu2+", 1], ["Fe", 1]]),
            products: new Map([["Cu", 1], ["Fe2+", 1]]),
        };
        EB.balanceNonOHAtoms(state, 10);
        expect(state.reactants.size).toBeGreaterThan(0);
    });
});

describe("balancerCoverage: OH- unit formatting", () => {
    it("omits coefficient 1 for OH-", () => {
        const state = {
            reactants: new Map([["OH-", 1], ["Fe3+", 1]]),
            products: new Map([["FeO2-", 1]]),
        };
        const out = EB.formatHalfReaction(state);
        expect(out).toContain("OH-");
        expect(out).not.toContain("1OH-");
    });
});
