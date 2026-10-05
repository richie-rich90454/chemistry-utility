// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
    ArrheniusCalculator,
    RateLawCalculator,
    IntegratedRateLawCalculator,
    ReactionOrderCalculator,
    CollisionTheoryCalculator,
} from "./kineticsCalculators.js";

function pureArrhenius(solveFor: string, A: string, Ea: string, T: string, k: string) {
    return new ArrheniusCalculator().calculatePure({
        "arrhenius-solve-for": solveFor,
        "arrhenius-A": A,
        "arrhenius-Ea": Ea,
        "arrhenius-T": T,
        "arrhenius-k": k,
    });
}

function pureRateLaw(A1: string, B1: string, r1: string, A2: string, B2: string, r2: string) {
    return new RateLawCalculator().calculatePure({
        "ratelaw-A1": A1,
        "ratelaw-B1": B1,
        "ratelaw-rate1": r1,
        "ratelaw-A2": A2,
        "ratelaw-B2": B2,
        "ratelaw-rate2": r2,
    });
}

function pureIrl(solveFor: string, order: string, A0: string, k: string, t: string, A: string) {
    return new IntegratedRateLawCalculator().calculatePure({
        "irl-solve-for": solveFor,
        "irl-order": order,
        "irl-A0": A0,
        "irl-k": k,
        "irl-t": t,
        "irl-A": A,
    });
}

function pureOrder(data: string) {
    return new ReactionOrderCalculator().calculatePure({"reaction-order-data": data});
}

function pureCollision(solveFor: string, Ea: string, T: string, Z: string, p: string, k: string) {
    return new CollisionTheoryCalculator().calculatePure({
        "collision-solve-for": solveFor,
        "collision-Ea": Ea,
        "collision-T": T,
        "collision-Z": Z,
        "collision-p": p,
        "collision-k": k,
    });
}

describe("kineticsCoverage: Arrhenius pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "arrhenius-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves Ea, T, A and rejects an invalid solveFor", () => {
        expect(pureArrhenius("Ea", "1e13", "75", "298", "0.7132").value).toContain("kJ/mol");
        expect(pureArrhenius("T", "1e13", "75", "", "0.7132").value).toContain("K");
        expect(pureArrhenius("A", "", "75", "298", "0.7132").value).toContain("s");
        expect(pureArrhenius("bogus", "1e13", "75", "298", "").explanation).toContain("Error");
    });

    it("rejects missing inputs per branch", () => {
        expect(pureArrhenius("k", "", "75", "298", "").explanation).toContain("Error");
        expect(pureArrhenius("Ea", "", "75", "298", "").explanation).toContain("Error");
        expect(pureArrhenius("T", "", "75", "298", "0.7132").explanation).toContain("Error");
        expect(pureArrhenius("A", "", "75", "298", "").explanation).toContain("Error");
    });

    it("rejects non-positive inputs per branch", () => {
        expect(pureArrhenius("k", "0", "75", "298", "").explanation).toContain("Error");
        expect(pureArrhenius("k", "1e13", "75", "0", "").explanation).toContain("Error");
        expect(pureArrhenius("Ea", "0", "75", "298", "0.7132").explanation).toContain("Error");
        expect(pureArrhenius("Ea", "1e13", "75", "0", "0.7132").explanation).toContain("Error");
        expect(pureArrhenius("Ea", "1e13", "75", "298", "0").explanation).toContain("Error");
        expect(pureArrhenius("T", "0", "75", "298", "0.7132").explanation).toContain("Error");
        expect(pureArrhenius("T", "1e13", "75", "298", "0").explanation).toContain("Error");
        expect(pureArrhenius("T", "1e13", "75", "298", "1e13").explanation).toContain("Error");
        expect(pureArrhenius("A", "", "75", "0", "0.7132").explanation).toContain("Error");
        expect(pureArrhenius("A", "", "75", "298", "0").explanation).toContain("Error");
    });
});

describe("kineticsCoverage: RateLaw pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "rate-law-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("determines integer orders via grid search", () => {
        // A1=0.1,B1=0.1,r1=0.001 -> A2=0.2,B2=0.3,r2=0.006: ratio 6 is not a
        // pure power of the single varying ratio, forcing the grid search
        // past the (0,3) shortcut to a mixed (1,1) solution.
        const r = pureRateLaw("0.1", "0.1", "0.001", "0.2", "0.3", "0.006");
        expect(r.value).toContain("[A]");
        expect(r.value).toContain("[B]");
        expect(r.explanation).toContain("grid-search fit error");
    });

    it("formats unit orders without exponents", () => {
        const r = pureRateLaw("0.1", "0.1", "0.01", "0.2", "0.1", "0.02");
        expect(r.value).toContain("[A]");
        expect(r.value).not.toContain("[A]^");
    });

    it("rejects missing and non-positive inputs", () => {
        expect(pureRateLaw("", "0.2", "0.004", "0.2", "0.2", "0.008").explanation).toContain("Error");
        expect(pureRateLaw("0.1", "0.1", "0.001", "0.1", "0.1", "0.001").explanation).toContain("Error");
        expect(pureRateLaw("0.1", "0", "0.004", "0.2", "0", "0.008").explanation).toContain("Error");
        expect(pureRateLaw("0.1", "0.2", "0", "0.2", "0.2", "0.008").explanation).toContain("Error");
        expect(pureRateLaw("-0.1", "0.2", "0.004", "0.2", "0.2", "0.008").explanation).toContain("Error");
        expect(pureRateLaw("0", "0.2", "0.004", "0.2", "0.2", "0.008").explanation).toContain("Error");
    });
});

