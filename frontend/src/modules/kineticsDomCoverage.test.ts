// @vitest-environment jsdom
import {describe, it, expect, afterEach} from "vitest";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";
import {
    calculateArrhenius,
    calculateRateLaw,
    calculateIntegratedRateLaw,
    calculateReactionOrder,
    calculateCollisionTheory,
    ArrheniusCalculator,
} from "./kineticsCalculators.js";

    function arrheniusDom(solveFor: string, A: string, Ea: string, T: string, k: string): void {
        document.body.innerHTML = "";
        createContainer("arrhenius-calc");
        createResultDiv("arrhenius-result", "arrhenius-calc");
        createSelect("arrhenius-solve-for", solveFor, ["k", "Ea", "T", "A"], "arrhenius-calc");
        createInput("arrhenius-A", A, "arrhenius-calc");
        createInput("arrhenius-Ea", Ea, "arrhenius-calc");
        createInput("arrhenius-T", T, "arrhenius-calc");
        createInput("arrhenius-k", k, "arrhenius-calc");
    }

function arrheniusPure(solveFor: string, A: string, Ea: string, T: string, k: string) {
    document.body.innerHTML = "";
    const result = document.createElement("div");
    result.id = "arrhenius-result";
    document.body.appendChild(result);
    return new ArrheniusCalculator().calculatePure({
        "arrhenius-solve-for": solveFor,
        "arrhenius-A": A,
        "arrhenius-Ea": Ea,
        "arrhenius-T": T,
        "arrhenius-k": k,
    });
}

describe("kineticsDomCoverage: Arrhenius DOM branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves k, Ea, T, A through the DOM and rejects bad solveFor", () => {
        arrheniusDom("k", "1e13", "75", "298", "");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("0.7");
        arrheniusDom("Ea", "1e13", "", "298", "0.7132");
        calculateArrhenius();
        const eaText = document.getElementById("arrhenius-result")!.textContent as string;
        const eaMatch = eaText.match(/Result:\s*([\d.eE+-]+)/);
        expect(eaMatch).not.toBeNull();
        expect(parseFloat(eaMatch![1])).toBeCloseTo(75, 0);
        arrheniusDom("T", "1e13", "75", "", "0.7132");
        calculateArrhenius();
        const tText = document.getElementById("arrhenius-result")!.textContent as string;
        const tMatch = tText.match(/Result:\s*([\d.eE+-]+)/);
        expect(tMatch).not.toBeNull();
        expect(parseFloat(tMatch![1])).toBeCloseTo(298, -1);
        arrheniusDom("A", "", "75", "298", "0.7132");
        calculateArrhenius();
        const aText = document.getElementById("arrhenius-result")!.textContent as string;
        const aMatch = aText.match(/Result:\s*([\d.eE+-]+)/);
        expect(aMatch).not.toBeNull();
        expect(Math.log10(parseFloat(aMatch![1]))).toBeCloseTo(13, 0);
    });

    it("rejects non-positive inputs per DOM branch", () => {
        arrheniusDom("k", "1e13", "75", "0", "");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("k", "0", "75", "298", "");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("Ea", "1e13", "75", "0", "0.7132");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("Ea", "0", "75", "298", "0.7132");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("Ea", "1e13", "75", "298", "0");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("T", "0", "75", "", "0.7132");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("T", "1e13", "75", "", "0");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("T", "1e13", "75", "", "1e13");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("A", "", "75", "0", "0.7132");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
        arrheniusDom("A", "", "75", "298", "0");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
    });

    it("mirrors the same branches through calculatePure", () => {
        expect(arrheniusPure("k", "1e13", "75", "298", "").value).toContain("s");
        expect(arrheniusPure("Ea", "1e13", "", "298", "0.7132").value).toContain("kJ");
        expect(arrheniusPure("T", "1e13", "75", "", "0.7132").value).toContain("K");
        expect(arrheniusPure("A", "", "75", "298", "0.7132").value).toContain("s");
        expect(arrheniusPure("k", "1e13", "75", "0", "").explanation).toContain("Error");
        expect(arrheniusPure("k", "0", "75", "298", "").explanation).toContain("Error");
        expect(arrheniusPure("Ea", "1e13", "75", "0", "0.7132").explanation).toContain("Error");
        expect(arrheniusPure("Ea", "0", "75", "298", "0.7132").explanation).toContain("Error");
        expect(arrheniusPure("Ea", "1e13", "75", "298", "0").explanation).toContain("Error");
        expect(arrheniusPure("T", "0", "75", "298", "0.7132").explanation).toContain("Error");
        expect(arrheniusPure("T", "1e13", "75", "298", "0").explanation).toContain("Error");
        expect(arrheniusPure("T", "1e13", "75", "298", "1e13").explanation).toContain("Error");
        expect(arrheniusPure("A", "", "75", "0", "0.7132").explanation).toContain("Error");
        expect(arrheniusPure("A", "", "75", "298", "0").explanation).toContain("Error");
    });

    it("rejects bad solveFor through the DOM", () => {
        document.body.innerHTML = "";
        createContainer("arrhenius-calc");
        createResultDiv("arrhenius-result", "arrhenius-calc");
        createSelect("arrhenius-solve-for", "bogus", ["k", "Ea", "T", "A", "bogus"], "arrhenius-calc");
        createInput("arrhenius-A", "1e13", "arrhenius-calc");
        createInput("arrhenius-Ea", "75", "arrhenius-calc");
        createInput("arrhenius-T", "298", "arrhenius-calc");
        createInput("arrhenius-k", "", "arrhenius-calc");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.textContent).toContain("Error");
    });
});

