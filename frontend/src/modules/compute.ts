/**
 * Pure compute functions for chemistry calculations.
 * These do NOT depend on DOM and can run in Node CLI, web workers,
 * or any JavaScript runtime. Each function takes numeric inputs
 * and returns a numeric result, throwing on invalid input.
 */

export interface DilutionInput {
    M1: number;
    V1: number;
    M2: number;
    V2: number;
}
export type DilutionSolveFor = "M1" | "V1" | "M2" | "V2";

export function computeDilution(input: DilutionInput, solveFor: DilutionSolveFor): number {
    let M1 = input.M1;
    let V1 = input.V1;
    let M2 = input.M2;
    let V2 = input.V2;
    if (solveFor !== "M1" && M1 <= 0) throw new Error("Initial molarity must be positive");
    if (solveFor !== "M2" && M2 <= 0) throw new Error("Final molarity must be positive");
    if (solveFor !== "V1" && V1 <= 0) throw new Error("Initial volume must be positive");
    if (solveFor !== "V2" && V2 <= 0) throw new Error("Final volume must be positive");
    if (solveFor === "M1") {
        if (V1 <= 0) throw new Error("Initial volume must be positive");
        return (M2 * V2) / V1;
    }
    if (solveFor === "V1") {
        if (M1 <= 0) throw new Error("Initial molarity must be positive");
        return (M2 * V2) / M1;
    }
    if (solveFor === "M2") {
        if (V2 <= 0) throw new Error("Final volume must be positive");
        return (M1 * V1) / V2;
    }
    if (solveFor === "V2") {
        if (M2 <= 0) throw new Error("Final molarity must be positive");
        return (M1 * V1) / M2;
    }
    throw new Error("Invalid solveFor: " + solveFor);
}

export interface IdealGasInput {
    P: number;
    V: number;
    n: number;
    T: number;
    R: number;
}
export type IdealGasSolveFor = "P" | "V" | "n" | "T";

export function computeIdealGasLaw(input: IdealGasInput, solveFor: IdealGasSolveFor): number {
    let P = input.P;
    let V = input.V;
    let n = input.n;
    let T = input.T;
    let R = input.R;
    if (R <= 0) throw new Error("Gas constant R must be positive");
    if (solveFor === "P") {
        if (V <= 0) throw new Error("Volume must be positive");
        if (n <= 0) throw new Error("Moles must be positive");
        if (T <= 0) throw new Error("Temperature must be positive");
        return (n * R * T) / V;
    }
    if (solveFor === "V") {
        if (P <= 0) throw new Error("Pressure must be positive");
        if (n <= 0) throw new Error("Moles must be positive");
        if (T <= 0) throw new Error("Temperature must be positive");
        return (n * R * T) / P;
    }
    if (solveFor === "n") {
        if (P <= 0) throw new Error("Pressure must be positive");
        if (V <= 0) throw new Error("Volume must be positive");
        if (T <= 0) throw new Error("Temperature must be positive");
        return (P * V) / (R * T);
    }
    if (solveFor === "T") {
        if (P <= 0) throw new Error("Pressure must be positive");
        if (V <= 0) throw new Error("Volume must be positive");
        if (n <= 0) throw new Error("Moles must be positive");
        return (P * V) / (n * R);
    }
    throw new Error("Invalid solveFor: " + solveFor);
}

export interface CombinedGasInput {
    P1: number;
    V1: number;
    T1: number;
    P2: number;
    V2: number;
    T2: number;
}
export type CombinedGasSolveFor = "P1" | "V1" | "T1" | "P2" | "V2" | "T2";

export function computeCombinedGasLaw(input: CombinedGasInput, solveFor: CombinedGasSolveFor): number {
    let P1 = input.P1;
    let V1 = input.V1;
    let T1 = input.T1;
    let P2 = input.P2;
    let V2 = input.V2;
    let T2 = input.T2;
    if (solveFor !== "P1" && P1 <= 0) throw new Error("P1 must be positive");
    if (solveFor !== "V1" && V1 <= 0) throw new Error("V1 must be positive");
    if (solveFor !== "T1" && T1 <= 0) throw new Error("T1 must be positive");
    if (solveFor !== "P2" && P2 <= 0) throw new Error("P2 must be positive");
    if (solveFor !== "V2" && V2 <= 0) throw new Error("V2 must be positive");
    if (solveFor !== "T2" && T2 <= 0) throw new Error("T2 must be positive");
    if (solveFor === "P1") {
        return (P2 * V2 * T1) / (T2 * V1);
    }
    if (solveFor === "V1") {
        return (P2 * V2 * T1) / (T2 * P1);
    }
    if (solveFor === "T1") {
        return (T2 * P1 * V1) / (P2 * V2);
    }
    if (solveFor === "P2") {
        return (P1 * V1 * T2) / (T1 * V2);
    }
    if (solveFor === "V2") {
        return (P1 * V1 * T2) / (T1 * P2);
    }
    if (solveFor === "T2") {
        return (T1 * P2 * V2) / (P1 * V1);
    }
    throw new Error("Invalid solveFor: " + solveFor);
}

