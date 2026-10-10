import type { CalculatorResult } from "./pureCalculator.js";
import { NumberFormatter } from "../i18n/numberFormatter.js";

/**
 * Pure thermodynamics calculations. Each function takes already-parsed
 * inputs (or the raw comma-separated string where that is the natural
 * input) and returns a {@link CalculatorResult} without touching the DOM.
 * These functions are the single source of truth that the DOM classes in
 * ../thermodynamicsCalculators.ts and the Go port in core/ mirror.
 */

/** ΔG = ΔH - TΔS. deltaH in kJ/mol, deltaS in J/(mol·K), T in K. */
export function gibbsFreeEnergy(deltaH: number, deltaS: number, T: number): CalculatorResult {
    if (T < 0) {
        throw new Error("Temperature cannot be negative");
    }
    // Convert deltaS from J/(mol·K) to kJ/(mol·K)
    const deltaS_kJ = deltaS / 1000;
    const deltaG = deltaH - T * deltaS_kJ;
    let spontaneity: string;
    if (deltaG < 0) {
        spontaneity = "Spontaneous";
    } else if (deltaG > 0) {
        spontaneity = "Non-spontaneous";
    } else {
        spontaneity = "Equilibrium";
    }
    const fmt = NumberFormatter.createFromCurrentLocale();
    return {
        value: "dG = " + fmt.format(deltaG, 4) + " kJ/mol; Process: " + spontaneity,
        explanation: "dG = dH - T*dS = " + fmt.format(deltaH, 4) + " - " + fmt.format(T, 4) + " * " + fmt.format(deltaS_kJ, 4) + " = " + fmt.format(deltaG, 4) + " kJ/mol; Process: " + spontaneity,
        metadata: {
            deltaG: deltaG,
            deltaH: deltaH,
            deltaS: deltaS,
            deltaS_kJ: deltaS_kJ,
            temperature: T,
            spontaneity: spontaneity
        }
    };
}

/** Hess's Law: sum of 2-10 comma-separated ΔH values (kJ/mol). */
export function hessLaw(stepsRaw: string): CalculatorResult {
    const fmt = NumberFormatter.createFromCurrentLocale();
    const rawValue = stepsRaw.trim();
    if (rawValue === "") {
        throw new Error("Please enter at least 2 enthalpy values separated by commas");
    }
    const parts = rawValue.split(",");
    if (parts.length < 2) {
        throw new Error("At least 2 enthalpy values are required");
    }
    if (parts.length > 10) {
        throw new Error("Maximum of 10 enthalpy values allowed");
    }
    let totalH = 0;
    for (let i = 0; i < parts.length; i++) {
        const parsed = parseFloat(parts[i].trim());
        if (isNaN(parsed)) {
            throw new Error("All values must be valid numbers");
        }
        totalH = totalH + parsed;
    }
    return {
        value: "Total dH = " + fmt.format(totalH, 4) + " kJ/mol",
        explanation: "Sum of " + parts.length + " enthalpy steps = " + fmt.format(totalH, 4) + " kJ/mol",
        metadata: {
            totalH: totalH,
            stepCount: parts.length,
            steps: parts.map((p) => parseFloat(p.trim()))
        }
    };
}

/** ΔS° = ΣS°(products) - ΣS°(reactants). Both inputs are comma-separated (J/(mol·K)). */
export function entropy(productsRaw: string, reactantsRaw: string): CalculatorResult {
    const fmt = NumberFormatter.createFromCurrentLocale();
    const productsTrimmed = productsRaw.trim();
    const reactantsTrimmed = reactantsRaw.trim();
    if (productsTrimmed === "" || reactantsTrimmed === "") {
        throw new Error("Please enter entropy values for both products and reactants");
    }
    const productParts = productsTrimmed.split(",");
    const reactantParts = reactantsTrimmed.split(",");
    let sumProducts = 0;
    for (let i = 0; i < productParts.length; i++) {
        const parsed = parseFloat(productParts[i].trim());
        if (isNaN(parsed)) {
            throw new Error("All product entropy values must be valid numbers");
        }
        sumProducts = sumProducts + parsed;
    }
    let sumReactants = 0;
    for (let i = 0; i < reactantParts.length; i++) {
        const parsed = parseFloat(reactantParts[i].trim());
        if (isNaN(parsed)) {
            throw new Error("All reactant entropy values must be valid numbers");
        }
        sumReactants = sumReactants + parsed;
    }
    const deltaS = sumProducts - sumReactants;
    return {
        value: "dS = " + fmt.format(deltaS, 4) + " J/(mol*K)",
        explanation: "dS = S(products) - S(reactants) = " + fmt.format(sumProducts, 4) + " - " + fmt.format(sumReactants, 4) + " = " + fmt.format(deltaS, 4) + " J/(mol*K)",
        metadata: {
            deltaS: deltaS,
            sumProducts: sumProducts,
            sumReactants: sumReactants,
            productCount: productParts.length,
            reactantCount: reactantParts.length
        }
    };
}

