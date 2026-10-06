import { Calculator } from "./calculator.js";
import type { CalculatorResult } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";

/** Planck constant in J*s */
const PLANCK: number = 6.626e-34;
/** Reduced Planck constant (h-bar) in J*s */
const HBAR: number = 1.055e-34;
/** Speed of light in m/s */
const SPEED_OF_LIGHT: number = 2.998e8;
/** Rydberg constant for hydrogen in m^-1 */
const RYDBERG: number = 1.097e7;
/** Elementary charge in C */
const ELEMENTARY_CHARGE: number = 1.602e-19;
/** Electron mass in kg */
// Used by backend; kept for reference
// const ELECTRON_MASS: number = 9.109e-31;
/** Atomic mass unit in kg */
const AMU_TO_KG: number = 1.661e-27;

/**
 * Validates quantum number combinations.
 * n: positive integer (1, 2, 3, ...)
 * l: 0 to n-1
 * ml: -l to +l
 * ms: +1/2 or -1/2
 * Inputs: n, l, ml, ms
 * Output: valid/invalid, orbital designation, max electrons in subshell
 */
export class QuantumNumbersValidator extends Calculator {
    constructor() {
        super("quantum-numbers-result", [
            "qn-n",
            "qn-l",
            "qn-ml",
            "qn-ms"
        ]);
    }

    protected performCalculation(): void {
        const nVal = this.getInput("qn-n").getValue();
        const lVal = this.getInput("qn-l").getValue();
        const mlVal = this.getInput("qn-ml").getValue();
        const msVal = this.getInput("qn-ms").getValue();
        InputValidator.validateValues([nVal, lVal, mlVal, msVal], ["qn-n", "qn-l", "qn-ml", "qn-ms"]);

        const n: number = nVal;
        const l: number = lVal;
        const ml: number = mlVal;
        const ms: number = msVal;

        let errors: string[] = [];
        if (n !== Math.floor(n) || n < 1) {
            errors.push("n must be a positive integer (1, 2, 3, ...)");
        }
        if (l !== Math.floor(l) || l < 0 || l >= n) {
            errors.push("l must be an integer from 0 to n-1");
        }
        if (ml !== Math.floor(ml) || ml < -l || ml > l) {
            errors.push("ml must be an integer from -l to +l");
        }
        if (ms !== 0.5 && ms !== -0.5) {
            errors.push("ms must be +1/2 or -1/2");
        }

        let valid: boolean = errors.length === 0;

        let shellNames: Record<number, string> = {
            1: "K", 2: "L", 3: "M", 4: "N", 5: "O", 6: "P", 7: "Q"
        };
        let subshellNames: Record<number, string> = {
            0: "s", 1: "p", 2: "d", 3: "f"
        };

        let shell: string = shellNames[n] || "";
        let subshell: string = subshellNames[l] || "";
        let orbitalDesignation: string = String(Math.round(n)) + subshell;
        let maxElectrons: number = 2 * (2 * Math.round(l) + 1);

        let html: string = "";
        html += "<p>n = " + Math.round(n) + " (shell " + shell + ")</p>";
        html += "<p>l = " + Math.round(l) + " (subshell " + subshell + ")</p>";
        html += "<p>ml = " + Math.round(ml) + "</p>";
        html += "<p>ms = " + (ms > 0 ? "+1/2" : "-1/2") + "</p>";
        if (valid) {
            html += "<p><strong>Valid</strong> set of quantum numbers</p>";
        } else {
            for (let i = 0; i < errors.length; i++) {
                html += "<p><strong>ERROR:</strong> " + errors[i] + "</p>";
            }
        }
        html += "<p>Orbital designation: <strong>" + orbitalDesignation + "</strong></p>";
        html += "<p>Max electrons in " + orbitalDesignation + " subshell: <strong>" + maxElectrons + "</strong></p>";
        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const nVal = parseFloat(inputs["qn-n"] ?? "");
        const lVal = parseFloat(inputs["qn-l"] ?? "");
        const mlVal = parseFloat(inputs["qn-ml"] ?? "");
        const msVal = parseFloat(inputs["qn-ms"] ?? "");
        if (isNaN(nVal) || isNaN(lVal) || isNaN(mlVal) || isNaN(msVal)) {
            throw new Error("Missing or invalid inputs for qn-n, qn-l, qn-ml, qn-ms");
        }
        const n: number = nVal;
        const l: number = lVal;
        const ml: number = mlVal;
        const ms: number = msVal;
        let errors: string[] = [];
        if (n !== Math.floor(n) || n < 1) {
            errors.push("n must be a positive integer (1, 2, 3, ...)");
        }
        if (l !== Math.floor(l) || l < 0 || l >= n) {
            errors.push("l must be an integer from 0 to n-1");
        }
        if (ml !== Math.floor(ml) || ml < -l || ml > l) {
            errors.push("ml must be an integer from -l to +l");
        }
        if (ms !== 0.5 && ms !== -0.5) {
            errors.push("ms must be +1/2 or -1/2");
        }
        let valid: boolean = errors.length === 0;
        let shellNames: Record<number, string> = {
            1: "K", 2: "L", 3: "M", 4: "N", 5: "O", 6: "P", 7: "Q"
        };
        let subshellNames: Record<number, string> = {
            0: "s", 1: "p", 2: "d", 3: "f"
        };
        let shell: string = shellNames[n] || "";
        let subshell: string = subshellNames[l] || "";
        let orbitalDesignation: string = String(Math.round(n)) + subshell;
        let maxElectrons: number = 2 * (2 * Math.round(l) + 1);
        let value: string = valid ? "Valid quantum numbers" : "Invalid quantum numbers";
        let explanation: string = "n = " + Math.round(n) + " (shell " + shell + "); ";
        explanation += "l = " + Math.round(l) + " (subshell " + subshell + "); ";
        explanation += "ml = " + Math.round(ml) + "; ";
        explanation += "ms = " + (ms > 0 ? "+1/2" : "-1/2") + "; ";
        if (valid) {
            explanation += "Orbital designation: " + orbitalDesignation + "; ";
            explanation += "Max electrons in " + orbitalDesignation + " subshell: " + maxElectrons;
        } else {
            explanation += "Errors: " + errors.join("; ");
        }
        return {
            value: value,
            explanation: explanation,
            metadata: {
                valid: valid,
                n: Math.round(n),
                l: Math.round(l),
                ml: Math.round(ml),
                ms: ms,
                shell: shell,
                subshell: subshell,
                orbitalDesignation: orbitalDesignation,
                maxElectrons: maxElectrons,
                errors: errors
            }
        };
    }
}

