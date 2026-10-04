import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
    calculateIdealGasLaw,
    calculateCombinedGasLaw,
    calculateVanDerWaals,
    calculateHalfLife,
    IdealGasLawCalculator,
    CombinedGasLawCalculator,
    VanDerWaalsCalculator,
    HalfLifeCalculator,
} from "./gasLawCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

function idealDom(solveFor: string, units: string, P: string, V: string, n: string, T: string, volUnit?: string): void {
    document.body.innerHTML = "";
    createContainer("ideal-gas-law");
    createResultDiv("ideal-result", "ideal-gas-law");
    createSelect("ideal-solve-for", solveFor, ["P", "V", "n", "T", "bogus"], "ideal-gas-law");
    createSelect("ideal-R-units", units, ["atm-L", "SI", "bogus"], "ideal-gas-law");
    createInput("ideal-P", P, "ideal-gas-law");
    createInput("ideal-V", V, "ideal-gas-law");
    createInput("ideal-n", n, "ideal-gas-law");
    createInput("ideal-T", T, "ideal-gas-law");
    if (volUnit !== undefined) {
        createSelect("ideal-volume-unit", volUnit, ["L", "m³", "gal"], "ideal-gas-law");
    }
}

function idealPure(solveFor: string, units: string, P: string, V: string, n: string, T: string, volUnit?: string) {
    const calc = new IdealGasLawCalculator();
    const inputs: Record<string, string> = {
        "ideal-solve-for": solveFor,
        "ideal-R-units": units,
        "ideal-P": P,
        "ideal-V": V,
        "ideal-n": n,
        "ideal-T": T,
    };
    if (volUnit !== undefined) {
        inputs["ideal-volume-unit"] = volUnit;
    }
    return calc.calculatePure(inputs);
}

describe("gasLaw coverage: ideal SI and volume units", () => {
    afterEach(() => {
        document.body.innerHTML = "";
        (IdealGasLawCalculator as unknown as {defaultsApplied: boolean}).defaultsApplied = false;
    });

    it("applyDefaults fills empty T and P", () => {
        document.body.innerHTML = "";
        const t = document.createElement("input");
        t.id = "ideal-T";
        const p = document.createElement("input");
        p.id = "ideal-P";
        document.body.appendChild(t);
        document.body.appendChild(p);
        IdealGasLawCalculator.applyDefaults();
        expect(t.value).toBe("298.15");
        expect(p.value).toBe("1");
    });

    it("applyDefaults leaves prefilled values and runs once", () => {
        document.body.innerHTML = "";
        const t = document.createElement("input");
        t.id = "ideal-T";
        t.value = "300";
        const p = document.createElement("input");
        p.id = "ideal-P";
        document.body.appendChild(t);
        document.body.appendChild(p);
        IdealGasLawCalculator.applyDefaults();
        expect(t.value).toBe("300");
        expect(p.value).toBe("1");
        t.value = "";
        IdealGasLawCalculator.applyDefaults();
        expect(t.value).toBe("");
    });

    it("applyDefaults tolerates missing elements", () => {
        document.body.innerHTML = "";
        expect(function(){ IdealGasLawCalculator.applyDefaults(); }).not.toThrow();
    });

    it("DOM solves P in SI with cubic metres", () => {
        idealDom("P", "SI", "", "0.0224", "1", "273", "m³");
        calculateIdealGasLaw();
        const text = getResultText("ideal-result");
        expect(text).toContain("Pa");
    });

    it("DOM solves P in SI with litres", () => {
        idealDom("P", "SI", "", "22.4", "1", "273", "L");
        calculateIdealGasLaw();
        const text = getResultText("ideal-result");
        expect(text).toContain("Pa");
    });

    it("DOM defaults volume unit when the select is absent", () => {
        idealDom("V", "SI", "101325", "", "1", "273");
        calculateIdealGasLaw();
        const text = getResultText("ideal-result");
        expect(text).toContain("m³");
    });

    it("DOM rejects an invalid volume unit", () => {
        idealDom("P", "atm-L", "", "22.4", "1", "273", "gal");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("Error");
    });

    it("DOM reports zero volume, zero pressure, zero moles", () => {
        idealDom("P", "atm-L", "", "0", "1", "273");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("zero");
        idealDom("V", "atm-L", "0", "", "1", "273");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("zero");
        idealDom("n", "atm-L", "1", "22.4", "", "0");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("zero");
        idealDom("T", "atm-L", "1", "22.4", "0", "");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("zero");
    });

    it("DOM rejects an invalid solveFor", () => {
        idealDom("bogus", "atm-L", "1", "22.4", "1", "273");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("Error");
    });

    it("DOM labels n in mol and T in K", () => {
        idealDom("n", "atm-L", "1", "22.4", "", "273");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("mol");
        idealDom("T", "atm-L", "1", "22.4", "1", "");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("K");
    });

    it("pure solves P in SI with cubic metres", () => {
        const r = idealPure("P", "SI", "", "0.0224", "1", "273", "m³");
        expect(r.value).toContain("Pa");
    });

    it("pure solves P in SI with litres", () => {
        const r = idealPure("P", "SI", "", "22.4", "1", "273", "L");
        expect(r.value).toContain("Pa");
    });

    it("pure defaults volume unit when absent", () => {
        const r = idealPure("V", "SI", "101325", "", "1", "273");
        expect(r.value).toContain("m³");
    });

    it("pure rejects an invalid volume unit", () => {
        const r = idealPure("P", "atm-L", "", "22.4", "1", "273", "gal");
        expect(r.explanation).toContain("Error");
    });

    it("pure reports zero divisors and bad solveFor", () => {
        expect(idealPure("P", "atm-L", "", "0", "1", "273").explanation).toContain("Error");
        expect(idealPure("V", "atm-L", "0", "", "1", "273").explanation).toContain("Error");
        expect(idealPure("n", "atm-L", "1", "22.4", "", "0").explanation).toContain("Error");
        expect(idealPure("T", "atm-L", "1", "22.4", "0", "").explanation).toContain("Error");
        expect(idealPure("bogus", "atm-L", "1", "22.4", "1", "273").explanation).toContain("Error");
    });

    it("pure labels V with the volume unit, n in mol, T in K", () => {
        expect(idealPure("V", "atm-L", "1", "", "1", "273", "L").value).toContain("L");
        expect(idealPure("n", "atm-L", "1", "22.4", "", "273").value).toContain("mol");
        expect(idealPure("T", "atm-L", "1", "22.4", "1", "").value).toContain("K");
    });

    it("pure reports missing inputs per branch", () => {
        expect(idealPure("P", "atm-L", "", "", "1", "273").explanation).toContain("Error");
        expect(idealPure("V", "atm-L", "", "", "1", "273").explanation).toContain("Error");
        expect(idealPure("n", "atm-L", "", "22.4", "", "273").explanation).toContain("Error");
        expect(idealPure("T", "atm-L", "", "22.4", "1", "").explanation).toContain("Error");
    });
});

