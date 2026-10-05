import { Calculator } from "./calculator.js";
import type { CalculatorResult } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";
import { ChartRenderer } from "./chartRenderer.js";

/**
 * Solves the dilution equation M1*V1 = M2*V2 for any one of the four
 * variables, determined by the "dilution-solve-for" select element.
 */
export class DilutionCalculator extends SolveForCalculator {
	constructor() {
		super("dilution-result", ["dilution-M1", "dilution-V1", "dilution-M2", "dilution-V2"], "dilution-solve-for");
	}

	protected performCalculation(): void {
		const solveFor = this.getSolveFor();
		const M1 = this.getInput("dilution-M1").getValue();
		const V1 = this.getInput("dilution-V1").getValue();
		const M2 = this.getInput("dilution-M2").getValue();
		const V2 = this.getInput("dilution-V2").getValue();
		let result: number, formula: string;
		// Validate positive values for non-solved-for fields
		if (solveFor !== "M1" && M1 <= 0) throw new Error("Initial molarity must be positive");
		if (solveFor !== "M2" && M2 <= 0) throw new Error("Final molarity must be positive");
		if (solveFor !== "V1" && V1 <= 0) throw new Error("Initial volume must be positive");
		if (solveFor !== "V2" && V2 <= 0) throw new Error("Final volume must be positive");
		if (solveFor === "M1") {
			InputValidator.validateValues([V1, M2, V2], ["dilution-V1", "dilution-M2", "dilution-V2"]);
			result = (M2 * V2) / V1;
			formula = "M<sub>1</sub>=(M<sub>2</sub> x V<sub>2</sub>)/V<sub>1</sub>";
		} else if (solveFor === "V1") {
			InputValidator.validateValues([M1, M2, V2], ["dilution-M1", "dilution-M2", "dilution-V2"]);
			result = (M2 * V2) / M1;
			formula = "V<sub>1</sub>=(M<sub>2</sub> x V<sub>2</sub>)/M<sub>1</sub>";
		} else if (solveFor === "M2") {
			InputValidator.validateValues([M1, V1, V2], ["dilution-M1", "dilution-V1", "dilution-V2"]);
			result = (M1 * V1) / V2;
			formula = "M<sub>2</sub>=(M<sub>1</sub> x V<sub>1</sub>)/V<sub>2</sub>";
		} else if (solveFor === "V2") {
			InputValidator.validateValues([M1, V1, M2], ["dilution-M1", "dilution-V1", "dilution-M2"]);
			result = (M1 * V1) / M2;
			formula = "V<sub>2</sub>=(M<sub>1</sub> x V<sub>1</sub>)/M<sub>2</sub>";
		} else {
			throw new Error("Invalid calculation type");
		}
		const unit = solveFor.startsWith("M") ? "M" : "L";
		this.resultDisplay.showFormula(formula, result, unit);
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const solveFor = this.getSolveFor(inputs);
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
		const formatted = this.numberFormatter.format(result, 4);
		return {
			value: formatted + " " + unit,
			explanation: formula + " = " + formatted + " " + unit,
			metadata: { solveFor: solveFor, result: result, unit: unit, formula: formula }
		};
	}
}

/**
 * Calculates mass-based concentration (percent, ppm, or ppb) from solute
 * and solution masses.
 */
export class MassPercentCalculator extends Calculator {
	constructor() {
		super("mass-percent-result", ["mass-solute", "mass-solution"]);
	}

	protected performCalculation(): void {
		const solute = this.getInput("mass-solute").getValue();
		const solution = this.getInput("mass-solution").getValue();
		const unitSelect = document.getElementById("concentration-unit") as HTMLSelectElement;
		const unit = unitSelect.value;
		InputValidator.validateValues([solute, solution], ["mass-solute", "mass-solution"]);
		if (solution === 0) {
			throw new Error("Solution mass cannot be zero");
		}
		if (solute < 0) throw new Error("Solute mass cannot be negative");
		const ratio = solute / solution;
		let result: number, unitText: string;
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
		this.resultDisplay.showResult("<p>Concentration: " + this.numberFormatter.format(result, 4) + " " + unitText + "</p>");
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
		const formatted = this.numberFormatter.format(result, 4);
		return {
			value: formatted + " " + unitText,
			explanation: "Concentration: " + formatted + " " + unitText,
			metadata: { concentration: result, unit: unitText, ratio: ratio, solute: solute, solution: solution }
		};
	}
}