function rateLawDom(A1: string, B1: string, r1: string, A2: string, B2: string, r2: string): string {
    document.body.innerHTML = "";
    createContainer("rate-law-calc");
    createResultDiv("rate-law-result", "rate-law-calc");
    createInput("ratelaw-A1", A1, "rate-law-calc");
    createInput("ratelaw-B1", B1, "rate-law-calc");
    createInput("ratelaw-rate1", r1, "rate-law-calc");
    createInput("ratelaw-A2", A2, "rate-law-calc");
    createInput("ratelaw-B2", B2, "rate-law-calc");
    createInput("ratelaw-rate2", r2, "rate-law-calc");
    calculateRateLaw();
    return getResultText("rate-law-result");
}

describe("kineticsDomCoverage: RateLaw DOM branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects B<=0, rate<=0, and identical experiments", () => {
        expect(rateLawDom("0.1", "0", "0.004", "0.2", "0", "0.008")).toContain("Error");
        expect(rateLawDom("0.1", "0.2", "0", "0.2", "0.2", "0.008")).toContain("Error");
        expect(rateLawDom("0.1", "0.1", "0.001", "0.1", "0.1", "0.001")).toContain("Error");
    });

    it("formats m=2 and n=2 with exponents", () => {
        expect(rateLawDom("0.1", "0.2", "0.001", "0.2", "0.2", "0.004")).toContain("[A]^2");
        expect(rateLawDom("0.1", "0.1", "0.001", "0.1", "0.2", "0.004")).toContain("[B]^2");
        expect(rateLawDom("0.1", "0.1", "0.001", "0.1", "0.2", "0.002")).toContain("[B]");
        expect(rateLawDom("0.1", "0.1", "0.001", "0.1", "0.2", "0.002")).not.toContain("[B]^");
    });
});

function irlDom(solveFor: string, order: string | null, A0: string, k: string, t: string, A: string, withChart = false): string {
    document.body.innerHTML = "";
    createContainer("irl-calc");
    createResultDiv("integrated-rate-law-result", "irl-calc");
    createSelect("irl-solve-for", solveFor, ["concentration", "time", "bogus"], "irl-calc");
    if (order !== null) createSelect("irl-order", order, ["0", "1", "2", "5", "bogus"], "irl-calc");
    createInput("irl-A0", A0, "irl-calc");
    createInput("irl-k", k, "irl-calc");
    createInput("irl-t", t, "irl-calc");
    createInput("irl-A", A, "irl-calc");
    if (withChart) {
        const canvas = document.createElement("canvas");
        canvas.id = "integrated-rate-law-chart";
        document.body.appendChild(canvas);
    }
    calculateIntegratedRateLaw();
    return getResultText("integrated-rate-law-result");
}

