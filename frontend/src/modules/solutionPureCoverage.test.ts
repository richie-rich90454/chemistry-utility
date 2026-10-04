// @vitest-environment jsdom
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
    DilutionCalculator,
    MassPercentCalculator,
    MixingCalculator,
    BufferSolutionCalculator,
    PKaPKbCalculator,
    KspCalculator,
    ColligativePropertiesCalculator,
    TitrationCurveCalculator,
    DebyeHuckelCalculator,
    CommonIonEffectCalculator,
} from "./solutionCalculators.js";

function pureDilution(solveFor: string, M1: string, V1: string, M2: string, V2: string) {
    return new DilutionCalculator().calculatePure({
        "dilution-solve-for": solveFor,
        "dilution-M1": M1,
        "dilution-V1": V1,
        "dilution-M2": M2,
        "dilution-V2": V2,
    });
}

describe("solutionPureCoverage: Dilution pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "dilution-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves M1, V1, M2, V2 and rejects bad solveFor", () => {
        expect(pureDilution("M1", "", "1", "0.5", "4").value).toContain("2.0000");
        expect(pureDilution("V1", "6", "", "2", "500").value).toContain("166.6667");
        expect(pureDilution("M2", "2", "1", "", "4").value).toContain("0.5000");
        expect(pureDilution("V2", "6", "100", "2", "").value).toContain("300.0000");
        expect(pureDilution("bogus", "6", "100", "2", "4").explanation).toContain("Error");
    });

    it("rejects non-positive inputs per branch", () => {
        expect(pureDilution("M1", "", "1", "0", "4").explanation).toContain("Error");
        expect(pureDilution("M1", "", "1", "0.5", "0").explanation).toContain("Error");
        expect(pureDilution("V1", "0", "", "2", "500").explanation).toContain("Error");
        expect(pureDilution("V1", "6", "", "0", "500").explanation).toContain("Error");
        expect(pureDilution("V1", "6", "", "2", "0").explanation).toContain("Error");
        expect(pureDilution("M2", "0", "1", "", "4").explanation).toContain("Error");
        expect(pureDilution("M2", "2", "0", "", "4").explanation).toContain("Error");
        expect(pureDilution("M2", "2", "1", "", "0").explanation).toContain("Error");
        expect(pureDilution("V2", "0", "100", "2", "").explanation).toContain("Error");
        expect(pureDilution("V2", "6", "0", "2", "").explanation).toContain("Error");
        expect(pureDilution("V2", "6", "100", "0", "").explanation).toContain("Error");
    });

    it("rejects missing inputs per branch", () => {
        expect(pureDilution("M1", "", "", "0.5", "4").explanation).toContain("Error");
        expect(pureDilution("V1", "", "", "2", "500").explanation).toContain("Error");
        expect(pureDilution("M2", "", "", "0.5", "4").explanation).toContain("Error");
        expect(pureDilution("V2", "", "100", "2", "").explanation).toContain("Error");
    });
});

function pureMassPercent(solute: string, solution: string, unit: string) {
    return new MassPercentCalculator().calculatePure({
        "mass-solute": solute,
        "mass-solution": solution,
        "concentration-unit": unit,
    });
}

describe("solutionPureCoverage: MassPercent pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "mass-percent-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("computes ppm, ppb, and rejects bad unit", () => {
        expect(pureMassPercent("0.001", "1", "ppm").value).toContain("1000.0000");
        expect(pureMassPercent("0.000001", "1", "ppb").value).toContain("1000.0000");
        expect(pureMassPercent("10", "100", "bogus").explanation).toContain("Error");
    });

    it("rejects missing and non-positive inputs", () => {
        expect(pureMassPercent("", "100", "percent").explanation).toContain("Error");
        expect(pureMassPercent("10", "", "percent").explanation).toContain("Error");
        expect(pureMassPercent("10", "0", "percent").explanation).toContain("Error");
        expect(pureMassPercent("-5", "100", "percent").explanation).toContain("Error");
    });
});

function pureMixing(C1: string, V1: string, C2: string, V2: string) {
    return new MixingCalculator().calculatePure({
        "mix-C1": C1,
        "mix-V1": V1,
        "mix-C2": C2,
        "mix-V2": V2,
    });
}

describe("solutionPureCoverage: Mixing pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "mixing-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("mixes and rejects bad inputs", () => {
        expect(pureMixing("2", "1", "1", "1").value).toContain("1.5000");
        expect(pureMixing("", "1", "0", "1").explanation).toContain("Error");
        expect(pureMixing("2", "1", "-1", "1").explanation).toContain("Error");
        expect(pureMixing("2", "0", "0", "1").explanation).toContain("Error");
    });
});

function pureBuffer(solveFor: string, pKa: string, HA: string, Aminus: string, pH: string) {
    return new BufferSolutionCalculator().calculatePure({
        "buffer-solve-for": solveFor,
        "buffer-pKa": pKa,
        "buffer-HA": HA,
        "buffer-Aminus": Aminus,
        "buffer-pH": pH,
    });
}