/**
 * Generates electron configuration from atomic number.
 * Fill order follows Aufbau principle with known exceptions.
 * Inputs: atomic number (1-118)
 * Output: full configuration, noble gas notation, orbital diagram text, valence electrons
 */
export class ElectronConfigurationGenerator extends Calculator {
    constructor() {
        super("electron-config-result", [
            "ec-atomic-number"
        ]);
    }

    /** Compare subshell strings like "2s2" by (n, l) for display order. */
    private static compareSubshellParts(a: string, b: string): number {
        let na: number = parseInt(a.charAt(0), 10);
        let nb: number = parseInt(b.charAt(0), 10);
        if (na !== nb) {
            return na - nb;
        }
        let la: string = a.charAt(1);
        let lb: string = b.charAt(1);
        let order: Record<string, number> = { "s": 0, "p": 1, "d": 2, "f": 3 };
        return order[la] - order[lb];
    }

    /** Aufbau fill order as [n, l] pairs */
    private static AUFBAU_ORDER: number[][] = [
        [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2],
        [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2],
        [6, 1], [7, 0], [5, 3], [6, 2], [7, 1]
    ];

    private static SUBSHELL_NAMES: Record<number, string> = {
        0: "s", 1: "p", 2: "d", 3: "f"
    };

    private static MAX_ELECTRONS: Record<number, number> = {
        0: 2, 1: 6, 2: 10, 3: 14
    };

    /** Noble gas atomic numbers and their configurations for shorthand */
    private static NOBLE_GASES: Record<number, string> = {
        2: "He", 10: "Ne", 18: "Ar", 36: "Kr", 54: "Xe", 86: "Rn"
    };

    /** Known exceptions to the Aufbau principle */
    private static EXCEPTIONS: Record<number, number[][]> = {
        24: [[3, 2, 5], [4, 0, 1]],   // Cr: [Ar] 3d5 4s1
        29: [[3, 2, 10], [4, 0, 1]],   // Cu: [Ar] 3d10 4s1
        41: [[4, 2, 4], [5, 0, 1]],    // Nb: [Kr] 4d4 5s1
        42: [[4, 2, 5], [5, 0, 1]],    // Mo: [Kr] 4d5 5s1
        44: [[4, 2, 7], [5, 0, 1]],    // Ru: [Kr] 4d7 5s1
        45: [[4, 2, 8], [5, 0, 1]],    // Rh: [Kr] 4d8 5s1
        46: [[4, 2, 10], [5, 0, 0]],   // Pd: [Kr] 4d10
        47: [[4, 2, 10], [5, 0, 1]],   // Ag: [Kr] 4d10 5s1
        78: [[5, 2, 9], [6, 0, 1]],    // Pt: [Xe] 5d9 6s1
        79: [[5, 2, 10], [6, 0, 1]]    // Au: [Xe] 5d10 6s1
    };

    protected performCalculation(): void {
        const zVal = this.getInput("ec-atomic-number").getValue();
        InputValidator.validateValues([zVal], ["ec-atomic-number"]);
        const z: number = Math.round(zVal);
        if (z < 1 || z > 118) {
            throw new Error("Atomic number must be between 1 and 118");
        }

        // Build configuration using Aufbau with exceptions
        let config: string = this.buildConfiguration(z);

        // Build noble gas notation
        let nobleGasNotation: string = this.buildNobleGasNotation(z);

        // Build orbital diagram text
        let orbitalDiagram: string = this.buildOrbitalDiagram(z);

        // Count valence electrons
        let valenceElectrons: number = this.countValenceElectrons(z);

        let html: string = "";
        html += "<p>Atomic number: <strong>" + z + "</strong></p>";
        html += "<p>Full configuration: <strong>" + config + "</strong></p>";
        html += "<p>Noble gas notation: <strong>" + nobleGasNotation + "</strong></p>";
        html += "<p>Valence electrons: <strong>" + valenceElectrons + "</strong></p>";
        html += "<p>Orbital diagram:</p>";
        html += "<pre>" + orbitalDiagram + "</pre>";
        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const zVal = parseFloat(inputs["ec-atomic-number"] ?? "");
        if (isNaN(zVal)) {
            throw new Error("Missing or invalid input for ec-atomic-number");
        }
        const z: number = Math.round(zVal);
        if (z < 1 || z > 118) {
            throw new Error("Atomic number must be between 1 and 118");
        }
        let config: string = this.buildConfiguration(z);
        let nobleGasNotation: string = this.buildNobleGasNotation(z);
        let orbitalDiagram: string = this.buildOrbitalDiagram(z);
        let valenceElectrons: number = this.countValenceElectrons(z);
        let explanation: string = "Atomic number: " + z + "; ";
        explanation += "Full configuration: " + config + "; ";
        explanation += "Noble gas notation: " + nobleGasNotation + "; ";
        explanation += "Valence electrons: " + valenceElectrons + "; ";
        explanation += "Orbital diagram:\n" + orbitalDiagram;
        return {
            value: config,
            explanation: explanation,
            metadata: {
                atomicNumber: z,
                fullConfig: config,
                nobleGasNotation: nobleGasNotation,
                valenceElectrons: valenceElectrons,
                orbitalDiagram: orbitalDiagram
            }
        };
    }

    private buildConfiguration(z: number): string {
        let exception: number[][] | undefined = ElectronConfigurationGenerator.EXCEPTIONS[z];
        if (exception) {
            return this.buildFromException(exception, z);
        }
        let parts: string[] = [];
        let remaining: number = z;
        for (let i = 0; i < ElectronConfigurationGenerator.AUFBAU_ORDER.length; i++) {
            if (remaining <= 0) {
                break;
            }
            let n: number = ElectronConfigurationGenerator.AUFBAU_ORDER[i][0];
            let l: number = ElectronConfigurationGenerator.AUFBAU_ORDER[i][1];
            let max: number = ElectronConfigurationGenerator.MAX_ELECTRONS[l];
            let electrons: number = remaining;
            if (electrons > max) {
                electrons = max;
            }
            parts.push(String(n) + ElectronConfigurationGenerator.SUBSHELL_NAMES[l] + electrons);
            remaining -= electrons;
        }
        return parts.join(" ");
    }