/**
 * Calculates the final concentration and total volume when mixing two
 * solutions of known concentration and volume.
 */
export class MixingCalculator extends Calculator {
	constructor() {
		super("mixing-result", ["mix-C1", "mix-V1", "mix-C2", "mix-V2"]);
	}

	protected performCalculation(): void {
		const C1 = this.getInput("mix-C1").getValue();
		const V1 = this.getInput("mix-V1").getValue();
		const C2 = this.getInput("mix-C2").getValue();
		const V2 = this.getInput("mix-V2").getValue();
		InputValidator.validateValues([C1, V1, C2, V2], ["mix-C1", "mix-V1", "mix-C2", "mix-V2"]);
		if (C1 <= 0) throw new Error("First solution concentration must be positive");
		if (C2 <= 0) throw new Error("Second solution concentration must be positive");
		if (V1 <= 0) throw new Error("First solution volume must be positive");
		if (V2 <= 0) throw new Error("Second solution volume must be positive");
		const totalMoles = (C1 * V1) + (C2 * V2);
		const totalVolume = V1 + V2;
		const finalConcentration = totalMoles / totalVolume;
		this.resultDisplay.showResult("<p>Final Concentration: " + this.numberFormatter.format(finalConcentration, 4) + " M</p><p>Total Volume: " + this.numberFormatter.format(totalVolume, 4) + " L</p>");
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
		const fcFormatted = this.numberFormatter.format(finalConcentration, 4);
		const tvFormatted = this.numberFormatter.format(totalVolume, 4);
		return {
			value: fcFormatted + " M",
			explanation: "Final Concentration: " + fcFormatted + " M; Total Volume: " + tvFormatted + " L",
			metadata: { finalConcentration: finalConcentration, totalVolume: totalVolume, totalMoles: totalMoles }
		};
	}
}

/**
 * Henderson-Hasselbalch equation: pH = pKa + log([A-]/[HA])
 * Can also solve for pKa or ratio given pH.
 */
export class BufferSolutionCalculator extends Calculator {
    constructor() {
        super("buffer-result", ["buffer-pKa", "buffer-HA", "buffer-Aminus", "buffer-pH", "buffer-ratio"]);
    }

    protected performCalculation(): void {
        const pKa = this.getInput("buffer-pKa").getValue();
        const HA = this.getInput("buffer-HA").getValue();
        const Aminus = this.getInput("buffer-Aminus").getValue();
        const pH = this.getInput("buffer-pH").getValue();
        const solveFor = (document.getElementById("buffer-solve-for") as HTMLSelectElement).value;
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
        this.resultDisplay.showResult(
            "<p>pH = " + this.numberFormatter.format(resultpH, 4) + "</p>" +
            "<p>pKa = " + this.numberFormatter.format(resultpKa, 4) + "</p>" +
            "<p>[A<sup>-</sup>]/[HA] = " + this.numberFormatter.format(resultRatio, 4) + "</p>" +
            "<p>Buffer Capacity: " + bufferCapacity + "</p>"
        );
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let value: string;
        if (solveFor === "pH") {
            value = "pH = " + this.numberFormatter.format(resultpH, 4);
        } else if (solveFor === "pKa") {
            value = "pKa = " + this.numberFormatter.format(resultpKa, 4);
        } else {
            value = "[A-]/[HA] = " + this.numberFormatter.format(resultRatio, 4);
        }
        let explanation: string = "pH = " + this.numberFormatter.format(resultpH, 4) + "; ";
        explanation += "pKa = " + this.numberFormatter.format(resultpKa, 4) + "; ";
        explanation += "[A-]/[HA] = " + this.numberFormatter.format(resultRatio, 4) + "; ";
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
}

/**
 * pKa/pKb relationship: pKa = -log(Ka), pKb = -log(Kb), pKa + pKb = 14
 */
export class PKaPKbCalculator extends Calculator {
    constructor() {
        super("pka-pkb-result", ["pka-pkb-input-value"]);
    }

