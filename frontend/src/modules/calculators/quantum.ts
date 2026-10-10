import { NumberFormatter } from "../i18n/numberFormatter.js";
import type { CalculatorResult } from "./pureCalculator.js";

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

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
/** Atomic mass unit in kg */
const AMU_TO_KG: number = 1.661e-27;

/**
 * Validates a set of quantum numbers and derives the orbital designation.
 * n: positive integer (1, 2, 3, ...), l: 0 to n-1, ml: -l to +l,
 * ms: +1/2 or -1/2.
 */
export function quantumNumbers(n: number, l: number, ml: number, ms: number): CalculatorResult {
    if (isNaN(n) || isNaN(l) || isNaN(ml) || isNaN(ms)) {
        throw new Error("Missing or invalid inputs for qn-n, qn-l, qn-ml, qn-ms");
    }
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

/** Full electron configuration from an atomic number, honouring the Aufbau
 * exceptions, plus the noble gas shorthand, orbital diagram, and valence
 * electron count. */
export function electronConfiguration(z: number): CalculatorResult {
    if (isNaN(z)) {
        throw new Error("Missing or invalid input for ec-atomic-number");
    }
    let atomicNumber: number = Math.round(z);
    if (atomicNumber < 1 || atomicNumber > 118) {
        throw new Error("Atomic number must be between 1 and 118");
    }
    let config: string = buildConfiguration(atomicNumber);
    let nobleGasNotation: string = buildNobleGasNotation(atomicNumber);
    let orbitalDiagram: string = buildOrbitalDiagram(atomicNumber);
    let valenceElectrons: number = countValenceElectrons(atomicNumber);
    let explanation: string = "Atomic number: " + atomicNumber + "; ";
    explanation += "Full configuration: " + config + "; ";
    explanation += "Noble gas notation: " + nobleGasNotation + "; ";
    explanation += "Valence electrons: " + valenceElectrons + "; ";
    explanation += "Orbital diagram:\n" + orbitalDiagram;
    return {
        value: config,
        explanation: explanation,
        metadata: {
            atomicNumber: atomicNumber,
            fullConfig: config,
            nobleGasNotation: nobleGasNotation,
            valenceElectrons: valenceElectrons,
            orbitalDiagram: orbitalDiagram
        }
    };
}

/** Hydrogen spectral line from the Rydberg formula 1/lambda = R_H*(1/n1^2 - 1/n2^2). */
export function rydberg(n1: number, n2: number): CalculatorResult {
    if (isNaN(n1) || isNaN(n2)) {
        throw new Error("Missing or invalid inputs for rydberg-n1, rydberg-n2");
    }
    if (n1 !== Math.floor(n1) || n1 < 1) {
        throw new Error("n1 must be a positive integer");
    }
    if (n2 !== Math.floor(n2) || n2 < 1) {
        throw new Error("n2 must be a positive integer");
    }
    if (n2 <= n1) {
        throw new Error("n2 must be greater than n1");
    }
    let nf: NumberFormatter = formatter();
    let invLambda: number = RYDBERG * (1 / (n1 * n1) - 1 / (n2 * n2));
    let lambdaM: number = 1 / invLambda;
    let lambdaNm: number = lambdaM * 1e9;
    let frequency: number = SPEED_OF_LIGHT / lambdaM;
    let energyJ: number = PLANCK * frequency;
    let energyEv: number = energyJ / ELEMENTARY_CHARGE;
    let seriesName: string = getSeriesName(n1);
    let value: string = nf.format(lambdaNm, 2) + " nm";
    let explanation: string = "Spectral series: " + seriesName + " (n\u2081 = " + Math.round(n1) + "); ";
    explanation += "Transition: n = " + Math.round(n2) + " \u2192 n = " + Math.round(n1) + "; ";
    explanation += "Wavelength: " + nf.format(lambdaNm, 2) + " nm; ";
    explanation += "Frequency: " + nf.format(frequency, 4) + " Hz; ";
    explanation += "Energy: " + nf.format(energyEv, 4) + " eV";
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

/** de Broglie wavelength lambda = h / (m*v); mass in kg, g, or amu. */
export function deBroglie(massRaw: number, velocity: number, massUnit: string): CalculatorResult {
    if (isNaN(massRaw) || isNaN(velocity)) {
        throw new Error("Missing or invalid inputs for db-mass, db-velocity");
    }
    if (massRaw <= 0) {
        throw new Error("Mass must be positive");
    }
    if (velocity <= 0) {
        throw new Error("Velocity must be positive");
    }
    let massKg: number = massRaw;
    if (massUnit === "amu") {
        massKg = massRaw * AMU_TO_KG;
    } else if (massUnit === "g") {
        massKg = massRaw / 1000;
    } else if (massUnit !== "kg") {
        throw new Error("Invalid mass unit");
    }
    let nf: NumberFormatter = formatter();
    let lambdaM: number = PLANCK / (massKg * velocity);
    // Choose appropriate unit based on scale. Large wavelengths use nm/µm —
    // never angstroms above 1e-7 m (1 µm as 10000 A is noise).
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
    let value: string = nf.format(lambdaDisplay, 4) + " " + unit;
    let explanation: string = "\u03BB = h / (m\u00B7v); ";
    if (massUnit === "amu") {
        explanation += "Mass: " + nf.format(massRaw, 4) + " amu = " + nf.format(massKg, 4) + " kg; ";
    }
    explanation += "De Broglie wavelength: " + nf.format(lambdaDisplay, 4) + " " + unit + "; ";
    explanation += "Wavelength in meters: " + nf.format(lambdaM, 4) + " m";
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

/** Photoelectric effect KE = hf - phi, solved for the variable named by
 * `solveFor` ("KE", "threshold-frequency", "work-function", or "wavelength"). */
export function photoelectric(
    solveFor: string,
    wavelengthNm: number,
    frequencyHz: number,
    workFunctionEv: number,
    keEv: number
): CalculatorResult {
    let nf: NumberFormatter = formatter();
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
        let explanation: string = "Photon energy: " + nf.format(energyEv, 4) + " eV; ";
        explanation += "Work function \u03C6: " + nf.format(workFunctionEv, 4) + " eV; ";
        if (ke < 0) {
            value = "No electron emission";
            explanation += "No electron emission (photon energy below work function); ";
            explanation += "KE would be: " + nf.format(ke, 4) + " eV (negative = no emission); ";
        } else {
            value = nf.format(ke, 4) + " eV";
            explanation += "Kinetic energy KE: " + nf.format(ke, 4) + " eV; ";
        }
        explanation += "Threshold frequency: " + nf.format(thresholdFreq, 4) + " Hz; ";
        explanation += "Threshold wavelength: " + nf.format(thresholdWavelengthNm, 2) + " nm";
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
    }
    if (solveFor === "threshold-frequency") {
        if (isNaN(workFunctionEv)) {
            throw new Error("Please enter the work function");
        }
        if (workFunctionEv < 0) {
            throw new Error("Work function cannot be negative");
        }
        let thresholdFreq: number = (workFunctionEv * ELEMENTARY_CHARGE) / PLANCK;
        let thresholdWavelengthNm: number = (SPEED_OF_LIGHT / thresholdFreq) * 1e9;
        let value: string = nf.format(thresholdFreq, 4) + " Hz";
        let explanation: string = "Threshold frequency: " + nf.format(thresholdFreq, 4) + " Hz; ";
        explanation += "Threshold wavelength: " + nf.format(thresholdWavelengthNm, 2) + " nm";
        return {
            value: value,
            explanation: explanation,
            metadata: {
                thresholdFrequencyHz: thresholdFreq,
                thresholdWavelengthNm: thresholdWavelengthNm,
                workFunctionEv: workFunctionEv
            }
        };
    }
    if (solveFor === "work-function") {
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
        let value: string = nf.format(phi, 4) + " eV";
        let explanation: string = "Photon energy: " + nf.format(photonEnergyEv, 4) + " eV; ";
        explanation += "Work function \u03C6: " + nf.format(phi, 4) + " eV";
        return {
            value: value,
            explanation: explanation,
            metadata: {
                photonEnergyEv: photonEnergyEv,
                workFunctionEv: phi,
                kineticEnergyEv: keEv
            }
        };
    }
    if (solveFor === "wavelength") {
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
        let value: string = nf.format(lambdaNm, 2) + " nm";
        let explanation: string = "Total photon energy: " + nf.format(totalEnergyEv, 4) + " eV; ";
        explanation += "Required wavelength: " + nf.format(lambdaNm, 2) + " nm; ";
        explanation += "Required frequency: " + nf.format(freq, 4) + " Hz";
        return {
            value: value,
            explanation: explanation,
            metadata: {
                totalPhotonEnergyEv: totalEnergyEv,
                wavelengthNm: lambdaNm,
                frequencyHz: freq
            }
        };
    }
    throw new Error("Invalid solve-for selection");
}

/** Heisenberg uncertainty deltaX * deltaP >= hbar/2, solved for the variable
 * named by `solveFor` ("min-delta-x" or "min-delta-p"). */
export function heisenberg(solveFor: string, deltaX: number, deltaP: number, mass: number): CalculatorResult {
    let nf: NumberFormatter = formatter();
    let minProduct: number = HBAR / 2.0;
    if (solveFor === "min-delta-x") {
        if (isNaN(deltaP)) {
            throw new Error("Please enter the uncertainty in momentum (\u0394p)");
        }
        if (deltaP <= 0) {
            throw new Error("\u0394p must be positive");
        }
        let minDeltaX: number = minProduct / deltaP;
        let value: string = nf.format(minDeltaX, 4) + " m";
        let explanation: string = "\u0394x\u00B7\u0394p \u2265 \u0127/2 = " + nf.format(minProduct, 4) + " J\u00B7s; ";
        explanation += "Minimum \u0394x: " + nf.format(minDeltaX, 4) + " m";
        let metadata: Record<string, unknown> = {
            minProduct: minProduct,
            minDeltaX: minDeltaX,
            deltaP: deltaP
        };
        if (!isNaN(mass) && mass > 0) {
            let deltaV: number = deltaP / mass;
            // deltaV >= hbar/(2*deltaX*m); with deltaX at its minimum this equals deltaP/m.
            let minDeltaV: number = minProduct / (minDeltaX * mass);
            explanation += "; \u0394v corresponding to \u0394p: " + nf.format(deltaV, 4) + " m/s";
            explanation += "; Minimum \u0394v from \u0394x: " + nf.format(minDeltaV, 4) + " m/s";
            metadata.deltaV = deltaV;
            metadata.minDeltaV = minDeltaV;
            metadata.mass = mass;
        }
        return {
            value: value,
            explanation: explanation,
            metadata: metadata
        };
    }
    if (solveFor === "min-delta-p") {
        if (isNaN(deltaX)) {
            throw new Error("Please enter the uncertainty in position (\u0394x)");
        }
        if (deltaX <= 0) {
            throw new Error("\u0394x must be positive");
        }
        let minDeltaP: number = minProduct / deltaX;
        let value: string = nf.format(minDeltaP, 4) + " kg\u00B7m/s";
        let explanation: string = "\u0394x\u00B7\u0394p \u2265 \u0127/2 = " + nf.format(minProduct, 4) + " J\u00B7s; ";
        explanation += "Minimum \u0394p: " + nf.format(minDeltaP, 4) + " kg\u00B7m/s";
        let metadata: Record<string, unknown> = {
            minProduct: minProduct,
            minDeltaP: minDeltaP,
            deltaX: deltaX
        };
        if (!isNaN(mass) && mass > 0) {
            let minDeltaV: number = minDeltaP / mass;
            explanation += "; Minimum \u0394v: " + nf.format(minDeltaV, 4) + " m/s";
            metadata.minDeltaV = minDeltaV;
            metadata.mass = mass;
        }
        return {
            value: value,
            explanation: explanation,
            metadata: metadata
        };
    }
    throw new Error("Invalid solve-for selection");
}

/** Compare subshell strings like "2s2" by (n, l) for display order. */
export function compareSubshellParts(a: string, b: string): number {
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
const AUFBAU_ORDER: number[][] = [
    [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2],
    [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2],
    [6, 1], [7, 0], [5, 3], [6, 2], [7, 1]
];

const SUBSHELL_NAMES: Record<number, string> = {
    0: "s", 1: "p", 2: "d", 3: "f"
};

const MAX_ELECTRONS: Record<number, number> = {
    0: 2, 1: 6, 2: 10, 3: 14
};

/** Noble gas atomic numbers and their symbols for shorthand notation */
const NOBLE_GASES: Record<number, string> = {
    2: "He", 10: "Ne", 18: "Ar", 36: "Kr", 54: "Xe", 86: "Rn"
};

/** Known exceptions to the Aufbau principle */
const EXCEPTIONS: Record<number, number[][]> = {
    24: [[3, 2, 5], [4, 0, 1]],
    29: [[3, 2, 10], [4, 0, 1]],
    41: [[4, 2, 4], [5, 0, 1]],
    42: [[4, 2, 5], [5, 0, 1]],
    44: [[4, 2, 7], [5, 0, 1]],
    45: [[4, 2, 8], [5, 0, 1]],
    46: [[4, 2, 10], [5, 0, 0]],
    47: [[4, 2, 10], [5, 0, 1]],
    78: [[5, 2, 9], [6, 0, 1]],
    79: [[5, 2, 10], [6, 0, 1]]
};

function buildConfiguration(z: number): string {
    let exception: number[][] | undefined = EXCEPTIONS[z];
    if (exception) {
        return buildFromException(exception, z);
    }
    let parts: string[] = [];
    let remaining: number = z;
    for (let i = 0; i < AUFBAU_ORDER.length; i++) {
        if (remaining <= 0) {
            break;
        }
        let n: number = AUFBAU_ORDER[i][0];
        let l: number = AUFBAU_ORDER[i][1];
        let max: number = MAX_ELECTRONS[l];
        let electrons: number = remaining;
        if (electrons > max) {
            electrons = max;
        }
        parts.push(String(n) + SUBSHELL_NAMES[l] + electrons);
        remaining -= electrons;
    }
    return parts.join(" ");
}

function buildFromException(exception: number[][], z: number): string {
    let parts: string[] = [];
    let exceptionSet: Set<string> = new Set();
    for (let i = 0; i < exception.length; i++) {
        exceptionSet.add(exception[i][0] + "-" + exception[i][1]);
    }

    let exceptionElectrons: number = 0;
    for (let i = 0; i < exception.length; i++) {
        exceptionElectrons += exception[i][2];
    }

    let usedElectrons: number = 0;
    for (let i = 0; i < AUFBAU_ORDER.length; i++) {
        let n: number = AUFBAU_ORDER[i][0];
        let l: number = AUFBAU_ORDER[i][1];
        if (exceptionSet.has(n + "-" + l)) {
            continue;
        }
        let max: number = MAX_ELECTRONS[l];
        let electrons: number = max;
        if (usedElectrons + electrons > z - exceptionElectrons) {
            electrons = z - exceptionElectrons - usedElectrons;
        }
        if (electrons > 0) {
            parts.push(String(n) + SUBSHELL_NAMES[l] + electrons);
            usedElectrons += electrons;
        }
    }

    parts.sort(compareSubshellParts);

    let exceptionParts: string[] = [];
    for (let i = 0; i < exception.length; i++) {
        let n: number = exception[i][0];
        let l: number = exception[i][1];
        let electrons: number = exception[i][2];
        if (electrons > 0) {
            exceptionParts.push(String(n) + SUBSHELL_NAMES[l] + electrons);
        }
    }
    exceptionParts.sort(compareSubshellParts);

    for (let i = 0; i < exceptionParts.length; i++) {
        parts.push(exceptionParts[i]);
    }

    parts.sort(compareSubshellParts);

    return parts.join(" ");
}

function buildNobleGasNotation(z: number): string {
    let nobleGasZ: number = 0;
    let nobleGasSymbol: string = "";
    let nobleGasKeys: number[] = Object.keys(NOBLE_GASES).map(Number);
    for (let i = 0; i < nobleGasKeys.length; i++) {
        if (nobleGasKeys[i] < z) {
            nobleGasZ = nobleGasKeys[i];
            nobleGasSymbol = NOBLE_GASES[nobleGasKeys[i]];
        }
    }

    if (nobleGasZ === 0) {
        return buildConfiguration(z);
    }

    let fullConfig: string = buildConfiguration(z);
    let coreConfig: string = buildConfiguration(nobleGasZ);
    let remaining: string = fullConfig;
    if (fullConfig.startsWith(coreConfig)) {
        remaining = fullConfig.substring(coreConfig.length).trim();
    }
    // Exception elements render their config in sorted (n, l) order, so the
    // Aufbau-ordered core string is not a literal prefix. The shells after the
    // core are exactly the exception entries (e.g. Pt: [Xe] 5d9 6s1).
    let exception: number[][] | undefined = EXCEPTIONS[z];
    if (exception) {
        let parts: string[] = [];
        for (let i = 0; i < exception.length; i++) {
            if (exception[i][2] > 0) {
                parts.push(String(exception[i][0]) + SUBSHELL_NAMES[exception[i][1]] + exception[i][2]);
            }
        }
        parts.sort(compareSubshellParts);
        remaining = parts.join(" ");
    }
    // nobleGasZ < z by construction above (strictly-less scan), so remaining is
    // never empty here.
    /* v8 ignore next -- remainder non-empty by nobleGasZ < z, verified above */
    if (remaining === "") {
        return "[" + nobleGasSymbol + "]";
    }
    return "[" + nobleGasSymbol + "] " + remaining;
}

function buildOrbitalDiagram(z: number): string {
    let config: string = buildConfiguration(z);
    let parts: string[] = config.split(" ");
    let lines: string[] = [];
    for (let i = 0; i < parts.length; i++) {
        let part: string = parts[i];
        /* v8 ignore next -- parts are built internally as n+name+electrons, never short */
        if (part.length < 2) {
            continue;
        }
        let n: string = part.charAt(0);
        let l: string = part.charAt(1);
        let electronCount: number = parseInt(part.substring(2), 10);
        /* v8 ignore next -- electron counts are built internally as numbers, never NaN */
        if (isNaN(electronCount)) {
            continue;
        }
        let orbitalCount: Record<string, number> = { "s": 1, "p": 3, "d": 5, "f": 7 };
        // l derives from SUBSHELL_NAMES (always s/p/d/f), so the fallback never fires.
        let numOrbitals: number = orbitalCount[l] as number;
        // Hund's rule: every orbital gets one electron with parallel spin before
        // any orbital is paired.
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

function countValenceElectrons(z: number): number {
    let config: string = buildConfiguration(z);
    let parts: string[] = config.split(" ");
    let valence: number = 0;
    let maxN: number = 0;
    for (let i = 0; i < parts.length; i++) {
        let n: number = parseInt(parts[i].charAt(0), 10);
        if (n > maxN) {
            maxN = n;
        }
    }
    // A filled p AND d subshell at maxN (Pd: [Kr] ...4p6 4d10, no 5s) means the
    // element's true outermost shell is maxN+1 and empty, so the s/p of the maxN
    // shell belong to the core and only its d subshell counts.
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
            valence += electronCount;
        } else if (l === "f" && n === maxN - 2 && electronCount < 14) {
            valence += electronCount;
        }
    }
    return valence;
}

function getSeriesName(n1: number): string {
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