/**
 * Heat capacity: q = mcΔT. Solves for q, c, ΔT, or final temperature
 * depending on solveFor. mass in g, specific heat in J/(g·K), temperatures
 * in K, heat in J.
 */
export function heatCapacity(solveFor: string, mass: number, c: number, T_initial: number, T_final: number, q: number): CalculatorResult {
    const fmt = NumberFormatter.createFromCurrentLocale();
    if (solveFor === "q") {
        if (isNaN(mass) || isNaN(c) || isNaN(T_initial) || isNaN(T_final)) {
            throw new Error("Missing or invalid inputs for heat-cap-mass, heat-cap-specific-heat, heat-cap-initial-temp, heat-cap-final-temp");
        }
        if (mass <= 0) throw new Error("Mass must be positive");
        if (c <= 0) throw new Error("Specific heat must be positive");
        const deltaT = T_final - T_initial;
        const result = mass * c * deltaT;
        return {
            value: "Heat: " + fmt.format(result, 4) + " J",
            explanation: "q = m*c*dT = " + fmt.format(mass, 4) + " * " + fmt.format(c, 4) + " * " + fmt.format(deltaT, 4) + " = " + fmt.format(result, 4) + " J",
            metadata: { q: result, mass: mass, c: c, deltaT: deltaT, solveFor: solveFor }
        };
    } else if (solveFor === "c") {
        if (isNaN(mass) || isNaN(T_initial) || isNaN(T_final) || isNaN(q)) {
            throw new Error("Missing or invalid inputs for heat-cap-mass, heat-cap-initial-temp, heat-cap-final-temp, heat-cap-heat");
        }
        if (mass <= 0) throw new Error("Mass must be positive");
        const deltaT = T_final - T_initial;
        if (deltaT === 0) throw new Error("Temperature change cannot be zero");
        const result = q / (mass * deltaT);
        return {
            value: "Specific Heat: " + fmt.format(result, 4) + " J/(g*K)",
            explanation: "c = q/(m*dT) = " + fmt.format(q, 4) + " / (" + fmt.format(mass, 4) + " * " + fmt.format(deltaT, 4) + ") = " + fmt.format(result, 4) + " J/(g*K)",
            metadata: { c: result, mass: mass, q: q, deltaT: deltaT, solveFor: solveFor }
        };
    } else if (solveFor === "deltaT") {
        if (isNaN(mass) || isNaN(c) || isNaN(q)) {
            throw new Error("Missing or invalid inputs for heat-cap-mass, heat-cap-specific-heat, heat-cap-heat");
        }
        if (mass <= 0) throw new Error("Mass must be positive");
        if (c <= 0) throw new Error("Specific heat must be positive");
        const result = q / (mass * c);
        return {
            value: "Temperature Change: " + fmt.format(result, 4) + " K",
            explanation: "dT = q/(m*c) = " + fmt.format(q, 4) + " / (" + fmt.format(mass, 4) + " * " + fmt.format(c, 4) + ") = " + fmt.format(result, 4) + " K",
            metadata: { deltaT: result, mass: mass, c: c, q: q, solveFor: solveFor }
        };
    } else if (solveFor === "Tfinal") {
        if (isNaN(mass) || isNaN(c) || isNaN(T_initial) || isNaN(q)) {
            throw new Error("Missing or invalid inputs for heat-cap-mass, heat-cap-specific-heat, heat-cap-initial-temp, heat-cap-heat");
        }
        if (mass <= 0) throw new Error("Mass must be positive");
        if (c <= 0) throw new Error("Specific heat must be positive");
        const deltaT = q / (mass * c);
        const result = T_initial + deltaT;
        return {
            value: "Final Temperature: " + fmt.format(result, 4) + " K",
            explanation: "T_final = T_initial + q/(m*c) = " + fmt.format(T_initial, 4) + " + " + fmt.format(deltaT, 4) + " = " + fmt.format(result, 4) + " K",
            metadata: { Tfinal: result, Tinitial: T_initial, deltaT: deltaT, mass: mass, c: c, q: q, solveFor: solveFor }
        };
    } else {
        throw new Error("Invalid solve-for selection");
    }
}

