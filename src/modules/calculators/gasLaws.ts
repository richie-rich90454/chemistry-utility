import { NumberFormatter } from "../i18n/numberFormatter.js";
import type { CalculatorResult } from "./pureCalculator.js";

const R_ATM_L = 0.08206;
const R_SI = 8.314;
const VDW_R = 0.08206;

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

function readText(inputs: Record<string, string>, key: string): string {
    return inputs[key] ?? "";
}

function readNumber(inputs: Record<string, string>, key: string): number {
    return parseFloat(inputs[key] ?? "");
}

/**
 * Solved gas-law state: the worked formula, its numeric result, and the
 * unit the result carries. The legacy DOM views render this triple
 * through `ResultDisplay.showFormula`, while the pure results below
 * format the same numbers into the {@link CalculatorResult} contract.
 */
export interface GasLawDisplay {
    formula: string;
    result: number;
    unit: string;
}

/** Ideal gas law outcome: a {@link GasLawDisplay} plus the units it was solved in. */
export interface IdealGasDisplay extends GasLawDisplay {
    volumeUnit: string;
    units: string;
}

/**
 * Resolves the volume unit for the ideal gas law. Reads the optional
 * "ideal-volume-unit" input (values "L" or "m\u00b3"); when it is absent
 * it defaults to the R-consistent unit - litres for atm-L, cubic metres
 * for SI - so SI results are never 1000x off.
 */
export function resolveVolumeUnit(raw: string | undefined | null, units: string): string {
    let volUnit: string = raw ? raw : (units === "SI" ? "m\u00b3" : "L");
    if (volUnit !== "L" && volUnit !== "m\u00b3") {
        throw new Error('Volume unit must be "L" or "m\u00b3"');
    }
    return volUnit;
}

/** Converts a user-entered volume to litres. */
export function toLitres(V: number, volUnit: string): number {
    return volUnit === "m\u00b3" ? V * 1000 : V;
}

/** Converts a user-entered volume to cubic metres. */
export function toCubicMetres(V: number, volUnit: string): number {
    return volUnit === "L" ? V / 1000 : V;
}

/**
 * Solves the ideal gas law PV = nRT for any one of P, V, n, or T,
 * determined by the "ideal-solve-for" input. The gas constant R is
 * selected from "ideal-R-units" (atm-L or SI) and the volume unit from
 * the optional "ideal-volume-unit" input.
 */
export function solveIdealGas(inputs: Record<string, string>): IdealGasDisplay {
    const solveFor = readText(inputs, "ideal-solve-for");
    const units = readText(inputs, "ideal-R-units");
    const R = units === "atm-L" ? R_ATM_L : R_SI;
    const volUnit = resolveVolumeUnit(readText(inputs, "ideal-volume-unit"), units);
    const P = readNumber(inputs, "ideal-P");
    const V = readNumber(inputs, "ideal-V");
    const n = readNumber(inputs, "ideal-n");
    const T = readNumber(inputs, "ideal-T");
    let result: number;
    let formula: string;
    if (solveFor === "P") {
        if (isNaN(V) || isNaN(n) || isNaN(T)) {
            throw new Error("Missing or invalid inputs for ideal-V, ideal-n, ideal-T");
        }
        const Vcalc = units === "atm-L" ? toLitres(V, volUnit) : toCubicMetres(V, volUnit);
        if (Vcalc === 0) throw new Error("Volume cannot be zero");
        result = (n * R * T) / Vcalc;
        formula = "P=(nRT)/V";
    } else if (solveFor === "V") {
        if (isNaN(P) || isNaN(n) || isNaN(T)) {
            throw new Error("Missing or invalid inputs for ideal-P, ideal-n, ideal-T");
        }
        if (P === 0) throw new Error("Pressure cannot be zero");
        const Vcalc = (n * R * T) / P;
        result = units === "atm-L" ? (volUnit === "m\u00b3" ? Vcalc / 1000 : Vcalc) : (volUnit === "L" ? Vcalc * 1000 : Vcalc);
        formula = "V=(nRT)/P";
    } else if (solveFor === "n") {
        if (isNaN(P) || isNaN(V) || isNaN(T)) {
            throw new Error("Missing or invalid inputs for ideal-P, ideal-V, ideal-T");
        }
        if (T === 0) throw new Error("Temperature cannot be zero");
        const Vcalc = units === "atm-L" ? toLitres(V, volUnit) : toCubicMetres(V, volUnit);
        result = (P * Vcalc) / (R * T);
        formula = "n=(PV)/(RT)";
    } else if (solveFor === "T") {
        if (isNaN(P) || isNaN(V) || isNaN(n)) {
            throw new Error("Missing or invalid inputs for ideal-P, ideal-V, ideal-n");
        }
        if (n === 0) throw new Error("Moles cannot be zero");
        const Vcalc = units === "atm-L" ? toLitres(V, volUnit) : toCubicMetres(V, volUnit);
        result = (P * Vcalc) / (n * R);
        formula = "T=(PV)/(nR)";
    } else {
        throw new Error("Invalid solveFor");
    }
    let unit: string;
    if (solveFor === "P") {
        unit = units === "atm-L" ? "atm" : "Pa";
    } else if (solveFor === "V") {
        unit = volUnit;
    } else if (solveFor === "n") {
        unit = "mol";
    } else {
        unit = "K";
    }
    return { "formula": formula, "result": result, "unit": unit, "volumeUnit": volUnit, "units": units };
}