describe("kineticsCoverage: IntegratedRateLaw pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "integrated-rate-law-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers zero and second order in both directions", () => {
        expect(pureIrl("concentration", "0", "1", "0.05", "10", "").value).toContain("M");
        expect(pureIrl("concentration", "2", "1", "0.05", "10", "").value).toContain("M");
        expect(pureIrl("time", "0", "1", "0.05", "", "0.5").value).toContain("s");
        expect(pureIrl("time", "2", "1", "0.05", "", "0.5").value).toContain("s");
        expect(pureIrl("bogus", "1", "1", "0.05", "10", "").explanation).toContain("Error");
    });

    it("rejects invalid inputs per branch", () => {
        expect(pureIrl("concentration", "1", "1", "-0.05", "10", "").explanation).toContain("Error");
        expect(pureIrl("concentration", "1", "1", "0.05", "-10", "").explanation).toContain("Error");
        expect(pureIrl("concentration", "5", "1", "0.05", "10", "").explanation).toContain("Error");
        expect(pureIrl("concentration", "1", "", "0.05", "10", "").explanation).toContain("Error");
        expect(pureIrl("time", "5", "1", "0.05", "", "0.5").explanation).toContain("Error");
        expect(pureIrl("time", "0", "1", "0.05", "", "1.5").explanation).toContain("Error");
        expect(pureIrl("time", "1", "1", "0", "", "0.5").explanation).toContain("Error");
        expect(pureIrl("time", "1", "0", "0.05", "", "0").explanation).toContain("Error");
        expect(pureIrl("time", "1", "1", "0.05", "", "0").explanation).toContain("Error");
        expect(pureIrl("time", "1", "1", "0.05", "", "2").explanation).toContain("Error");
        expect(pureIrl("time", "2", "1", "0.05", "", "0").explanation).toContain("Error");
        expect(pureIrl("time", "2", "1", "0.05", "", "2").explanation).toContain("Error");
        expect(pureIrl("concentration", "", "1", "0.05", "10", "").explanation).toContain("Error");
        expect(pureIrl("time", "1", "1", "0.05", "", "").explanation).toContain("Error");
    });

    it("solves zero-order time without clamping", () => {
        const r = pureIrl("time", "0", "1", "0.05", "", "0.5");
        expect(r.value).toContain("s");
    });
});

describe("kineticsCoverage: ReactionOrder pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "reaction-order-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("identifies zero and second order data", () => {
        expect(pureOrder("0,1.0; 100,0.75; 200,0.5; 300,0.25").value).toContain("0");
        const second = pureOrder("0,1.0; 5,0.6667; 10,0.5; 15,0.4");
        expect(second.value).toContain("2");
        expect(second.explanation).toContain("M");
    });

    it("rejects bad data shapes", () => {
        expect(pureOrder("0,1.0; bad; 200,0.5").explanation).toContain("Error");
        expect(pureOrder("0,1.0; 1,abc; 2,0.5").explanation).toContain("Error");
        expect(pureOrder("0,0; 1,0.5; 2,0.25").explanation).toContain("Error");
        expect(pureOrder("0,1.0; 100,0.5").explanation).toContain("Error");
        expect(pureOrder("0; 1,0.5; 2,0.25").explanation).toContain("Error");
    });

    it("rejects identical time values", () => {
        expect(pureOrder("5,1.0; 5,0.5; 5,0.25").explanation).toContain("Error");
    });
});