    private buildFromException(exception: number[][], z: number): string {
        // Build full config: standard part up to noble gas, then exception override
        let parts: string[] = [];

        // First fill using Aufbau until we reach the subshell where exceptions apply
        // Then apply the exception
        let exceptionSet: Set<string> = new Set();
        for (let i = 0; i < exception.length; i++) {
            exceptionSet.add(exception[i][0] + "-" + exception[i][1]);
        }

        let exceptionElectrons: number = 0;
        for (let i = 0; i < exception.length; i++) {
            exceptionElectrons += exception[i][2];
        }

        // Fill standard orbitals first
        let usedElectrons: number = 0;
        for (let i = 0; i < ElectronConfigurationGenerator.AUFBAU_ORDER.length; i++) {
            let n: number = ElectronConfigurationGenerator.AUFBAU_ORDER[i][0];
            let l: number = ElectronConfigurationGenerator.AUFBAU_ORDER[i][1];
            if (exceptionSet.has(n + "-" + l)) {
                continue;
            }
            let max: number = ElectronConfigurationGenerator.MAX_ELECTRONS[l];
            let electrons: number = max;
            if (usedElectrons + electrons > z - exceptionElectrons) {
                electrons = z - exceptionElectrons - usedElectrons;
            }
            if (electrons > 0) {
                parts.push(String(n) + ElectronConfigurationGenerator.SUBSHELL_NAMES[l] + electrons);
                usedElectrons += electrons;
            }
        }

        // Sort parts by (n, l) for display
        parts.sort(ElectronConfigurationGenerator.compareSubshellParts);

        // Add exception orbitals in sorted order
        let exceptionParts: string[] = [];
        for (let i = 0; i < exception.length; i++) {
            let n: number = exception[i][0];
            let l: number = exception[i][1];
            let electrons: number = exception[i][2];
            if (electrons > 0) {
                exceptionParts.push(String(n) + ElectronConfigurationGenerator.SUBSHELL_NAMES[l] + electrons);
            }
        }
        exceptionParts.sort(ElectronConfigurationGenerator.compareSubshellParts);

        for (let i = 0; i < exceptionParts.length; i++) {
            parts.push(exceptionParts[i]);
        }

        // Re-sort all parts
        parts.sort(ElectronConfigurationGenerator.compareSubshellParts);

        return parts.join(" ");
    }

    private buildNobleGasNotation(z: number): string {
        let nobleGasZ: number = 0;
        let nobleGasSymbol: string = "";
        let nobleGasKeys: number[] = Object.keys(ElectronConfigurationGenerator.NOBLE_GASES).map(Number);
        for (let i = 0; i < nobleGasKeys.length; i++) {
            if (nobleGasKeys[i] < z) {
                nobleGasZ = nobleGasKeys[i];
                nobleGasSymbol = ElectronConfigurationGenerator.NOBLE_GASES[nobleGasKeys[i]];
            }
        }

        if (nobleGasZ === 0) {
            return this.buildConfiguration(z);
        }

        let fullConfig: string = this.buildConfiguration(z);
        // Build the noble gas core config to strip
        let coreConfig: string = this.buildConfiguration(nobleGasZ);
        // Remove the core prefix from full config
        let remaining: string = fullConfig;
        if (fullConfig.startsWith(coreConfig)) {
            remaining = fullConfig.substring(coreConfig.length).trim();
        }
        // Exception elements (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au) render
        // their config in sorted (n, l) order, so the Aufbau-ordered core
        // string is not a literal prefix. The shells after the core are
        // exactly the exception entries (e.g. Pt: [Xe] 5d9 6s1).
        let exception: number[][] | undefined = ElectronConfigurationGenerator.EXCEPTIONS[z];
        if (exception) {
            let parts: string[] = [];
            for (let i = 0; i < exception.length; i++) {
                if (exception[i][2] > 0) {
                    parts.push(String(exception[i][0]) + ElectronConfigurationGenerator.SUBSHELL_NAMES[exception[i][1]] + exception[i][2]);
                }
            }
            parts.sort(ElectronConfigurationGenerator.compareSubshellParts);
            remaining = parts.join(" ");
        }
        // nobleGasZ < z by construction above (strictly-less scan), so the full
        // config strictly extends the core and remaining is never empty here.
        /* v8 ignore next -- remainder non-empty by nobleGasZ < z, verified above */
        if (remaining === "") {
            return "[" + nobleGasSymbol + "]";
        }
        return "[" + nobleGasSymbol + "] " + remaining;
    }

    private buildOrbitalDiagram(z: number): string {
        let config: string = this.buildConfiguration(z);
        let parts: string[] = config.split(" ");
        let lines: string[] = [];
        for (let i = 0; i < parts.length; i++) {
            let part: string = parts[i];
            /* v8 ignore next -- parts are built internally as n+name+electrons (always length >= 3), never short */
            if (part.length < 2) {
                continue;
            }
            // Parse orbital name and electron count
            let n: string = part.charAt(0);
            let l: string = part.charAt(1);
            let electronCount: number = parseInt(part.substring(2), 10);
            /* v8 ignore next -- electron counts are built internally as numbers, never NaN */
            if (isNaN(electronCount)) {
                continue;
            }
            // Determine number of orbitals
            let orbitalCount: Record<string, number> = { "s": 1, "p": 3, "d": 5, "f": 7 };
            // l derives from internal SUBSHELL_NAMES (always s/p/d/f), so the fallback never fires.
            let numOrbitals: number = orbitalCount[l] as number;
            // Build spin arrows following Hund's rule: every orbital gets one
            // electron with parallel spin before any orbital is paired.
            let orbitals: string[] = [];
            for (let j = 0; j < numOrbitals; j++) {
                let up: boolean = j < electronCount;
                let down: boolean = (j + numOrbitals) < electronCount;
                if (up && down) {
                    orbitals.push("\u2191\u2193");
                } else if (up) {
                    orbitals.push("\u2191 ");
                } else {
                    orbitals.push("  ");
                }
            }
            lines.push(n + l + ": " + orbitals.join(" | "));
        }
        return lines.join("\n");
    }