/** Solves the ideal gas law PV = nRT and reports the worked result. */
export function idealGas(inputs: Record<string, string>): CalculatorResult {
    const solve = solveIdealGas(inputs);
    const formatted = formatter().format(solve.result, 4);
    return {
        value: formatted + " " + solve.unit,
        explanation: solve.formula + " = " + formatted + " " + solve.unit,
        metadata: { volumeUnit: solve.volumeUnit, units: solve.units }
    };
}

/**
 * Solves the combined gas law (P1*V1)/T1 = (P2*V2)/T2 for any one of the
 * six variables, determined by the "combined-solve-for" input.
 */
export function solveCombinedGas(inputs: Record<string, string>): GasLawDisplay {
    const solveFor = readText(inputs, "combined-solve-for");
    const P1 = readNumber(inputs, "combined-P1");
    const V1 = readNumber(inputs, "combined-V1");
    const T1 = readNumber(inputs, "combined-T1");
    const P2 = readNumber(inputs, "combined-P2");
    const V2 = readNumber(inputs, "combined-V2");
    const T2 = readNumber(inputs, "combined-T2");
    let result: number;
    let formula: string;
    if (solveFor === "P1") {
        if (isNaN(V1) || isNaN(T1) || isNaN(P2) || isNaN(V2) || isNaN(T2)) {
            throw new Error("Missing or invalid inputs for combined-V1, combined-T1, combined-P2, combined-V2, combined-T2");
        }
        if (V1 === 0 || T2 === 0) throw new Error("V1 and T2 cannot be zero");
        result = (P2 * V2 * T1) / (V1 * T2);
        formula = "P<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(V<sub>1</sub> T<sub>2</sub>)";
    } else if (solveFor === "V1") {
        if (isNaN(P1) || isNaN(T1) || isNaN(P2) || isNaN(V2) || isNaN(T2)) {
            throw new Error("Missing or invalid inputs for combined-P1, combined-T1, combined-P2, combined-V2, combined-T2");
        }
        if (P1 === 0 || T2 === 0) throw new Error("P1 and T2 cannot be zero");
        result = (P2 * V2 * T1) / (P1 * T2);
        formula = "V<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> T<sub>2</sub>)";
    } else if (solveFor === "T1") {
        if (isNaN(P1) || isNaN(V1) || isNaN(P2) || isNaN(V2) || isNaN(T2)) {
            throw new Error("Missing or invalid inputs for combined-P1, combined-V1, combined-P2, combined-V2, combined-T2");
        }
        if (P2 === 0 || V2 === 0) throw new Error("P2 and V2 cannot be zero");
        result = (P1 * V1 * T2) / (P2 * V2);
        formula = "T<sub>1</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> V<sub>2</sub>)";
    } else if (solveFor === "P2") {
        if (isNaN(P1) || isNaN(V1) || isNaN(T1) || isNaN(V2) || isNaN(T2)) {
            throw new Error("Missing or invalid inputs for combined-P1, combined-V1, combined-T1, combined-V2, combined-T2");
        }
        if (V2 === 0 || T1 === 0) throw new Error("V2 and T1 cannot be zero");
        result = (P1 * V1 * T2) / (V2 * T1);
        formula = "P<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(V<sub>2</sub> T<sub>1</sub>)";
    } else if (solveFor === "V2") {
        if (isNaN(P1) || isNaN(V1) || isNaN(T1) || isNaN(P2) || isNaN(T2)) {
            throw new Error("Missing or invalid inputs for combined-P1, combined-V1, combined-T1, combined-P2, combined-T2");
        }
        if (P2 === 0 || T1 === 0) throw new Error("P2 and T1 cannot be zero");
        result = (P1 * V1 * T2) / (P2 * T1);
        formula = "V<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> T<sub>1</sub>)";
    } else if (solveFor === "T2") {
        if (isNaN(P1) || isNaN(V1) || isNaN(T1) || isNaN(P2) || isNaN(V2)) {
            throw new Error("Missing or invalid inputs for combined-P1, combined-V1, combined-T1, combined-P2, combined-V2");
        }
        if (P1 === 0 || V1 === 0) throw new Error("P1 and V1 cannot be zero");
        result = (P2 * V2 * T1) / (P1 * V1);
        formula = "T<sub>2</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> V<sub>1</sub>)";
    } else {
        throw new Error("Invalid solveFor");
    }
    let unit: string = "";
    if (solveFor.includes("P")) {
        unit = "pressure units";
    } else if (solveFor.includes("V")) {
        unit = "volume units";
    } else {
        // solveFor is validated above to one of P1/V1/T1/P2/V2/T2, so
        // reaching here means it contains "T".
        unit = "K";
    }
    return { "formula": formula, "result": result, "unit": unit };
}