    protected performCalculation(): void {
        const inputValue = this.getInput("pka-pkb-input-value").getValue();
        const inputType = (document.getElementById("pka-pkb-input-type") as HTMLSelectElement).value;
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
        this.resultDisplay.showResult(
            "<p>K<sub>a</sub> = " + this.numberFormatter.format(Ka, 6) + "</p>" +
            "<p>pK<sub>a</sub> = " + this.numberFormatter.format(pKa, 4) + "</p>" +
            "<p>K<sub>b</sub> = " + this.numberFormatter.format(Kb, 6) + "</p>" +
            "<p>pK<sub>b</sub> = " + this.numberFormatter.format(pKb, 4) + "</p>" +
            "<p>K<sub>a</sub> &times; K<sub>b</sub> = K<sub>w</sub> = " + this.numberFormatter.format(Kw / 1e-14, 4) + " &times; 10<sup>-14</sup></p>"
        );
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let explanation: string = "Ka = " + this.numberFormatter.format(Ka, 6) + "; ";
        explanation += "pKa = " + this.numberFormatter.format(pKa, 4) + "; ";
        explanation += "Kb = " + this.numberFormatter.format(Kb, 6) + "; ";
        explanation += "pKb = " + this.numberFormatter.format(pKb, 4) + "; ";
        explanation += "Ka * Kb = Kw = " + this.numberFormatter.format(Kw / 1e-14, 4) + " x 10^-14";
        return {
            value: "pKa = " + this.numberFormatter.format(pKa, 4) + "; pKb = " + this.numberFormatter.format(pKb, 4),
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
}

/**
 * Ksp solubility product: Ksp = [A]^a * [B]^b
 * Supports AB, AB2, A2B, AB3, A3B salt types.
 */
export class KspCalculator extends Calculator {
    constructor() {
        super("ksp-result", ["ksp-value", "ksp-molar-solubility"]);
    }

    protected performCalculation(): void {
        const kspVal = this.getInput("ksp-value").getValue();
        const solubility = this.getInput("ksp-molar-solubility").getValue();
        const saltType = (document.getElementById("ksp-salt-type") as HTMLSelectElement).value;
        const solveFor = (document.getElementById("ksp-solve-for") as HTMLSelectElement).value;
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
        this.resultDisplay.showResult(
            "<p>K<sub>sp</sub> = " + this.numberFormatter.format(resultKsp, 6) + "</p>" +
            "<p>Molar Solubility (s) = " + this.numberFormatter.format(resultS, 6) + " M</p>" +
            "<p>[A<sup>" + stoichB + "+</sup>] = " + this.numberFormatter.format(concA, 6) + " M</p>" +
            "<p>[B<sup>" + stoichA + "-</sup>] = " + this.numberFormatter.format(concB, 6) + " M</p>" +
            "<p>Charges shown are the minimal integer charges satisfying neutrality for salt type " + saltType + "</p>"
        );
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let explanation: string = "Ksp = " + this.numberFormatter.format(resultKsp, 6) + "; ";
        explanation += "Molar Solubility (s) = " + this.numberFormatter.format(resultS, 6) + " M; ";
        explanation += "[A] = " + this.numberFormatter.format(concA, 6) + " M; ";
        explanation += "[B] = " + this.numberFormatter.format(concB, 6) + " M";
        return {
            value: "Ksp = " + this.numberFormatter.format(resultKsp, 6) + "; s = " + this.numberFormatter.format(resultS, 6) + " M",
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
}

/**
 * Colligative properties: boiling point elevation, freezing point depression,
 * osmotic pressure, and vapor pressure lowering (Raoult's law).
 */
export class ColligativePropertiesCalculator extends Calculator {
    constructor() {
        super("colligative-result", [
            "collig-solute-mass", "collig-molar-mass", "collig-solvent-mass",
            "collig-vanthoff", "collig-Kb", "collig-Kf",
            "collig-solvent-bp", "collig-solvent-fp", "collig-Psolvent"
        ]);
    }

    /**
     * Reads the optional solvent molar mass input (g/mol), falling back to
     * water. Returns kg/mol for the mole-fraction math.
     */
    private getSolventMolarMassKgPerMol(): number {
        let el: HTMLElement | null = document.getElementById("collig-solvent-molar-mass");
        if (el instanceof HTMLInputElement && el.value.trim() !== "") {
            let v: number = parseFloat(el.value);
            if (isNaN(v) || v <= 0) throw new Error("Solvent molar mass must be positive");
            return v / 1000;
        }
        return 0.018015;
    }

    protected performCalculation(): void {
        const soluteMass = this.getInput("collig-solute-mass").getValue();
        const molarMass = this.getInput("collig-molar-mass").getValue();
        const solventMass = this.getInput("collig-solvent-mass").getValue();
        const i = this.getInput("collig-vanthoff").getValue();
        const Kb = this.getInput("collig-Kb").getValue();
        const Kf = this.getInput("collig-Kf").getValue();
        const solventBp = this.getInput("collig-solvent-bp").getValue();
        const solventFp = this.getInput("collig-solvent-fp").getValue();
        const Psolvent = this.getInput("collig-Psolvent").getValue();

        InputValidator.validateValues(
            [soluteMass, molarMass, solventMass, i],
            ["collig-solute-mass", "collig-molar-mass", "collig-solvent-mass", "collig-vanthoff"]
        );
        if (soluteMass <= 0) throw new Error("Solute mass must be positive");
        if (molarMass <= 0) throw new Error("Molar mass must be positive");
        if (solventMass <= 0) throw new Error("Solvent mass must be positive");
        if (i < 1) throw new Error("Van't Hoff factor must be >= 1");
        // Optional solution density (g/mL == kg/L, defaults to water-like 1).
        // Molarity needs solution volume, which is NOT the solvent mass
        // except at density 1 — hence the explicit, labelled input.
        let density = 1;
        let densityEl: HTMLElement | null = document.getElementById("collig-density");
        if (densityEl instanceof HTMLInputElement && densityEl.value.trim() !== "") {
            density = parseFloat(densityEl.value);
            if (isNaN(density) || density <= 0) throw new Error("Solution density must be positive");
        }
        // Optional temperature for osmotic pressure (K, defaults to 298.15).
        let osmoticTemp = 298.15;
        let tempEl: HTMLElement | null = document.getElementById("collig-temp");
        if (tempEl instanceof HTMLInputElement && tempEl.value.trim() !== "") {
            osmoticTemp = parseFloat(tempEl.value);
            if (isNaN(osmoticTemp) || osmoticTemp <= 0) throw new Error("Temperature must be positive (Kelvin)");
        }
        let molesSolute = soluteMass / molarMass;
        let molality = molesSolute / (solventMass / 1000);
        let html = "<p>Molality (m) = " + this.numberFormatter.format(molality, 4) + " mol/kg</p>";
        if (!isNaN(Kb) && Kb > 0 && !isNaN(solventBp)) {
            let deltaTb = Kb * molality * i;
            let newBp = solventBp + deltaTb;
            html += "<p>&Delta;T<sub>b</sub> = " + this.numberFormatter.format(deltaTb, 4) + " &deg;C</p>";
            html += "<p>New Boiling Point = " + this.numberFormatter.format(newBp, 4) + " &deg;C</p>";
        }
        if (!isNaN(Kf) && Kf > 0 && !isNaN(solventFp)) {
            let deltaTf = Kf * molality * i;
            let newFp = solventFp - deltaTf;
            html += "<p>&Delta;T<sub>f</sub> = " + this.numberFormatter.format(deltaTf, 4) + " &deg;C</p>";
            html += "<p>New Freezing Point = " + this.numberFormatter.format(newFp, 4) + " &deg;C</p>";
        }
        // Solvent molar mass defaults to water (18.015 g/mol); Raoult's law
        // needs the real solvent value for any other solvent.
        let molesSolvent = (solventMass / 1000) / this.getSolventMolarMassKgPerMol();        let xSolute = molesSolute / (molesSolute + molesSolvent);
        let solutionVolumeL = (solventMass / 1000) / density;
        let molarity = molesSolute / solutionVolumeL;
        let osmoticPressure = molarity * 0.08206 * osmoticTemp * i;
        html += "<p>Molarity (M) = " + this.numberFormatter.format(molarity, 4) + " mol/L (solution density " + this.numberFormatter.format(density, 4) + " g/mL)</p>";
        html += "<p>Osmotic Pressure (&pi;) = " + this.numberFormatter.format(osmoticPressure, 4) + " atm (at " + this.numberFormatter.format(osmoticTemp, 2) + " K)</p>";
        if (!isNaN(Psolvent) && Psolvent > 0) {
            let deltaP = xSolute * Psolvent;
            html += "<p>&Delta;P = " + this.numberFormatter.format(deltaP, 4) + " atm</p>";
            html += "<p>New Vapor Pressure = " + this.numberFormatter.format(Psolvent - deltaP, 4) + " atm</p>";
        }
        this.resultDisplay.showResult(html);
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let molesSolute = soluteMass / molarMass;
        let molality = molesSolute / (solventMass / 1000);
        let explanation: string = "Molality (m) = " + this.numberFormatter.format(molality, 4) + " mol/kg";
        let metadata: Record<string, unknown> = {
            molality: molality,
            molesSolute: molesSolute,
            i: i
        };
        if (!isNaN(Kb) && Kb > 0 && !isNaN(solventBp)) {
            let deltaTb = Kb * molality * i;
            let newBp = solventBp + deltaTb;
            explanation += "; Delta Tb = " + this.numberFormatter.format(deltaTb, 4) + " C; New Boiling Point = " + this.numberFormatter.format(newBp, 4) + " C";
            metadata.deltaTb = deltaTb;
            metadata.newBp = newBp;
        }
        if (!isNaN(Kf) && Kf > 0 && !isNaN(solventFp)) {
            let deltaTf = Kf * molality * i;
            let newFp = solventFp - deltaTf;
            explanation += "; Delta Tf = " + this.numberFormatter.format(deltaTf, 4) + " C; New Freezing Point = " + this.numberFormatter.format(newFp, 4) + " C";
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
        explanation += "; Molarity = " + this.numberFormatter.format(molarity, 4) + " mol/L (density " + this.numberFormatter.format(density, 4) + " g/mL)";
        explanation += "; Osmotic Pressure = " + this.numberFormatter.format(osmoticPressure, 4) + " atm (at " + this.numberFormatter.format(osmoticTemp, 2) + " K)";
        metadata.osmoticPressure = osmoticPressure;
        metadata.xSolute = xSolute;
        metadata.molarity = molarity;
        metadata.density = density;
        metadata.osmoticTemp = osmoticTemp;
        if (!isNaN(Psolvent) && Psolvent > 0) {
            let deltaP = xSolute * Psolvent;
            explanation += "; Delta P = " + this.numberFormatter.format(deltaP, 4) + " atm; New Vapor Pressure = " + this.numberFormatter.format(Psolvent - deltaP, 4) + " atm";
            metadata.deltaP = deltaP;
            metadata.newVaporPressure = Psolvent - deltaP;
        }
        return {
            value: "Molality = " + this.numberFormatter.format(molality, 4) + " mol/kg; Osmotic Pressure = " + this.numberFormatter.format(osmoticPressure, 4) + " atm",
            explanation: explanation,
            metadata: metadata
        };
    }
}

/**
 * Titration curve calculator: generates pH vs volume data points
 * for strong acid / weak acid titrated with strong base (NaOH).
 */
export class TitrationCurveCalculator extends Calculator {
    constructor() {
        super("titration-result", [
            "titration-acid-conc", "titration-acid-vol",
            "titration-base-conc", "titration-max-vol", "titration-Ka"
        ]);
    }

    protected performCalculation(): void {
        const acidConc = this.getInput("titration-acid-conc").getValue();
        const acidVol = this.getInput("titration-acid-vol").getValue();
        const baseConc = this.getInput("titration-base-conc").getValue();
        const maxVol = this.getInput("titration-max-vol").getValue();
        const acidType = (document.getElementById("titration-acid-type") as HTMLSelectElement).value;
        let Ka: number;
        if (acidType === "weak") {
            Ka = this.getInput("titration-Ka").getValue();
            if (isNaN(Ka) || Ka <= 0) throw new Error("Ka is required for weak acid");
        } else {
            Ka = 1e7;
        }
        InputValidator.validateValues(
            [acidConc, acidVol, baseConc, maxVol],
            ["titration-acid-conc", "titration-acid-vol", "titration-base-conc", "titration-max-vol"]
        );
        if (acidConc <= 0) throw new Error("Acid concentration must be positive");
        if (acidVol <= 0) throw new Error("Acid volume must be positive");
        if (baseConc <= 0) throw new Error("Base concentration must be positive");
        if (maxVol <= 0) throw new Error("Max volume must be positive");
        let equivVol = (acidConc * acidVol) / baseConc;
        let halfEquivVol = equivVol / 2;
        let dataPoints: Array<{ volume: number; pH: number }> = [];
        let steps = 50;
        let stepSize = maxVol / steps;
        for (let step = 0; step <= steps; step = step + 1) {
            let Vb = step * stepSize;
            let pH: number;
            let totalAcid = acidConc * acidVol;
            let addedBase = baseConc * Vb;
            let totalVolume = acidVol + Vb;
            // acidVol > 0 is validated above and Vb >= 0 by loop construction,
            // so totalVolume > 0 always; the totalVolume === 0 fallback could never fire.
            if (Vb === 0) {
                if (acidType === "strong") {
                    pH = -Math.log10(acidConc);
                } else {
                    // Exact [H+] from Ka = x^2/(C - x): x = (-Ka + sqrt(Ka^2 + 4*Ka*C))/2.
                    // Valid at any dilution, unlike sqrt(Ka*C) which needs C >> Ka.
                    pH = -Math.log10((-Ka + Math.sqrt(Ka * Ka + 4 * Ka * acidConc)) / 2);
                }
            } else if (Math.abs(Vb - equivVol) <= stepSize / 2) {
                // Nearest grid point to the equivalence point. Clamp to the
                // exact equivalence volume so the equivalence pH always
                // appears even when it falls between grid steps.
                let totalVolumeEq = acidVol + equivVol;
                if (acidType === "strong") {
                    pH = 7;
                } else {
                    let concA = totalAcid / totalVolumeEq;
                    let Kb = 1e-14 / Ka;
                    // Exact [OH-] from Kb = x^2/(C - x), valid at any dilution.
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
        let html = "<p>Equivalence Point: " + this.numberFormatter.format(equivVol, 2) + " mL</p>";
        if (acidType === "weak") {
            html += "<p>Half-Equivalence Point: " + this.numberFormatter.format(halfEquivVol, 2) + " mL (pH = pKa = " + this.numberFormatter.format(-Math.log10(Ka), 4) + ")</p>";
        }
        html += "<p>Data Points (Volume mL, pH):</p><p>";
        for (let i = 0; i < dataPoints.length; i = i + 1) {
            html += "(" + this.numberFormatter.format(dataPoints[i].volume, 1) + ", " + this.numberFormatter.format(dataPoints[i].pH, 2) + ") ";
        }
        html += "</p>";
        this.resultDisplay.showResult(html);
        let chartCanvas = document.getElementById("titration-chart");
        if (chartCanvas) {
            ChartRenderer.getInstance().renderTitrationCurve("titration-chart", dataPoints);
        }
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let dataPoints: Array<{ volume: number; pH: number }> = [];
        let steps = 50;
        let stepSize = maxVol / steps;
        for (let step = 0; step <= steps; step = step + 1) {
            let Vb = step * stepSize;
            let pH: number;
            let totalAcid = acidConc * acidVol;
            let addedBase = baseConc * Vb;
            let totalVolume = acidVol + Vb;
            // acidVol > 0 is validated above and Vb >= 0 by loop construction,
            // so totalVolume > 0 always; the totalVolume === 0 fallback could never fire.
            if (Vb === 0) {
                if (acidType === "strong") {
                    pH = -Math.log10(acidConc);
                } else {
                    // Exact [H+] from Ka = x^2/(C - x): x = (-Ka + sqrt(Ka^2 + 4*Ka*C))/2.
                    // Valid at any dilution, unlike sqrt(Ka*C) which needs C >> Ka.
                    pH = -Math.log10((-Ka + Math.sqrt(Ka * Ka + 4 * Ka * acidConc)) / 2);
                }
            } else if (Math.abs(Vb - equivVol) <= stepSize / 2) {
                // Nearest grid point to the equivalence point. Clamp to the
                // exact equivalence volume so the equivalence pH always
                // appears even when it falls between grid steps.
                let totalVolumeEq = acidVol + equivVol;
                if (acidType === "strong") {
                    pH = 7;
                } else {
                    let concA = totalAcid / totalVolumeEq;
                    let Kb = 1e-14 / Ka;
                    // Exact [OH-] from Kb = x^2/(C - x), valid at any dilution.
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
        let explanation: string = "Equivalence Point: " + this.numberFormatter.format(equivVol, 2) + " mL";
        if (acidType === "weak") {
            explanation += "; Half-Equivalence Point: " + this.numberFormatter.format(halfEquivVol, 2) + " mL (pH = pKa = " + this.numberFormatter.format(-Math.log10(Ka), 4) + ")";
        }
        explanation += "; Data Points: " + dataPoints.length;
        return {
            value: "Equivalence Point: " + this.numberFormatter.format(equivVol, 2) + " mL",
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
}

/**
 * Extended Debye-Huckel equation for activity coefficients.
 * log(γ±) = -0.509 * |z+*z-| * sqrt(I) / (1 + 3.28 * a * sqrt(I))
 *
 * The input concentration is the *salt* concentration. Ion concentrations
 * follow from charge neutrality with minimal integer stoichiometry:
 * nu+ = |z-|/g, nu- = |z+|/g, g = gcd(|z+|, |z-|), so
 * I = 0.5 * c * (nu+*z+^2 + nu-*z-^2) and the mean molality is
 * m± = c * (nu+^nu+ * nu-^nu-)^(1/(nu+ + nu-)).
 */
function saltStoichiometry(zplus: number, zminus: number): { nuPlus: number; nuMinus: number } {
    let a: number = Math.abs(Math.round(zplus));
    let b: number = Math.abs(Math.round(zminus));
    let g: number = saltGcd(a, b);
    return { nuPlus: b / g, nuMinus: a / g };
}

function saltGcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        let t: number = a % b;
        a = b;
        b = t;
    }
    // Callers validate charges as non-zero integers, so a > 0 here; the a === 0
    // fallback guards gcd(0, 0) and could never fire (proven by validation above).
    /* v8 ignore next -- defensive div-by-zero guard, unreachable via validated inputs */
    return a === 0 ? 1 : a;
}
export class DebyeHuckelCalculator extends Calculator {
    constructor() {
        super("debye-huckel-result", [
            "dh-zplus", "dh-zminus", "dh-concentration", "dh-ion-size"
        ]);
    }

    protected performCalculation(): void {
        const zplus = this.getInput("dh-zplus").getValue();
        const zminus = this.getInput("dh-zminus").getValue();
        const concentration = this.getInput("dh-concentration").getValue();
        const ionSize = this.getInput("dh-ion-size").getValue();
        InputValidator.validateValues(
            [zplus, zminus, concentration, ionSize],
            ["dh-zplus", "dh-zminus", "dh-concentration", "dh-ion-size"]
        );
        if (zplus === 0 || zminus === 0) throw new Error("Ion charges cannot be zero");
        if (!Number.isInteger(zplus) || !Number.isInteger(zminus)) throw new Error("Ion charges must be integers");
        if (concentration <= 0) throw new Error("Concentration must be positive");
        if (ionSize <= 0) throw new Error("Ion size parameter must be positive");
        let stoich = saltStoichiometry(zplus, zminus);
        let I = 0.5 * concentration * (stoich.nuPlus * zplus * zplus + stoich.nuMinus * zminus * zminus);
        let sqrtI = Math.sqrt(I);
        let absProduct = Math.abs(zplus * zminus);
        let logGamma = -0.509 * absProduct * sqrtI / (1 + 3.28 * ionSize * sqrtI);
        let gamma = Math.pow(10, logGamma);
        let nuTotal = stoich.nuPlus + stoich.nuMinus;
        let meanMolality = concentration * Math.pow(Math.pow(stoich.nuPlus, stoich.nuPlus) * Math.pow(stoich.nuMinus, stoich.nuMinus), 1 / nuTotal);
        let meanActivity = gamma * meanMolality;
        this.resultDisplay.showResult(
            "<p>Ionic Strength (I) = " + this.numberFormatter.format(I, 6) + " M</p>" +
            "<p>log(&gamma;<sub>&plusmn;</sub>) = " + this.numberFormatter.format(logGamma, 6) + "</p>" +
            "<p>&gamma;<sub>&plusmn;</sub> = " + this.numberFormatter.format(gamma, 6) + "</p>" +
            "<p>Mean Activity (a<sub>&plusmn;</sub>) = " + this.numberFormatter.format(meanActivity, 6) + "</p>" +
            "<p>Salt stoichiometry assumed from charge neutrality: M<sub>" + stoich.nuPlus + "</sub>X<sub>" + stoich.nuMinus + "</sub>; concentration is the salt concentration</p>"
        );
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let stoich = saltStoichiometry(zplus, zminus);
        let I = 0.5 * concentration * (stoich.nuPlus * zplus * zplus + stoich.nuMinus * zminus * zminus);
        let sqrtI = Math.sqrt(I);
        let absProduct = Math.abs(zplus * zminus);
        let logGamma = -0.509 * absProduct * sqrtI / (1 + 3.28 * ionSize * sqrtI);
        let gamma = Math.pow(10, logGamma);
        let nuTotal = stoich.nuPlus + stoich.nuMinus;
        let meanMolality = concentration * Math.pow(Math.pow(stoich.nuPlus, stoich.nuPlus) * Math.pow(stoich.nuMinus, stoich.nuMinus), 1 / nuTotal);
        let meanActivity = gamma * meanMolality;
        let explanation: string = "Ionic Strength (I) = " + this.numberFormatter.format(I, 6) + " M; ";
        explanation += "log(gamma) = " + this.numberFormatter.format(logGamma, 6) + "; ";
        explanation += "gamma = " + this.numberFormatter.format(gamma, 6) + "; ";
        explanation += "Mean Activity = " + this.numberFormatter.format(meanActivity, 6) + "; ";
        explanation += "salt stoichiometry M" + stoich.nuPlus + "X" + stoich.nuMinus + " from charge neutrality (concentration is the salt concentration)";
        return {
            value: "I = " + this.numberFormatter.format(I, 6) + " M; gamma = " + this.numberFormatter.format(gamma, 6),
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
}

/**
 * Common ion effect: molar solubility with a common ion present.
 * Ksp = [A]^a * [B + common]^b
 */
export class CommonIonEffectCalculator extends Calculator {
    constructor() {
        super("common-ion-result", ["common-ion-Ksp", "common-ion-concentration"]);
    }

    protected performCalculation(): void {
        const Ksp = this.getInput("common-ion-Ksp").getValue();
        const commonIonConc = this.getInput("common-ion-concentration").getValue();
        const saltType = (document.getElementById("common-ion-salt-type") as HTMLSelectElement).value;
        InputValidator.validateValues(
            [Ksp, commonIonConc],
            ["common-ion-Ksp", "common-ion-concentration"]
        );
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
        // The closed form assumes s << C (dissolved B negligible vs the
        // common ion). Flag it when that assumption breaks down.
        let approxWarning = "";
        if ((stoichB * s) / commonIonConc > 0.05) {
            approxWarning = "<p>Warning: dissolved B (" + this.numberFormatter.format(stoichB * s, 6) + " M) exceeds 5% of the common ion concentration, so the s &lt;&lt; C approximation may be inaccurate; solve the exact polynomial for a rigorous result.</p>";
        }
        this.resultDisplay.showResult(
            "<p>Molar Solubility (with common ion) = " + this.numberFormatter.format(s, 6) + " M</p>" +
            "<p>Molar Solubility (without common ion) = " + this.numberFormatter.format(solubilityWithout, 6) + " M</p>" +
            "<p>[A] = " + this.numberFormatter.format(concA, 6) + " M</p>" +
            "<p>[B] = " + this.numberFormatter.format(concB, 6) + " M</p>" +
            "<p>Solubility Ratio = " + this.numberFormatter.format(s / solubilityWithout, 6) + "</p>" +
            approxWarning
        );
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
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
        let explanation: string = "Molar Solubility (with common ion) = " + this.numberFormatter.format(s, 6) + " M; ";
        explanation += "Molar Solubility (without common ion) = " + this.numberFormatter.format(solubilityWithout, 6) + " M; ";
        explanation += "[A] = " + this.numberFormatter.format(concA, 6) + " M; ";
        explanation += "[B] = " + this.numberFormatter.format(concB, 6) + " M; ";
        explanation += "Solubility Ratio = " + this.numberFormatter.format(s / solubilityWithout, 6);
        let approxValid: boolean = (stoichB * s) / commonIonConc <= 0.05;
        if (!approxValid) {
            explanation += "; WARNING: dissolved B exceeds 5% of the common ion concentration, so the s << C approximation may be inaccurate";
        }
        return {
            value: "s (with common ion) = " + this.numberFormatter.format(s, 6) + " M; s (without) = " + this.numberFormatter.format(solubilityWithout, 6) + " M",
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
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateDilution(): void {
    new DilutionCalculator().calculate();
}

export function calculateMassPercent(): void {
    new MassPercentCalculator().calculate();
}

export function calculateMixing(): void {
    new MixingCalculator().calculate();
}

export function calculateBufferSolution(): void {
    new BufferSolutionCalculator().calculate();
}

export function calculatePKaPKb(): void {
    new PKaPKbCalculator().calculate();
}

export function calculateKsp(): void {
    new KspCalculator().calculate();
}

export function calculateColligativeProperties(): void {
    new ColligativePropertiesCalculator().calculate();
}

export function calculateTitrationCurve(): void {
    new TitrationCurveCalculator().calculate();
}

export function calculateDebyeHuckel(): void {
    new DebyeHuckelCalculator().calculate();
}

export function calculateCommonIonEffect(): void {
    new CommonIonEffectCalculator().calculate();
}
