// @vitest-environment jsdom
import {describe, it, expect, afterEach} from "vitest";
import {
    QuantumNumbersValidator,
    ElectronConfigurationGenerator,
    RydbergCalculator,
    DeBroglieWavelengthCalculator,
    PhotoelectricEffectCalculator,
    HeisenbergUncertaintyCalculator,
} from "./quantumCalculators.js";
import {compareSubshellParts} from "./calculators/quantum.js";
import type {PureCalculator} from "./calculators/pureCalculator.js";

describe("quantumCoverage: subshell comparator", () => {
    const cmp = compareSubshellParts;

    it("orders by n then subshell", () => {
        expect(cmp("1s2", "2s2")).toBeLessThan(0);
        expect(cmp("2s2", "1s2")).toBeGreaterThan(0);
        expect(cmp("2s2", "2p6")).toBeLessThan(0);
        expect(cmp("2p6", "2s2")).toBeGreaterThan(0);
        expect(cmp("3d6", "3p6")).toBeGreaterThan(0);
        expect(cmp("4f14", "4d10")).toBeGreaterThan(0);
        expect(cmp("2s2", "2s2")).toBe(0);
    });
});

describe("quantumCoverage: calculator ids", () => {
    it("reports the stable id of every calculator to the history sink", () => {
        let cases: { calculator: PureCalculator; inputs: Record<string, string> }[] = [
            {"calculator": new QuantumNumbersValidator(), "inputs": {"qn-n": "2", "qn-l": "1", "qn-ml": "0", "qn-ms": "0.5"}},
            {"calculator": new ElectronConfigurationGenerator(), "inputs": {"ec-atomic-number": "26"}},
            {"calculator": new RydbergCalculator(), "inputs": {"rydberg-n1": "2", "rydberg-n2": "3"}},
            {"calculator": new DeBroglieWavelengthCalculator(), "inputs": {"db-mass": "9.109e-31", "db-velocity": "1e6", "db-mass-unit": "kg"}},
            {"calculator": new PhotoelectricEffectCalculator(), "inputs": {"pe-solve-for": "KE", "pe-wavelength": "400", "pe-frequency": "", "pe-work-function": "2.3", "pe-ke": ""}},
            {"calculator": new HeisenbergUncertaintyCalculator(), "inputs": {"heis-solve-for": "min-delta-p", "heis-delta-x": "1e-10", "heis-delta-p": "", "heis-mass": ""}}
        ];
        let ids: string[] = [];
        for (let i = 0; i < cases.length; i++) {
            cases[i].calculator.setHistorySink({
                "addToHistory": function (calculatorId: string): void {
                    ids.push(calculatorId);
                }
            });
            expect(cases[i].calculator.calculatePure(cases[i].inputs).value).not.toBe("");
        }
        expect(ids).toEqual(["quantum-numbers", "electron-config", "rydberg", "debroglie", "photoelectric", "heisenberg"]);
    });
});

describe("quantumCoverage: gap closure", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers g-subshell fallback and negative spin", () => {
        setup("quantum-numbers-result");
        expect(new QuantumNumbersValidator().calculatePure({"qn-n": "5", "qn-l": "4", "qn-ml": "0", "qn-ms": "0.5"}).value).toContain("Valid");
        setup("quantum-numbers-result");
        expect(new QuantumNumbersValidator().calculatePure({"qn-n": "2", "qn-l": "1", "qn-ml": "0", "qn-ms": "-0.5"}).explanation).toContain("-1/2");
    });

    it("covers f-block lanthanides", () => {
        setup("electron-config-result");
        expect(new ElectronConfigurationGenerator().calculatePure({"ec-atomic-number": "60"}).value).toContain("4f");
    });

    it("covers Rydberg n2 invalid and n1 series", () => {
        setup("rydberg-result");
        expect(new RydbergCalculator().calculatePure({"rydberg-n1": "1", "rydberg-n2": "0"}).explanation).toContain("Error");
        setup("rydberg-result");
        expect(new RydbergCalculator().calculatePure({"rydberg-n1": "5", "rydberg-n2": "6"}).value).not.toBe("");
        setup("rydberg-result");
        expect(new RydbergCalculator().calculatePure({"rydberg-n1": "6", "rydberg-n2": "7"}).value).not.toBe("");
    });

    it("covers DeBroglie unit fallback and ranges", () => {
        setup("debroglie-result");
        expect(new DeBroglieWavelengthCalculator().calculatePure({"db-mass": "9.11e-31", "db-velocity": "1e6"}).value).not.toBe("");
        setup("debroglie-result");
        expect(new DeBroglieWavelengthCalculator().calculatePure({"db-mass": "1", "db-velocity": "1e6", "db-mass-unit": "kg"}).value).toContain("m");
        setup("debroglie-result");
        expect(new DeBroglieWavelengthCalculator().calculatePure({"db-mass": "9.11e-31", "db-velocity": "70", "db-mass-unit": "kg"}).value).toContain("m");
    });

    it("covers Photoelectric wavelength/work/ke validation", () => {
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "KE", "pe-wavelength": "0", "pe-frequency": "", "pe-work-function": "2.3", "pe-ke": ""}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "KE", "pe-wavelength": "", "pe-frequency": "", "pe-work-function": "2.3", "pe-ke": ""}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "KE", "pe-wavelength": "400", "pe-frequency": "", "pe-work-function": "-1", "pe-ke": ""}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "work-function", "pe-wavelength": "0", "pe-frequency": "", "pe-work-function": "", "pe-ke": "1"}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "work-function", "pe-wavelength": "", "pe-frequency": "", "pe-work-function": "", "pe-ke": ""}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "work-function", "pe-wavelength": "400", "pe-frequency": "", "pe-work-function": "", "pe-ke": "-1"}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "wavelength", "pe-wavelength": "", "pe-frequency": "", "pe-work-function": "", "pe-ke": "1"}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({"pe-solve-for": "wavelength", "pe-wavelength": "", "pe-frequency": "", "pe-work-function": "0", "pe-ke": "0"}).explanation).toContain("Error");
    });

    it("covers Heisenberg mass and delta validation", () => {
        setup("heisenberg-result");
        expect(new HeisenbergUncertaintyCalculator().calculatePure({"heis-solve-for": "min-delta-x", "heis-delta-x": "", "heis-delta-p": "1e-24", "heis-mass": "9.11e-31"}).value).not.toBe("");
        setup("heisenberg-result");
        expect(new HeisenbergUncertaintyCalculator().calculatePure({"heis-solve-for": "min-delta-p", "heis-delta-x": "", "heis-delta-p": "1e-24", "heis-mass": ""}).explanation).toContain("Error");
        setup("heisenberg-result");
        expect(new HeisenbergUncertaintyCalculator().calculatePure({"heis-solve-for": "min-delta-p", "heis-delta-x": "1e-10", "heis-delta-p": "", "heis-mass": "9.11e-31"}).value).not.toBe("");
    });
});