/** Solves the combined gas law and reports the worked result. */
export function combinedGas(inputs: Record<string, string>): CalculatorResult {
    const solve = solveCombinedGas(inputs);
    const formatted = formatter().format(solve.result, 4);
    return {
        value: formatted + " " + solve.unit,
        explanation: solve.formula + " = " + formatted + " " + solve.unit
    };
}

/** Calculates pressure using the Van der Waals equation of state. */
export function vanDerWaals(inputs: Record<string, string>): CalculatorResult {
    const V = readNumber(inputs, "vdw-V");
    const n = readNumber(inputs, "vdw-n");
    const T = readNumber(inputs, "vdw-T");
    const a = readNumber(inputs, "vdw-a");
    const b = readNumber(inputs, "vdw-b");
    if (isNaN(V) || isNaN(n) || isNaN(T) || isNaN(a) || isNaN(b)) {
        throw new Error("Missing or invalid inputs for vdw-V, vdw-n, vdw-T, vdw-a, vdw-b");
    }
    if (V <= 0) throw new Error("Volume must be positive");
    if (n <= 0) throw new Error("Moles must be positive");
    if (T <= 0) throw new Error("Temperature must be positive (Kelvin)");
    if (a < 0 || b < 0) throw new Error("Van der Waals constants a and b cannot be negative");
    if (V - n * b <= 0) throw new Error("Volume is too small for the given amount of gas (V must be greater than n*b)");
    const P = (n * VDW_R * T) / (V - n * b) - a * Math.pow(n / V, 2);
    const formatted = formatter().format(P, 4);
    return {
        value: "P=" + formatted + " atm",
        explanation: "P=(nRT)/(V-nb) - a(n/V)\u00b2 = " + formatted + " atm (R = 0.08206 L\u00b7atm/(mol\u00b7K))"
    };
}

/**
 * Solves radioactive decay problems for remaining quantity, time
 * elapsed, or half-life, determined by the "half-life-solve-for" input.
 */
export function halfLife(inputs: Record<string, string>): CalculatorResult {
    const solveFor = readText(inputs, "half-life-solve-for");
    const N0 = readNumber(inputs, "initial-quantity");
    const t = readNumber(inputs, "time-input");
    const t_half = readNumber(inputs, "half-life-input");
    const Nt = readNumber(inputs, "remaining-quantity");
    if (solveFor === "remaining") {
        if (isNaN(N0) || isNaN(t) || isNaN(t_half)) {
            throw new Error("Missing or invalid inputs for initial-quantity, time-input, half-life-input");
        }
        if (t_half <= 0) throw new Error("Half-life must be positive");
        if (N0 <= 0) throw new Error("Initial quantity must be positive");
        if (t < 0) throw new Error("Time cannot be negative");
        const result = N0 * Math.pow(0.5, t / t_half);
        const formatted = formatter().format(result, 4);
        return {
            value: "Remaining: " + formatted + " (after " + t + " units)",
            explanation: "Nt = N0 \u00d7 (0.5)^(t/t_half) = " + formatted
        };
    } else if (solveFor === "time") {
        if (isNaN(N0) || isNaN(t_half) || isNaN(Nt)) {
            throw new Error("Missing or invalid inputs for initial-quantity, half-life-input, remaining-quantity");
        }
        if (t_half <= 0) throw new Error("Half-life must be positive");
        if (N0 <= 0) throw new Error("Initial quantity must be positive");
        if (Nt <= 0) throw new Error("Remaining quantity must be positive");
        if (Nt >= N0) throw new Error("Remaining quantity must be less than initial quantity (decay only decreases quantity)");
        const result = (Math.log(Nt / N0) / Math.log(0.5)) * t_half;
        const formatted = formatter().format(result, 4);
        return {
            value: "Time needed: " + formatted + " units",
            explanation: "t = (ln(Nt/N0) / ln(0.5)) \u00d7 t_half = " + formatted + " units"
        };
    } else if (solveFor === "half-life") {
        if (isNaN(N0) || isNaN(t) || isNaN(Nt)) {
            throw new Error("Missing or invalid inputs for initial-quantity, time-input, remaining-quantity");
        }
        if (N0 <= 0) throw new Error("Initial quantity must be positive");
        if (Nt <= 0) throw new Error("Remaining quantity must be positive");
        if (Nt >= N0) throw new Error("Remaining quantity must be less than initial quantity");
        if (t <= 0) throw new Error("Time must be positive");
        const result = t / (Math.log(Nt / N0) / Math.log(0.5));
        const formatted = formatter().format(result, 4);
        return {
            value: "Half-life: " + formatted + " units",
            explanation: "t_half = t / (ln(Nt/N0) / ln(0.5)) = " + formatted + " units"
        };
    } else {
        throw new Error("Invalid solve-for selection");
    }
}
