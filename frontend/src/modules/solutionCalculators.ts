import { Calculator } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";

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
		if (V1 + V2 === 0) {
			throw new Error("Total volume cannot be zero");
		}
		const totalMoles = (C1 * V1) + (C2 * V2);
		const totalVolume = V1 + V2;
		const finalConcentration = totalMoles / totalVolume;
		this.resultDisplay.showResult("<p>Final Concentration: " + this.numberFormatter.format(finalConcentration, 4) + " M</p><p>Total Volume: " + this.numberFormatter.format(totalVolume, 4) + " L</p>");
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
