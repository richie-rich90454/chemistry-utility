import { NumberFormatter } from "../i18n/numberFormatter.js";
import type { CalculatorResult } from "./pureCalculator.js";

/**
 * A single point on the titration curve. The DOM chart layer consumes this
 * shape via chartBindings.renderTitrationCurve; it is declared here so the
 * pure layer never imports the Chart.js-backed renderer.
 */
export interface TitrationCurvePoint {
    volume: number;
    pH: number;
}

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

/**
 * Dilution M1*V1 = M2*V2, solved for the variable named by
 * "dilution-solve-for" (M1, V1, M2, or V2).
 */
export function dilution(inputs: Record<string, string>): CalculatorResult {
    const solveFor = inputs["dilution-solve-for"] ?? "";
    const M1 = parseFloat(inputs["dilution-M1"] ?? "");
    const V1 = parseFloat(inputs["dilution-V1"] ?? "");
    const M2 = parseFloat(inputs["dilution-M2"] ?? "");
    const V2 = parseFloat(inputs["dilution-V2"] ?? "");
    let result: number;
    let formula: string;
    if (solveFor === "M1") {
        if (isNaN(V1) || isNaN(M2) || isNaN(V2)) {
            throw new Error("Missing or invalid inputs for dilution-V1, dilution-M2, dilution-V2");
        }
        if (V1 <= 0) throw new Error("Initial volume must be positive");
        if (M2 <= 0) throw new Error("Final molarity must be positive");
        if (V2 <= 0) throw new Error("Final volume must be positive");
        result = (M2 * V2) / V1;
        formula = "M1 = (M2 * V2) / V1";
    } else if (solveFor === "V1") {
        if (isNaN(M1) || isNaN(M2) || isNaN(V2)) {
            throw new Error("Missing or invalid inputs for dilution-M1, dilution-M2, dilution-V2");
        }
        if (M1 <= 0) throw new Error("Initial molarity must be positive");
        if (M2 <= 0) throw new Error("Final molarity must be positive");
        if (V2 <= 0) throw new Error("Final volume must be positive");
        result = (M2 * V2) / M1;
        formula = "V1 = (M2 * V2) / M1";
    } else if (solveFor === "M2") {
        if (isNaN(M1) || isNaN(V1) || isNaN(V2)) {
            throw new Error("Missing or invalid inputs for dilution-M1, dilution-V1, dilution-V2");
        }
        if (M1 <= 0) throw new Error("Initial molarity must be positive");
        if (V1 <= 0) throw new Error("Initial volume must be positive");
        if (V2 <= 0) throw new Error("Final volume must be positive");
        result = (M1 * V1) / V2;
        formula = "M2 = (M1 * V1) / V2";
    } else if (solveFor === "V2") {
        if (isNaN(M1) || isNaN(V1) || isNaN(M2)) {
            throw new Error("Missing or invalid inputs for dilution-M1, dilution-V1, dilution-M2");
        }
        if (M1 <= 0) throw new Error("Initial molarity must be positive");
        if (V1 <= 0) throw new Error("Initial volume must be positive");
        if (M2 <= 0) throw new Error("Final molarity must be positive");
        result = (M1 * V1) / M2;
        formula = "V2 = (M1 * V1) / M2";
    } else {
        throw new Error("Invalid calculation type");
    }
    const unit = solveFor.startsWith("M") ? "M" : "L";
    const nf = formatter();
    const formatted = nf.format(result, 4);
    return {
        value: formatted + " " + unit,
        explanation: formula + " = " + formatted + " " + unit,
        metadata: { solveFor: solveFor, result: result, unit: unit, formula: formula }
    };
}

/** Mass-based concentration (percent, ppm, or ppb) from solute and solution masses. */
export function massPercent(inputs: Record<string, string>): CalculatorResult {
    const solute = parseFloat(inputs["mass-solute"] ?? "");
    const solution = parseFloat(inputs["mass-solution"] ?? "");
    const unit = inputs["concentration-unit"] || "percent";
    if (isNaN(solute) || isNaN(solution)) {
        throw new Error("Missing or invalid inputs for mass-solute, mass-solution");
    }
    if (solution === 0) {
        throw new Error("Solution mass cannot be zero");
    }
    if (solute < 0) throw new Error("Solute mass cannot be negative");
    const ratio = solute / solution;
    let result: number;
    let unitText: string;
    if (unit === "percent") {
        result = ratio * 100;
        unitText = "%";
    } else if (unit === "ppm") {
        result = ratio * 1000000;
        unitText = "ppm";
    } else if (unit === "ppb") {
        result = ratio * 1000000000;
        unitText = "ppb";
    } else {
        throw new Error("Invalid unit");
    }
    const nf = formatter();
    const formatted = nf.format(result, 4);
    return {
        value: formatted + " " + unitText,
        explanation: "Concentration: " + formatted + " " + unitText,
        metadata: { concentration: result, unit: unitText, ratio: ratio, solute: solute, solution: solution }
    };
}

