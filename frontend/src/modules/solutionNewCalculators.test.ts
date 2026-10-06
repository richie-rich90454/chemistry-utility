import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
    calculateBufferSolution, calculatePKaPKb, calculateKsp,
    calculateColligativeProperties, calculateTitrationCurve,
    calculateDebyeHuckel, calculateCommonIonEffect
} from "./solutionCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

describe("calculateBufferSolution", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("buffer-calc");
        createResultDiv("buffer-result", "buffer-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should calculate pH from pKa, [HA], and [A-]", () => {
        createSelect("buffer-solve-for", "pH", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "0.1", "buffer-calc");
        createInput("buffer-Aminus", "0.2", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("5.05");
        expect(text).toContain("Good");
    });

    it("should calculate pKa from pH, [HA], and [A-]", () => {
        createSelect("buffer-solve-for", "pKa", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "", "buffer-calc");
        createInput("buffer-HA", "0.1", "buffer-calc");
        createInput("buffer-Aminus", "0.2", "buffer-calc");
        createInput("buffer-pH", "5.05", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("4.7490");
    });

    it("should calculate ratio from pKa and pH", () => {
        createSelect("buffer-solve-for", "ratio", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "", "buffer-calc");
        createInput("buffer-Aminus", "", "buffer-calc");
        createInput("buffer-pH", "5.75", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("10.0000");
    });

    it("should show error when required fields are missing for pH", () => {
        createSelect("buffer-solve-for", "pH", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "", "buffer-calc");
        createInput("buffer-HA", "0.1", "buffer-calc");
        createInput("buffer-Aminus", "0.2", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });

    it("should show error for non-positive [HA]", () => {
        createSelect("buffer-solve-for", "pH", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "0", "buffer-calc");
        createInput("buffer-Aminus", "0.2", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });

    it("should indicate poor buffer capacity for extreme ratio", () => {
        createSelect("buffer-solve-for", "pH", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "0.001", "buffer-calc");
        createInput("buffer-Aminus", "1", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Poor");
    });

    it("should show error for invalid solve-for selection", () => {
        createSelect("buffer-solve-for", "bogus", ["pH", "pKa", "ratio", "bogus"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "0.1", "buffer-calc");
        createInput("buffer-Aminus", "0.2", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });

    it("should show error for non-positive [A-]", () => {
        createSelect("buffer-solve-for", "pH", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "0.1", "buffer-calc");
        createInput("buffer-Aminus", "0", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });

    it("should show error when pH is missing for pKa", () => {
        createSelect("buffer-solve-for", "pKa", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "", "buffer-calc");
        createInput("buffer-HA", "0.1", "buffer-calc");
        createInput("buffer-Aminus", "0.2", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });

    it("should show error when pKa is missing for ratio", () => {
        createSelect("buffer-solve-for", "ratio", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "", "buffer-calc");
        createInput("buffer-HA", "", "buffer-calc");
        createInput("buffer-Aminus", "", "buffer-calc");
        createInput("buffer-pH", "5.75", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });

    it("should show error when pH is missing for ratio", () => {
        createSelect("buffer-solve-for", "ratio", ["pH", "pKa", "ratio"], "buffer-calc");
        createInput("buffer-pKa", "4.75", "buffer-calc");
        createInput("buffer-HA", "", "buffer-calc");
        createInput("buffer-Aminus", "", "buffer-calc");
        createInput("buffer-pH", "", "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");

        calculateBufferSolution();

        const text = getResultText("buffer-result");
        expect(text).toContain("Error");
    });
});

describe("calculatePKaPKb", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("pka-pkb-calc");
        createResultDiv("pka-pkb-result", "pka-pkb-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should compute all values from Ka", () => {
        createSelect("pka-pkb-input-type", "Ka", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "0.000018", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("4.7447");
        expect(text).toContain("9.2553");
    });

    it("should compute all values from pKa", () => {
        createSelect("pka-pkb-input-type", "pKa", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "4.75", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("9.25");
    });

    it("should compute all values from Kb", () => {
        createSelect("pka-pkb-input-type", "Kb", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "0.000000000556", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("4.74");
    });

    it("should compute all values from pKb", () => {
        createSelect("pka-pkb-input-type", "pKb", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "9.25", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("4.75");
    });

    it("should show error for zero input", () => {
        createSelect("pka-pkb-input-type", "Ka", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "0", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("Error");
    });

    it("should show error for negative input", () => {
        createSelect("pka-pkb-input-type", "Ka", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "-5", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("Error");
    });

    it("should display non-zero Kw mantissa (not 0.0000 x 10^-14)", () => {
        createSelect("pka-pkb-input-type", "Ka", ["Ka", "pKa", "Kb", "pKb"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "0.000018", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).not.toContain("Kw = 0.0000");
        expect(text).toContain("Kw = 1.0000");
    });

    it("should show error for invalid input type", () => {
        createSelect("pka-pkb-input-type", "bogus", ["Ka", "pKa", "Kb", "pKb", "bogus"], "pka-pkb-calc");
        createInput("pka-pkb-input-value", "1", "pka-pkb-calc");

        calculatePKaPKb();

        const text = getResultText("pka-pkb-result");
        expect(text).toContain("Error");
    });
});

describe("calculateKsp", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("ksp-calc");
        createResultDiv("ksp-result", "ksp-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should calculate Ksp from molar solubility for AB salt", () => {
        createSelect("ksp-solve-for", "Ksp", ["Ksp", "solubility"], "ksp-calc");
        createSelect("ksp-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "ksp-calc");
        createInput("ksp-value", "", "ksp-calc");
        createInput("ksp-molar-solubility", "0.0000134", "ksp-calc");

        calculateKsp();

        const text = getResultText("ksp-result");
        expect(text).toContain("0.000000");
        expect(text).toContain("0.000013");
    });

    it("should calculate molar solubility from Ksp for AB salt", () => {
        createSelect("ksp-solve-for", "solubility", ["Ksp", "solubility"], "ksp-calc");
        createSelect("ksp-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "ksp-calc");
        createInput("ksp-value", "0.00000000018", "ksp-calc");
        createInput("ksp-molar-solubility", "", "ksp-calc");

        calculateKsp();

        const text = getResultText("ksp-result");
        expect(text).toContain("0.000013");
    });

    it("should calculate molar solubility for AB2 salt", () => {
        createSelect("ksp-solve-for", "solubility", ["Ksp", "solubility"], "ksp-calc");
        createSelect("ksp-salt-type", "AB2", ["AB", "AB2", "A2B", "AB3", "A3B"], "ksp-calc");
        createInput("ksp-value", "0.00000000000148", "ksp-calc");
        createInput("ksp-molar-solubility", "", "ksp-calc");

        calculateKsp();

        const text = getResultText("ksp-result");
        expect(text).toContain("0.000072");
    });

    it("should calculate molar solubility for A2B salt", () => {
        createSelect("ksp-solve-for", "solubility", ["Ksp", "solubility"], "ksp-calc");
        createSelect("ksp-salt-type", "A2B", ["AB", "AB2", "A2B", "AB3", "A3B"], "ksp-calc");
        createInput("ksp-value", "0.0000000148", "ksp-calc");
        createInput("ksp-molar-solubility", "", "ksp-calc");

        calculateKsp();

        const text = getResultText("ksp-result");
        expect(text).toContain("0.001547");
    });

    it("should show error for zero Ksp", () => {
        createSelect("ksp-solve-for", "solubility", ["Ksp", "solubility"], "ksp-calc");
        createSelect("ksp-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "ksp-calc");
        createInput("ksp-value", "0", "ksp-calc");
        createInput("ksp-molar-solubility", "", "ksp-calc");

        calculateKsp();

        const text = getResultText("ksp-result");
        expect(text).toContain("Error");
    });

    it("should show error for negative molar solubility", () => {
        createSelect("ksp-solve-for", "Ksp", ["Ksp", "solubility"], "ksp-calc");
        createSelect("ksp-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "ksp-calc");
        createInput("ksp-value", "", "ksp-calc");
        createInput("ksp-molar-solubility", "-0.01", "ksp-calc");

        calculateKsp();

        const text = getResultText("ksp-result");
        expect(text).toContain("Error");
    });
});

describe("calculateColligativeProperties", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("colligative-calc");
        createResultDiv("colligative-result", "colligative-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should calculate molality and boiling/freezing point changes", () => {
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "0.512", "colligative-calc");
        createInput("collig-Kf", "1.86", "colligative-calc");
        createInput("collig-solvent-bp", "100", "colligative-calc");
        createInput("collig-solvent-fp", "0", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");

        calculateColligativeProperties();

        const text = getResultText("colligative-result");
        expect(text).toContain("1.7112");
        expect(text).toContain("1.7522");
        expect(text).toContain("6.3655");
    });

    it("should calculate osmotic pressure", () => {
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "", "colligative-calc");
        createInput("collig-Kf", "", "colligative-calc");
        createInput("collig-solvent-bp", "", "colligative-calc");
        createInput("collig-solvent-fp", "", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");

        calculateColligativeProperties();

        const text = getResultText("colligative-result");
        expect(text).toContain("Osmotic Pressure");
    });

    it("should calculate vapor pressure lowering", () => {
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "", "colligative-calc");
        createInput("collig-Kf", "", "colligative-calc");
        createInput("collig-solvent-bp", "", "colligative-calc");
        createInput("collig-solvent-fp", "", "colligative-calc");
        createInput("collig-Psolvent", "0.0313", "colligative-calc");

        calculateColligativeProperties();

        const text = getResultText("colligative-result");
        expect(text).toContain("Vapor Pressure");
    });

    it("should honor explicit density and temperature inputs", () => {
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "", "colligative-calc");
        createInput("collig-Kf", "", "colligative-calc");
        createInput("collig-solvent-bp", "", "colligative-calc");
        createInput("collig-solvent-fp", "", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");
        createInput("collig-density", "1.2", "colligative-calc");
        createInput("collig-temp", "310", "colligative-calc");

        calculateColligativeProperties();

        const text = getResultText("colligative-result");
        expect(text).toContain("1.2");
        expect(text).toContain("310");
    });

    it("should show error for zero solute mass", () => {
        createInput("collig-solute-mass", "0", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "", "colligative-calc");
        createInput("collig-Kf", "", "colligative-calc");
        createInput("collig-solvent-bp", "", "colligative-calc");
        createInput("collig-solvent-fp", "", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");

        calculateColligativeProperties();

        const text = getResultText("colligative-result");
        expect(text).toContain("Error");
    });

    it("should show error for Van't Hoff factor less than 1", () => {
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "0", "colligative-calc");
        createInput("collig-Kb", "", "colligative-calc");
        createInput("collig-Kf", "", "colligative-calc");
        createInput("collig-solvent-bp", "", "colligative-calc");
        createInput("collig-solvent-fp", "", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");

        calculateColligativeProperties();

        const text = getResultText("colligative-result");
        expect(text).toContain("Error");
    });
});

describe("calculateTitrationCurve", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("titration-calc");
        createResultDiv("titration-result", "titration-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should generate titration curve for strong acid", () => {
        createSelect("titration-acid-type", "strong", ["strong", "weak"], "titration-calc");
        createInput("titration-acid-conc", "0.1", "titration-calc");
        createInput("titration-acid-vol", "25", "titration-calc");
        createInput("titration-base-conc", "0.1", "titration-calc");
        createInput("titration-max-vol", "50", "titration-calc");
        createInput("titration-Ka", "", "titration-calc");

        calculateTitrationCurve();

        const text = getResultText("titration-result");
        expect(text).toContain("Equivalence Point");
        expect(text).toContain("25.00");
    });

    it("should generate titration curve for weak acid", () => {
        createSelect("titration-acid-type", "weak", ["strong", "weak"], "titration-calc");
        createInput("titration-acid-conc", "0.1", "titration-calc");
        createInput("titration-acid-vol", "25", "titration-calc");
        createInput("titration-base-conc", "0.1", "titration-calc");
        createInput("titration-max-vol", "50", "titration-calc");
        createInput("titration-Ka", "0.000018", "titration-calc");

        calculateTitrationCurve();

        const text = getResultText("titration-result");
        expect(text).toContain("Equivalence Point");
        expect(text).toContain("Half-Equivalence Point");
        expect(text).toContain("pKa");
    });

    it("should show error when Ka is missing for weak acid", () => {
        createSelect("titration-acid-type", "weak", ["strong", "weak"], "titration-calc");
        createInput("titration-acid-conc", "0.1", "titration-calc");
        createInput("titration-acid-vol", "25", "titration-calc");
        createInput("titration-base-conc", "0.1", "titration-calc");
        createInput("titration-max-vol", "50", "titration-calc");
        createInput("titration-Ka", "", "titration-calc");

        calculateTitrationCurve();

        const text = getResultText("titration-result");
        expect(text).toContain("Error");
    });

    it("should show error for zero acid concentration", () => {
        createSelect("titration-acid-type", "strong", ["strong", "weak"], "titration-calc");
        createInput("titration-acid-conc", "0", "titration-calc");
        createInput("titration-acid-vol", "25", "titration-calc");
        createInput("titration-base-conc", "0.1", "titration-calc");
        createInput("titration-max-vol", "50", "titration-calc");
        createInput("titration-Ka", "", "titration-calc");

        calculateTitrationCurve();

        const text = getResultText("titration-result");
        expect(text).toContain("Error");
    });
});

describe("calculateDebyeHuckel", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("debye-huckel-calc");
        createResultDiv("debye-huckel-result", "debye-huckel-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should calculate ionic strength and activity coefficient", () => {
        createInput("dh-zplus", "1", "debye-huckel-calc");
        createInput("dh-zminus", "1", "debye-huckel-calc");
        createInput("dh-concentration", "0.01", "debye-huckel-calc");
        createInput("dh-ion-size", "9", "debye-huckel-calc");

        calculateDebyeHuckel();

        const text = getResultText("debye-huckel-result");
        expect(text).toContain("0.010000");
        expect(text).toContain("0.970779");
    });

    it("should handle multivalent ions", () => {
        createInput("dh-zplus", "2", "debye-huckel-calc");
        createInput("dh-zminus", "1", "debye-huckel-calc");
        createInput("dh-concentration", "0.001", "debye-huckel-calc");
        createInput("dh-ion-size", "8", "debye-huckel-calc");

        calculateDebyeHuckel();

        const text = getResultText("debye-huckel-result");
        // MX2 salt at c=0.001: I = 0.5*c*(1*4 + 2*1) = 3c = 0.003.
        expect(text).toContain("0.003000");
        expect(text).toContain("M1X2");
    });

    it("should reject non-integer ion charges", () => {
        createInput("dh-zplus", "1.5", "debye-huckel-calc");
        createInput("dh-zminus", "1", "debye-huckel-calc");
        createInput("dh-concentration", "0.01", "debye-huckel-calc");
        createInput("dh-ion-size", "9", "debye-huckel-calc");

        calculateDebyeHuckel();

        const text = getResultText("debye-huckel-result");
        expect(text).toContain("Error");
        expect(text).toContain("integers");
    });
    it("should show error for zero ion charge", () => {
        createInput("dh-zplus", "0", "debye-huckel-calc");
        createInput("dh-zminus", "1", "debye-huckel-calc");
        createInput("dh-concentration", "0.01", "debye-huckel-calc");
        createInput("dh-ion-size", "9", "debye-huckel-calc");

        calculateDebyeHuckel();

        const text = getResultText("debye-huckel-result");
        expect(text).toContain("Error");
    });

    it("should show error for zero concentration", () => {
        createInput("dh-zplus", "1", "debye-huckel-calc");
        createInput("dh-zminus", "1", "debye-huckel-calc");
        createInput("dh-concentration", "0", "debye-huckel-calc");
        createInput("dh-ion-size", "9", "debye-huckel-calc");

        calculateDebyeHuckel();

        const text = getResultText("debye-huckel-result");
        expect(text).toContain("Error");
    });

    it("should show error for zero ion size", () => {
        createInput("dh-zplus", "1", "debye-huckel-calc");
        createInput("dh-zminus", "1", "debye-huckel-calc");
        createInput("dh-concentration", "0.01", "debye-huckel-calc");
        createInput("dh-ion-size", "0", "debye-huckel-calc");

        calculateDebyeHuckel();

        const text = getResultText("debye-huckel-result");
        expect(text).toContain("Error");
    });
});

describe("calculateCommonIonEffect", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("common-ion-calc");
        createResultDiv("common-ion-result", "common-ion-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("should calculate solubility with common ion for AB salt", () => {
        createSelect("common-ion-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000018", "common-ion-calc");
        createInput("common-ion-concentration", "0.1", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("0.000000");
        expect(text).toContain("0.000013");
        expect(text).toContain("0.100000");
    });

    it("should show comparison with and without common ion", () => {
        createSelect("common-ion-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000018", "common-ion-calc");
        createInput("common-ion-concentration", "0.1", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("without");
        expect(text).toContain("Ratio");
    });

    it("should handle AB2 salt type", () => {
        createSelect("common-ion-salt-type", "AB2", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000000148", "common-ion-calc");
        createInput("common-ion-concentration", "0.05", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("0.050000");
    });

    it("should warn when the s << C approximation breaks down", () => {
        createSelect("common-ion-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.0001", "common-ion-calc");
        createInput("common-ion-concentration", "0.001", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Warning");
    });

    it("should show error for zero Ksp", () => {
        createSelect("common-ion-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0", "common-ion-calc");
        createInput("common-ion-concentration", "0.1", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Error");
    });

    it("should show error for negative common ion concentration", () => {
        createSelect("common-ion-salt-type", "AB", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000018", "common-ion-calc");
        createInput("common-ion-concentration", "-0.1", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Error");
    });

    it("should handle A2B salt type", () => {
        createSelect("common-ion-salt-type", "A2B", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.0000000148", "common-ion-calc");
        createInput("common-ion-concentration", "0.1", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Molar Solubility");
        expect(text).not.toContain("Error");
    });

    it("should handle AB3 salt type", () => {
        createSelect("common-ion-salt-type", "AB3", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000000148", "common-ion-calc");
        createInput("common-ion-concentration", "0.05", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Molar Solubility");
        expect(text).not.toContain("Error");
    });

    it("should handle A3B salt type", () => {
        createSelect("common-ion-salt-type", "A3B", ["AB", "AB2", "A2B", "AB3", "A3B"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000000148", "common-ion-calc");
        createInput("common-ion-concentration", "0.05", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Molar Solubility");
        expect(text).not.toContain("Error");
    });

    it("should show error for invalid salt type", () => {
        createSelect("common-ion-salt-type", "XYZ", ["AB", "AB2", "A2B", "AB3", "A3B", "XYZ"], "common-ion-calc");
        createInput("common-ion-Ksp", "0.00000000018", "common-ion-calc");
        createInput("common-ion-concentration", "0.1", "common-ion-calc");

        calculateCommonIonEffect();

        const text = getResultText("common-ion-result");
        expect(text).toContain("Error");
    });
});

describe("solutionGapCoverage: buffer DOM validation", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("buffer-calc");
        createResultDiv("buffer-result", "buffer-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    function bufferDom(solveFor: string, pKa: string, HA: string, Aminus: string, pH: string): string {
        document.body.innerHTML = "";
        createContainer("buffer-calc");
        createResultDiv("buffer-result", "buffer-calc");
        createSelect("buffer-solve-for", solveFor, ["pH", "pKa", "ratio", "bogus"], "buffer-calc");
        createInput("buffer-pKa", pKa, "buffer-calc");
        createInput("buffer-HA", HA, "buffer-calc");
        createInput("buffer-Aminus", Aminus, "buffer-calc");
        createInput("buffer-pH", pH, "buffer-calc");
        createInput("buffer-ratio", "", "buffer-calc");
        calculateBufferSolution();
        return getResultText("buffer-result");
    }

    it("rejects HA/Aminus problems in pH branch", () => {
        expect(bufferDom("pH", "4.75", "", "0.2", "")).toContain("Error");
        expect(bufferDom("pH", "4.75", "0", "0.2", "")).toContain("Error");
    });

    it("rejects HA/Aminus problems in pKa branch", () => {
        expect(bufferDom("pKa", "", "0.1", "", "5.06")).toContain("Error");
        expect(bufferDom("pKa", "", "0", "0.2", "5.06")).toContain("Error");
        expect(bufferDom("pKa", "", "0.1", "0", "5.06")).toContain("Error");
    });
});

describe("solutionGapCoverage: Ksp DOM salt types", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("ksp-calc");
        createResultDiv("ksp-result", "ksp-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    function kspDom(salt: string, solveFor: string, ksp: string, s: string): string {
        document.body.innerHTML = "";
        createContainer("ksp-calc");
        createResultDiv("ksp-result", "ksp-calc");
        createSelect("ksp-solve-for", solveFor, ["Ksp", "solubility", "bogus"], "ksp-calc");
        createSelect("ksp-salt-type", salt, ["AB", "AB2", "A2B", "AB3", "A3B", "bogus"], "ksp-calc");
        createInput("ksp-value", ksp, "ksp-calc");
        createInput("ksp-molar-solubility", s, "ksp-calc");
        calculateKsp();
        return getResultText("ksp-result");
    }

    it("covers AB3 and A3B in both directions", () => {
        expect(kspDom("AB3", "Ksp", "", "0.01")).toContain("Ksp");
        expect(kspDom("AB3", "solubility", "1e-10", "")).toContain("Molar Solubility");
        expect(kspDom("A3B", "Ksp", "", "0.01")).toContain("Ksp");
        expect(kspDom("A3B", "solubility", "1e-10", "")).toContain("Molar Solubility");
    });

    it("rejects bogus salt and solveFor", () => {
        expect(kspDom("bogus", "Ksp", "", "0.01")).toContain("Error");
        expect(kspDom("AB", "bogus", "1e-10", "0.01")).toContain("Error");
    });
});

describe("solutionGapCoverage: colligative DOM validation", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("colligative-calc");
        createResultDiv("colligative-result", "colligative-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    function colligDom(extra: Record<string, string>): string {
        document.body.innerHTML = "";
        createContainer("colligative-calc");
        createResultDiv("colligative-result", "colligative-calc");
        const base: Record<string, string> = {
            "collig-solute-mass": "10",
            "collig-molar-mass": "58.44",
            "collig-solvent-mass": "100",
            "collig-vanthoff": "2",
            "collig-Kb": "0.512",
            "collig-Kf": "1.86",
            "collig-solvent-bp": "100",
            "collig-solvent-fp": "0",
            "collig-Psolvent": "",
        };
        Object.assign(base, extra);
        for (const k of Object.keys(base)) createInput(k, base[k], "colligative-calc");
        calculateColligativeProperties();
        return getResultText("colligative-result");
    }

    it("honors custom solvent molar mass", () => {
        document.body.innerHTML = "";
        createContainer("colligative-calc");
        createResultDiv("colligative-result", "colligative-calc");
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "0.512", "colligative-calc");
        createInput("collig-Kf", "1.86", "colligative-calc");
        createInput("collig-solvent-bp", "100", "colligative-calc");
        createInput("collig-solvent-fp", "0", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");
        createInput("collig-solvent-molar-mass", "46.07", "colligative-calc");
        calculateColligativeProperties();
        expect(getResultText("colligative-result")).toContain("Molality");
        document.body.innerHTML = "";
        createContainer("colligative-calc");
        createResultDiv("colligative-result", "colligative-calc");
        createInput("collig-solute-mass", "10", "colligative-calc");
        createInput("collig-molar-mass", "58.44", "colligative-calc");
        createInput("collig-solvent-mass", "100", "colligative-calc");
        createInput("collig-vanthoff", "2", "colligative-calc");
        createInput("collig-Kb", "0.512", "colligative-calc");
        createInput("collig-Kf", "1.86", "colligative-calc");
        createInput("collig-solvent-bp", "100", "colligative-calc");
        createInput("collig-solvent-fp", "0", "colligative-calc");
        createInput("collig-Psolvent", "", "colligative-calc");
        createInput("collig-solvent-molar-mass", "0", "colligative-calc");
        calculateColligativeProperties();
        expect(getResultText("colligative-result")).toContain("Error");
    });

    it("rejects bad masses, density, temp", () => {
        expect(colligDom({"collig-molar-mass": "0"})).toContain("Error");
        expect(colligDom({"collig-solvent-mass": "0"})).toContain("Error");
        expect(colligDom({"collig-density": "0"})).toContain("Error");
        expect(colligDom({"collig-temp": "0"})).toContain("Error");
    });
});

describe("solutionGapCoverage: titration DOM validation", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        createContainer("titration-calc");
        createResultDiv("titration-result", "titration-calc");
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    function titrationDom(acidType: string, acidConc: string, acidVol: string, baseConc: string, maxVol: string, Ka: string, withChart = false): string {
        document.body.innerHTML = "";
        createContainer("titration-calc");
        createResultDiv("titration-result", "titration-calc");
        createSelect("titration-acid-type", acidType, ["strong", "weak"], "titration-calc");
        createInput("titration-acid-conc", acidConc, "titration-calc");
        createInput("titration-acid-vol", acidVol, "titration-calc");
        createInput("titration-base-conc", baseConc, "titration-calc");
        createInput("titration-max-vol", maxVol, "titration-calc");
        createInput("titration-Ka", Ka, "titration-calc");
        if (withChart) {
            const canvas = document.createElement("canvas");
            canvas.id = "titration-chart";
            document.body.appendChild(canvas);
        }
        calculateTitrationCurve();
        return getResultText("titration-result");
    }

    it("rejects bad volumes and concentrations", () => {
        expect(titrationDom("strong", "0.1", "0", "0.1", "50", "")).toContain("Error");
        expect(titrationDom("strong", "0.1", "25", "0", "50", "")).toContain("Error");
        expect(titrationDom("strong", "0.1", "25", "0.1", "0", "")).toContain("Error");
    });

    it("clamps extreme pH and renders chart", () => {
        expect(titrationDom("strong", "10", "25", "0.1", "50", "")).toContain("Equivalence Point");
        expect(titrationDom("strong", "0.1", "25", "10", "50", "")).toContain("Equivalence Point");
        expect(titrationDom("strong", "0.1", "25", "0.1", "50", "", true)).toContain("Equivalence Point");
    });
});
