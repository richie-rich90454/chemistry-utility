import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
    calculateArrhenius,
    calculateRateLaw,
    calculateIntegratedRateLaw,
    calculateReactionOrder,
    calculateCollisionTheory,
    ArrheniusCalculator,
    RateLawCalculator,
    IntegratedRateLawCalculator,
    ReactionOrderCalculator,
    CollisionTheoryCalculator,
} from "./kineticsCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

function extractResultNumber(text: string): number | null {
    const match = text.match(/Result:\s*([\d.eE+-]+)/);
    return match ? parseFloat(match[1]) : null;
}

describe("ArrheniusCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("arrhenius-calc");
        createResultDiv("arrhenius-result", "arrhenius-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should solve for k: A=1e13, Ea=75, T=298", () => {
        createSelect("arrhenius-solve-for", "k", ["k", "Ea", "T", "A"], "arrhenius-calc");
        createInput("arrhenius-A", "1e13", "arrhenius-calc");
        createInput("arrhenius-Ea", "75", "arrhenius-calc");
        createInput("arrhenius-T", "298", "arrhenius-calc");
        createInput("arrhenius-k", "", "arrhenius-calc");

        calculateArrhenius();

        const text = getResultText("arrhenius-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // k = 1e13 * e^(-75000/(8.314*298)) ≈ 0.7132
        expect(result!).toBeCloseTo(0.7132, 2);
    });

    it("should solve for Ea: A=1e13, k=0.7132, T=298", () => {
        createSelect("arrhenius-solve-for", "Ea", ["k", "Ea", "T", "A"], "arrhenius-calc");
        createInput("arrhenius-A", "1e13", "arrhenius-calc");
        createInput("arrhenius-Ea", "", "arrhenius-calc");
        createInput("arrhenius-T", "298", "arrhenius-calc");
        createInput("arrhenius-k", "0.7132", "arrhenius-calc");

        calculateArrhenius();

        const text = getResultText("arrhenius-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // Ea should be close to 75 kJ/mol
        expect(result!).toBeCloseTo(75, 0);
    });

    it("should solve for T: A=1e13, Ea=75, k=0.7132", () => {
        createSelect("arrhenius-solve-for", "T", ["k", "Ea", "T", "A"], "arrhenius-calc");
        createInput("arrhenius-A", "1e13", "arrhenius-calc");
        createInput("arrhenius-Ea", "75", "arrhenius-calc");
        createInput("arrhenius-T", "", "arrhenius-calc");
        createInput("arrhenius-k", "0.7132", "arrhenius-calc");

        calculateArrhenius();

        const text = getResultText("arrhenius-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // T should be close to 298 K
        expect(result!).toBeCloseTo(298, -1);
    });

    it("should solve for A: Ea=75, T=298, k=0.7132", () => {
        createSelect("arrhenius-solve-for", "A", ["k", "Ea", "T", "A"], "arrhenius-calc");
        createInput("arrhenius-A", "", "arrhenius-calc");
        createInput("arrhenius-Ea", "75", "arrhenius-calc");
        createInput("arrhenius-T", "298", "arrhenius-calc");
        createInput("arrhenius-k", "0.7132", "arrhenius-calc");

        calculateArrhenius();

        const text = getResultText("arrhenius-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // A should be close to 1e13
        expect(Math.log10(result!)).toBeCloseTo(13, 0);
    });

    it("should show error when T<=0", () => {
        createSelect("arrhenius-solve-for", "k", ["k"], "arrhenius-calc");
        createInput("arrhenius-A", "1e13", "arrhenius-calc");
        createInput("arrhenius-Ea", "75", "arrhenius-calc");
        createInput("arrhenius-T", "0", "arrhenius-calc");
        createInput("arrhenius-k", "", "arrhenius-calc");

        calculateArrhenius();

        const text = getResultText("arrhenius-result");
        expect(text).toContain("Error");
        expect(text).toContain("positive");
    });
});

describe("RateLawCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("rate-law-calc");
        createResultDiv("rate-law-result", "rate-law-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should determine order m=1 in A when B is constant", () => {
        // B constant, A doubles, rate doubles -> order 1 in A
        createInput("ratelaw-A1", "0.1", "rate-law-calc");
        createInput("ratelaw-B1", "0.2", "rate-law-calc");
        createInput("ratelaw-rate1", "0.004", "rate-law-calc");
        createInput("ratelaw-A2", "0.2", "rate-law-calc");
        createInput("ratelaw-B2", "0.2", "rate-law-calc");
        createInput("ratelaw-rate2", "0.008", "rate-law-calc");

        calculateRateLaw();

        const text = getResultText("rate-law-result");
        expect(text).toContain("1");
        expect(text).toContain("0");
        expect(text).toContain("Rate constant");
    });

    it("should determine order n=2 in B when A is constant", () => {
        // A constant, B doubles, rate quadruples -> order 2 in B
        createInput("ratelaw-A1", "0.1", "rate-law-calc");
        createInput("ratelaw-B1", "0.1", "rate-law-calc");
        createInput("ratelaw-rate1", "0.001", "rate-law-calc");
        createInput("ratelaw-A2", "0.1", "rate-law-calc");
        createInput("ratelaw-B2", "0.2", "rate-law-calc");
        createInput("ratelaw-rate2", "0.004", "rate-law-calc");

        calculateRateLaw();

        const text = getResultText("rate-law-result");
        expect(text).toContain("2");
        expect(text).toContain("Rate constant");
    });

    it("should show error with negative concentrations", () => {
        createInput("ratelaw-A1", "-0.1", "rate-law-calc");
        createInput("ratelaw-B1", "0.2", "rate-law-calc");
        createInput("ratelaw-rate1", "0.004", "rate-law-calc");
        createInput("ratelaw-A2", "0.2", "rate-law-calc");
        createInput("ratelaw-B2", "0.2", "rate-law-calc");
        createInput("ratelaw-rate2", "0.008", "rate-law-calc");

        calculateRateLaw();

        const text = getResultText("rate-law-result");
        expect(text).toContain("Error");
    });

    it("should flag the undetermined order when only one reactant varies", () => {
        createInput("ratelaw-A1", "0.1", "rate-law-calc");
        createInput("ratelaw-B1", "0.2", "rate-law-calc");
        createInput("ratelaw-rate1", "0.004", "rate-law-calc");
        createInput("ratelaw-A2", "0.2", "rate-law-calc");
        createInput("ratelaw-B2", "0.2", "rate-law-calc");
        createInput("ratelaw-rate2", "0.008", "rate-law-calc");

        calculateRateLaw();

        const text = getResultText("rate-law-result");
        expect(text).toContain("underdetermined");
    });

    it("should report the grid-search fit error when both reactants vary", () => {
        createInput("ratelaw-A1", "0.1", "rate-law-calc");
        createInput("ratelaw-B1", "0.1", "rate-law-calc");
        createInput("ratelaw-rate1", "0.001", "rate-law-calc");
        createInput("ratelaw-A2", "0.2", "rate-law-calc");
        createInput("ratelaw-B2", "0.2", "rate-law-calc");
        createInput("ratelaw-rate2", "0.004", "rate-law-calc");

        calculateRateLaw();

        const text = getResultText("rate-law-result");
        expect(text).toContain("fit error");
    });
});

describe("IntegratedRateLawCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("irl-calc");
        createResultDiv("integrated-rate-law-result", "irl-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should calculate first order concentration: [A]0=1, k=0.05, t=10", () => {
        createSelect("irl-solve-for", "concentration", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "1", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "10", "irl-calc");
        createInput("irl-A", "", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // [A] = 1 * e^(-0.05*10) = e^(-0.5) ≈ 0.6065
        expect(result!).toBeCloseTo(0.6065, 3);
    });

    it("should calculate first order time: [A]0=1, k=0.05, [A]=0.5", () => {
        createSelect("irl-solve-for", "time", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "1", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "", "irl-calc");
        createInput("irl-A", "0.5", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // t = ln(1/0.5)/0.05 = ln(2)/0.05 ≈ 13.86
        expect(result!).toBeCloseTo(13.86, 1);
    });

    it("should reject negative time when solving for concentration", () => {
        createSelect("irl-solve-for", "concentration", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "1", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "-5", "irl-calc");
        createInput("irl-A", "", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        expect(text).toContain("Error");
    });

    it("should calculate zero order concentration: [A]0=1, k=0.05, t=10", () => {
        createSelect("irl-solve-for", "concentration", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "0", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "10", "irl-calc");
        createInput("irl-A", "", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // [A] = 1 - 0.05*10 = 0.5
        expect(result!).toBeCloseTo(0.5, 3);
    });

    it("should clamp zero order concentration to 0 when kt exceeds [A]0", () => {
        createSelect("irl-solve-for", "concentration", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "0", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "30", "irl-calc");
        createInput("irl-A", "", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // [A] = 1 - 0.05*30 = -0.5 (unphysical); clamp to 0
        expect(result!).toBeGreaterThanOrEqual(0);
        expect(result!).toBeCloseTo(0, 3);
    });

    it("should calculate second order concentration: [A]0=1, k=0.1, t=5", () => {
        createSelect("irl-solve-for", "concentration", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "2", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.1", "irl-calc");
        createInput("irl-t", "5", "irl-calc");
        createInput("irl-A", "", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        const result = extractResultNumber(text);
        expect(result).not.toBeNull();
        // [A] = 1/(1 + 0.1*1*5) = 1/1.5 ≈ 0.6667
        expect(result!).toBeCloseTo(0.6667, 3);
    });

    it("should show error when [A]0<=0", () => {
        createSelect("irl-solve-for", "concentration", ["concentration"], "irl-calc");
        createSelect("irl-order", "1", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "0", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "10", "irl-calc");
        createInput("irl-A", "", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        expect(text).toContain("Error");
        expect(text).toContain("positive");
    });

    it("should show error for first order time when A > A0 (would give negative time)", () => {
        createSelect("irl-solve-for", "time", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "1", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "0.5", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "", "irl-calc");
        createInput("irl-A", "1.0", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        expect(text).toContain("Error");
        expect(text).toContain("less than");
    });

    it("should show error for second order time when A > A0 (would give negative time)", () => {
        createSelect("irl-solve-for", "time", ["concentration", "time"], "irl-calc");
        createSelect("irl-order", "2", ["0", "1", "2"], "irl-calc");
        createInput("irl-A0", "0.5", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "", "irl-calc");
        createInput("irl-A", "1.0", "irl-calc");

        calculateIntegratedRateLaw();

        const text = getResultText("integrated-rate-law-result");
        expect(text).toContain("Error");
        expect(text).toContain("less than");
    });
});

describe("ReactionOrderCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("reaction-order-calc");
        createResultDiv("reaction-order-result", "reaction-order-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should identify first order from exponential decay data", () => {
        // First order: [A] = [A]0 * e^(-kt), k=0.01
        // t=0, c=1.0; t=100, c=0.3679; t=200, c=0.1353; t=300, c=0.0498
        createInput("reaction-order-data", "0,1.0; 100,0.3679; 200,0.1353; 300,0.0498", "reaction-order-calc", "text");

        calculateReactionOrder();

        const text = getResultText("reaction-order-result");
        expect(text).toContain("1");
        expect(text).toContain("R");
    });

    it("should identify zero order from linear decay data", () => {
        // Zero order: [A] = [A]0 - kt, k=0.1
        // t=0, c=1.0; t=2, c=0.8; t=4, c=0.6; t=6, c=0.4
        createInput("reaction-order-data", "0,1.0; 2,0.8; 4,0.6; 6,0.4", "reaction-order-calc", "text");

        calculateReactionOrder();

        const text = getResultText("reaction-order-result");
        expect(text).toContain("0");
        expect(text).toContain("R");
    });

    it("should identify second order from inverse-linear data", () => {
        // Second order: 1/[A] = 1/[A]0 + kt, [A]0=1, k=0.1
        // t=0, c=1.0; t=5, c=0.6667; t=10, c=0.5; t=15, c=0.4
        createInput("reaction-order-data", "0,1.0; 5,0.6667; 10,0.5; 15,0.4", "reaction-order-calc", "text");

        calculateReactionOrder();

        const text = getResultText("reaction-order-result");
        expect(text).toContain("2");
        expect(text).toContain("R");
    });

    it("should show error for empty data", () => {
        createInput("reaction-order-data", "", "reaction-order-calc", "text");

        calculateReactionOrder();

        const text = getResultText("reaction-order-result");
        expect(text).toContain("Error");
    });

    it("should show error for insufficient data points", () => {
        createInput("reaction-order-data", "0,1.0; 100,0.5", "reaction-order-calc", "text");

        calculateReactionOrder();

        const text = getResultText("reaction-order-result");
        expect(text).toContain("Error");
    });

    it("should show error when all time values are identical", () => {
        createInput("reaction-order-data", "5,1.0; 5,0.5; 5,0.25", "reaction-order-calc", "text");

        calculateReactionOrder();

        const text = getResultText("reaction-order-result");
        expect(text).toContain("Error");
    });
});

describe("CollisionTheoryCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("collision-calc");
        createResultDiv("collision-theory-result", "collision-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should solve for k: Ea=50, T=298, Z=1e11, p=0.01", () => {
        createSelect("collision-solve-for", "k", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", "", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).not.toContain("Error");
        expect(text).toContain("Result:");
        expect(text).toContain("Fraction of effective collisions");
    });

    it("should solve for p: Ea=50, T=298, Z=1e11, k=known", () => {
        // First calculate k, then use it to solve for p
        const R = 8.314;
        const Ea = 50 * 1000;
        const T = 298;
        const Z = 1e11;
        const kExpected = Z * 0.01 * Math.exp(-Ea / (R * T));

        createSelect("collision-solve-for", "p", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "", "collision-calc");
        createInput("collision-k", String(kExpected), "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).not.toContain("Error");
        // p should be close to 0.01
        expect(text).toContain("Result:");
    });

    it("should solve for Z: Ea=50, T=298, p=0.01, k=known", () => {
        const R = 8.314;
        const Ea = 50 * 1000;
        const T = 298;
        const Z = 1e11;
        const kExpected = Z * 0.01 * Math.exp(-Ea / (R * T));

        createSelect("collision-solve-for", "Z", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", String(kExpected), "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).not.toContain("Error");
        expect(text).toContain("Result:");
    });

    it("should show error when T<=0", () => {
        createSelect("collision-solve-for", "k", ["k"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "0", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", "", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("positive");
    });

    it("should warn when solved steric factor lies outside [0, 1]", () => {
        // k far larger than Z*exp(-Ea/RT) forces p > 1.
        createSelect("collision-solve-for", "p", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "", "collision-calc");
        createInput("collision-k", "1e11", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("warning");
    });

    it("should show error when steric factor out of range", () => {
        createSelect("collision-solve-for", "k", ["k"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "2", "collision-calc");
        createInput("collision-k", "", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("between 0 and 1");
    });

    it("should show error when solving for Z with T<=0", () => {
        createSelect("collision-solve-for", "Z", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "0", "collision-calc");
        createInput("collision-Z", "", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", "1e5", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("positive");
    });

    it("should show error when solving for Z with p<=0", () => {
        createSelect("collision-solve-for", "Z", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "", "collision-calc");
        createInput("collision-p", "0", "collision-calc");
        createInput("collision-k", "1e5", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("Steric factor must be positive");
    });

    it("should show error when solving for Z with k<=0", () => {
        createSelect("collision-solve-for", "Z", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", "0", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("Rate constant k must be positive");
    });

    it("should show error when solving for p with T<=0", () => {
        createSelect("collision-solve-for", "p", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "0", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "", "collision-calc");
        createInput("collision-k", "1e5", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("positive");
    });

    it("should show error when solving for p with Z<=0", () => {
        createSelect("collision-solve-for", "p", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "0", "collision-calc");
        createInput("collision-p", "", "collision-calc");
        createInput("collision-k", "1e5", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("Collision frequency must be positive");
    });

    it("should show error when solving for p with k<=0", () => {
        createSelect("collision-solve-for", "p", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "", "collision-calc");
        createInput("collision-k", "0", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("Rate constant k must be positive");
    });

    it("should show error when solving for k with Z<=0", () => {
        createSelect("collision-solve-for", "k", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "0", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", "", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("Collision frequency must be positive");
    });

    it("should show error when solving for k with negative steric factor", () => {
        createSelect("collision-solve-for", "k", ["k", "Z", "p"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "-0.5", "collision-calc");
        createInput("collision-k", "", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
        expect(text).toContain("between 0 and 1");
    });

    it("should show error for invalid solveFor value", () => {
        createSelect("collision-solve-for", "invalid", ["k", "Z", "p", "invalid"], "collision-calc");
        createInput("collision-Ea", "50", "collision-calc");
        createInput("collision-T", "298", "collision-calc");
        createInput("collision-Z", "1e11", "collision-calc");
        createInput("collision-p", "0.01", "collision-calc");
        createInput("collision-k", "1e5", "collision-calc");

        calculateCollisionTheory();

        const text = getResultText("collision-theory-result");
        expect(text).toContain("Error");
    });
});

describe("ArrheniusCalculator.calculatePure", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "arrhenius-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves for k (A=1e13, Ea=75, T=298)", () => {
        const calc = new ArrheniusCalculator();
        const result = calc.calculatePure({
            "arrhenius-solve-for": "k",
            "arrhenius-A": "1e13",
            "arrhenius-Ea": "75",
            "arrhenius-T": "298",
            "arrhenius-k": ""
        });
        expect(result.value).toContain("s\u207B\u00B9");
        const match = result.value.match(/^([\d.eE+-]+)/);
        expect(match).not.toBeNull();
        expect(parseFloat(match![1])).toBeCloseTo(0.7132, 2);
        expect(result.explanation).toContain("k = A\u00B7e^(-Ea/RT)");
    });

    it("returns an error result when T<=0", () => {
        const calc = new ArrheniusCalculator();
        const result = calc.calculatePure({
            "arrhenius-solve-for": "k",
            "arrhenius-A": "1e13",
            "arrhenius-Ea": "75",
            "arrhenius-T": "0",
            "arrhenius-k": ""
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error");
        expect(result.explanation).toContain("positive");
    });
});

describe("RateLawCalculator.calculatePure", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "rate-law-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("determines order m=1 in A when B is constant", () => {
        const calc = new RateLawCalculator();
        const result = calc.calculatePure({
            "ratelaw-A1": "0.1",
            "ratelaw-B1": "0.2",
            "ratelaw-rate1": "0.004",
            "ratelaw-A2": "0.2",
            "ratelaw-B2": "0.2",
            "ratelaw-rate2": "0.008"
        });
        expect(result.value).toContain("rate = ");
        const meta = result.metadata as { orderA: number; orderB: number; k: number; rateLaw: string };
        expect(meta.orderA).toBe(1);
        expect(meta.orderB).toBe(0);
        expect(meta.rateLaw).toContain("[A]");
    });

    it("returns an error result with negative concentrations", () => {
        const calc = new RateLawCalculator();
        const result = calc.calculatePure({
            "ratelaw-A1": "-0.1",
            "ratelaw-B1": "0.2",
            "ratelaw-rate1": "0.004",
            "ratelaw-A2": "0.2",
            "ratelaw-B2": "0.2",
            "ratelaw-rate2": "0.008"
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error");
        expect(result.explanation).toContain("positive");
    });
});

describe("IntegratedRateLawCalculator.calculatePure", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "integrated-rate-law-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("calculates first order concentration ([A]0=1, k=0.05, t=10)", () => {
        const calc = new IntegratedRateLawCalculator();
        const result = calc.calculatePure({
            "irl-solve-for": "concentration",
            "irl-order": "1",
            "irl-A0": "1",
            "irl-k": "0.05",
            "irl-t": "10",
            "irl-A": ""
        });
        expect(result.value).toContain("M");
        const match = result.value.match(/^([\d.eE+-]+)/);
        expect(match).not.toBeNull();
        expect(parseFloat(match![1])).toBeCloseTo(0.6065, 3);
        expect(Array.isArray(result.chartData)).toBe(true);
    });

    it("returns an error result when A0<=0", () => {
        const calc = new IntegratedRateLawCalculator();
        const result = calc.calculatePure({
            "irl-solve-for": "concentration",
            "irl-order": "1",
            "irl-A0": "0",
            "irl-k": "0.05",
            "irl-t": "10",
            "irl-A": ""
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error");
        expect(result.explanation).toContain("positive");
    });
});

describe("ReactionOrderCalculator.calculatePure", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "reaction-order-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("identifies first order from exponential decay data", () => {
        const calc = new ReactionOrderCalculator();
        const result = calc.calculatePure({
            "reaction-order-data": "0,1.0; 100,0.3679; 200,0.1353; 300,0.0498"
        });
        expect(result.value).toContain("Best-fit reaction order");
        const meta = result.metadata as { bestOrder: number; r2Zero: number; r2First: number; r2Second: number; k: number };
        expect(meta.bestOrder).toBe(1);
        expect(meta.r2First).toBeGreaterThan(meta.r2Zero);
        expect(meta.r2First).toBeGreaterThan(meta.r2Second);
    });

    it("returns an error result when data is empty", () => {
        const calc = new ReactionOrderCalculator();
        const result = calc.calculatePure({
            "reaction-order-data": ""
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error");
        expect(result.explanation).toContain("time-concentration");
    });
});

describe("CollisionTheoryCalculator.calculatePure", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "collision-theory-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves for k (Ea=50, T=298, Z=1e11, p=0.01)", () => {
        const calc = new CollisionTheoryCalculator();
        const result = calc.calculatePure({
            "collision-solve-for": "k",
            "collision-Ea": "50",
            "collision-T": "298",
            "collision-Z": "1e11",
            "collision-p": "0.01",
            "collision-k": ""
        });
        expect(result.value).toContain("s\u207B\u00B9");
        const match = result.value.match(/^([\d.eE+-]+)/);
        expect(match).not.toBeNull();
        const R = 8.314;
        const expected = 1e11 * 0.01 * Math.exp(-(50 * 1000) / (R * 298));
        expect(parseFloat(match![1])).toBeCloseTo(expected, 4);
        const meta = result.metadata as { fractionEffective: number };
        expect(meta.fractionEffective).toBeGreaterThan(0);
        expect(meta.fractionEffective).toBeLessThan(1);
    });

    it("returns an error result when T<=0", () => {
        const calc = new CollisionTheoryCalculator();
        const result = calc.calculatePure({
            "collision-solve-for": "k",
            "collision-Ea": "50",
            "collision-T": "0",
            "collision-Z": "1e11",
            "collision-p": "0.01",
            "collision-k": ""
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error");
        expect(result.explanation).toContain("positive");
    });
});