/** Final concentration and total volume when mixing two solutions. */
export function solutionMixing(inputs: Record<string, string>): CalculatorResult {
    const C1 = parseFloat(inputs["mix-C1"] ?? "");
    const V1 = parseFloat(inputs["mix-V1"] ?? "");
    const C2 = parseFloat(inputs["mix-C2"] ?? "");
    const V2 = parseFloat(inputs["mix-V2"] ?? "");
    if (isNaN(C1) || isNaN(V1) || isNaN(C2) || isNaN(V2)) {
        throw new Error("Missing or invalid inputs for mix-C1, mix-V1, mix-C2, mix-V2");
    }
    if (C1 <= 0) throw new Error("First solution concentration must be positive");
    if (C2 <= 0) throw new Error("Second solution concentration must be positive");
    if (V1 <= 0) throw new Error("First solution volume must be positive");
    if (V2 <= 0) throw new Error("Second solution volume must be positive");
    const totalMoles = (C1 * V1) + (C2 * V2);
    const totalVolume = V1 + V2;
    const finalConcentration = totalMoles / totalVolume;
    const nf = formatter();
    const fcFormatted = nf.format(finalConcentration, 4);
    const tvFormatted = nf.format(totalVolume, 4);
    return {
        value: fcFormatted + " M",
        explanation: "Final Concentration: " + fcFormatted + " M; Total Volume: " + tvFormatted + " L",
        metadata: { finalConcentration: finalConcentration, totalVolume: totalVolume, totalMoles: totalMoles }
    };
}

/** Henderson-Hasselbalch pH = pKa + log([A-]/[HA]); also solves for pKa or ratio. */
export function bufferSolution(inputs: Record<string, string>): CalculatorResult {
    const pKa = parseFloat(inputs["buffer-pKa"] ?? "");
    const HA = parseFloat(inputs["buffer-HA"] ?? "");
    const Aminus = parseFloat(inputs["buffer-Aminus"] ?? "");
    const pH = parseFloat(inputs["buffer-pH"] ?? "");
    const solveFor = inputs["buffer-solve-for"] || "pH";
    let resultpH: number, resultpKa: number, resultRatio: number;
    if (solveFor === "pH") {
        if (isNaN(pKa)) throw new Error("pKa is required");
        if (isNaN(HA) || isNaN(Aminus)) throw new Error("[HA] and [A-] are required");
        if (HA <= 0) throw new Error("[HA] must be positive");
        if (Aminus <= 0) throw new Error("[A-] must be positive");
        resultRatio = Aminus / HA;
        resultpH = pKa + Math.log10(resultRatio);
        resultpKa = pKa;
    } else if (solveFor === "pKa") {
        if (isNaN(pH)) throw new Error("pH is required");
        if (isNaN(HA) || isNaN(Aminus)) throw new Error("[HA] and [A-] are required");
        if (HA <= 0) throw new Error("[HA] must be positive");
        if (Aminus <= 0) throw new Error("[A-] must be positive");
        resultRatio = Aminus / HA;
        resultpKa = pH - Math.log10(resultRatio);
        resultpH = pH;
    } else if (solveFor === "ratio") {
        if (isNaN(pKa)) throw new Error("pKa is required");
        if (isNaN(pH)) throw new Error("pH is required");
        resultpH = pH;
        resultpKa = pKa;
        resultRatio = Math.pow(10, pH - pKa);
    } else {
        throw new Error("Invalid solve-for selection");
    }
    let bufferCapacity: string;
    let logRatio = Math.abs(Math.log10(resultRatio));
    if (logRatio <= 1) {
        bufferCapacity = "Good (ratio within 10:1)";
    } else {
        bufferCapacity = "Poor (ratio outside 10:1)";
    }
    let nf = formatter();
    let value: string;
    if (solveFor === "pH") {
        value = "pH = " + nf.format(resultpH, 4);
    } else if (solveFor === "pKa") {
        value = "pKa = " + nf.format(resultpKa, 4);
    } else {
        value = "[A-]/[HA] = " + nf.format(resultRatio, 4);
    }
    let explanation: string = "pH = " + nf.format(resultpH, 4) + "; ";
    explanation += "pKa = " + nf.format(resultpKa, 4) + "; ";
    explanation += "[A-]/[HA] = " + nf.format(resultRatio, 4) + "; ";
    explanation += "Buffer Capacity: " + bufferCapacity;
    return {
        value: value,
        explanation: explanation,
        metadata: {
            pH: resultpH,
            pKa: resultpKa,
            ratio: resultRatio,
            bufferCapacity: bufferCapacity,
            solveFor: solveFor
        }
    };
}