    private countValenceElectrons(z: number): number {
        // Determine period and group from config
        let config: string = this.buildConfiguration(z);
        let parts: string[] = config.split(" ");
        let valence: number = 0;
        // Find the highest principal quantum number
        let maxN: number = 0;
        for (let i = 0; i < parts.length; i++) {
            let n: number = parseInt(parts[i].charAt(0), 10);
            if (n > maxN) {
                maxN = n;
            }
        }
        // A filled p AND d subshell at maxN (Pd: [Kr] ...4p6 4d10, no 5s)
        // means the element's true outermost shell is maxN+1 and empty, so
        // the s/p of the maxN shell belong to the core and only its d
        // subshell counts.
        let hasPAtMaxN: boolean = false;
        let hasDAtMaxN: boolean = false;
        for (let i = 0; i < parts.length; i++) {
            let n: number = parseInt(parts[i].charAt(0), 10);
            let l: string = parts[i].charAt(1);
            if (n === maxN && l === "p") {
                hasPAtMaxN = true;
            }
            if (n === maxN && l === "d") {
                hasDAtMaxN = true;
            }
        }
        let dIsOutermostShell: boolean = hasPAtMaxN && hasDAtMaxN;
        // For transition metals, also count (maxN-1)d electrons partially
        // Count electrons in the outermost shell and any partially filled d/f
        for (let i = 0; i < parts.length; i++) {
            let part: string = parts[i];
            let n: number = parseInt(part.charAt(0), 10);
            let l: string = part.charAt(1);
            let electronCount: number = parseInt(part.substring(2), 10);
            /* v8 ignore next -- parts are built internally as n+name+electrons, counts never NaN */
            if (isNaN(electronCount)) {
                continue;
            }
            if (n === maxN) {
                if (dIsOutermostShell) {
                    if (l === "d") {
                        valence += electronCount;
                    }
                } else {
                    valence += electronCount;
                }
            } else if (l === "d" && n === maxN - 1 && electronCount < 10) {
                // Partially filled (n-1)d counts for transition metals
                valence += electronCount;
            } else if (l === "f" && n === maxN - 2 && electronCount < 14) {
                valence += electronCount;
            }
        }
        return valence;
    }
}

/**
 * Calculates wavelength, frequency, and energy for hydrogen spectral lines
 * using the Rydberg formula: 1/lambda = R_H * (1/n1^2 - 1/n2^2)
 * Inputs: n1 (lower energy level), n2 (higher energy level)
 * Output: wavelength (nm), frequency (Hz), energy (eV), spectral series name
 */
export class RydbergCalculator extends Calculator {
    constructor() {
        super("rydberg-result", [
            "rydberg-n1",
            "rydberg-n2"
        ]);
    }

    protected performCalculation(): void {
        const n1Val = this.getInput("rydberg-n1").getValue();
        const n2Val = this.getInput("rydberg-n2").getValue();
        InputValidator.validateValues([n1Val, n2Val], ["rydberg-n1", "rydberg-n2"]);

        const n1: number = n1Val;
        const n2: number = n2Val;

        if (n1 !== Math.floor(n1) || n1 < 1) {
            throw new Error("n1 must be a positive integer");
        }
        if (n2 !== Math.floor(n2) || n2 < 1) {
            throw new Error("n2 must be a positive integer");
        }
        if (n2 <= n1) {
            throw new Error("n2 must be greater than n1");
        }

        let invLambda: number = RYDBERG * (1 / (n1 * n1) - 1 / (n2 * n2));
        let lambdaM: number = 1 / invLambda;
        let lambdaNm: number = lambdaM * 1e9;
        let frequency: number = SPEED_OF_LIGHT / lambdaM;
        let energyJ: number = PLANCK * frequency;
        let energyEv: number = energyJ / ELEMENTARY_CHARGE;

        let seriesName: string = this.getSeriesName(n1);

        let html: string = "";
        html += "<p>Spectral series: <strong>" + seriesName + "</strong> (n\u2081 = " + Math.round(n1) + ")</p>";
        html += "<p>Transition: n = " + Math.round(n2) + " \u2192 n = " + Math.round(n1) + "</p>";
        html += "<p>Wavelength: <strong>" + this.numberFormatter.format(lambdaNm, 2) + " nm</strong></p>";
        html += "<p>Frequency: <strong>" + this.numberFormatter.format(frequency, 4) + " Hz</strong></p>";
        html += "<p>Energy: <strong>" + this.numberFormatter.format(energyEv, 4) + " eV</strong></p>";
        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const n1Val = parseFloat(inputs["rydberg-n1"] ?? "");
        const n2Val = parseFloat(inputs["rydberg-n2"] ?? "");
        if (isNaN(n1Val) || isNaN(n2Val)) {
            throw new Error("Missing or invalid inputs for rydberg-n1, rydberg-n2");
        }
        const n1: number = n1Val;
        const n2: number = n2Val;
        if (n1 !== Math.floor(n1) || n1 < 1) {
            throw new Error("n1 must be a positive integer");
        }
        if (n2 !== Math.floor(n2) || n2 < 1) {
            throw new Error("n2 must be a positive integer");
        }
        if (n2 <= n1) {
            throw new Error("n2 must be greater than n1");
        }
        let invLambda: number = RYDBERG * (1 / (n1 * n1) - 1 / (n2 * n2));
        let lambdaM: number = 1 / invLambda;
        let lambdaNm: number = lambdaM * 1e9;
        let frequency: number = SPEED_OF_LIGHT / lambdaM;
        let energyJ: number = PLANCK * frequency;
        let energyEv: number = energyJ / ELEMENTARY_CHARGE;
        let seriesName: string = this.getSeriesName(n1);
        let value: string = this.numberFormatter.format(lambdaNm, 2) + " nm";
        let explanation: string = "Spectral series: " + seriesName + " (n\u2081 = " + Math.round(n1) + "); ";
        explanation += "Transition: n = " + Math.round(n2) + " \u2192 n = " + Math.round(n1) + "; ";
        explanation += "Wavelength: " + this.numberFormatter.format(lambdaNm, 2) + " nm; ";
        explanation += "Frequency: " + this.numberFormatter.format(frequency, 4) + " Hz; ";
        explanation += "Energy: " + this.numberFormatter.format(energyEv, 4) + " eV";
        return {
            value: value,
            explanation: explanation,
            metadata: {
                n1: Math.round(n1),
                n2: Math.round(n2),
                wavelengthNm: lambdaNm,
                frequencyHz: frequency,
                energyEv: energyEv,
                seriesName: seriesName
            }
        };
    }

