import {describe, it, expect, afterEach} from "vitest";
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

    it("pure solves V in atm-L with explicit litres and cubic metres, and in SI", () => {
        expect(idealPure("V", "atm-L", "1", "", "1", "273", "L").value).toContain("L");
        expect(idealPure("V", "atm-L", "1", "", "1", "273", "m³").value).toContain("m³");
        const si = idealPure("V", "SI", "101325", "", "1", "273", "L");
        expect(si.value).toContain("L");
    });

    it("pure solves n and T in SI units", () => {
        expect(idealPure("n", "SI", "101325", "0.0224", "", "273", "m³").value).toContain("mol");
        expect(idealPure("T", "SI", "101325", "0.0224", "1", "", "m³").value).toContain("K");
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

    it("DOM and pure reject bad half-life inputs per branch", () => {        function halfDom(solveFor: string, vals: Record<string, string>): void {
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

describe("gasLaw coverage: per-operand validation branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("DOM solves P in atm-L with cubic metres", () => {
        idealDom("P", "atm-L", "", "0.0224", "1", "273", "m³");
        calculateIdealGasLaw();
        const text = getResultText("ideal-result");
        expect(text).toContain("atm");
    });

    it("DOM solves V in atm-L with explicit litres and cubic metres", () => {
        idealDom("V", "atm-L", "1", "", "1", "273", "L");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("L");
        idealDom("V", "atm-L", "1", "", "1", "273", "m³");
        calculateIdealGasLaw();
        expect(getResultText("ideal-result")).toContain("m³");
    });

    it("DOM reports the second zero divisor per combined branch", () => {
        combinedDom("P1", {"combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "0"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("V1", {"combined-P1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "0"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("T1", {"combined-P1": "1", "combined-V1": "1", "combined-P2": "1", "combined-V2": "0", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("P2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "0", "combined-V2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("V2", {"combined-P1": "1", "combined-V1": "1", "combined-T1": "0", "combined-P2": "1", "combined-T2": "273"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
        combinedDom("T2", {"combined-P1": "1", "combined-V1": "0", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1"});
        calculateCombinedGasLaw();
        expect(getResultText("combined-result")).toContain("Error");
    });

    it("pure reports each missing operand per combined branch", () => {
        const full: Record<string, string> = {"combined-P1": "1", "combined-V1": "1", "combined-T1": "273", "combined-P2": "1", "combined-V2": "1", "combined-T2": "273"};
        const needed: Record<string, string[]> = {
            "P1": ["combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"],
            "V1": ["combined-P1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"],
            "T1": ["combined-P1", "combined-V1", "combined-P2", "combined-V2", "combined-T2"],
            "P2": ["combined-P1", "combined-V1", "combined-T1", "combined-V2", "combined-T2"],
            "V2": ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-T2"],
            "T2": ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2"],
        };
        for (const solveFor of Object.keys(needed)) {
            const ids = needed[solveFor];
            const none: Record<string, string> = {};
            expect(combinedPure(solveFor, none).explanation).toContain("Error");
            for (const missing of ids) {
                const vals: Record<string, string> = {};
                for (const id of ids) {
                    vals[id] = id === missing ? "" : full[id];
                }
                expect(combinedPure(solveFor, vals).explanation).toContain("Error");
            }
        }
    });

    it("pure reports each missing operand per ideal branch", () => {
        const needed: Record<string, string[]> = {
            "P": ["ideal-V", "ideal-n", "ideal-T"],
            "V": ["ideal-P", "ideal-n", "ideal-T"],
            "n": ["ideal-P", "ideal-V", "ideal-T"],
            "T": ["ideal-P", "ideal-V", "ideal-n"],
        };
        for (const solveFor of Object.keys(needed)) {
            const ids = needed[solveFor];
            expect(idealPure(solveFor, "atm-L", "", "", "", "").explanation).toContain("Error");
            const idToArg: Record<string, string> = {"ideal-P": "P", "ideal-V": "V", "ideal-n": "n", "ideal-T": "T"};
            for (const missing of ids) {
                const vals: Record<string, string> = {P: "1", V: "22.4", n: "1", T: "273"};
                vals[idToArg[missing]] = "";
                expect(idealPure(solveFor, "atm-L", vals.P, vals.V, vals.n, vals.T).explanation).toContain("Error");
            }
        }
    });

    it("pure handles absent input objects", () => {
        expect(idealPure("P", "atm-L", "", "", "", "").explanation).toContain("Error");
        const empty = new IdealGasLawCalculator().calculatePure({});
        expect(empty.explanation).toContain("Error");
        expect(new CombinedGasLawCalculator().calculatePure({}).explanation).toContain("Error");
        expect(new VanDerWaalsCalculator().calculatePure({}).explanation).toContain("Error");
        expect(new HalfLifeCalculator().calculatePure({}).explanation).toContain("Error");
    });

    it("pure solves half-life time and half-life branches", () => {
        const calc = new HalfLifeCalculator();
        const t = calc.calculatePure({
            "half-life-solve-for": "time",
            "initial-quantity": "100",
            "time-input": "",
            "half-life-input": "5",
            "remaining-quantity": "25"
        });
        expect(t.value).toContain("Time needed:");
        const h = calc.calculatePure({
            "half-life-solve-for": "half-life",
            "initial-quantity": "100",
            "time-input": "10",
            "half-life-input": "",
            "remaining-quantity": "25"
        });
        expect(h.value).toContain("Half-life:");
    });

    it("pure reports each missing VdW operand", () => {
        const full: Record<string, string> = {"vdw-V": "22.4", "vdw-n": "1", "vdw-T": "273", "vdw-a": "1", "vdw-b": "0.01"};
        expect(vdwPure({}).explanation).toContain("Error");
        for (const missing of Object.keys(full)) {
            const vals: Record<string, string> = {};
            for (const id of Object.keys(full)) {
                vals[id] = id === missing ? "" : full[id];
            }
            expect(vdwPure(vals).explanation).toContain("Error");
        }
    });

    it("pure rejects V equal to n*b", () => {
        expect(vdwPure({"vdw-V": "0.01", "vdw-n": "1", "vdw-T": "273", "vdw-a": "1", "vdw-b": "0.01"}).explanation).toContain("Error");
    });

    it("pure reports each missing half-life operand", () => {
        function halfPure(solveFor: string, vals: Record<string, string>) {
            const calc = new HalfLifeCalculator();
            const inputs: Record<string, string> = {"half-life-solve-for": solveFor};
            for (const id of ["initial-quantity", "time-input", "half-life-input", "remaining-quantity"]) {
                inputs[id] = vals[id] ?? "";
            }
            return calc.calculatePure(inputs);
        }
        const groups: Record<string, string[]> = {
            "remaining": ["initial-quantity", "time-input", "half-life-input"],
            "time": ["initial-quantity", "half-life-input", "remaining-quantity"],
            "half-life": ["initial-quantity", "time-input", "remaining-quantity"],
        };
        const full: Record<string, string> = {"initial-quantity": "100", "time-input": "10", "half-life-input": "5", "remaining-quantity": "25"};
        for (const solveFor of Object.keys(groups)) {
            expect(halfPure(solveFor, {}).explanation).toContain("Error");
            for (const missing of groups[solveFor]) {
                const vals: Record<string, string> = {};
                for (const id of groups[solveFor]) {
                    vals[id] = id === missing ? "" : full[id];
                }
                expect(halfPure(solveFor, vals).explanation).toContain("Error");
            }
        }
    });
});