/** pKa/pKb relationship: pKa + pKb = 14 and Ka*Kb = Kw. */
export function pKaPKb(inputs: Record<string, string>): CalculatorResult {
    const inputValue = parseFloat(inputs["pka-pkb-input-value"] ?? "");
    const inputType = inputs["pka-pkb-input-type"] || "Ka";
    if (isNaN(inputValue) || inputValue <= 0) throw new Error("Input value must be a positive number");
    let Ka: number, pKa: number, Kb: number, pKb: number;
    if (inputType === "Ka") {
        Ka = inputValue;
        pKa = -Math.log10(Ka);
        pKb = 14 - pKa;
        Kb = Math.pow(10, -pKb);
    } else if (inputType === "pKa") {
        pKa = inputValue;
        Ka = Math.pow(10, -pKa);
        pKb = 14 - pKa;
        Kb = Math.pow(10, -pKb);
    } else if (inputType === "Kb") {
        Kb = inputValue;
        pKb = -Math.log10(Kb);
        pKa = 14 - pKb;
        Ka = Math.pow(10, -pKa);
    } else if (inputType === "pKb") {
        pKb = inputValue;
        Kb = Math.pow(10, -pKb);
        pKa = 14 - pKb;
        Ka = Math.pow(10, -pKa);
    } else {
        throw new Error("Invalid input type");
    }
    const Kw = Ka * Kb;
    let nf = formatter();
    let explanation: string = "Ka = " + nf.format(Ka, 6) + "; ";
    explanation += "pKa = " + nf.format(pKa, 4) + "; ";
    explanation += "Kb = " + nf.format(Kb, 6) + "; ";
    explanation += "pKb = " + nf.format(pKb, 4) + "; ";
    explanation += "Ka * Kb = Kw = " + nf.format(Kw / 1e-14, 4) + " x 10^-14";
    return {
        value: "pKa = " + nf.format(pKa, 4) + "; pKb = " + nf.format(pKb, 4),
        explanation: explanation,
        metadata: {
            Ka: Ka,
            pKa: pKa,
            Kb: Kb,
            pKb: pKb,
            Kw: Kw,
            inputType: inputType,
            inputValue: inputValue
        }
    };
}