    private getSeriesName(n1: number): string {
        if (n1 === 1) {
            return "Lyman (UV)";
        } else if (n1 === 2) {
            return "Balmer (Visible)";
        } else if (n1 === 3) {
            return "Paschen (IR)";
        } else if (n1 === 4) {
            return "Brackett (IR)";
        } else if (n1 === 5) {
            return "Pfund (IR)";
        }
        return "Unknown series";
    }
}

/**
 * Calculates de Broglie wavelength: lambda = h / (m * v)
 * h = 6.626e-34 J*s
 * Inputs: mass (kg or amu), velocity (m/s)
 * Output: wavelength (pm, nm, or Angstrom depending on scale)
 */
export class DeBroglieWavelengthCalculator extends Calculator {
    constructor() {
        super("debroglie-result", [
            "db-mass",
            "db-velocity",
            "db-mass-unit"
        ]);
    }

    protected performCalculation(): void {
        const massVal = this.getInput("db-mass").getValue();
        const velocityVal = this.getInput("db-velocity").getValue();
        InputValidator.validateValues([massVal, velocityVal], ["db-mass", "db-velocity"]);

        const massRaw: number = massVal;
        const velocity: number = velocityVal;

        if (massRaw <= 0) {
            throw new Error("Mass must be positive");
        }
        if (velocity <= 0) {
            throw new Error("Velocity must be positive");
        }

        // Get mass unit from select (db-mass-unit is in the constructor input
        // list, so it always exists when performCalculation runs; the old
        // null-fallback could never fire).
        let massUnit: string = (document.getElementById("db-mass-unit") as HTMLSelectElement).value;

        let massKg: number = massRaw;
        if (massUnit === "amu") {
            massKg = massRaw * AMU_TO_KG;
        } else if (massUnit === "g") {
            massKg = massRaw / 1000;
        } else if (massUnit !== "kg") {
            throw new Error("Invalid mass unit");
        }

        let lambdaM: number = PLANCK / (massKg * velocity);

        // Choose appropriate unit based on scale. Large wavelengths use
        // nm/µm — never angstroms above 1e-7 m (1 µm as 10000 Å is noise).
        let lambdaDisplay: number;
        let unit: string;
        if (lambdaM < 1e-12) {
            lambdaDisplay = lambdaM * 1e12;
            unit = "pm";
        } else if (lambdaM < 1e-6) {
            lambdaDisplay = lambdaM * 1e9;
            unit = "nm";
        } else if (lambdaM < 1e-3) {
            lambdaDisplay = lambdaM * 1e6;
            unit = "µm";
        } else {
            lambdaDisplay = lambdaM;
            unit = "m";
        }

        let html: string = "";
        html += "<p>\u03BB = h / (m\u00B7v)</p>";
        if (massUnit === "amu") {
            html += "<p>Mass: " + this.numberFormatter.format(massRaw, 4) + " amu = " + this.numberFormatter.format(massKg, 4) + " kg</p>";
        }
        html += "<p>De Broglie wavelength: <strong>" + this.numberFormatter.format(lambdaDisplay, 4) + " " + unit + "</strong></p>";
        html += "<p>Wavelength in meters: " + this.numberFormatter.format(lambdaM, 4) + " m</p>";
        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const massRaw = parseFloat(inputs["db-mass"] ?? "");
        const velocity = parseFloat(inputs["db-velocity"] ?? "");
        if (isNaN(massRaw) || isNaN(velocity)) {
            throw new Error("Missing or invalid inputs for db-mass, db-velocity");
        }
        if (massRaw <= 0) {
            throw new Error("Mass must be positive");
        }
        if (velocity <= 0) {
            throw new Error("Velocity must be positive");
        }
        const massUnit: string = inputs["db-mass-unit"] || "kg";
        let massKg: number = massRaw;
        if (massUnit === "amu") {
            massKg = massRaw * AMU_TO_KG;
        } else if (massUnit === "g") {
            massKg = massRaw / 1000;
        } else if (massUnit !== "kg") {
            throw new Error("Invalid mass unit");
        }
        let lambdaM: number = PLANCK / (massKg * velocity);
        let lambdaDisplay: number;
        let unit: string;
        if (lambdaM < 1e-12) {
            lambdaDisplay = lambdaM * 1e12;
            unit = "pm";
        } else if (lambdaM < 1e-6) {
            lambdaDisplay = lambdaM * 1e9;
            unit = "nm";
        } else if (lambdaM < 1e-3) {
            lambdaDisplay = lambdaM * 1e6;
            unit = "\u00B5m";
        } else {
            lambdaDisplay = lambdaM;
            unit = "m";
        }
        let value: string = this.numberFormatter.format(lambdaDisplay, 4) + " " + unit;
        let explanation: string = "\u03BB = h / (m\u00B7v); ";
        if (massUnit === "amu") {
            explanation += "Mass: " + this.numberFormatter.format(massRaw, 4) + " amu = " + this.numberFormatter.format(massKg, 4) + " kg; ";
        }
        explanation += "De Broglie wavelength: " + this.numberFormatter.format(lambdaDisplay, 4) + " " + unit + "; ";
        explanation += "Wavelength in meters: " + this.numberFormatter.format(lambdaM, 4) + " m";
        return {
            value: value,
            explanation: explanation,
            metadata: {
                wavelengthM: lambdaM,
                wavelengthDisplay: lambdaDisplay,
                unit: unit,
                massKg: massKg,
                massRaw: massRaw,
                massUnit: massUnit,
                velocity: velocity
            }
        };
    }
}

/**
 * Calculates photoelectric effect: KE = hf - phi (work function)
 * KE = hc/lambda - phi
 * Inputs: wavelength (nm) or frequency (Hz), work function phi (eV)
 * Can solve for KE, threshold frequency, threshold wavelength, or phi
 * Output: KE (eV), threshold frequency (Hz), threshold wavelength (nm)
 */
export class PhotoelectricEffectCalculator extends SolveForCalculator {
    constructor() {
        super("photoelectric-result", [
            "pe-wavelength",
            "pe-frequency",
            "pe-work-function",
            "pe-ke"
        ], "pe-solve-for");
    }