export interface BoyleInput {
    P1: number;
    V1: number;
    P2: number;
    V2: number;
}
export type BoyleSolveFor = "P1" | "V1" | "P2" | "V2";

export function computeBoylesLaw(input: BoyleInput, solveFor: BoyleSolveFor): number {
    let P1 = input.P1;
    let V1 = input.V1;
    let P2 = input.P2;
    let V2 = input.V2;
    if (solveFor !== "P1" && P1 <= 0) throw new Error("P1 must be positive");
    if (solveFor !== "V1" && V1 <= 0) throw new Error("V1 must be positive");
    if (solveFor !== "P2" && P2 <= 0) throw new Error("P2 must be positive");
    if (solveFor !== "V2" && V2 <= 0) throw new Error("V2 must be positive");
    if (solveFor === "P1") return (P2 * V2) / V1;
    if (solveFor === "V1") return (P2 * V2) / P1;
    if (solveFor === "P2") return (P1 * V1) / V2;
    if (solveFor === "V2") return (P1 * V1) / P2;
    throw new Error("Invalid solveFor: " + solveFor);
}

export interface CharlesInput {
    V1: number;
    T1: number;
    V2: number;
    T2: number;
}
export type CharlesSolveFor = "V1" | "T1" | "V2" | "T2";

export function computeCharlesLaw(input: CharlesInput, solveFor: CharlesSolveFor): number {
    let V1 = input.V1;
    let T1 = input.T1;
    let V2 = input.V2;
    let T2 = input.T2;
    if (solveFor !== "V1" && V1 <= 0) throw new Error("V1 must be positive");
    if (solveFor !== "T1" && T1 <= 0) throw new Error("T1 must be positive");
    if (solveFor !== "V2" && V2 <= 0) throw new Error("V2 must be positive");
    if (solveFor !== "T2" && T2 <= 0) throw new Error("T2 must be positive");
    if (solveFor === "V1") return (V2 * T1) / T2;
    if (solveFor === "T1") return (T2 * V1) / V2;
    if (solveFor === "V2") return (V1 * T2) / T1;
    if (solveFor === "T2") return (T1 * V2) / V1;
    throw new Error("Invalid solveFor: " + solveFor);
}

export interface MassPercentInput {
    soluteMass: number;
    solutionMass: number;
    unit: "percent" | "ppm" | "ppb";
}

export function computeMassPercent(input: MassPercentInput): number {
    let solute = input.soluteMass;
    let solution = input.solutionMass;
    if (solution === 0) throw new Error("Solution mass cannot be zero");
    if (solute < 0) throw new Error("Solute mass cannot be negative");
    let ratio = solute / solution;
    if (input.unit === "percent") return ratio * 100;
    if (input.unit === "ppm") return ratio * 1000000;
    if (input.unit === "ppb") return ratio * 1000000000;
    throw new Error("Invalid unit: " + input.unit);
}

export interface MixingInput {
    C1: number;
    V1: number;
    C2: number;
    V2: number;
}

export interface MixingResult {
    finalConcentration: number;
    totalVolume: number;
}

export function computeMixing(input: MixingInput): MixingResult {
    let C1 = input.C1;
    let V1 = input.V1;
    let C2 = input.C2;
    let V2 = input.V2;
    if (C1 <= 0) throw new Error("First solution concentration must be positive");
    if (C2 <= 0) throw new Error("Second solution concentration must be positive");
    if (V1 <= 0) throw new Error("First solution volume must be positive");
    if (V2 <= 0) throw new Error("Second solution volume must be positive");
    let totalMoles = (C1 * V1) + (C2 * V2);
    let totalVolume = V1 + V2;
    return {
        finalConcentration: totalMoles / totalVolume,
        totalVolume: totalVolume
    };
}

export interface PHInput {
    H: number;
}

export function computePH(H: number): number {
    if (H <= 0) throw new Error("H+ concentration must be positive");
    return -Math.log10(H);
}

export interface BufferInput {
    pKa: number;
    HA: number;
    Aminus: number;
}

export function computeBufferPH(input: BufferInput): number {
    if (input.HA <= 0) throw new Error("[HA] must be positive");
    if (input.Aminus <= 0) throw new Error("[A-] must be positive");
    return input.pKa + Math.log10(input.Aminus / input.HA);
}

export interface FirstOrderHalfLifeInput {
    k: number;
}

export function computeFirstOrderHalfLife(k: number): number {
    if (k <= 0) throw new Error("Rate constant must be positive");
    return Math.log(2) / k;
}