/** Ksp solubility product Ksp = [A]^a * [B]^b for AB, AB2, A2B, AB3, A3B salts. */
export function ksp(inputs: Record<string, string>): CalculatorResult {
    const kspVal = parseFloat(inputs["ksp-value"] ?? "");
    const solubility = parseFloat(inputs["ksp-molar-solubility"] ?? "");
    const saltType = inputs["ksp-salt-type"] || "AB";
    const solveFor = inputs["ksp-solve-for"] || "Ksp";
    let resultKsp: number, resultS: number;
    let concA: number, concB: number;
    let stoichA: number, stoichB: number;
    if (saltType === "AB") {
        stoichA = 1;
        stoichB = 1;
    } else if (saltType === "AB2") {
        stoichA = 1;
        stoichB = 2;
    } else if (saltType === "A2B") {
        stoichA = 2;
        stoichB = 1;
    } else if (saltType === "AB3") {
        stoichA = 1;
        stoichB = 3;
    } else if (saltType === "A3B") {
        stoichA = 3;
        stoichB = 1;
    } else {
        throw new Error("Invalid salt type");
    }
    if (solveFor === "Ksp") {
        if (isNaN(solubility) || solubility <= 0) throw new Error("Molar solubility must be positive");
        resultS = solubility;
        concA = stoichA * resultS;
        concB = stoichB * resultS;
        resultKsp = Math.pow(concA, stoichA) * Math.pow(concB, stoichB);
    } else if (solveFor === "solubility") {
        if (isNaN(kspVal) || kspVal <= 0) throw new Error("Ksp must be positive");
        resultKsp = kspVal;
        let exponent = stoichA + stoichB;
        let coeff = Math.pow(stoichA, stoichA) * Math.pow(stoichB, stoichB);
        resultS = Math.pow(resultKsp / coeff, 1 / exponent);
        concA = stoichA * resultS;
        concB = stoichB * resultS;
    } else {
        throw new Error("Invalid solve-for selection");
    }
    let nf = formatter();
    let explanation: string = "Ksp = " + nf.format(resultKsp, 6) + "; ";
    explanation += "Molar Solubility (s) = " + nf.format(resultS, 6) + " M; ";
    explanation += "[A] = " + nf.format(concA, 6) + " M; ";
    explanation += "[B] = " + nf.format(concB, 6) + " M";
    return {
        value: "Ksp = " + nf.format(resultKsp, 6) + "; s = " + nf.format(resultS, 6) + " M",
        explanation: explanation,
        metadata: {
            Ksp: resultKsp,
            solubility: resultS,
            concA: concA,
            concB: concB,
            stoichA: stoichA,
            stoichB: stoichB,
            saltType: saltType,
            solveFor: solveFor
        }
    };
}

/**
 * Colligative properties: boiling point elevation, freezing point depression,
 * osmotic pressure, and vapor pressure lowering.
 */
export function colligativeProperties(inputs: Record<string, string>): CalculatorResult {
    const soluteMass = parseFloat(inputs["collig-solute-mass"] ?? "");
    const molarMass = parseFloat(inputs["collig-molar-mass"] ?? "");
    const solventMass = parseFloat(inputs["collig-solvent-mass"] ?? "");
    const i = parseFloat(inputs["collig-vanthoff"] ?? "");
    const Kb = parseFloat(inputs["collig-Kb"] ?? "");
    const Kf = parseFloat(inputs["collig-Kf"] ?? "");
    const solventBp = parseFloat(inputs["collig-solvent-bp"] ?? "");
    const solventFp = parseFloat(inputs["collig-solvent-fp"] ?? "");
    const Psolvent = parseFloat(inputs["collig-Psolvent"] ?? "");
    if (isNaN(soluteMass) || isNaN(molarMass) || isNaN(solventMass) || isNaN(i)) {
        throw new Error("Missing or invalid inputs for collig-solute-mass, collig-molar-mass, collig-solvent-mass, collig-vanthoff");
    }
    if (soluteMass <= 0) throw new Error("Solute mass must be positive");
    if (molarMass <= 0) throw new Error("Molar mass must be positive");
    if (solventMass <= 0) throw new Error("Solvent mass must be positive");
    if (i < 1) throw new Error("Van't Hoff factor must be >= 1");
    let density = parseFloat(inputs["collig-density"] ?? "");
    if (isNaN(density)) {
        density = 1;
    }
    if (density <= 0) throw new Error("Solution density must be positive");
    let osmoticTemp = parseFloat(inputs["collig-temp"] ?? "");
    if (isNaN(osmoticTemp)) {
        osmoticTemp = 298.15;
    }
    if (osmoticTemp <= 0) throw new Error("Temperature must be positive (Kelvin)");
    let nf = formatter();
    let molesSolute = soluteMass / molarMass;
    let molality = molesSolute / (solventMass / 1000);
    let explanation: string = "Molality (m) = " + nf.format(molality, 4) + " mol/kg";
    let metadata: Record<string, unknown> = {
        molality: molality,
        molesSolute: molesSolute,
        i: i
    };
    if (!isNaN(Kb) && Kb > 0 && !isNaN(solventBp)) {
        let deltaTb = Kb * molality * i;
        let newBp = solventBp + deltaTb;
        explanation += "; Delta Tb = " + nf.format(deltaTb, 4) + " C; New Boiling Point = " + nf.format(newBp, 4) + " C";
        metadata.deltaTb = deltaTb;
        metadata.newBp = newBp;
    }
    if (!isNaN(Kf) && Kf > 0 && !isNaN(solventFp)) {
        let deltaTf = Kf * molality * i;
        let newFp = solventFp - deltaTf;
        explanation += "; Delta Tf = " + nf.format(deltaTf, 4) + " C; New Freezing Point = " + nf.format(newFp, 4) + " C";
        metadata.deltaTf = deltaTf;
        metadata.newFp = newFp;
    }
    let solventMM = parseFloat(inputs["collig-solvent-molar-mass"] ?? "");
    if (isNaN(solventMM)) {
        // ponytail: default assumes water; pass collig-solvent-molar-mass for other solvents
        solventMM = 18.015;
    }
    if (solventMM <= 0) throw new Error("Solvent molar mass must be positive");
    let molesSolvent = (solventMass / 1000) / (solventMM / 1000);
    let xSolute = molesSolute / (molesSolute + molesSolvent);
    let solutionVolumeL = (solventMass / 1000) / density;
    let molarity = molesSolute / solutionVolumeL;
    let osmoticPressure = molarity * 0.08206 * osmoticTemp * i;
    explanation += "; Molarity = " + nf.format(molarity, 4) + " mol/L (density " + nf.format(density, 4) + " g/mL)";
    explanation += "; Osmotic Pressure = " + nf.format(osmoticPressure, 4) + " atm (at " + nf.format(osmoticTemp, 2) + " K)";
    metadata.osmoticPressure = osmoticPressure;
    metadata.xSolute = xSolute;
    metadata.molarity = molarity;
    metadata.density = density;
    metadata.osmoticTemp = osmoticTemp;
    if (!isNaN(Psolvent) && Psolvent > 0) {
        let deltaP = xSolute * Psolvent;
        explanation += "; Delta P = " + nf.format(deltaP, 4) + " atm; New Vapor Pressure = " + nf.format(Psolvent - deltaP, 4) + " atm";
        metadata.deltaP = deltaP;
        metadata.newVaporPressure = Psolvent - deltaP;
    }
    return {
        value: "Molality = " + nf.format(molality, 4) + " mol/kg; Osmotic Pressure = " + nf.format(osmoticPressure, 4) + " atm",
        explanation: explanation,
        metadata: metadata
    };
}