describe("solutionPureCoverage: Buffer pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "buffer-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves pH, pKa, ratio, and poor capacity", () => {
        expect(pureBuffer("pH", "4.76", "0.1", "0.2", "").explanation).toContain("Good");
        expect(pureBuffer("pKa", "", "0.1", "0.2", "5.06").explanation).toContain("pKa");
        expect(pureBuffer("ratio", "4.76", "", "", "5.06").explanation).toContain("[A-]/[HA]");
        expect(pureBuffer("pH", "4.76", "0.001", "10", "").explanation).toContain("Poor");
        expect(pureBuffer("bogus", "4.76", "0.1", "0.2", "").explanation).toContain("Error");
    });

    it("rejects missing and non-positive inputs per branch", () => {
        expect(pureBuffer("pH", "", "0.1", "0.2", "").explanation).toContain("Error");
        expect(pureBuffer("pH", "4.76", "", "0.2", "").explanation).toContain("Error");
        expect(pureBuffer("pH", "4.76", "0", "0.2", "").explanation).toContain("Error");
        expect(pureBuffer("pH", "4.76", "0.1", "0", "").explanation).toContain("Error");
        expect(pureBuffer("pKa", "", "0.1", "0.2", "").explanation).toContain("Error");
        expect(pureBuffer("pKa", "5.06", "", "0.2", "").explanation).toContain("Error");
        expect(pureBuffer("pKa", "5.06", "0.1", "0", "").explanation).toContain("Error");
        expect(pureBuffer("ratio", "", "0.1", "0.2", "5.06").explanation).toContain("Error");
        expect(pureBuffer("ratio", "4.76", "0.1", "0.2", "").explanation).toContain("Error");
    });
});

function purePka(value: string, type: string) {
    return new PKaPKbCalculator().calculatePure({
        "pka-pkb-input-value": value,
        "pka-pkb-input-type": type,
    });
}

describe("solutionPureCoverage: PKaPKb pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "pka-pkb-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("converts all four input types and rejects bad input", () => {
        expect(purePka("1.8e-5", "Ka").explanation).toContain("pKa");
        expect(purePka("4.76", "pKa").explanation).toContain("pKb");
        expect(purePka("5.6e-10", "Kb").explanation).toContain("pKa");
        expect(purePka("9.24", "pKb").explanation).toContain("pKa");
        expect(purePka("4.76", "bogus").explanation).toContain("Error");
        expect(purePka("", "Ka").explanation).toContain("Error");
        expect(purePka("0", "Ka").explanation).toContain("Error");
    });
});

function pureKsp(saltType: string, solveFor: string, ksp: string, s: string) {
    return new KspCalculator().calculatePure({
        "ksp-salt-type": saltType,
        "ksp-solve-for": solveFor,
        "ksp-value": ksp,
        "ksp-molar-solubility": s,
    });
}

describe("solutionPureCoverage: Ksp pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "ksp-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers every salt type in both directions", () => {
        for (const salt of ["AB", "AB2", "A2B", "AB3", "A3B"]) {
            expect(pureKsp(salt, "Ksp", "", "0.01").value).toContain("Ksp");
            expect(pureKsp(salt, "solubility", "1e-10", "").value).toContain("s = ");
        }
        expect(pureKsp("bogus", "Ksp", "", "0.01").explanation).toContain("Error");
        expect(pureKsp("AB", "bogus", "1e-10", "0.01").explanation).toContain("Error");
        expect(pureKsp("AB", "Ksp", "", "0").explanation).toContain("Error");
        expect(pureKsp("AB", "solubility", "0", "").explanation).toContain("Error");
    });
});

function pureCollig(vals: Record<string, string>) {
    return new ColligativePropertiesCalculator().calculatePure(vals);
}

function colligBase(): Record<string, string> {
    return {
        "collig-solute-mass": "10",
        "collig-molar-mass": "58.44",
        "collig-solvent-mass": "100",
        "collig-vanthoff": "2",
        "collig-Kb": "0.512",
        "collig-Kf": "1.86",
        "collig-solvent-bp": "100",
        "collig-solvent-fp": "0",
        "collig-Psolvent": "0.0313",
    };
}

describe("solutionPureCoverage: Colligative pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "colligative-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("computes all effects and honors density, temp, solvent mass", () => {
        const full = pureCollig(colligBase());
        expect(full.explanation).toContain("Delta Tb");
        expect(full.explanation).toContain("Delta Tf");
        expect(full.explanation).toContain("Delta P");
        expect(full.metadata).toHaveProperty("deltaTb");
        expect(full.metadata).toHaveProperty("deltaTf");
        expect(full.metadata).toHaveProperty("deltaP");
        const custom = pureCollig(Object.assign(colligBase(), {
            "collig-density": "1.2",
            "collig-temp": "310",
            "collig-solvent-molar-mass": "46.07",
        }));
        expect(custom.explanation).toContain("1.2000");
        expect(custom.explanation).toContain("310");
    });

    it("rejects bad inputs", () => {
        const bad = colligBase();
        bad["collig-solute-mass"] = "";
        expect(pureCollig(bad).explanation).toContain("Error");
        const bad2 = colligBase();
        bad2["collig-solute-mass"] = "0";
        expect(pureCollig(bad2).explanation).toContain("Error");
        const bad3 = colligBase();
        bad3["collig-molar-mass"] = "0";
        expect(pureCollig(bad3).explanation).toContain("Error");
        const bad4 = colligBase();
        bad4["collig-solvent-mass"] = "0";
        expect(pureCollig(bad4).explanation).toContain("Error");
        const bad5 = colligBase();
        bad5["collig-vanthoff"] = "0";
        expect(pureCollig(bad5).explanation).toContain("Error");
        const bad6 = colligBase();
        bad6["collig-density"] = "0";
        expect(pureCollig(bad6).explanation).toContain("Error");
        const bad7 = colligBase();
        bad7["collig-temp"] = "0";
        expect(pureCollig(bad7).explanation).toContain("Error");
        const bad8 = colligBase();
        bad8["collig-solvent-molar-mass"] = "0";
        expect(pureCollig(bad8).explanation).toContain("Error");
    });
});