describe("kineticsDomCoverage: IRL DOM branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects missing selector and NaN order", () => {
        document.body.innerHTML = "";
        createContainer("irl-calc");
        createResultDiv("integrated-rate-law-result", "irl-calc");
        createSelect("irl-solve-for", "concentration", ["concentration", "time"], "irl-calc");
        createInput("irl-order", "1", "irl-calc");
        createInput("irl-A0", "1", "irl-calc");
        createInput("irl-k", "0.05", "irl-calc");
        createInput("irl-t", "10", "irl-calc");
        createInput("irl-A", "", "irl-calc");
        calculateIntegratedRateLaw();
        expect(getResultText("integrated-rate-law-result")).toContain("Error");
        expect(irlDom("concentration", "bogus", "1", "0.05", "10", "")).toContain("Error");
    });

    it("covers concentration order 2 and k<0", () => {
        expect(irlDom("concentration", "2", "1", "0.05", "10", "")).toContain("M");
        expect(irlDom("concentration", "1", "1", "-0.05", "10", "")).toContain("Error");
        expect(irlDom("concentration", "5", "1", "0.05", "10", "")).toContain("Error");
    });

    it("rejects bad solveFor and time validation", () => {
        expect(irlDom("bogus", "1", "1", "0.05", "10", "")).toContain("Error");
        expect(irlDom("time", "1", "0", "0.05", "", "0.5")).toContain("Error");
        expect(irlDom("time", "1", "1", "0", "", "0.5")).toContain("Error");
        expect(irlDom("time", "1", "1", "0.05", "", "0")).toContain("Error");
        expect(irlDom("time", "0", "1", "0.05", "", "1.5")).toContain("Error");
        expect(irlDom("time", "0", "1", "0.05", "", "0.5")).toContain("s");
        expect(irlDom("time", "1", "1", "0.05", "", "2")).toContain("Error");
        expect(irlDom("time", "2", "1", "0.05", "", "2")).toContain("Error");
        expect(irlDom("time", "2", "1", "0.05", "", "0.5")).toContain("s");
        expect(irlDom("time", "5", "1", "0.05", "", "0.5")).toContain("Error");
    });

    it("renders charts for both directions", () => {
        expect(irlDom("concentration", "1", "1", "0.05", "10", "", true)).not.toContain("Error");
        expect(irlDom("time", "1", "1", "0.05", "", "0.5", true)).not.toContain("Error");
    });
});

function orderDom(data: string): string {
    document.body.innerHTML = "";
    createContainer("reaction-order-calc");
    createResultDiv("reaction-order-result", "reaction-order-calc");
    const inp = document.createElement("input");
    inp.id = "reaction-order-data";
    inp.value = data;
    inp.type = "text";
    document.getElementById("reaction-order-calc")!.appendChild(inp);
    calculateReactionOrder();
    return getResultText("reaction-order-result");
}

describe("kineticsDomCoverage: ReactionOrder DOM branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("skips empty entries and rejects bad shapes", () => {
        expect(orderDom("0,1.0; 100,0.75; 200,0.5; 300,0.25;")).toContain("0");
        expect(orderDom("0,1.0; bad; 200,0.5")).toContain("Error");
        expect(orderDom("0,1.0; 1,abc; 2,0.5")).toContain("Error");
        expect(orderDom("0,0; 1,0.5; 2,0.25")).toContain("Error");
        expect(orderDom("0; 1,0.5; 2,0.25")).toContain("Error");
    });
});

function collisionDom(solveFor: string, Ea: string, T: string, Z: string, p: string, k: string): string {
    document.body.innerHTML = "";
    createContainer("collision-calc");
    createResultDiv("collision-theory-result", "collision-calc");
    createSelect("collision-solve-for", solveFor, ["k", "Z", "p", "bogus"], "collision-calc");
    createInput("collision-Ea", Ea, "collision-calc");
    createInput("collision-T", T, "collision-calc");
    createInput("collision-Z", Z, "collision-calc");
    createInput("collision-p", p, "collision-calc");
    createInput("collision-k", k, "collision-calc");
    calculateCollisionTheory();
    return getResultText("collision-theory-result");
}

describe("kineticsDomCoverage: Collision DOM branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects missing and non-positive DOM inputs", () => {
        expect(collisionDom("k", "", "298", "1e11", "0.01", "")).toContain("Error");
        expect(collisionDom("k", "50", "0", "1e11", "0.01", "")).toContain("Error");
        expect(collisionDom("bogus", "50", "298", "1e11", "0.01", "")).toContain("Error");
        expect(collisionDom("Z", "50", "0", "", "0.01", "1")).toContain("Error");
        expect(collisionDom("p", "50", "0", "1e11", "", "1")).toContain("Error");
    });

    it("hits denominator-zero via extreme DOM barriers", () => {
        expect(collisionDom("Z", "1000000", "1", "", "0.01", "1")).toContain("Error");
        expect(collisionDom("p", "1000000", "1", "1e11", "", "1")).toContain("Error");
    });
});