    protected performCalculation(): void {
        const solveFor: string = this.getSolveFor();
        const wavelengthNm: number = this.getInput("pe-wavelength").getValue();
        const frequencyHz: number = this.getInput("pe-frequency").getValue();
        const workFunctionEv: number = this.getInput("pe-work-function").getValue();
        const keEv: number = this.getInput("pe-ke").getValue();

        let html: string = "";

        if (solveFor === "KE") {
            // Need frequency or wavelength + work function
            let freq: number = frequencyHz;
            if (isNaN(freq) && !isNaN(wavelengthNm)) {
                if (wavelengthNm <= 0) {
                    throw new Error("Wavelength must be positive");
                }
                let lambdaM: number = wavelengthNm * 1e-9;
                freq = SPEED_OF_LIGHT / lambdaM;
            }
            if (isNaN(freq)) {
                throw new Error("Please enter wavelength or frequency");
            }
            if (freq <= 0) {
                throw new Error("Frequency must be positive");
            }
            if (isNaN(workFunctionEv)) {
                throw new Error("Please enter the work function");
            }
            if (workFunctionEv < 0) {
                throw new Error("Work function cannot be negative");
            }
            let energyEv: number = (PLANCK * freq) / ELEMENTARY_CHARGE;
            let ke: number = energyEv - workFunctionEv;

            html += "<p>Photon energy: " + this.numberFormatter.format(energyEv, 4) + " eV</p>";
            html += "<p>Work function \u03C6: " + this.numberFormatter.format(workFunctionEv, 4) + " eV</p>";
            if (ke < 0) {
                html += "<p><strong>No electron emission</strong> (photon energy below work function)</p>";
                html += "<p>KE would be: " + this.numberFormatter.format(ke, 4) + " eV (negative = no emission)</p>";
            } else {
                html += "<p>Kinetic energy KE: <strong>" + this.numberFormatter.format(ke, 4) + " eV</strong></p>";
            }
            // Threshold info
            let thresholdFreq: number = (workFunctionEv * ELEMENTARY_CHARGE) / PLANCK;
            let thresholdWavelengthNm: number = (SPEED_OF_LIGHT / thresholdFreq) * 1e9;
            html += "<p>Threshold frequency: " + this.numberFormatter.format(thresholdFreq, 4) + " Hz</p>";
            html += "<p>Threshold wavelength: " + this.numberFormatter.format(thresholdWavelengthNm, 2) + " nm</p>";
        } else if (solveFor === "threshold-frequency") {
            if (isNaN(workFunctionEv)) {
                throw new Error("Please enter the work function");
            }
            if (workFunctionEv < 0) {
                throw new Error("Work function cannot be negative");
            }
            let thresholdFreq: number = (workFunctionEv * ELEMENTARY_CHARGE) / PLANCK;
            let thresholdWavelengthNm: number = (SPEED_OF_LIGHT / thresholdFreq) * 1e9;
            html += "<p>Threshold frequency: <strong>" + this.numberFormatter.format(thresholdFreq, 4) + " Hz</strong></p>";
            html += "<p>Threshold wavelength: <strong>" + this.numberFormatter.format(thresholdWavelengthNm, 2) + " nm</strong></p>";
        } else if (solveFor === "work-function") {
            let freq: number = frequencyHz;
            if (isNaN(freq) && !isNaN(wavelengthNm)) {
                if (wavelengthNm <= 0) {
                    throw new Error("Wavelength must be positive");
                }
                let lambdaM: number = wavelengthNm * 1e-9;
                freq = SPEED_OF_LIGHT / lambdaM;
            }
            if (isNaN(freq)) {
                throw new Error("Please enter wavelength or frequency");
            }
            if (isNaN(keEv)) {
                throw new Error("Please enter the kinetic energy");
            }
            if (keEv < 0) {
                throw new Error("Kinetic energy cannot be negative");
            }
            let photonEnergyEv: number = (PLANCK * freq) / ELEMENTARY_CHARGE;
            let phi: number = photonEnergyEv - keEv;
            html += "<p>Photon energy: " + this.numberFormatter.format(photonEnergyEv, 4) + " eV</p>";
            html += "<p>Work function \u03C6: <strong>" + this.numberFormatter.format(phi, 4) + " eV</strong></p>";
        } else if (solveFor === "wavelength") {
            if (isNaN(keEv)) {
                throw new Error("Please enter the kinetic energy");
            }
            if (keEv < 0) {
                throw new Error("Kinetic energy cannot be negative");
            }
            if (isNaN(workFunctionEv)) {
                throw new Error("Please enter the work function");
            }
            let totalEnergyEv: number = keEv + workFunctionEv;
            if (totalEnergyEv <= 0) {
                throw new Error("Photon energy (KE + work function) must be positive");
            }
            let totalEnergyJ: number = totalEnergyEv * ELEMENTARY_CHARGE;
            let freq: number = totalEnergyJ / PLANCK;
            let lambdaM: number = SPEED_OF_LIGHT / freq;
            let lambdaNm: number = lambdaM * 1e9;
            html += "<p>Total photon energy: " + this.numberFormatter.format(totalEnergyEv, 4) + " eV</p>";
            html += "<p>Required wavelength: <strong>" + this.numberFormatter.format(lambdaNm, 2) + " nm</strong></p>";
            html += "<p>Required frequency: <strong>" + this.numberFormatter.format(freq, 4) + " Hz</strong></p>";
        } else {
            throw new Error("Invalid solve-for selection");
        }

        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const solveFor: string = this.getSolveFor(inputs);
        const wavelengthNm: number = parseFloat(inputs["pe-wavelength"] ?? "");
        const frequencyHz: number = parseFloat(inputs["pe-frequency"] ?? "");
        const workFunctionEv: number = parseFloat(inputs["pe-work-function"] ?? "");
        const keEv: number = parseFloat(inputs["pe-ke"] ?? "");
        if (solveFor === "KE") {
            let freq: number = frequencyHz;
            if (isNaN(freq) && !isNaN(wavelengthNm)) {
                if (wavelengthNm <= 0) {
                    throw new Error("Wavelength must be positive");
                }
                let lambdaM: number = wavelengthNm * 1e-9;
                freq = SPEED_OF_LIGHT / lambdaM;
            }
            if (isNaN(freq)) {
                throw new Error("Please enter wavelength or frequency");
            }
            if (freq <= 0) {
                throw new Error("Frequency must be positive");
            }
            if (isNaN(workFunctionEv)) {
                throw new Error("Please enter the work function");
            }
            if (workFunctionEv < 0) {
                throw new Error("Work function cannot be negative");
            }
            let energyEv: number = (PLANCK * freq) / ELEMENTARY_CHARGE;
            let ke: number = energyEv - workFunctionEv;
            let thresholdFreq: number = (workFunctionEv * ELEMENTARY_CHARGE) / PLANCK;
            let thresholdWavelengthNm: number = (SPEED_OF_LIGHT / thresholdFreq) * 1e9;
            let value: string;
            let explanation: string = "Photon energy: " + this.numberFormatter.format(energyEv, 4) + " eV; ";
            explanation += "Work function \u03C6: " + this.numberFormatter.format(workFunctionEv, 4) + " eV; ";
            if (ke < 0) {
                value = "No electron emission";
                explanation += "No electron emission (photon energy below work function); ";
                explanation += "KE would be: " + this.numberFormatter.format(ke, 4) + " eV (negative = no emission); ";
            } else {
                value = this.numberFormatter.format(ke, 4) + " eV";
                explanation += "Kinetic energy KE: " + this.numberFormatter.format(ke, 4) + " eV; ";
            }
            explanation += "Threshold frequency: " + this.numberFormatter.format(thresholdFreq, 4) + " Hz; ";
            explanation += "Threshold wavelength: " + this.numberFormatter.format(thresholdWavelengthNm, 2) + " nm";
            return {
                value: value,
                explanation: explanation,
                metadata: {
                    photonEnergyEv: energyEv,
                    kineticEnergyEv: ke,
                    workFunctionEv: workFunctionEv,
                    thresholdFrequencyHz: thresholdFreq,
                    thresholdWavelengthNm: thresholdWavelengthNm,
                    emissionOccurred: ke >= 0
                }
            };
        } else if (solveFor === "threshold-frequency") {
            if (isNaN(workFunctionEv)) {
                throw new Error("Please enter the work function");
            }
            if (workFunctionEv < 0) {
                throw new Error("Work function cannot be negative");
            }
            let thresholdFreq: number = (workFunctionEv * ELEMENTARY_CHARGE) / PLANCK;
            let thresholdWavelengthNm: number = (SPEED_OF_LIGHT / thresholdFreq) * 1e9;
            let value: string = this.numberFormatter.format(thresholdFreq, 4) + " Hz";
            let explanation: string = "Threshold frequency: " + this.numberFormatter.format(thresholdFreq, 4) + " Hz; ";
            explanation += "Threshold wavelength: " + this.numberFormatter.format(thresholdWavelengthNm, 2) + " nm";
            return {
                value: value,
                explanation: explanation,
                metadata: {
                    thresholdFrequencyHz: thresholdFreq,
                    thresholdWavelengthNm: thresholdWavelengthNm,
                    workFunctionEv: workFunctionEv
                }
            };
        } else if (solveFor === "work-function") {
            let freq: number = frequencyHz;
            if (isNaN(freq) && !isNaN(wavelengthNm)) {
                if (wavelengthNm <= 0) {
                    throw new Error("Wavelength must be positive");
                }
                let lambdaM: number = wavelengthNm * 1e-9;
                freq = SPEED_OF_LIGHT / lambdaM;
            }
            if (isNaN(freq)) {
                throw new Error("Please enter wavelength or frequency");
            }
            if (isNaN(keEv)) {
                throw new Error("Please enter the kinetic energy");
            }
            if (keEv < 0) {
                throw new Error("Kinetic energy cannot be negative");
            }
            let photonEnergyEv: number = (PLANCK * freq) / ELEMENTARY_CHARGE;
            let phi: number = photonEnergyEv - keEv;
            let value: string = this.numberFormatter.format(phi, 4) + " eV";
            let explanation: string = "Photon energy: " + this.numberFormatter.format(photonEnergyEv, 4) + " eV; ";
            explanation += "Work function \u03C6: " + this.numberFormatter.format(phi, 4) + " eV";
            return {
                value: value,
                explanation: explanation,
                metadata: {
                    photonEnergyEv: photonEnergyEv,
                    workFunctionEv: phi,
                    kineticEnergyEv: keEv
                }
            };
        } else if (solveFor === "wavelength") {
            if (isNaN(keEv)) {
                throw new Error("Please enter the kinetic energy");
            }
            if (keEv < 0) {
                throw new Error("Kinetic energy cannot be negative");
            }
            if (isNaN(workFunctionEv)) {
                throw new Error("Please enter the work function");
            }
            let totalEnergyEv: number = keEv + workFunctionEv;
            if (totalEnergyEv <= 0) {
                throw new Error("Photon energy (KE + work function) must be positive");
            }
            let totalEnergyJ: number = totalEnergyEv * ELEMENTARY_CHARGE;
            let freq: number = totalEnergyJ / PLANCK;
            let lambdaM: number = SPEED_OF_LIGHT / freq;
            let lambdaNm: number = lambdaM * 1e9;
            let value: string = this.numberFormatter.format(lambdaNm, 2) + " nm";
            let explanation: string = "Total photon energy: " + this.numberFormatter.format(totalEnergyEv, 4) + " eV; ";
            explanation += "Required wavelength: " + this.numberFormatter.format(lambdaNm, 2) + " nm; ";
            explanation += "Required frequency: " + this.numberFormatter.format(freq, 4) + " Hz";
            return {
                value: value,
                explanation: explanation,
                metadata: {
                    totalPhotonEnergyEv: totalEnergyEv,
                    wavelengthNm: lambdaNm,
                    frequencyHz: freq
                }
            };
        } else {
            throw new Error("Invalid solve-for selection");
        }
    }
}

