import { Calculator } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";

/**
 * Solves the ideal gas law PV = nRT for any one of P, V, n, or T,
 * determined by the "ideal-solve-for" select element. The gas constant
 * R is selected from the "ideal-R-units" select (atm-L or SI).
 */
export class IdealGasLawCalculator extends SolveForCalculator {
	constructor() {
		super("ideal-result", ["ideal-P", "ideal-V", "ideal-n", "ideal-T"], "ideal-solve-for");
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
			result = (n * R * T) / V;
			formula = "P=(nRT)/V";
		} else if (solveFor === "V") {
			InputValidator.validateValues([P, n, T], ["ideal-P", "ideal-n", "ideal-T"]);
			result = (n * R * T) / P;
			formula = "V=(nRT)/P";
		} else if (solveFor === "n") {
			InputValidator.validateValues([P, V, T], ["ideal-P", "ideal-V", "ideal-T"]);
			result = (P * V) / (R * T);
			formula = "n=(PV)/(RT)";
		} else if (solveFor === "T") {
			InputValidator.validateValues([P, V, n], ["ideal-P", "ideal-V", "ideal-n"]);
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
			result = (P2 * V2 * T1) / (V1 * T2);
			formula = "P<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(V<sub>1</sub> T<sub>2</sub>)";
		} else if (solveFor === "V1") {
			InputValidator.validateValues([P1, T1, P2, V2, T2], ["combined-P1", "combined-T1", "combined-P2", "combined-V2", "combined-T2"]);
			result = (P2 * V2 * T1) / (P1 * T2);
			formula = "V<sub>1</sub>=(P<sub>2</sub> V<sub>2</sub> T<sub>1</sub>)/(P<sub>1</sub> T<sub>2</sub>)";
		} else if (solveFor === "T1") {
			InputValidator.validateValues([P1, V1, P2, V2, T2], ["combined-P1", "combined-V1", "combined-P2", "combined-V2", "combined-T2"]);
			result = (P1 * V1 * T2) / (P2 * V2);
			formula = "T<sub>1</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> V<sub>2</sub>)";
		} else if (solveFor === "P2") {
			InputValidator.validateValues([P1, V1, T1, V2, T2], ["combined-P1", "combined-V1", "combined-T1", "combined-V2", "combined-T2"]);
			result = (P1 * V1 * T2) / (V2 * T1);
			formula = "P<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(V<sub>2</sub> T<sub>1</sub>)";
		} else if (solveFor === "V2") {
			InputValidator.validateValues([P1, V1, T1, P2, T2], ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-T2"]);
			result = (P1 * V1 * T2) / (P2 * T1);
			formula = "V<sub>2</sub>=(P<sub>1</sub> V<sub>1</sub> T<sub>2</sub>)/(P<sub>2</sub> T<sub>1</sub>)";
		} else if (solveFor === "T2") {
			InputValidator.validateValues([P1, V1, T1, P2, V2], ["combined-P1", "combined-V1", "combined-T1", "combined-P2", "combined-V2"]);
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