const bondEnergies: Record<string, number> = {
    "C-H": 413,
    "C-C": 348,
    "C=C": 614,
    "C\u2261C": 839,
    "O-H": 463,
    "O=O": 495,
    "N\u2261N": 941,
    "C-O": 358,
    "C=O": 799,
    "H-H": 436
};

function parseBondList(raw: string, label: string): number {
    const entries = raw.split(",");
    let total = 0;
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i].trim();
        if (entry === "") continue;
        // Format: "bondType:count" or just "bondType" (count defaults to 1)
        const colonIndex = entry.indexOf(":");
        let bondType: string;
        let count: number;
        if (colonIndex >= 0) {
            bondType = entry.substring(0, colonIndex).trim();
            const countStr = entry.substring(colonIndex + 1).trim();
            count = parseFloat(countStr);
            if (isNaN(count)) {
                throw new Error("Invalid count for bond " + bondType + " in " + label + " bonds");
            }
            if (!isFinite(count) || count !== Math.floor(count) || count <= 0) {
                throw new Error("Bond count must be a positive integer for bond " + bondType + " in " + label + " bonds");
            }
        } else {
            bondType = entry;
            count = 1;
        }
        const energy = bondEnergies[bondType];
        if (energy === undefined) {
            throw new Error("Unknown bond type: " + bondType + ". Supported: C-H, C-C, C=C, C\u2261C, O-H, O=O, N\u2261N, C-O, C=O, H-H");
        }
        total = total + energy * count;
    }
    return total;
}

/** ΔH ≈ Σ(bonds broken) - Σ(bonds formed), using the built-in bond-energy table. */
export function bondEnthalpy(brokenRaw: string, formedRaw: string): CalculatorResult {
    const fmt = NumberFormatter.createFromCurrentLocale();
    const brokenTrimmed = brokenRaw.trim();
    const formedTrimmed = formedRaw.trim();
    if (brokenTrimmed === "" || formedTrimmed === "") {
        throw new Error("Please enter bond information for both broken and formed bonds");
    }
    const brokenEnergy = parseBondList(brokenTrimmed, "broken");
    const formedEnergy = parseBondList(formedTrimmed, "formed");
    const deltaH = brokenEnergy - formedEnergy;
    let processType: string;
    if (deltaH < 0) {
        processType = "Exothermic";
    } else if (deltaH > 0) {
        processType = "Endothermic";
    } else {
        processType = "Thermoneutral";
    }
    return {
        value: "Estimated dH = " + fmt.format(deltaH, 4) + " kJ/mol; Process: " + processType,
        explanation: "dH = bonds broken - bonds formed = " + fmt.format(brokenEnergy, 4) + " - " + fmt.format(formedEnergy, 4) + " = " + fmt.format(deltaH, 4) + " kJ/mol; Process: " + processType,
        metadata: {
            deltaH: deltaH,
            brokenEnergy: brokenEnergy,
            formedEnergy: formedEnergy,
            processType: processType
        }
    };
}

/**
 * Lattice energy U from the Born-Haber cycle:
 * U = ΔHf - ΔHsub - IE - ΔHdiss/2 - EA. All inputs in kJ/mol. EA uses the
 * "energy released on electron attachment" convention (negative when exothermic).
 */
export function bornHaber(dHf: number, dHsub: number, IE: number, dHdiss: number, EA: number): CalculatorResult {
    const fmt = NumberFormatter.createFromCurrentLocale();
    const U = dHf - dHsub - IE - (dHdiss / 2) - EA;
    return {
        value: "Lattice Energy U = " + fmt.format(U, 4) + " kJ/mol",
        explanation: "U = dHf - dHsub - IE - dHdiss/2 - EA = " + fmt.format(dHf, 4) + " - " + fmt.format(dHsub, 4) + " - " + fmt.format(IE, 4) + " - " + fmt.format(dHdiss / 2, 4) + " - " + fmt.format(EA, 4) + " = " + fmt.format(U, 4) + " kJ/mol (EA sign convention: energy released on electron attachment, negative when exothermic)",
        metadata: {
            U: U,
            dHf: dHf,
            dHsub: dHsub,
            IE: IE,
            dHdiss: dHdiss,
            EA: EA
        }
    };
}