function setup(id: string): void {
    document.body.innerHTML = "";
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
}

describe("quantumCoverage: pure missing-key fallbacks", () => {    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers ?? fallbacks with empty input records", () => {
        setup("quantum-numbers-result");
        expect(new QuantumNumbersValidator().calculatePure({}).explanation).toContain("Error");
        setup("electron-config-result");
        expect(new ElectronConfigurationGenerator().calculatePure({}).explanation).toContain("Error");
        setup("rydberg-result");
        expect(new RydbergCalculator().calculatePure({}).explanation).toContain("Error");
        setup("debroglie-result");
        expect(new DeBroglieWavelengthCalculator().calculatePure({}).explanation).toContain("Error");
        setup("photoelectric-result");
        expect(new PhotoelectricEffectCalculator().calculatePure({}).explanation).toContain("Error");
        setup("heisenberg-result");
        expect(new HeisenbergUncertaintyCalculator().calculatePure({}).explanation).toContain("Error");
    });
});

describe("quantumCoverage: QuantumNumbers pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(n: string, l: string, ml: string, ms: string) {
        setup("quantum-numbers-result");
        return new QuantumNumbersValidator().calculatePure({"qn-n": n, "qn-l": l, "qn-ml": ml, "qn-ms": ms});
    }

    it("rejects non-integer, out-of-range, and bad spin", () => {
        expect(pure("2.5", "1", "0", "0.5").value).toContain("Invalid");
        expect(pure("0", "0", "0", "0.5").value).toContain("Invalid");
        expect(pure("2", "2", "0", "0.5").value).toContain("Invalid");
        expect(pure("2", "1", "2", "0.5").value).toContain("Invalid");
        expect(pure("2", "1", "0", "1").value).toContain("Invalid");
        expect(pure("2", "1", "0", "0.5").value).toContain("Valid");
    });
});

describe("quantumCoverage: ElectronConfig pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(z: string) {
        setup("electron-config-result");
        return new ElectronConfigurationGenerator().calculatePure({"ec-atomic-number": z});
    }

    it("rejects missing, zero, negative, and huge atomic numbers", () => {
        expect(pure("").explanation).toContain("Error");
        expect(pure("0").explanation).toContain("Error");
        expect(pure("-1").explanation).toContain("Error");
        expect(pure("200").explanation).toContain("Error");
        expect(pure("26").value).toContain("3d6");
    });

    it("covers anomalies and noble gases", () => {
        for (const z of ["24", "29", "41", "42", "44", "45", "46", "47", "78", "79"]) {
            setup("electron-config-result");
            const r = new ElectronConfigurationGenerator().calculatePure({"ec-atomic-number": z});
            expect(r.value).not.toBe("");
        }
        setup("electron-config-result");
        expect(new ElectronConfigurationGenerator().calculatePure({"ec-atomic-number": "2"}).value).toContain("1s2");
        setup("electron-config-result");
        expect(new ElectronConfigurationGenerator().calculatePure({"ec-atomic-number": "10"}).value).toContain("2p6");
    });
});