describe("kineticsCoverage: CollisionTheory pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "collision-theory-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves Z and p and rejects bad solveFor", () => {
        const R = 8.314;
        const kExpected = 1e11 * 0.01 * Math.exp(-(50 * 1000) / (R * 298));
        expect(pureCollision("Z", "50", "298", "", "0.01", String(kExpected)).value).toContain("s");
        expect(pureCollision("p", "50", "298", "1e11", "", String(kExpected)).value).not.toBe("");
        expect(pureCollision("bogus", "50", "298", "1e11", "0.01", "").explanation).toContain("Error");
    });

    it("rejects missing and non-positive inputs", () => {
        expect(pureCollision("k", "", "298", "1e11", "0.01", "").explanation).toContain("Error");
        expect(pureCollision("k", "50", "0", "1e11", "0.01", "").explanation).toContain("Error");
        expect(pureCollision("k", "50", "298", "0", "0.01", "").explanation).toContain("Error");
        expect(pureCollision("k", "50", "298", "1e11", "2", "").explanation).toContain("Error");
        expect(pureCollision("Z", "", "298", "", "0.01", "1").explanation).toContain("Error");
        expect(pureCollision("Z", "50", "0", "", "0.01", "1").explanation).toContain("Error");
        expect(pureCollision("Z", "50", "298", "", "0", "1").explanation).toContain("Error");
        expect(pureCollision("Z", "50", "298", "", "0.01", "0").explanation).toContain("Error");
        expect(pureCollision("p", "", "298", "1e11", "", "1").explanation).toContain("Error");
        expect(pureCollision("p", "50", "0", "1e11", "", "1").explanation).toContain("Error");
        expect(pureCollision("p", "50", "298", "0", "", "1").explanation).toContain("Error");
        expect(pureCollision("p", "50", "298", "1e11", "", "0").explanation).toContain("Error");
    });

    it("warns on unphysical solved steric factors", () => {
        const r = pureCollision("p", "50", "298", "1e11", "", "1e11");
        expect(r.explanation).toContain("warning");
    });
});

describe("kineticsCoverage: pure missing-key fallbacks", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "arrhenius-result";
        document.body.appendChild(result);
        const r2 = document.createElement("div");
        r2.id = "rate-law-result";
        document.body.appendChild(r2);
        const r3 = document.createElement("div");
        r3.id = "integrated-rate-law-result";
        document.body.appendChild(r3);
        const r4 = document.createElement("div");
        r4.id = "reaction-order-result";
        document.body.appendChild(r4);
        const r5 = document.createElement("div");
        r5.id = "collision-theory-result";
        document.body.appendChild(r5);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers ?? fallbacks with empty input records", () => {
        expect(new ArrheniusCalculator().calculatePure({}).explanation).toContain("Error");
        expect(new RateLawCalculator().calculatePure({}).explanation).toContain("Error");
        expect(new IntegratedRateLawCalculator().calculatePure({}).explanation).toContain("Error");
        expect(new ReactionOrderCalculator().calculatePure({}).explanation).toContain("Error");
        expect(new CollisionTheoryCalculator().calculatePure({}).explanation).toContain("Error");
    });

    it("covers A-constant pure path and non-unit orders", () => {
        const aConst = pureRateLaw("0.1", "0.1", "0.001", "0.1", "0.2", "0.004");
        expect(aConst.value).toContain("[B]^2");
        const m2 = pureRateLaw("0.1", "0.2", "0.001", "0.2", "0.2", "0.004");
        expect(m2.value).toContain("[A]^2");
    });

    it("covers IRL order validation and time branches", () => {
        expect(pureIrl("concentration", "5", "1", "0.05", "10", "").explanation).toContain("Error");
        expect(pureIrl("time", "1", "1", "0.05", "", "0.5").value).toContain("s");
        expect(pureIrl("time", "0", "1", "0", "", "0.5").explanation).toContain("Error");
        expect(pureIrl("concentration", "1", "1", "0.05", "0", "").value).toContain("M");
        expect(pureIrl("concentration", "0", "1", "0.05", "100", "").value).toContain("M");
    });

    it("covers trailing-semicolon empty entries in pure", () => {
        const r = pureOrder("0,1.0; 100,0.75; 200,0.5; 300,0.25;");
        expect(r.value).toContain("0");
    });

    it("covers denominator-zero via extreme barriers", () => {
        expect(pureCollision("k", "1000000", "1", "1e11", "0.01", "").value).toContain("0.000000");
        expect(pureCollision("Z", "1000000", "1", "", "0.01", "1").explanation).toContain("Error");
        expect(pureCollision("p", "1000000", "1", "1e11", "", "1").explanation).toContain("Error");
    });

    it("covers whitebox helpers directly", () => {
        const calc = new IntegratedRateLawCalculator() as unknown as Record<string, (o: number, a: number, k: number, e: number) => Array<{ time: number; concentration: number }>>;
        const series = calc["buildConcentrationTimeSeries"](0, 1, 0.05, 0);
        expect(series.length).toBe(31);
        const rc = new ReactionOrderCalculator() as unknown as Record<string, (pts: Array<{ t: number; c: number }>, fn: (p: { t: number; c: number }) => number) => number>;
        expect(rc["calculateRSquared"]([{ t: 0, c: 1 }], (p) => p.c)).toBe(0);
    });
});