/**
 * Titration curve: pH vs volume of added base for a strong or weak acid
 * titrated with strong base. Returns the sampled series as `chartData`.
 */
export function titrationCurve(inputs: Record<string, string>): CalculatorResult {
    const acidConc = parseFloat(inputs["titration-acid-conc"] ?? "");
    const acidVol = parseFloat(inputs["titration-acid-vol"] ?? "");
    const baseConc = parseFloat(inputs["titration-base-conc"] ?? "");
    const maxVol = parseFloat(inputs["titration-max-vol"] ?? "");
    const acidType = inputs["titration-acid-type"] || "strong";
    let Ka: number;
    if (acidType === "weak") {
        Ka = parseFloat(inputs["titration-Ka"] ?? "");
        if (isNaN(Ka) || Ka <= 0) throw new Error("Ka is required for weak acid");
    } else {
        Ka = 1e7;
    }
    if (isNaN(acidConc) || isNaN(acidVol) || isNaN(baseConc) || isNaN(maxVol)) {
        throw new Error("Missing or invalid inputs for titration-acid-conc, titration-acid-vol, titration-base-conc, titration-max-vol");
    }
    if (acidConc <= 0) throw new Error("Acid concentration must be positive");
    if (acidVol <= 0) throw new Error("Acid volume must be positive");
    if (baseConc <= 0) throw new Error("Base concentration must be positive");
    if (maxVol <= 0) throw new Error("Max volume must be positive");
    let equivVol = (acidConc * acidVol) / baseConc;
    let halfEquivVol = equivVol / 2;
    let dataPoints: TitrationCurvePoint[] = [];
    let steps = 50;
    let stepSize = maxVol / steps;
    let nf = formatter();
    for (let step = 0; step <= steps; step = step + 1) {
        let Vb = step * stepSize;
        let pH: number;
        let totalAcid = acidConc * acidVol;
        let addedBase = baseConc * Vb;
        let totalVolume = acidVol + Vb;
        if (Vb === 0) {
            if (acidType === "strong") {
                pH = -Math.log10(acidConc);
            } else {
                pH = -Math.log10((-Ka + Math.sqrt(Ka * Ka + 4 * Ka * acidConc)) / 2);
            }
        } else if (Math.abs(Vb - equivVol) <= stepSize / 2) {
            let totalVolumeEq = acidVol + equivVol;
            if (acidType === "strong") {
                pH = 7;
            } else {
                let concA = totalAcid / totalVolumeEq;
                let Kb = 1e-14 / Ka;
                let concOH = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * concA)) / 2;
                pH = 14 + Math.log10(concOH);
            }
        } else if (Vb < equivVol) {
            let remainingAcid = totalAcid - addedBase;
            let formedBase = addedBase;
            if (acidType === "strong") {
                let concH = remainingAcid / totalVolume;
                pH = -Math.log10(concH);
            } else {
                let concHA = remainingAcid / totalVolume;
                let concA = formedBase / totalVolume;
                pH = -Math.log10(Ka) + Math.log10(concA / concHA);
            }
        } else {
            let excessBase = addedBase - totalAcid;
            let concOH = excessBase / totalVolume;
            pH = 14 + Math.log10(concOH);
        }
        if (pH < 0) { pH = 0; }
        if (pH > 14) { pH = 14; }
        dataPoints.push({ volume: Vb, pH: pH });
    }
    let explanation: string = "Equivalence Point: " + nf.format(equivVol, 2) + " mL";
    if (acidType === "weak") {
        explanation += "; Half-Equivalence Point: " + nf.format(halfEquivVol, 2) + " mL (pH = pKa = " + nf.format(-Math.log10(Ka), 4) + ")";
    }
    explanation += "; Data Points: " + dataPoints.length;
    return {
        value: "Equivalence Point: " + nf.format(equivVol, 2) + " mL",
        explanation: explanation,
        chartData: dataPoints,
        metadata: {
            equivalenceVolume: equivVol,
            halfEquivalenceVolume: halfEquivVol,
            acidType: acidType,
            Ka: Ka,
            dataPointCount: dataPoints.length
        }
    };
}

function saltGcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        let t: number = a % b;
        a = b;
        b = t;
    }
    /* v8 ignore next -- defensive div-by-zero guard, unreachable via validated inputs */
    return a === 0 ? 1 : a;
}

function saltStoichiometry(zplus: number, zminus: number): { nuPlus: number; nuMinus: number } {
    let a: number = Math.abs(Math.round(zplus));
    let b: number = Math.abs(Math.round(zminus));
    let g: number = saltGcd(a, b);
    return { nuPlus: b / g, nuMinus: a / g };
}

/**
 * Extended Debye-Huckel activity coefficient. The input concentration is the
 * salt concentration; ion concentrations follow charge neutrality with minimal
 * integer stoichiometry.
 */
export function debyeHuckel(inputs: Record<string, string>): CalculatorResult {
    const zplus = parseFloat(inputs["dh-zplus"] ?? "");
    const zminus = parseFloat(inputs["dh-zminus"] ?? "");
    const concentration = parseFloat(inputs["dh-concentration"] ?? "");
    const ionSize = parseFloat(inputs["dh-ion-size"] ?? "");
    if (isNaN(zplus) || isNaN(zminus) || isNaN(concentration) || isNaN(ionSize)) {
        throw new Error("Missing or invalid inputs for dh-zplus, dh-zminus, dh-concentration, dh-ion-size");
    }
    if (zplus === 0 || zminus === 0) throw new Error("Ion charges cannot be zero");
    if (!Number.isInteger(zplus) || !Number.isInteger(zminus)) throw new Error("Ion charges must be integers");
    if (concentration <= 0) throw new Error("Concentration must be positive");
    if (ionSize <= 0) throw new Error("Ion size parameter must be positive");
    let nf = formatter();
    let stoich = saltStoichiometry(zplus, zminus);
    let I = 0.5 * concentration * (stoich.nuPlus * zplus * zplus + stoich.nuMinus * zminus * zminus);
    let sqrtI = Math.sqrt(I);
    let absProduct = Math.abs(zplus * zminus);
    let logGamma = -0.509 * absProduct * sqrtI / (1 + 3.28 * ionSize * sqrtI);
    let gamma = Math.pow(10, logGamma);
    let nuTotal = stoich.nuPlus + stoich.nuMinus;
    let meanMolality = concentration * Math.pow(Math.pow(stoich.nuPlus, stoich.nuPlus) * Math.pow(stoich.nuMinus, stoich.nuMinus), 1 / nuTotal);
    let meanActivity = gamma * meanMolality;
    let explanation: string = "Ionic Strength (I) = " + nf.format(I, 6) + " M; ";
    explanation += "log(gamma) = " + nf.format(logGamma, 6) + "; ";
    explanation += "gamma = " + nf.format(gamma, 6) + "; ";
    explanation += "Mean Activity = " + nf.format(meanActivity, 6) + "; ";
    explanation += "salt stoichiometry M" + stoich.nuPlus + "X" + stoich.nuMinus + " from charge neutrality (concentration is the salt concentration)";
    return {
        value: "I = " + nf.format(I, 6) + " M; gamma = " + nf.format(gamma, 6),
        explanation: explanation,
        metadata: {
            ionicStrength: I,
            logGamma: logGamma,
            gamma: gamma,
            meanActivity: meanActivity,
            meanMolality: meanMolality,
            nuPlus: stoich.nuPlus,
            nuMinus: stoich.nuMinus,
            zplus: zplus,
            zminus: zminus,
            concentration: concentration,
            ionSize: ionSize
        }
    };
}