function pureTitration(acidType: string, vals: Record<string, string>) {
    return new TitrationCurveCalculator().calculatePure(Object.assign(
        {"titration-acid-type": acidType}, vals));
}

function titrationBase(): Record<string, string> {
    return {
        "titration-acid-conc": "0.1",
        "titration-acid-vol": "25",
        "titration-base-conc": "0.1",
        "titration-max-vol": "50",
        "titration-Ka": "0.000018",
    };
}

describe("solutionPureCoverage: Titration pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "titration-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("renders strong and weak curves", () => {
        expect(pureTitration("strong", titrationBase()).value).toContain("Equivalence Point");
        const weak = pureTitration("weak", titrationBase());
        expect(weak.explanation).toContain("Half-Equivalence Point");
        expect(weak.metadata).toHaveProperty("dataPointCount", 51);
    });

    it("rejects bad inputs", () => {
        const noKa = titrationBase();
        noKa["titration-Ka"] = "";
        expect(pureTitration("weak", noKa).explanation).toContain("Error");
        for (const key of ["titration-acid-conc", "titration-acid-vol", "titration-base-conc", "titration-max-vol"]) {
            const bad = titrationBase();
            bad[key] = "";
            expect(pureTitration("strong", bad).explanation).toContain("Error");
            const zero = titrationBase();
            zero[key] = "0";
            expect(pureTitration("strong", zero).explanation).toContain("Error");
        }
    });
});

function pureDH(zplus: string, zminus: string, c: string, a: string) {
    return new DebyeHuckelCalculator().calculatePure({
        "dh-zplus": zplus,
        "dh-zminus": zminus,
        "dh-concentration": c,
        "dh-ion-size": a,
    });
}

describe("solutionPureCoverage: DebyeHuckel pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "debye-huckel-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("computes 1:1 and multivalent salts", () => {
        const one = pureDH("1", "1", "0.01", "9");
        expect(one.value).toContain("I = ");
        const multi = pureDH("2", "1", "0.001", "8");
        expect(multi.value).toContain("I = ");
        expect(multi.metadata).toHaveProperty("nuPlus", 1);
        expect(multi.metadata).toHaveProperty("nuMinus", 2);
    });

    it("rejects bad inputs", () => {
        expect(pureDH("", "1", "0.01", "9").explanation).toContain("Error");
        expect(pureDH("0", "1", "0.01", "9").explanation).toContain("Error");
        expect(pureDH("1.5", "1", "0.01", "9").explanation).toContain("Error");
        expect(pureDH("1", "1", "0", "9").explanation).toContain("Error");
        expect(pureDH("1", "1", "0.01", "0").explanation).toContain("Error");
    });
});

function pureCommon(salt: string, ksp: string, c: string) {
    return new CommonIonEffectCalculator().calculatePure({
        "common-ion-salt-type": salt,
        "common-ion-Ksp": ksp,
        "common-ion-concentration": c,
    });
}

describe("solutionPureCoverage: CommonIon pure branches", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "common-ion-result";
        document.body.appendChild(result);
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers every salt type and warns on breakdown", () => {
        for (const salt of ["AB", "AB2", "A2B", "AB3", "A3B"]) {
            expect(pureCommon(salt, "1.8e-10", "0.1").explanation).toContain("Solubility Ratio");
        }
        expect(pureCommon("bogus", "1.8e-10", "0.1").explanation).toContain("Error");
        const warn = pureCommon("AB", "1e-4", "0.001");
        expect(warn.explanation).toContain("WARNING");
        expect(warn.metadata).toHaveProperty("approxValid", false);
        const ok = pureCommon("AB", "1.8e-10", "0.1");
        expect(ok.metadata).toHaveProperty("approxValid", true);
    });

    it("rejects bad inputs", () => {
        expect(pureCommon("AB", "", "0.1").explanation).toContain("Error");
        expect(pureCommon("AB", "0", "0.1").explanation).toContain("Error");
        expect(pureCommon("AB", "1.8e-10", "").explanation).toContain("Error");
        expect(pureCommon("AB", "1.8e-10", "0").explanation).toContain("Error");
    });
});