describe("quantumCoverage: Rydberg pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(n1: string, n2: string) {
        setup("rydberg-result");
        return new RydbergCalculator().calculatePure({"rydberg-n1": n1, "rydberg-n2": n2});
    }

    it("rejects missing, zero, negative, and inverted levels", () => {
        expect(pure("", "3").explanation).toContain("Error");
        expect(pure("0", "3").explanation).toContain("Error");
        expect(pure("-1", "3").explanation).toContain("Error");
        expect(pure("3", "2").explanation).toContain("Error");
        expect(pure("2", "2").explanation).toContain("Error");
        expect(pure("1", "2").value).not.toBe("");
    });
});

describe("quantumCoverage: DeBroglie pure validation", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(mass: string, velocity: string, unit = "kg") {
        setup("debroglie-result");
        return new DeBroglieWavelengthCalculator().calculatePure({"db-mass": mass, "db-velocity": velocity, "db-mass-unit": unit});
    }

    it("rejects missing, zero, and negative inputs", () => {
        expect(pure("", "1e6").explanation).toContain("Error");
        expect(pure("9.11e-31", "").explanation).toContain("Error");
        expect(pure("0", "1e6").explanation).toContain("Error");
        expect(pure("9.11e-31", "0").explanation).toContain("Error");
        expect(pure("-1", "1e6").explanation).toContain("Error");
        expect(pure("9.11e-31", "1e6").value).not.toBe("");
    });

    it("handles g, amu, and invalid units", () => {
        expect(pure("9.11e-28", "1e6", "g").value).not.toBe("");
        expect(pure("9.11e-31", "1e6", "amu").value).not.toBe("");
        setup("debroglie-result");
        expect(new DeBroglieWavelengthCalculator().calculatePure({"db-mass": "9.11e-31", "db-velocity": "1e6", "db-mass-unit": "bogus"}).explanation).toContain("Error");
    });

    it("covers meter-scale wavelengths", () => {
        expect(pure("9.11e-31", "0.07", "kg").value).toContain("m");
    });
});

describe("quantumCoverage: Photoelectric pure branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(solveFor: string, wavelength: string, freq: string, work: string, ke: string) {
        setup("photoelectric-result");
        return new PhotoelectricEffectCalculator().calculatePure({
            "pe-solve-for": solveFor,
            "pe-wavelength": wavelength,
            "pe-frequency": freq,
            "pe-work-function": work,
            "pe-ke": ke,
        });
    }

    it("solves each variable and rejects bad solveFor", () => {
        expect(pure("KE", "400", "", "2.3", "").value).toContain("eV");
        expect(pure("threshold-frequency", "", "", "2.3", "").value).toContain("Hz");
        expect(pure("work-function", "400", "", "", "1").value).toContain("eV");
        expect(pure("wavelength", "", "", "2.3", "1").value).toContain("nm");
        expect(pure("bogus", "400", "", "2.3", "").explanation).toContain("Error");
    });

    it("rejects missing and non-positive inputs", () => {
        expect(pure("KE", "", "", "2.3", "").explanation).toContain("Error");
        expect(pure("KE", "400", "", "-1", "").explanation).toContain("Error");
        expect(pure("KE", "400", "", "", "").explanation).toContain("Error");
        expect(pure("KE", "", "0", "2.3", "").explanation).toContain("Error");
        expect(pure("threshold-frequency", "", "", "", "").explanation).toContain("Error");
        expect(pure("threshold-frequency", "", "", "-1", "").explanation).toContain("Error");
        expect(pure("work-function", "", "", "", "").explanation).toContain("Error");
        expect(pure("work-function", "400", "", "", "-1").explanation).toContain("Error");
        expect(pure("work-function", "400", "", "", "").explanation).toContain("Error");
        expect(pure("wavelength", "", "", "2.3", "").explanation).toContain("Error");
        expect(pure("wavelength", "", "", "2.3", "-1").explanation).toContain("Error");
    });
});

describe("quantumCoverage: Heisenberg pure branches", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    function pure(solveFor: string, dx: string, dp: string) {
        setup("heisenberg-result");
        return new HeisenbergUncertaintyCalculator().calculatePure({
            "heis-solve-for": solveFor,
            "heis-delta-x": dx,
            "heis-delta-p": dp,
            "heis-mass": "",
        });
    }

    it("solves each variable and rejects bad solveFor", () => {
        expect(pure("min-delta-x", "", "1e-24").value).not.toBe("");
        expect(pure("min-delta-p", "1e-10", "").value).not.toBe("");
        expect(pure("bogus", "1e-10", "1e-24").explanation).toContain("Error");
    });

    it("rejects missing and non-positive inputs", () => {
        expect(pure("min-delta-x", "", "").explanation).toContain("Error");
        expect(pure("min-delta-x", "", "0").explanation).toContain("Error");
        expect(pure("min-delta-p", "0", "").explanation).toContain("Error");
    });
});