/** Common ion effect: molar solubility with a common ion present, Ksp = [A]^a * [B + common]^b. */
export function commonIonEffect(inputs: Record<string, string>): CalculatorResult {
    const Ksp = parseFloat(inputs["common-ion-Ksp"] ?? "");
    const commonIonConc = parseFloat(inputs["common-ion-concentration"] ?? "");
    const saltType = inputs["common-ion-salt-type"] || "AB";
    if (isNaN(Ksp) || isNaN(commonIonConc)) {
        throw new Error("Missing or invalid inputs for common-ion-Ksp, common-ion-concentration");
    }
    if (Ksp <= 0) throw new Error("Ksp must be positive");
    if (commonIonConc <= 0) throw new Error("Common ion concentration must be positive");
    let stoichA: number, stoichB: number;
    if (saltType === "AB") {
        stoichA = 1;
        stoichB = 1;
    } else if (saltType === "AB2") {
        stoichA = 1;
        stoichB = 2;
    } else if (saltType === "A2B") {
        stoichA = 2;
        stoichB = 1;
    } else if (saltType === "AB3") {
        stoichA = 1;
        stoichB = 3;
    } else if (saltType === "A3B") {
        stoichA = 3;
        stoichB = 1;
    } else {
        throw new Error("Invalid salt type");
    }
    let s: number;
    let concA: number, concB: number;
    s = Math.pow(Ksp / Math.pow(commonIonConc, stoichB), 1 / stoichA) / stoichA;
    concA = stoichA * s;
    concB = stoichB * s + commonIonConc;
    let exponent = stoichA + stoichB;
    let coeff = Math.pow(stoichA, stoichA) * Math.pow(stoichB, stoichB);
    let solubilityWithout = Math.pow(Ksp / coeff, 1 / exponent);
    let nf = formatter();
    let explanation: string = "Molar Solubility (with common ion) = " + nf.format(s, 6) + " M; ";
    explanation += "Molar Solubility (without common ion) = " + nf.format(solubilityWithout, 6) + " M; ";
    explanation += "[A] = " + nf.format(concA, 6) + " M; ";
    explanation += "[B] = " + nf.format(concB, 6) + " M; ";
    explanation += "Solubility Ratio = " + nf.format(s / solubilityWithout, 6);
    let approxValid: boolean = (stoichB * s) / commonIonConc <= 0.05;
    if (!approxValid) {
        explanation += "; WARNING: dissolved B exceeds 5% of the common ion concentration, so the s << C approximation may be inaccurate";
    }
    return {
        value: "s (with common ion) = " + nf.format(s, 6) + " M; s (without) = " + nf.format(solubilityWithout, 6) + " M",
        explanation: explanation,
        metadata: {
            solubilityWithCommonIon: s,
            solubilityWithoutCommonIon: solubilityWithout,
            concA: concA,
            concB: concB,
            solubilityRatio: s / solubilityWithout,
            saltType: saltType,
            stoichA: stoichA,
            stoichB: stoichB,
            approxValid: approxValid
        }
    };
}
