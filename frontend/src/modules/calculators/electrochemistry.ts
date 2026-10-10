import { NumberFormatter } from "../i18n/numberFormatter.js";
import type { CalculatorResult } from "./pureCalculator.js";

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

/**
 * Standard cell potential E°_cell from two half-reaction potentials. The
 * higher potential is the cathode, the lower is the anode.
 */
export function cellPotential(E1: number, E2: number): CalculatorResult {
    if (isNaN(E1) || isNaN(E2)) {
        throw new Error("Please enter valid numbers for both potentials.");
    }
    let nf: NumberFormatter = formatter();
    let E_cathode: number = Math.max(E1, E2);
    let E_anode: number = Math.min(E1, E2);
    let E_cell: number = E_cathode - E_anode;
    return {
        value: "E_cell = " + nf.format(E_cell, 3) + " V",
        explanation: "Cathode E = " + nf.format(E_cathode, 3) + " V; Anode E = " + nf.format(E_anode, 3) + " V; E_cell = E_cathode - E_anode = " + nf.format(E_cell, 3) + " V",
        metadata: {
            E_cell: E_cell,
            E_cathode: E_cathode,
            E_anode: E_anode,
            E1: E1,
            E2: E2
        }
    };
}

/**
 * Cell potential under non-standard conditions from the Nernst equation:
 * E = E° - (RT)/(nF) * ln(Q).
 */
export function nernst(EStandard: number, temperature: number, nElectrons: number, Q: number): CalculatorResult {
    let nf: NumberFormatter = formatter();
    if (isNaN(EStandard) || isNaN(temperature) || isNaN(nElectrons) || isNaN(Q) || temperature <= 0 || nElectrons <= 0 || Q <= 0) {
        throw new Error("Please enter valid positive numbers for all fields.");
    }
    if (nElectrons !== Math.floor(nElectrons)) {
        throw new Error("Number of electrons must be an integer");
    }
    let gasConstant: number = 8.314;
    let faradayConstant: number = 96485;
    let E: number = EStandard - ((gasConstant * temperature) / (nElectrons * faradayConstant)) * Math.log(Q);
    return {
        value: "E = " + nf.format(E, 3) + " V",
        explanation: "E = E_standard - (R*T/(n*F))*ln(Q) = " + nf.format(EStandard, 3) + " - (" + nf.format(gasConstant * temperature, 4) + "/(" + nf.format(nElectrons, 3) + " * " + faradayConstant + "))*ln(" + Q + ") = " + nf.format(E, 3) + " V",
        metadata: {
            E: E,
            E_standard: EStandard,
            temperature: temperature,
            n_electrons: nElectrons,
            Q: Q,
            gasConstant: gasConstant,
            faradayConstant: faradayConstant
        }
    };
}

/**
 * Faraday's law of electrolysis, solved for the variable named by
 * `solveFor` ("mass", "current", or "time").
 */
export function electrolysis(solveFor: string, m: number, I: number, t: number, z: number, M: number): CalculatorResult {
    let nf: NumberFormatter = formatter();
    let faradayConstant: number = 96485;
    if (solveFor === "mass") {
        if (isNaN(I) || isNaN(t) || isNaN(z) || isNaN(M) || I <= 0 || t <= 0 || z <= 0 || M <= 0) {
            throw new Error("Please enter valid positive numbers for I, t, z, and M.");
        }
        if (z !== Math.floor(z)) {
            throw new Error("Charge number z must be an integer");
        }
        let n: number = (I * t) / (faradayConstant * z);
        let mass: number = n * M;
        return {
            value: "Mass deposited m = " + nf.format(mass, 3) + " g",
            explanation: "n = (I*t)/(F*z) = " + nf.format(n, 6) + " mol; m = n*M = " + nf.format(mass, 3) + " g",
            metadata: { mass: mass, moles: n, I: I, t: t, z: z, M: M, solveFor: solveFor }
        };
    }
    if (solveFor === "current") {
        if (isNaN(m) || isNaN(t) || isNaN(z) || isNaN(M) || m <= 0 || t <= 0 || z <= 0 || M <= 0) {
            throw new Error("Please enter valid positive numbers for m, t, z, and M.");
        }
        if (z !== Math.floor(z)) {
            throw new Error("Charge number z must be an integer");
        }
        let n: number = m / M;
        let current: number = (n * faradayConstant * z) / t;
        return {
            value: "Current I = " + nf.format(current, 3) + " A",
            explanation: "n = m/M = " + nf.format(n, 6) + " mol; I = (n*F*z)/t = " + nf.format(current, 3) + " A",
            metadata: { current: current, moles: n, m: m, t: t, z: z, M: M, solveFor: solveFor }
        };
    }
    if (solveFor === "time") {
        if (isNaN(m) || isNaN(I) || isNaN(z) || isNaN(M) || m <= 0 || I <= 0 || z <= 0 || M <= 0) {
            throw new Error("Please enter valid positive numbers for m, I, z, and M.");
        }
        if (z !== Math.floor(z)) {
            throw new Error("Charge number z must be an integer");
        }
        let n: number = m / M;
        let time: number = (n * faradayConstant * z) / I;
        return {
            value: "Time t = " + nf.format(time, 3) + " s",
            explanation: "n = m/M = " + nf.format(n, 6) + " mol; t = (n*F*z)/I = " + nf.format(time, 3) + " s",
            metadata: { time: time, moles: n, m: m, I: I, t: t, z: z, M: M, solveFor: solveFor }
        };
    }
    throw new Error("Invalid solve-for selection");
}
