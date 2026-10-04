// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {createContainer, createInput, createSelect, createResultDiv} from "../test/helpers.js";
import {
    calculateArrhenius,
    ArrheniusCalculator,
    RateLawCalculator,
    IntegratedRateLawCalculator,
    ReactionOrderCalculator,
    CollisionTheoryCalculator,
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
});