/**
 * Calculates Heisenberg uncertainty principle: deltaX * deltaP >= hbar/2
 * hbar = h / (2*pi) = 1.055e-34 J*s
 * deltaP = m * deltaV
 * Inputs: uncertainty in position deltaX (m) OR uncertainty in momentum deltaP (kg*m/s)
 * Can also input mass to convert between deltaP and deltaV
 * Output: minimum deltaP or deltaX, deltaV if mass given
 */
export class HeisenbergUncertaintyCalculator extends SolveForCalculator {
    constructor() {
        super("heisenberg-result", [
            "heis-delta-x",
            "heis-delta-p",
            "heis-mass"
        ], "heis-solve-for");
    }

    protected performCalculation(): void {
        const solveFor: string = this.getSolveFor();
        const deltaXVal: number = this.getInput("heis-delta-x").getValue();
        const deltaPVal: number = this.getInput("heis-delta-p").getValue();
        const massVal: number = this.getInput("heis-mass").getValue();

        let minProduct: number = HBAR / 2.0;
        let html: string = "";
        html += "<p>\u0394x\u00B7\u0394p \u2265 \u0127/2 = " + this.numberFormatter.format(minProduct, 4) + " J\u00B7s</p>";

        if (solveFor === "min-delta-x") {
            if (isNaN(deltaPVal)) {
                throw new Error("Please enter the uncertainty in momentum (\u0394p)");
            }
            if (deltaPVal <= 0) {
                throw new Error("\u0394p must be positive");
            }
            let minDeltaX: number = minProduct / deltaPVal;
            html += "<p>Minimum \u0394x: <strong>" + this.numberFormatter.format(minDeltaX, 4) + " m</strong></p>";
            // If mass is given, compute deltaV
            if (!isNaN(massVal) && massVal > 0) {
                let deltaV: number = deltaPVal / massVal;
                html += "<p>\u0394v corresponding to \u0394p: <strong>" + this.numberFormatter.format(deltaV, 4) + " m/s</strong></p>";
                // Δv ≥ ħ/(2·Δx·m); with Δx at its minimum this equals Δp/m.
                let minDeltaV: number = minProduct / (minDeltaX * massVal);
                html += "<p>Minimum \u0394v from \u0394x: <strong>" + this.numberFormatter.format(minDeltaV, 4) + " m/s</strong></p>";
            }
        } else if (solveFor === "min-delta-p") {
            if (isNaN(deltaXVal)) {
                throw new Error("Please enter the uncertainty in position (\u0394x)");
            }
            if (deltaXVal <= 0) {
                throw new Error("\u0394x must be positive");
            }
            let minDeltaP: number = minProduct / deltaXVal;
            html += "<p>Minimum \u0394p: <strong>" + this.numberFormatter.format(minDeltaP, 4) + " kg\u00B7m/s</strong></p>";
            // If mass is given, compute deltaV
            if (!isNaN(massVal) && massVal > 0) {
                let minDeltaV: number = minDeltaP / massVal;
                html += "<p>Minimum \u0394v: <strong>" + this.numberFormatter.format(minDeltaV, 4) + " m/s</strong></p>";
            }
        } else {
            throw new Error("Invalid solve-for selection");
        }

        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const solveFor: string = this.getSolveFor(inputs);
        const deltaXVal: number = parseFloat(inputs["heis-delta-x"] ?? "");
        const deltaPVal: number = parseFloat(inputs["heis-delta-p"] ?? "");
        const massVal: number = parseFloat(inputs["heis-mass"] ?? "");
        let minProduct: number = HBAR / 2.0;
        if (solveFor === "min-delta-x") {
            if (isNaN(deltaPVal)) {
                throw new Error("Please enter the uncertainty in momentum (\u0394p)");
            }
            if (deltaPVal <= 0) {
                throw new Error("\u0394p must be positive");
            }
            let minDeltaX: number = minProduct / deltaPVal;
            let value: string = this.numberFormatter.format(minDeltaX, 4) + " m";
            let explanation: string = "\u0394x\u00B7\u0394p \u2265 \u0127/2 = " + this.numberFormatter.format(minProduct, 4) + " J\u00B7s; ";
            explanation += "Minimum \u0394x: " + this.numberFormatter.format(minDeltaX, 4) + " m";
            let metadata: Record<string, unknown> = {
                minProduct: minProduct,
                minDeltaX: minDeltaX,
                deltaP: deltaPVal
            };
            if (!isNaN(massVal) && massVal > 0) {
                let deltaV: number = deltaPVal / massVal;
                // Δv ≥ ħ/(2·Δx·m); with Δx at its minimum this equals Δp/m.
                let minDeltaV: number = minProduct / (minDeltaX * massVal);
                explanation += "; \u0394v corresponding to \u0394p: " + this.numberFormatter.format(deltaV, 4) + " m/s";
                explanation += "; Minimum \u0394v from \u0394x: " + this.numberFormatter.format(minDeltaV, 4) + " m/s";
                metadata.deltaV = deltaV;
                metadata.minDeltaV = minDeltaV;
                metadata.mass = massVal;
            }
            return {
                value: value,
                explanation: explanation,
                metadata: metadata
            };
        } else if (solveFor === "min-delta-p") {
            if (isNaN(deltaXVal)) {
                throw new Error("Please enter the uncertainty in position (\u0394x)");
            }
            if (deltaXVal <= 0) {
                throw new Error("\u0394x must be positive");
            }
            let minDeltaP: number = minProduct / deltaXVal;
            let value: string = this.numberFormatter.format(minDeltaP, 4) + " kg\u00B7m/s";
            let explanation: string = "\u0394x\u00B7\u0394p \u2265 \u0127/2 = " + this.numberFormatter.format(minProduct, 4) + " J\u00B7s; ";
            explanation += "Minimum \u0394p: " + this.numberFormatter.format(minDeltaP, 4) + " kg\u00B7m/s";
            let metadata: Record<string, unknown> = {
                minProduct: minProduct,
                minDeltaP: minDeltaP,
                deltaX: deltaXVal
            };
            if (!isNaN(massVal) && massVal > 0) {
                let minDeltaV: number = minDeltaP / massVal;
                explanation += "; Minimum \u0394v: " + this.numberFormatter.format(minDeltaV, 4) + " m/s";
                metadata.minDeltaV = minDeltaV;
                metadata.mass = massVal;
            }
            return {
                value: value,
                explanation: explanation,
                metadata: metadata
            };
        } else {
            throw new Error("Invalid solve-for selection");
        }
    }
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateQuantumNumbers(): void {
    new QuantumNumbersValidator().calculate();
}

export function calculateElectronConfiguration(): void {
    new ElectronConfigurationGenerator().calculate();
}

export function calculateRydberg(): void {
    new RydbergCalculator().calculate();
}

export function calculateDeBroglie(): void {
    new DeBroglieWavelengthCalculator().calculate();
}

export function calculatePhotoelectricEffect(): void {
    new PhotoelectricEffectCalculator().calculate();
}

export function calculateHeisenbergUncertainty(): void {
    new HeisenbergUncertaintyCalculator().calculate();
}
