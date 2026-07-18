import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    calculateQuantumNumbers,
    calculateElectronConfiguration,
    calculateRydberg,
    calculateDeBroglie,
    calculatePhotoelectricEffect,
    calculateHeisenbergUncertainty,
} from "./quantumCalculators.js";
import { setOrCreateInput, setOrCreateSelect, getResultHTML, createContainer, createResultDiv } from "../test/helpers.js";

const PLANCK: number = 6.626e-34;
const HBAR: number = 1.055e-34;
const SPEED_OF_LIGHT: number = 2.998e8;
const RYDBERG: number = 1.097e7;
const ELEMENTARY_CHARGE: number = 1.602e-19;

describe("quantumCalculators", () => {
    beforeEach(() => {
        // Quantum numbers
        createContainer("quantum-numbers-section");
        createResultDiv("quantum-numbers-result", "quantum-numbers-section");

        // Electron configuration
        createContainer("electron-config-section");
        createResultDiv("electron-config-result", "electron-config-section");

        // Rydberg
        createContainer("rydberg-section");
        createResultDiv("rydberg-result", "rydberg-section");

        // De Broglie
        createContainer("debroglie-section");
        createResultDiv("debroglie-result", "debroglie-section");

        // Photoelectric
        createContainer("photoelectric-section");
        createResultDiv("photoelectric-result", "photoelectric-section");

        // Heisenberg
        createContainer("heisenberg-section");
        createResultDiv("heisenberg-result", "heisenberg-section");
    });

    afterEach(() => {
        const ids = [
            "quantum-numbers-section", "electron-config-section",
            "rydberg-section", "debroglie-section",
            "photoelectric-section", "heisenberg-section"
        ];
        for (let i = 0; i < ids.length; i++) {
            const el = document.getElementById(ids[i]);
            if (el) el.remove();
        }
    });

    describe("QuantumNumbersValidator", () => {
        it("should validate a valid set of quantum numbers (2,1,0,0.5)", () => {
            setOrCreateInput("qn-n", "2", "quantum-numbers-section");
            setOrCreateInput("qn-l", "1", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "0.5", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("Valid");
            expect(html).toContain("2p");
            expect(html).toContain("6");
        });

        it("should validate n=1, l=0, ml=0, ms=-0.5 as valid (1s)", () => {
            setOrCreateInput("qn-n", "1", "quantum-numbers-section");
            setOrCreateInput("qn-l", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "-0.5", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("Valid");
            expect(html).toContain("1s");
            expect(html).toContain("2");
        });

        it("should reject l >= n as invalid", () => {
            setOrCreateInput("qn-n", "1", "quantum-numbers-section");
            setOrCreateInput("qn-l", "1", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "0.5", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("ERROR");
            expect(html).toContain("l must be an integer from 0 to n-1");
        });

        it("should reject ml outside -l to +l range", () => {
            setOrCreateInput("qn-n", "2", "quantum-numbers-section");
            setOrCreateInput("qn-l", "1", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "2", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "0.5", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("ERROR");
            expect(html).toContain("ml must be an integer from -l to +l");
        });

        it("should reject ms values other than +1/2 or -1/2", () => {
            setOrCreateInput("qn-n", "2", "quantum-numbers-section");
            setOrCreateInput("qn-l", "1", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "0", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("ERROR");
            expect(html).toContain("ms must be +1/2 or -1/2");
        });

        it("should reject non-integer n", () => {
            setOrCreateInput("qn-n", "1.5", "quantum-numbers-section");
            setOrCreateInput("qn-l", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "0", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "0.5", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("ERROR");
            expect(html).toContain("n must be a positive integer");
        });

        it("should validate n=3, l=2, ml=-2, ms=-0.5 as valid (3d)", () => {
            setOrCreateInput("qn-n", "3", "quantum-numbers-section");
            setOrCreateInput("qn-l", "2", "quantum-numbers-section");
            setOrCreateInput("qn-ml", "-2", "quantum-numbers-section");
            setOrCreateInput("qn-ms", "-0.5", "quantum-numbers-section");
            calculateQuantumNumbers();
            const html = getResultHTML("quantum-numbers-result");
            expect(html).toContain("Valid");
            expect(html).toContain("3d");
            expect(html).toContain("10");
        });
    });

    describe("ElectronConfigurationGenerator", () => {
        it("should generate correct configuration for H (Z=1)", () => {
            setOrCreateInput("ec-atomic-number", "1", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("1s1");
        });

        it("should generate correct configuration for He (Z=2)", () => {
            setOrCreateInput("ec-atomic-number", "2", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("1s2");
        });

        it("should generate correct configuration for Fe (Z=26)", () => {
            setOrCreateInput("ec-atomic-number", "26", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("[Ar]");
            expect(html).toContain("3d6");
            expect(html).toContain("4s2");
        });

        it("should handle Cr (Z=24) as an exception: [Ar] 3d5 4s1", () => {
            setOrCreateInput("ec-atomic-number", "24", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("[Ar]");
            expect(html).toContain("3d5");
            expect(html).toContain("4s1");
        });

        it("should handle Cu (Z=29) as an exception: [Ar] 3d10 4s1", () => {
            setOrCreateInput("ec-atomic-number", "29", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("[Ar]");
            expect(html).toContain("3d10");
            expect(html).toContain("4s1");
        });

        it("should show valence electrons", () => {
            setOrCreateInput("ec-atomic-number", "26", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("Valence electrons");
        });

        it("should reject atomic number outside 1-118", () => {
            setOrCreateInput("ec-atomic-number", "0", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("Error");
        });

        it("should reject atomic number above 118", () => {
            setOrCreateInput("ec-atomic-number", "119", "electron-config-section");
            calculateElectronConfiguration();
            const html = getResultHTML("electron-config-result");
            expect(html).toContain("Error");
        });
    });

    describe("RydbergCalculator", () => {
        it("should calculate Balmer series H-alpha line (n1=2, n2=3) at ~656 nm", () => {
            setOrCreateInput("rydberg-n1", "2", "rydberg-section");
            setOrCreateInput("rydberg-n2", "3", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Balmer");
            const expectedWavelength = 1 / (RYDBERG * (1 / 4 - 1 / 9)) * 1e9;
            expect(html).toContain(expectedWavelength.toFixed(2));
        });

        it("should calculate Lyman series (n1=1, n2=2) at ~121 nm", () => {
            setOrCreateInput("rydberg-n1", "1", "rydberg-section");
            setOrCreateInput("rydberg-n2", "2", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Lyman");
            const expectedWavelength = 1 / (RYDBERG * (1 / 1 - 1 / 4)) * 1e9;
            expect(html).toContain(expectedWavelength.toFixed(2));
        });

        it("should show Paschen series name for n1=3", () => {
            setOrCreateInput("rydberg-n1", "3", "rydberg-section");
            setOrCreateInput("rydberg-n2", "4", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Paschen");
        });

        it("should show Brackett series name for n1=4", () => {
            setOrCreateInput("rydberg-n1", "4", "rydberg-section");
            setOrCreateInput("rydberg-n2", "5", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Brackett");
        });

        it("should show Pfund series name for n1=5", () => {
            setOrCreateInput("rydberg-n1", "5", "rydberg-section");
            setOrCreateInput("rydberg-n2", "6", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Pfund");
        });

        it("should reject n2 <= n1", () => {
            setOrCreateInput("rydberg-n1", "3", "rydberg-section");
            setOrCreateInput("rydberg-n2", "2", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Error");
            expect(html).toContain("n2 must be greater than n1");
        });

        it("should display energy in eV", () => {
            setOrCreateInput("rydberg-n1", "2", "rydberg-section");
            setOrCreateInput("rydberg-n2", "3", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("eV");
        });

        it("should display frequency in Hz", () => {
            setOrCreateInput("rydberg-n1", "2", "rydberg-section");
            setOrCreateInput("rydberg-n2", "3", "rydberg-section");
            calculateRydberg();
            const html = getResultHTML("rydberg-result");
            expect(html).toContain("Hz");
        });
    });

    describe("DeBroglieWavelengthCalculator", () => {
        it("should calculate wavelength for an electron at 1e6 m/s", () => {
            setOrCreateInput("db-mass", String(9.109e-31), "debroglie-section");
            setOrCreateInput("db-velocity", "1e6", "debroglie-section");
            setOrCreateSelect("db-mass-unit", "kg", "debroglie-section", ["kg", "amu"]);
            calculateDeBroglie();
            const html = getResultHTML("debroglie-result");
            // lambda = h/(mv) = 6.626e-34 / (9.109e-31 * 1e6) = 7.274e-10 m = 0.727 nm
            const expectedLambda = PLANCK / (9.109e-31 * 1e6);
            expect(expectedLambda).toBeCloseTo(7.274e-10, -12);
            expect(html).toContain("nm");
            expect(html).toContain("0.727");
        });

        it("should support amu mass unit", () => {
            setOrCreateInput("db-mass", "1", "debroglie-section");
            setOrCreateInput("db-velocity", "1000", "debroglie-section");
            setOrCreateSelect("db-mass-unit", "amu", "debroglie-section", ["kg", "amu"]);
            calculateDeBroglie();
            const html = getResultHTML("debroglie-result");
            expect(html).toContain("amu");
            // 1 amu = 1.661e-27 kg, lambda = 6.626e-34 / (1.661e-27 * 1000) = 3.989e-10 m
            const expectedLambda = PLANCK / (1.661e-27 * 1000);
            expect(expectedLambda).toBeCloseTo(3.989e-10, -12);
        });

        it("should reject zero or negative mass", () => {
            setOrCreateInput("db-mass", "0", "debroglie-section");
            setOrCreateInput("db-velocity", "1000", "debroglie-section");
            setOrCreateSelect("db-mass-unit", "kg", "debroglie-section", ["kg", "amu"]);
            calculateDeBroglie();
            const html = getResultHTML("debroglie-result");
            expect(html).toContain("Error");
            expect(html).toContain("Mass must be positive");
        });

        it("should reject zero or negative velocity", () => {
            setOrCreateInput("db-mass", "9.109e-31", "debroglie-section");
            setOrCreateInput("db-velocity", "-100", "debroglie-section");
            setOrCreateSelect("db-mass-unit", "kg", "debroglie-section", ["kg", "amu"]);
            calculateDeBroglie();
            const html = getResultHTML("debroglie-result");
            expect(html).toContain("Error");
            expect(html).toContain("Velocity must be positive");
        });
    });

    describe("PhotoelectricEffectCalculator", () => {
        it("should calculate KE from wavelength and work function", () => {
            setOrCreateSelect("pe-solve-for", "KE", "photoelectric-section", ["KE", "threshold-frequency", "work-function", "wavelength"]);
            setOrCreateInput("pe-wavelength", "400", "photoelectric-section");
            setOrCreateInput("pe-frequency", "", "photoelectric-section", "text");
            setOrCreateInput("pe-work-function", "2.3", "photoelectric-section");
            setOrCreateInput("pe-ke", "", "photoelectric-section", "text");
            calculatePhotoelectricEffect();
            const html = getResultHTML("photoelectric-result");
            // E_photon = hc/lambda = (6.626e-34 * 2.998e8) / (400e-9) / 1.602e-19 eV
            const photonEnergy = (PLANCK * SPEED_OF_LIGHT) / (400e-9) / ELEMENTARY_CHARGE;
            const expectedKE = photonEnergy - 2.3;
            expect(expectedKE).toBeCloseTo(0.8, 0);
            expect(html).toContain("eV");
        });

        it("should show no emission when photon energy is below work function", () => {
            setOrCreateSelect("pe-solve-for", "KE", "photoelectric-section", ["KE", "threshold-frequency", "work-function", "wavelength"]);
            setOrCreateInput("pe-wavelength", "700", "photoelectric-section");
            setOrCreateInput("pe-frequency", "", "photoelectric-section", "text");
            setOrCreateInput("pe-work-function", "4.5", "photoelectric-section");
            setOrCreateInput("pe-ke", "", "photoelectric-section", "text");
            calculatePhotoelectricEffect();
            const html = getResultHTML("photoelectric-result");
            expect(html).toContain("No electron emission");
        });

        it("should calculate threshold frequency from work function", () => {
            setOrCreateSelect("pe-solve-for", "threshold-frequency", "photoelectric-section", ["KE", "threshold-frequency", "work-function", "wavelength"]);
            setOrCreateInput("pe-wavelength", "", "photoelectric-section", "text");
            setOrCreateInput("pe-frequency", "", "photoelectric-section", "text");
            setOrCreateInput("pe-work-function", "4.5", "photoelectric-section");
            setOrCreateInput("pe-ke", "", "photoelectric-section", "text");
            calculatePhotoelectricEffect();
            const html = getResultHTML("photoelectric-result");
            const expectedFreq = (4.5 * ELEMENTARY_CHARGE) / PLANCK;
            expect(expectedFreq).toBeCloseTo(1.088e15, -13);
            expect(html).toContain("Threshold frequency");
            expect(html).toContain("Hz");
        });

        it("should calculate work function from KE and wavelength", () => {
            setOrCreateSelect("pe-solve-for", "work-function", "photoelectric-section", ["KE", "threshold-frequency", "work-function", "wavelength"]);
            setOrCreateInput("pe-wavelength", "400", "photoelectric-section");
            setOrCreateInput("pe-frequency", "", "photoelectric-section", "text");
            setOrCreateInput("pe-work-function", "", "photoelectric-section", "text");
            setOrCreateInput("pe-ke", "0.8", "photoelectric-section");
            calculatePhotoelectricEffect();
            const html = getResultHTML("photoelectric-result");
            expect(html).toContain("Work function");
            expect(html).toContain("eV");
        });

        it("shows error for invalid solveFor value instead of silent failure", () => {
            setOrCreateSelect("pe-solve-for", "invalid", "photoelectric-section", ["KE", "threshold-frequency", "work-function", "wavelength", "invalid"]);
            setOrCreateInput("pe-wavelength", "400", "photoelectric-section");
            setOrCreateInput("pe-frequency", "", "photoelectric-section", "text");
            setOrCreateInput("pe-work-function", "2.3", "photoelectric-section");
            setOrCreateInput("pe-ke", "", "photoelectric-section", "text");
            calculatePhotoelectricEffect();
            const html = getResultHTML("photoelectric-result");
            expect(html).toContain("Error");
        });
    });

    describe("HeisenbergUncertaintyCalculator", () => {
        it("should calculate minimum delta-x from delta-p", () => {
            setOrCreateSelect("heis-solve-for", "min-delta-x", "heisenberg-section", ["min-delta-x", "min-delta-p"]);
            setOrCreateInput("heis-delta-x", "", "heisenberg-section", "text");
            setOrCreateInput("heis-delta-p", "1e-24", "heisenberg-section");
            setOrCreateInput("heis-mass", "", "heisenberg-section", "text");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            const minDeltaX = (HBAR / 2) / 1e-24;
            expect(minDeltaX).toBeCloseTo(5.275e-11, -13);
            expect(html).toContain("m");
        });

        it("should calculate minimum delta-p from delta-x", () => {
            setOrCreateSelect("heis-solve-for", "min-delta-p", "heisenberg-section", ["min-delta-x", "min-delta-p"]);
            setOrCreateInput("heis-delta-x", "1e-10", "heisenberg-section");
            setOrCreateInput("heis-delta-p", "", "heisenberg-section", "text");
            setOrCreateInput("heis-mass", "", "heisenberg-section", "text");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            const minDeltaP = (HBAR / 2) / 1e-10;
            expect(minDeltaP).toBeCloseTo(5.275e-25, -27);
            expect(html).toContain("kg");
        });

        it("should show delta-v when mass is provided for min-delta-p", () => {
            setOrCreateSelect("heis-solve-for", "min-delta-p", "heisenberg-section", ["min-delta-x", "min-delta-p"]);
            setOrCreateInput("heis-delta-x", "1e-10", "heisenberg-section");
            setOrCreateInput("heis-delta-p", "", "heisenberg-section", "text");
            setOrCreateInput("heis-mass", "9.109e-31", "heisenberg-section");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            expect(html).toContain("m/s");
        });

        it("should reject zero or negative delta-p", () => {
            setOrCreateSelect("heis-solve-for", "min-delta-x", "heisenberg-section", ["min-delta-x", "min-delta-p"]);
            setOrCreateInput("heis-delta-x", "", "heisenberg-section", "text");
            setOrCreateInput("heis-delta-p", "0", "heisenberg-section");
            setOrCreateInput("heis-mass", "", "heisenberg-section", "text");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            expect(html).toContain("Error");
        });

        it("should reject zero or negative delta-x", () => {
            setOrCreateSelect("heis-solve-for", "min-delta-p", "heisenberg-section", ["min-delta-x", "min-delta-p"]);
            setOrCreateInput("heis-delta-x", "0", "heisenberg-section");
            setOrCreateInput("heis-delta-p", "", "heisenberg-section", "text");
            setOrCreateInput("heis-mass", "", "heisenberg-section", "text");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            expect(html).toContain("Error");
        });

        it("should display the hbar/2 constant", () => {
            setOrCreateSelect("heis-solve-for", "min-delta-p", "heisenberg-section", ["min-delta-x", "min-delta-p"]);
            setOrCreateInput("heis-delta-x", "1e-10", "heisenberg-section");
            setOrCreateInput("heis-delta-p", "", "heisenberg-section", "text");
            setOrCreateInput("heis-mass", "", "heisenberg-section", "text");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            expect(html).toContain("J");
        });

        it("shows error for invalid solveFor value instead of silent failure", () => {
            setOrCreateSelect("heis-solve-for", "invalid", "heisenberg-section", ["min-delta-x", "min-delta-p", "invalid"]);
            setOrCreateInput("heis-delta-x", "1e-10", "heisenberg-section");
            setOrCreateInput("heis-delta-p", "1e-24", "heisenberg-section");
            setOrCreateInput("heis-mass", "", "heisenberg-section", "text");
            calculateHeisenbergUncertainty();
            const html = getResultHTML("heisenberg-result");
            expect(html).toContain("Error");
        });
    });
});
