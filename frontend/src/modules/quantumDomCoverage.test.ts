// @vitest-environment jsdom
import {describe, it, expect, afterEach} from "vitest";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";
import {
    calculateQuantumNumbers,
    calculateElectronConfiguration,
    calculateRydberg,
    calculateDeBroglie,
    calculatePhotoelectricEffect,
    calculateHeisenbergUncertainty,
} from "./quantumCalculators.js";

function qnDom(n: string, l: string, ml: string, ms: string): string {
    document.body.innerHTML = "";
    createContainer("quantum-numbers-section");
    createResultDiv("quantum-numbers-result", "quantum-numbers-section");
    createInput("qn-n", n, "quantum-numbers-section");
    createInput("qn-l", l, "quantum-numbers-section");
    createInput("qn-ml", ml, "quantum-numbers-section");
    createInput("qn-ms", ms, "quantum-numbers-section");
    calculateQuantumNumbers();
    return getResultText("quantum-numbers-result");
}

describe("quantumDomCoverage: QuantumNumbers DOM", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("validates and rejects bad quantum numbers", () => {
        expect(qnDom("2", "1", "0", "0.5")).toContain("Valid");
        expect(qnDom("2.5", "1", "0", "0.5")).toContain("ERROR");
        expect(qnDom("0", "0", "0", "0.5")).toContain("ERROR");
        expect(qnDom("2", "2", "0", "0.5")).toContain("ERROR");
        expect(qnDom("2", "1", "2", "0.5")).toContain("ERROR");
        expect(qnDom("2", "1", "0", "1")).toContain("ERROR");
    });
});

function ecDom(z: string): string {
    document.body.innerHTML = "";
    createContainer("electron-config-section");
    createResultDiv("electron-config-result", "electron-config-section");
    createInput("ec-atomic-number", z, "electron-config-section");
    calculateElectronConfiguration();
    return getResultText("electron-config-result");
}

describe("quantumDomCoverage: ElectronConfig DOM", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects bad atomic numbers", () => {
        expect(ecDom("26")).toContain("3d6");
        expect(ecDom("")).toContain("Error");
        expect(ecDom("0")).toContain("Error");
        expect(ecDom("-1")).toContain("Error");
        expect(ecDom("200")).toContain("Error");
    });
});

function rydDom(n1: string, n2: string): string {
    document.body.innerHTML = "";
    createContainer("rydberg-section");
    createResultDiv("rydberg-result", "rydberg-section");
    createInput("rydberg-n1", n1, "rydberg-section");
    createInput("rydberg-n2", n2, "rydberg-section");
    calculateRydberg();
    return getResultText("rydberg-result");
}

describe("quantumDomCoverage: Rydberg DOM", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects bad levels", () => {
        expect(rydDom("1", "2")).toContain("nm");
        expect(rydDom("", "3")).toContain("Error");
        expect(rydDom("0", "3")).toContain("Error");
        expect(rydDom("-1", "3")).toContain("Error");
        expect(rydDom("3", "2")).toContain("Error");
        expect(rydDom("2", "2")).toContain("Error");
    });
});

function dbDom(mass: string, velocity: string, unit = "kg"): string {
    document.body.innerHTML = "";
    createContainer("debroglie-section");
    createResultDiv("debroglie-result", "debroglie-section");
    createInput("db-mass", mass, "debroglie-section");
    createInput("db-velocity", velocity, "debroglie-section");
    createSelect("db-mass-unit", unit, ["kg", "g", "amu", "bogus"], "debroglie-section");
    calculateDeBroglie();
    return getResultText("debroglie-result");
}

describe("quantumDomCoverage: DeBroglie DOM", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("rejects bad mass/velocity and units", () => {
        expect(dbDom("9.11e-31", "1e6")).toContain("nm");
        expect(dbDom("", "1e6")).toContain("Error");
        expect(dbDom("9.11e-31", "")).toContain("Error");
        expect(dbDom("0", "1e6")).toContain("Error");
        expect(dbDom("9.11e-31", "0")).toContain("Error");
        expect(dbDom("-1", "1e6")).toContain("Error");
        expect(dbDom("9.11e-31", "1e6", "bogus")).toContain("Error");
        expect(dbDom("9.11e-28", "1e6", "g")).toContain("nm");
        expect(dbDom("1", "1e6", "amu")).toContain("m");
        expect(dbDom("9.11e-31", "0.07", "kg")).toContain("m");
    });
});

function peDom(solveFor: string, wavelength: string, freq: string, work: string, ke: string): string {
    document.body.innerHTML = "";
    createContainer("photoelectric-section");
    createResultDiv("photoelectric-result", "photoelectric-section");
    createSelect("pe-solve-for", solveFor, ["KE", "threshold-frequency", "work-function", "wavelength", "bogus"], "photoelectric-section");
    createInput("pe-wavelength", wavelength, "photoelectric-section");
    createInput("pe-frequency", freq, "photoelectric-section");
    createInput("pe-work-function", work, "photoelectric-section");
    createInput("pe-ke", ke, "photoelectric-section");
    calculatePhotoelectricEffect();
    return getResultText("photoelectric-result");
}

