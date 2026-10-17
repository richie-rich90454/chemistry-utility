import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { predictBondType, BondTypePredictor } from "./bondPredictor.js";
import { setOrCreateInput, getResultHTML } from "../test/helpers.js";

describe("bondPredictor", () => {
    beforeEach(() => {
        const container = document.createElement("div");
        container.id = "bond-predictor";
        const resultDiv = document.createElement("div");
        resultDiv.id = "bond-type-result";
        container.appendChild(resultDiv);
        document.body.appendChild(container);
    });

    afterEach(() => {
        const el = document.getElementById("bond-predictor");
        if (el) el.remove();
    });

    it("should predict Metallic bond for Metal + Metal (Na + Ca)", () => {
        setOrCreateInput("element1-input", "Na", "bond-predictor", "text");
        setOrCreateInput("element2-input", "Ca", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Metallic");
    });

    it("should predict Ionic bond for Metal + Non-metal (Na + Cl)", () => {
        setOrCreateInput("element1-input", "Na", "bond-predictor", "text");
        setOrCreateInput("element2-input", "Cl", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Ionic");
    });

    it("should predict Polar Covalent bond for Non-metal + Non-metal with high deltaEN (H + O)", () => {
        setOrCreateInput("element1-input", "H", "bond-predictor", "text");
        setOrCreateInput("element2-input", "O", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        // H=2.20, O=3.44, deltaEN=1.24 → since one is not metal and deltaEN < 1.7, it's Polar Covalent
        expect(html).toContain("Polar Covalent");
    });

    it("should predict Polar Covalent for C + O (deltaEN = 0.89)", () => {
        setOrCreateInput("element1-input", "C", "bond-predictor", "text");
        setOrCreateInput("element2-input", "O", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        // C=2.55, O=3.44, deltaEN=0.89 → 0.4 <= 0.89 < 1.7, both non-metals → Polar Covalent
        expect(html).toContain("Polar Covalent");
    });

    it("should predict Nonpolar Covalent for same element (deltaEN = 0)", () => {
        setOrCreateInput("element1-input", "H", "bond-predictor", "text");
        setOrCreateInput("element2-input", "H", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        // Same element: deltaEN=0 → Nonpolar Covalent
        expect(html).toContain("Nonpolar Covalent");
    });

    it("should handle case-insensitive input (na + cl)", () => {
        setOrCreateInput("element1-input", "na", "bond-predictor", "text");
        setOrCreateInput("element2-input", "cl", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Ionic");
    });

    it("should show error for missing element", () => {
        setOrCreateInput("element1-input", "Xx", "bond-predictor", "text");
        setOrCreateInput("element2-input", "Na", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Error");
        expect(html).toContain("not found");
    });

    it("should handle element with null electronegativity gracefully", () => {
        setOrCreateInput("element1-input", "He", "bond-predictor", "text");
        setOrCreateInput("element2-input", "H", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("unavailable electronegativity data");
    });

    it("should show error when inputs are empty", () => {
        setOrCreateInput("element1-input", "", "bond-predictor", "text");
        setOrCreateInput("element2-input", "", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Error");
        expect(html).toContain("enter both element symbols");
    });

    it("should not round deltaEN up to the polar-covalent threshold (uses raw value for comparison)", () => {
        // N (3.04) and O (3.44) differ by 0.3999999999999999, which rounds to
        // "0.40" for display but is below the 0.4 polar-covalent threshold.
        // The buggy code parses the rounded string and misclassifies as Polar Covalent.
        setOrCreateInput("element1-input", "N", "bond-predictor", "text");
        setOrCreateInput("element2-input", "O", "bond-predictor", "text");
        predictBondType();
        const html = getResultHTML("bond-type-result");
        expect(html).toContain("Nonpolar Covalent");
        expect(html).not.toContain("Polar Covalent");
        expect(html).not.toContain("Ionic");
    });
});

describe("BondTypePredictor.calculatePure", () => {
    beforeEach(() => {
        // Legacy DOM hooks are still constructed by the calculator; supply
        // a result element so the constructor does not throw.
        const result = document.createElement("div");
        result.id = "bond-type-result";
        document.body.appendChild(result);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("predicts Ionic bond for Na + Cl", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "Na",
            "element2-input": "Cl"
        });
        expect(result.value).toContain("Ionic");
        expect(result.value).toContain("Na");
        expect(result.value).toContain("Cl");
        expect(result.metadata).toHaveProperty("bondType", "Ionic");
        expect(result.metadata).toHaveProperty("deltaEN");
    });

    it("predicts Metallic bond for Na + Ca", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "Na",
            "element2-input": "Ca"
        });
        expect(result.value).toContain("Metallic");
        expect(result.metadata).toHaveProperty("bondType", "Metallic");
    });

    it("predicts Polar Covalent bond for H + O", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "H",
            "element2-input": "O"
        });
        expect(result.value).toContain("Polar Covalent");
        expect(result.metadata).toHaveProperty("bondType", "Polar Covalent");
    });

    it("predicts Nonpolar Covalent bond for H + H", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "H",
            "element2-input": "H"
        });
        expect(result.value).toContain("Nonpolar Covalent");
        expect(result.metadata).toHaveProperty("bondType", "Nonpolar Covalent");
    });

    it("returns 'not possible' result when an element has null electronegativity", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "He",
            "element2-input": "H"
        });
        expect(result.value).toContain("not possible");
        expect(result.value).toContain("unavailable electronegativity data");
        expect(result.metadata).toHaveProperty("element1", "He");
        expect(result.metadata).toHaveProperty("element2", "H");
    });

    it("returns an error result when an element symbol is missing", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "Xx",
            "element2-input": "Na"
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error:");
        expect(result.explanation).toContain("not found");
    });

    it("returns an error result when an element input is empty", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({
            "element1-input": "",
            "element2-input": "Na"
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error:");
        expect(result.explanation).toContain("enter both element symbols");
    });

    it("exercises ?? fallback when both element input keys are missing", () => {
        const calc = new BondTypePredictor();
        const result = calc.calculatePure({});
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error:");
        expect(result.explanation).toContain("enter both element symbols");
    });
});