function combinedDom(solveFor: string, vals: Record<string, string>): void {
    document.body.innerHTML = "";
    createContainer("combined-gas-law");
    createResultDiv("combined-result", "combined-gas-law");
    createSelect("combined-solve-for", solveFor, ["P1", "V1", "T1", "P2", "V2", "T2", "bogus"], "combined-gas-law");
    for (const id of ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]) {
        createInput(id, vals[id] ?? "", "combined-gas-law");
    }
}

function combinedPure(solveFor: string, vals: Record<string, string>) {
    const calc = new CombinedGasLawCalculator();
    const inputs: Record<string, string> = {"combined-solve-for": solveFor};
    for (const id of ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]) {
        inputs[id] = vals[id] ?? "";
    }
    return calc.calculatePure(inputs);
}

describe("gasLaw coverage: combined branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("DOM solves every variable and units", () => {
        combinedDom("P1", {"combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("pressure units");
        combinedDom("V1", {"combined-P1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("volume units");
        combinedDom("T1", {"combined-P1": "1", "combined-V1": "1", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("K");
        combinedDom("P2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("pressure units");
        combinedDom("V2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("volume units");
    });

    it("DOM reports zero divisors per branch and bad solveFor", () => {
        combinedDom("P1", {"combined-V1": "0", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("V1", {"combined-P1": "0", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("T1", {"combined-P1": "1", "combined-V1": "1", "combined-P2": "0", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("P2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-V2": "0", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("V2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "0", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("T2", {"combined-P1": "0", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("bogus", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
    });

    it("pure solves every variable and units", () => {
        expect(combinedPure("P1", {"combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"}).value).toContain("pressure units");
        expect(combinedPure("V1", {"combined-P1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"}).value).toContain("volume units");
        expect(combinedPure("T1", {"combined-P1": "1", "combined-V1": "1", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"}).value).toContain("K");
        expect(combinedPure("P2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-V2": "1", "combined-T2": "273"}).value).toContain("pressure units");
        expect(combinedPure("V2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-T2": "273"}).value).toContain("volume units");
        expect(combinedPure("T2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "2", "combined-V2": "1"}).value).toContain("K");
    });

    it("pure reports zero divisors, bad solveFor, and missing inputs", () => {
        expect(combinedPure("P1", {"combined-V1": "0", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"}).explanation).toContain("Error");
        expect(combinedPure("V1", {"combined-P1": "0", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"}).explanation).toContain("Error");
        expect(combinedPure("T1", {"combined-P1": "1", "combined-V1": "1", "combined-P2": "0", "combined-V2": "1", "combined-T2": "273"}).explanation).toContain("Error");
        expect(combinedPure("P2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-V2": "0", "combined-T2": "273"}).explanation).toContain("Error");
        expect(combinedPure("V2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "0", "combined-T2": "273"}).explanation).toContain("Error");
        expect(combinedPure("T2", {"combined-P1": "0", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1"}).explanation).toContain("Error");
        expect(combinedPure("bogus", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"}).explanation).toContain("Error");
        expect(combinedPure("P1", {}).explanation).toContain("Error");
    });
});

function vdwDom(vals: Record<string, string>): void {
    document.body.innerHTML = "";
    createContainer("van-der-waals");
    createResultDiv("vdw-result", "van-der-waals");
    for (const id of ["vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"]) {
        createInput(id, vals[id] ?? "", "van-der-waals");
    }
}

function vdwPure(vals: Record<string, string>) {
    return new VanDerWaalsCalculator().calculatePure(vals);
}

describe("gasLaw coverage: VdW and half-life validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("DOM and pure reject bad VdW inputs", () => {
        const bad: Record<string, string>[] = [
            {"vdw-V": "", "vdw-n": "1", "vdw-T": "273", "vdw-a": "1", "vdw-b": "0.01"},
            {"vdw-V": "1", "vdw-n": "0", "vdw-T": "273", "vdw-a": "1", "vdw-b": "0.01"},
            {"vdw-V": "1", "vdw-n": "1", "vdw-T": "0", "vdw-a": "1", "vdw-b": "0.01"},
            {"vdw-V": "1", "vdw-n": "1", "vdw-T": "273", "vdw-a": "-1", "vdw-b": "0.01"},
            {"vdw-V": "1", "vdw-n": "1", "vdw-T": "273", "vdw-a": "1", "vdw-b": "-0.01"},
        ];
        for (const vals of bad) {
            vdwDom(vals);
            calculateVanDerWaals();
            expect(getResultText("vdw-result")).toContain("Error");
            expect(vdwPure(vals).explanation).toContain("Error");
        }
    });

    it("DOM and pure reject bad half-life inputs per branch", () => {
        function halfDom(solveFor: string, vals: Record<string, string>): void {
            document.body.innerHTML = "";
            createContainer("half-life-calc");
            createResultDiv("half-life-result", "half-life-calc");
            createSelect("half-life-solve-for", solveFor, ["remaining", "time", "half-life", "bogus"], "half-life-calc");
            for (const id of ["initial-quantity", "time-input", "half-life-input", "remaining-quantity"]) {
                createInput(id, vals[id] ?? "", "half-life-calc");
            }
        }
        function halfPure(solveFor: string, vals: Record<string, string>) {
            const calc = new HalfLifeCalculator();
            const inputs: Record<string, string> = {"half-life-solve-for": solveFor};
            for (const id of ["initial-quantity", "time-input", "half-life-input", "remaining-quantity"]) {
                inputs[id] = vals[id] ?? "";
            }
            return calc.calculatePure(inputs);
        }
        const badRemaining: Record<string, string>[] = [
            {"initial-quantity": "", "time-input": "10", "half-life-input": "5", "remaining-quantity": ""},
            {"initial-quantity": "100", "time-input": "10", "half-life-input": "0", "remaining-quantity": ""},
            {"initial-quantity": "0", "time-input": "10", "half-life-input": "5", "remaining-quantity": ""},
            {"initial-quantity": "100", "time-input": "-1", "half-life-input": "5", "remaining-quantity": ""},
        ];
        for (const vals of badRemaining) {
            halfDom("remaining", vals);
            calculateHalfLife();
            expect(getResultText("half-life-result")).toContain("Error");
            expect(halfPure("remaining", vals).explanation).toContain("Error");
        }
        const badTime: Record<string, string>[] = [
            {"initial-quantity": "100", "time-input": "", "half-life-input": "0", "remaining-quantity": "25"},
            {"initial-quantity": "0", "time-input": "", "half-life-input": "5", "remaining-quantity": "25"},
            {"initial-quantity": "100", "time-input": "", "half-life-input": "5", "remaining-quantity": "0"},
            {"initial-quantity": "100", "time-input": "", "half-life-input": "5", "remaining-quantity": "100"},
        ];
        for (const vals of badTime) {
            halfDom("time", vals);
            calculateHalfLife();
            expect(getResultText("half-life-result")).toContain("Error");
            expect(halfPure("time", vals).explanation).toContain("Error");
        }
        const badHalf: Record<string, string>[] = [
            {"initial-quantity": "0", "time-input": "10", "half-life-input": "", "remaining-quantity": "25"},
            {"initial-quantity": "100", "time-input": "10", "half-life-input": "", "remaining-quantity": "0"},
            {"initial-quantity": "100", "time-input": "10", "half-life-input": "", "remaining-quantity": "100"},
            {"initial-quantity": "100", "time-input": "0", "half-life-input": "", "remaining-quantity": "25"},
        ];
        for (const vals of badHalf) {
            halfDom("half-life", vals);
            calculateHalfLife();
            expect(getResultText("half-life-result")).toContain("Error");
            expect(halfPure("half-life", vals).explanation).toContain("Error");
        }
        halfDom("bogus", {"initial-quantity": "100", "time-input": "10", "half-life-input": "5", "remaining-quantity": "25"});
        calculateHalfLife();
        expect(getResultText("half-life-result")).toContain("Error");
        expect(halfPure("bogus", {"initial-quantity": "100", "time-input": "10", "half-life-input": "5", "remaining-quantity": "25"}).explanation).toContain("Error");
    });
});
