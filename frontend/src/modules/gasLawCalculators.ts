import { Calculator } from "./calculator.js";
import type { CalculatorResult } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";

/**
 * Solves the ideal gas law PV = nRT for any one of P, V, n, or T,
 * determined by the "ideal-solve-for" select element. The gas constant
 * R is selected from the "ideal-R-units" select (atm-L or SI).
 */
export class IdealGasLawCalculator extends SolveForCalculator {
	private static defaultsApplied: boolean = false;

	constructor() {
		super("ideal-result", ["ideal-P", "ideal-V", "ideal-n", "ideal-T"], "ideal-solve-for");
	}

	/**
	 * Pre-fills temperature with 298.15 K and pressure with 1 atm
	 * when the ideal gas law calculator view is first shown.
	 */
	public static applyDefaults(): void {
		if (IdealGasLawCalculator.defaultsApplied) return;
		IdealGasLawCalculator.defaultsApplied = true;
		let tempInput = document.getElementById("ideal-T") as HTMLInputElement;
		let pressureInput = document.getElementById("ideal-P") as HTMLInputElement;
		if (tempInput && tempInput.value === "") {
			tempInput.value = "298.15";
		}
		if (pressureInput && pressureInput.value === "") {
			pressureInput.value = "1";
		}
	}

	protected performCalculation(): void {
		const solveFor = this.getSolveFor();
		const unitsSelect = document.getElementById("ideal-R-units") as HTMLSelectElement;
		const units = unitsSelect.value;
		const R = units === "atm-L" ? 0.08206 : 8.314;
		const P = this.getInput("ideal-P").getValue();
		const V = this.getInput("ideal-V").getValue();
		const n = this.getInput("ideal-n").getValue();
		const T = this.getInput("ideal-T").getValue();
		let result: number, formula: string;
		if (solveFor === "P") {
			InputValidator.validateValues([V, n, T], ["ideal-V", "ideal-n", "ideal-T"]);
			if (V === 0) throw new Error("Volume cannot be zero");
			result = (n * R * T) / V;
			formula = "P=(nRT)/V";
		} else if (solveFor === "V") {
			InputValidator.validateValues([P, n, T], ["ideal-P", "ideal-n", "ideal-T"]);
			if (P === 0) throw new Error("Pressure cannot be zero");
			result = (n * R * T) / P;
			formula = "V=(nRT)/P";
		} else if (solveFor === "n") {
			InputValidator.validateValues([P, V, T], ["ideal-P", "ideal-V", "ideal-T"]);
			if (T === 0) throw new Error("Temperature cannot be zero");
			result = (P * V) / (R * T);
			formula = "n=(PV)/(RT)";
		} else if (solveFor === "T") {
			InputValidator.validateValues([P, V, n], ["ideal-P", "ideal-V", "ideal-n"]);
			if (n === 0) throw new Error("Moles cannot be zero");
			result = (P * V) / (n * R);
			formula = "T=(PV)/(nR)";
		} else {
			throw new Error("Invalid solveFor");
		}
		let unit: string;
		if (solveFor === "P") {
			unit = units === "atm-L" ? "atm" : "Pa";
		} else if (solveFor === "V") {
			unit = units === "atm-L" ? "L" : "m³";
		} else if (solveFor === "n") {
			unit = "mol";
		} else {
			unit = "K";
		}
		this.resultDisplay.showFormula(formula, result, unit);
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const solveFor = this.getSolveFor(inputs);
		const units = inputs["ideal-R-units"] ?? "";
		const R = units === "atm-L" ? 0.08206 : 8.314;
		const P = parseFloat(inputs["ideal-P"] ?? "");
		const V = parseFloat(inputs["ideal-V"] ?? "");
		const n = parseFloat(inputs["ideal-n"] ?? "");
		const T = parseFloat(inputs["ideal-T"] ?? "");
		let result: number, formula: string;
		if (solveFor === "P") {
			if (isNaN(V) || isNaN(n) || isNaN(T)) {
				throw new Error("Missing or invalid inputs for ideal-V, ideal-n, ideal-T");
			}
			if (V === 0) throw new Error("Volume cannot be zero");
			result = (n * R * T) / V;
			formula = "P=(nRT)/V";
		} else if (solveFor === "V") {
			if (isNaN(P) || isNaN(n) || isNaN(T)) {
				throw new Error("Missing or invalid inputs for ideal-P, ideal-n, ideal-T");
			}
			if (P === 0) throw new Error("Pressure cannot be zero");
			result = (n * R * T) / P;
			formula = "V=(nRT)/P";
		} else if (solveFor === "n") {
			if (isNaN(P) || isNaN(V) || isNaN(T)) {
				throw new Error("Missing or invalid inputs for ideal-P, ideal-V, ideal-T");
			}
			if (T === 0) throw new Error("Temperature cannot be zero");
			result = (P * V) / (R * T);
			formula = "n=(PV)/(RT)";
		} else if (solveFor === "T") {
			if (isNaN(P) || isNaN(V) || isNaN(n)) {
				throw new Error("Missing or invalid inputs for ideal-P, ideal-V, ideal-n");
			}
			if (n === 0) throw new Error("Moles cannot be zero");
			result = (P * V) / (n * R);
			formula = "T=(PV)/(nR)";
		} else {
			throw new Error("Invalid solveFor");
		}
		let unit: string;
		if (solveFor === "P") {
			unit = units === "atm-L" ? "atm" : "Pa";
		} else if (solveFor === "V") {
			unit = units === "atm-L" ? "L" : "m³";
		} else if (solveFor === "n") {
			unit = "mol";
		} else {
			unit = "K";
		}
		const formatted = this.numberFormatter.format(result, 4);
		return { value: formatted + " " + unit, explanation: formula + " = " + formatted + " " + unit };
	}
}