describe("quantumDomCoverage: Photoelectric DOM", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves each variable and rejects bad solveFor", () => {
        expect(peDom("KE", "400", "", "2.3", "")).toContain("eV");
        expect(peDom("threshold-frequency", "", "", "2.3", "").replace("Hz", "Hz")).toContain("Hz");
        expect(peDom("work-function", "400", "", "", "1")).toContain("eV");
        expect(peDom("wavelength", "", "", "2.3", "1")).toContain("nm");
        expect(peDom("bogus", "400", "", "2.3", "")).toContain("Error");
    });

    it("rejects bad inputs", () => {
        expect(peDom("KE", "", "", "2.3", "")).toContain("Error");
        expect(peDom("KE", "400", "", "", "")).toContain("Error");
        expect(peDom("KE", "400", "", "-1", "")).toContain("Error");
        expect(peDom("KE", "", "0", "2.3", "")).toContain("Error");
        expect(peDom("threshold-frequency", "", "", "", "")).toContain("Error");
        expect(peDom("threshold-frequency", "", "", "-1", "")).toContain("Error");
        expect(peDom("work-function", "", "", "", "")).toContain("Error");
        expect(peDom("work-function", "400", "", "", "-1")).toContain("Error");
        expect(peDom("work-function", "400", "", "", "")).toContain("Error");
        expect(peDom("wavelength", "", "", "2.3", "")).toContain("Error");
        expect(peDom("wavelength", "", "", "2.3", "-1")).toContain("Error");
    });
});

function heisDom(solveFor: string, dx: string, dp: string): string {
    document.body.innerHTML = "";
    createContainer("heisenberg-section");
    createResultDiv("heisenberg-result", "heisenberg-section");
    createSelect("heis-solve-for", solveFor, ["min-delta-x", "min-delta-p", "bogus"], "heisenberg-section");
    createInput("heis-delta-x", dx, "heisenberg-section");
    createInput("heis-delta-p", dp, "heisenberg-section");
    createInput("heis-mass", "", "heisenberg-section");
    calculateHeisenbergUncertainty();
    return getResultText("heisenberg-result");
}

describe("quantumDomCoverage: Heisenberg DOM", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("solves each variable and rejects bad inputs", () => {
        expect(heisDom("min-delta-x", "", "1e-24")).toContain("m");
        expect(heisDom("min-delta-p", "1e-10", "")).toContain("kg");
        expect(heisDom("bogus", "1e-10", "1e-24")).toContain("Error");
        expect(heisDom("min-delta-x", "", "")).toContain("Error");
        expect(heisDom("min-delta-x", "", "0")).toContain("Error");
        expect(heisDom("min-delta-p", "0", "")).toContain("Error");
    });
});

describe("quantumDomCoverage: gap closure", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("covers QN g-subshell and negative spin", () => {
        expect(qnDom("5", "4", "0", "0.5")).toContain("Valid");
        expect(qnDom("2", "1", "0", "-0.5")).toContain("-1/2");
    });

    it("covers f-block and Rydberg series", () => {
        expect(ecDom("60")).toContain("4f");
        expect(rydDom("1", "0")).toContain("Error");
        expect(rydDom("5", "6")).toContain("nm");
        expect(rydDom("6", "7")).toContain("nm");
    });

    it("covers DeBroglie unit absent and ranges", () => {
        expect(dbDom("1", "1e6", "kg")).toContain("m");
        expect(dbDom("9.11e-31", "70", "kg")).toContain("m");
    });

    it("covers Photoelectric DOM validation", () => {
        expect(peDom("KE", "0", "", "2.3", "")).toContain("Error");
        expect(peDom("KE", "", "", "2.3", "")).toContain("Error");
        expect(peDom("KE", "400", "", "-1", "")).toContain("Error");
        expect(peDom("work-function", "0", "", "", "1")).toContain("Error");
        expect(peDom("work-function", "", "", "", "")).toContain("Error");
        expect(peDom("wavelength", "", "", "", "1")).toContain("Error");
        expect(peDom("wavelength", "", "", "0", "0")).toContain("Error");
    });

    it("covers Heisenberg DOM mass and delta", () => {
        document.body.innerHTML = "";
        createContainer("heisenberg-section");
        createResultDiv("heisenberg-result", "heisenberg-section");
        createSelect("heis-solve-for", "min-delta-x", ["min-delta-x", "min-delta-p"], "heisenberg-section");
        createInput("heis-delta-x", "", "heisenberg-section");
        createInput("heis-delta-p", "1e-24", "heisenberg-section");
        createInput("heis-mass", "9.11e-31", "heisenberg-section");
        calculateHeisenbergUncertainty();
        expect(getResultText("heisenberg-result")).toContain("m");
        expect(heisDom("min-delta-p", "", "1e-24")).toContain("Error");
    });
});