/**
 * Solves the combined gas law (P1*V1)/T1 = (P2*V2)/T2 for any one of the
 * six variables, determined by the "combined-solve-for" select element.
 */
export class CombinedGasLawCalculator extends SolveForCalculator {
	constructor() {
		super("combined-result", ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"], "combined-solve-for");
	}

	protected performCalculation(): void {
		const solveFor = this.getSolveFor();
		const P1 = this.getInput("combined-P1").getValue();
		const V1 = this.getInput("combined-V1").getValue();
		const T1 = this.getInput("combined-T1").getValue();
		const P2 = this.getInput("combined-P2").getValue();
		const V2 = this.getInput("combined-V2").getValue();
		const T2 = this.getInput("combined-T2").getValue();
		let result: number, formula: string;
		if (solveFor === "P1") {
			InputValidator.validateValues([V1, T1, P2, V2, T2], ["combined-V1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]);
			if (V1 === 0 || T2 === 0) throw new Error("V1 and T2 cannot be zero");
			result = (P2 * V2 * T1) / (V1 * T2);
			formula = "P<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(V<sub>1</sub> T<sub>2</sub>)";
		} else if (solveFor === "V1") {
			InputValidator.validateValues([P1, T1, P2, V2, T2], ["combined-P1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]);
			if (P1 === 0 || T2 === 0) throw new Error("P1 and T2 cannot be zero");
			result = (P2 * V2 * T1) / (P1 * T2);
			formula = "V<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> T<sub>2</sub>)";
		} else if (solveFor === "T1") {
			InputValidator.validateValues([P1, V1, P2, V2, T2], ["combined-P1", "combined-V1", "combined-P2", "combined-V2", "combined-T2"]);
			if (P2 === 0 || V2 === 0) throw new Error("P2 and V2 cannot be zero");
			result = (P1 * V1 * T2) / (P2 * V2);
			formula = "T<sub>1</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> V<sub>2</sub>)";
		} else if (solveFor === "P2") {
			InputValidator.validateValues([P1, V1, T1, V2, T2], ["combined-P1", "combined-V1", "combined-T1", "combined-V2", "combined-T2"]);
			if (V2 === 0 || T1 === 0) throw new Error("V2 and T1 cannot be zero");
			result = (P1 * V1 * T2) / (V2 * T1);
			formula = "P<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(V<sub>2</sub> T<sub>1</sub>)";
		} else if (solveFor === "V2") {
			InputValidator.validateValues([P1, V1, T1, P2, T2], ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-T2"]);
			if (P2 === 0 || T1 === 0) throw new Error("P2 and T1 cannot be zero");
			result = (P1 * V1 * T2) / (P2 * T1);
			formula = "V<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> T<sub>1</sub>)";
		} else if (solveFor === "T2") {
			InputValidator.validateValues([P1, V1, T1, P2, V2], ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2"]);
			if (P1 === 0 || V1 === 0) throw new Error("P1 and V1 cannot be zero");
			result = (P2 * V2 * T1) / (P1 * V1);
			formula = "T<sub>2</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> V<sub>1</sub>)";
		} else {
			throw new Error("Invalid solveFor");
		}
		let unit: string;
		if (solveFor.includes("P")) {
			unit = "pressure units";
		} else if (solveFor.includes("V")) {
			unit = "volume units";
		} else if (solveFor.includes("T")) {
			unit = "K";
		} else {
			unit = "";
		}
		this.resultDisplay.showFormula(formula, result, unit);
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const solveFor = this.getSolveFor(inputs);
		const P1 = parseFloat(inputs["combined-P1"] ?? "");
		const V1 = parseFloat(inputs["combined-V1"] ?? "");
		const T1 = parseFloat(inputs["combined-T1"] ?? "");
		const P2 = parseFloat(inputs["combined-P2"] ?? "");
		const V2 = parseFloat(inputs["combined-V2"] ?? "");
		const T2 = parseFloat(inputs["combined-T2"] ?? "");
		let result: number, formula: string;
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
		let unit: string;
		if (solveFor.includes("P")) {
			unit = "pressure units";
		} else if (solveFor.includes("V")) {
			unit = "volume units";
		} else if (solveFor.includes("T")) {
			unit = "K";
		} else {
			unit = "";
		}
		const formatted = this.numberFormatter.format(result, 4);
		return { value: formatted + " " + unit, explanation: formula + " = " + formatted + " " + unit };
	}
}

/**
 * Calculates pressure using the Van der Waals equation of state.
 */
export class VanDerWaalsCalculator extends Calculator {
	constructor() {
		super("vdw-result", ["vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"]);
	}

	protected performCalculation(): void {
		const V = this.getInput("vdw-V").getValue();
		const n = this.getInput("vdw-n").getValue();
		const T = this.getInput("vdw-T").getValue();
		const a = this.getInput("vdw-a").getValue();
		const b = this.getInput("vdw-b").getValue();
		InputValidator.validateValues([V, n, T, a, b], ["vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"]);
		if (V <= 0) throw new Error("Volume must be positive");
		if (V - n * b <= 0) throw new Error("Volume is too small for the given amount of gas (V must be greater than n*b)");
		const R = 0.08206;
		const P = (n * R * T) / (V - n * b) - a * Math.pow(n / V, 2);
		this.resultDisplay.showResult("<p>P=" + this.numberFormatter.format(P, 4) + " atm</p>");
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const V = parseFloat(inputs["vdw-V"] ?? "");
		const n = parseFloat(inputs["vdw-n"] ?? "");
		const T = parseFloat(inputs["vdw-T"] ?? "");
		const a = parseFloat(inputs["vdw-a"] ?? "");
		const b = parseFloat(inputs["vdw-b"] ?? "");
		if (isNaN(V) || isNaN(n) || isNaN(T) || isNaN(a) || isNaN(b)) {
			throw new Error("Missing or invalid inputs for vdw-V, vdw-n, vdw-T, vdw-a, vdw-b");
		}
		if (V <= 0) throw new Error("Volume must be positive");
		if (V - n * b <= 0) throw new Error("Volume is too small for the given amount of gas (V must be greater than n*b)");
		const R = 0.08206;
		const P = (n * R * T) / (V - n * b) - a * Math.pow(n / V, 2);
		const formatted = this.numberFormatter.format(P, 4);
		return { value: "P=" + formatted + " atm", explanation: "P=(nRT)/(V-nb) - a(n/V)² = " + formatted + " atm" };
	}
}

/**
 * Solves radioactive decay problems for remaining quantity, time elapsed,
 * or half-life, determined by the "half-life-solve-for" select element.
 */
export class HalfLifeCalculator extends SolveForCalculator {
	constructor() {
		super("half-life-result", ["initial-quantity", "time-input", "half-life-input", "remaining-quantity"], "half-life-solve-for");
	}

	protected performCalculation(): void {
		const solveFor = this.getSolveFor();
		const N0 = this.getInput("initial-quantity").getValue();
		const t = this.getInput("time-input").getValue();
		const t_half = this.getInput("half-life-input").getValue();
		const Nt = this.getInput("remaining-quantity").getValue();
		let result: number;
		if (solveFor === "remaining") {
			InputValidator.validateValues([N0, t, t_half], ["initial-quantity", "time-input", "half-life-input"]);
			if (t_half <= 0) throw new Error("Half-life must be positive");
			if (N0 <= 0) throw new Error("Initial quantity must be positive");
			result = N0 * Math.pow(0.5, t / t_half);
			this.resultDisplay.showResult("<p>Remaining: " + this.numberFormatter.format(result, 4) + " (after " + t + " units)</p>");
		} else if (solveFor === "time") {
			InputValidator.validateValues([N0, t_half, Nt], ["initial-quantity", "half-life-input", "remaining-quantity"]);
			if (t_half <= 0) throw new Error("Half-life must be positive");
			if (N0 <= 0) throw new Error("Initial quantity must be positive");
			if (Nt <= 0) throw new Error("Remaining quantity must be positive");
			result = (Math.log(Nt / N0) / Math.log(0.5)) * t_half;
			this.resultDisplay.showResult("<p>Time needed: " + this.numberFormatter.format(result, 4) + " units</p>");
		} else if (solveFor === "half-life") {
			InputValidator.validateValues([N0, t, Nt], ["initial-quantity", "time-input", "remaining-quantity"]);
			if (N0 <= 0) throw new Error("Initial quantity must be positive");
			if (Nt <= 0) throw new Error("Remaining quantity must be positive");
			result = t / (Math.log(Nt / N0) / Math.log(0.5));
			this.resultDisplay.showResult("<p>Half-life: " + this.numberFormatter.format(result, 4) + " units</p>");
		} else {
			throw new Error("Invalid solve-for selection");
		}
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const solveFor = this.getSolveFor(inputs);
		const N0 = parseFloat(inputs["initial-quantity"] ?? "");
		const t = parseFloat(inputs["time-input"] ?? "");
		const t_half = parseFloat(inputs["half-life-input"] ?? "");
		const Nt = parseFloat(inputs["remaining-quantity"] ?? "");
		let result: number;
		if (solveFor === "remaining") {
			if (isNaN(N0) || isNaN(t) || isNaN(t_half)) {
				throw new Error("Missing or invalid inputs for initial-quantity, time-input, half-life-input");
			}
			if (t_half <= 0) throw new Error("Half-life must be positive");
			if (N0 <= 0) throw new Error("Initial quantity must be positive");
			result = N0 * Math.pow(0.5, t / t_half);
			const formatted = this.numberFormatter.format(result, 4);
			return { value: "Remaining: " + formatted + " (after " + t + " units)", explanation: "Nt = N0 × (0.5)^(t/t_half) = " + formatted };
		} else if (solveFor === "time") {
			if (isNaN(N0) || isNaN(t_half) || isNaN(Nt)) {
				throw new Error("Missing or invalid inputs for initial-quantity, half-life-input, remaining-quantity");
			}
			if (t_half <= 0) throw new Error("Half-life must be positive");
			if (N0 <= 0) throw new Error("Initial quantity must be positive");
			if (Nt <= 0) throw new Error("Remaining quantity must be positive");
			result = (Math.log(Nt / N0) / Math.log(0.5)) * t_half;
			const formatted = this.numberFormatter.format(result, 4);
			return { value: "Time needed: " + formatted + " units", explanation: "t = (ln(Nt/N0) / ln(0.5)) × t_half = " + formatted + " units" };
		} else if (solveFor === "half-life") {
			if (isNaN(N0) || isNaN(t) || isNaN(Nt)) {
				throw new Error("Missing or invalid inputs for initial-quantity, time-input, remaining-quantity");
			}
			if (N0 <= 0) throw new Error("Initial quantity must be positive");
			if (Nt <= 0) throw new Error("Remaining quantity must be positive");
			result = t / (Math.log(Nt / N0) / Math.log(0.5));
			const formatted = this.numberFormatter.format(result, 4);
			return { value: "Half-life: " + formatted + " units", explanation: "t_half = t / (ln(Nt/N0) / ln(0.5)) = " + formatted + " units" };
		} else {
			throw new Error("Invalid solve-for selection");
		}
	}
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateIdealGasLaw(): void {
	new IdealGasLawCalculator().calculate();
}

export function calculateCombinedGasLaw(): void {
	new CombinedGasLawCalculator().calculate();
}

export function calculateVanDerWaals(): void {
	new VanDerWaalsCalculator().calculate();
}

export function calculateHalfLife(): void {
	new HalfLifeCalculator().calculate();
}
