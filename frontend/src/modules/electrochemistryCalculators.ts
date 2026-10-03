import { Calculator } from "./calculator.js";
import type { CalculatorResult } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";

/**
 * Calculates the standard cell potential E°_cell from two half-reaction
 * potentials. The higher potential is the cathode, the lower is the anode.
 */
export class CellPotentialCalculator extends Calculator {
	constructor() {
		super("cell-potential-result", ["E1", "E2"]);
	}

	protected performCalculation(): void {
		const E1 = this.getInput("E1").getValue();
		const E2 = this.getInput("E2").getValue();
		if (isNaN(E1) || isNaN(E2)) {
			this.getInput("E1").markError();
			this.getInput("E2").markError();
			throw new Error("Please enter valid numbers for both potentials.");
		}
		const E_cathode = Math.max(E1, E2);
		const E_anode = Math.min(E1, E2);
		const E_cell = E_cathode - E_anode;
		const html = "<p>The half-reaction with E&deg;=" + this.numberFormatter.format(E_cathode, 3) + " V is the cathode, and the one with E&deg;=" + this.numberFormatter.format(E_anode, 3) + " V is the anode.</p>" + "<p>The standard cell potential E&deg;_cell=" + this.numberFormatter.format(E_cell, 3) + " V</p>";
		this.resultDisplay.showResult(html);
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const E1 = parseFloat(inputs["E1"] ?? "");
		const E2 = parseFloat(inputs["E2"] ?? "");
		if (isNaN(E1) || isNaN(E2)) {
			throw new Error("Please enter valid numbers for both potentials.");
		}
		const E_cathode = Math.max(E1, E2);
		const E_anode = Math.min(E1, E2);
		const E_cell = E_cathode - E_anode;
		return {
			value: "E_cell = " + this.numberFormatter.format(E_cell, 3) + " V",
			explanation: "Cathode E = " + this.numberFormatter.format(E_cathode, 3) + " V; Anode E = " + this.numberFormatter.format(E_anode, 3) + " V; E_cell = E_cathode - E_anode = " + this.numberFormatter.format(E_cell, 3) + " V",
			metadata: {
				E_cell: E_cell,
				E_cathode: E_cathode,
				E_anode: E_anode,
				E1: E1,
				E2: E2
			}
		};
	}
}

/**
 * Calculates the cell potential under non-standard conditions using the
 * Nernst equation: E = E° - (RT)/(nF) * ln(Q).
 */
export class NernstCalculator extends Calculator {
	constructor() {
		super("nernst-result", ["E-standard", "temperature", "n-electrons", "Q-reaction"]);
	}

	protected performCalculation(): void {
		const E_standard = this.getInput("E-standard").getValue();
		const T = this.getInput("temperature").getValue();
		const n = this.getInput("n-electrons").getValue();
		const Q = this.getInput("Q-reaction").getValue();
		if (isNaN(E_standard) || isNaN(T) || isNaN(n) || isNaN(Q) || T <= 0 || n <= 0 || Q <= 0) {
			this.getInput("E-standard").markError();
			this.getInput("temperature").markError();
			this.getInput("n-electrons").markError();
			this.getInput("Q-reaction").markError();
			throw new Error("Please enter valid positive numbers for all fields.");
		}
		if (n !== Math.floor(n)) {
			this.getInput("n-electrons").markError();
			throw new Error("Number of electrons must be an integer");
		}
		const gasConstant = 8.314;
		const faradayConstant = 96485;
		const E = E_standard - ((gasConstant * T) / (n * faradayConstant)) * Math.log(Q);
		this.resultDisplay.showResult("<p>The cell potential E=" + this.numberFormatter.format(E, 3) + " V</p>");
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const E_standard = parseFloat(inputs["E-standard"] ?? "");
		const T = parseFloat(inputs["temperature"] ?? "");
		const n = parseFloat(inputs["n-electrons"] ?? "");
		const Q = parseFloat(inputs["Q-reaction"] ?? "");
		if (isNaN(E_standard) || isNaN(T) || isNaN(n) || isNaN(Q) || T <= 0 || n <= 0 || Q <= 0) {
			throw new Error("Please enter valid positive numbers for all fields.");
		}
		if (n !== Math.floor(n)) {
			throw new Error("Number of electrons must be an integer");
		}
		const gasConstant = 8.314;
		const faradayConstant = 96485;
		const E = E_standard - ((gasConstant * T) / (n * faradayConstant)) * Math.log(Q);
		return {
			value: "E = " + this.numberFormatter.format(E, 3) + " V",
			explanation: "E = E_standard - (R*T/(n*F))*ln(Q) = " + this.numberFormatter.format(E_standard, 3) + " - (" + this.numberFormatter.format(gasConstant * T, 4) + "/(" + this.numberFormatter.format(n, 3) + " * " + faradayConstant + "))*ln(" + Q + ") = " + this.numberFormatter.format(E, 3) + " V",
			metadata: {
				E: E,
				E_standard: E_standard,
				temperature: T,
				n_electrons: n,
				Q: Q,
				gasConstant: gasConstant,
				faradayConstant: faradayConstant
			}
		};
	}
}

/**
 * Solves Faraday's law of electrolysis for mass deposited, current, or
 * time, determined by the "electrolysis-solve-for" select element.
 */
export class ElectrolysisCalculator extends SolveForCalculator {
	constructor() {
		super("electrolysis-result", ["electrolysis-m", "electrolysis-I", "electrolysis-t", "electrolysis-z", "electrolysis-M"], "electrolysis-solve-for");
	}

	protected performCalculation(): void {
		const solveFor = this.getSolveFor();
		const m = this.getInput("electrolysis-m").getValue();
		const I = this.getInput("electrolysis-I").getValue();
		const t = this.getInput("electrolysis-t").getValue();
		const z = this.getInput("electrolysis-z").getValue();
		const M = this.getInput("electrolysis-M").getValue();
		const faradayConstant = 96485;
		if (solveFor === "mass") {
			if (isNaN(I) || isNaN(t) || isNaN(z) || isNaN(M) || I <= 0 || t <= 0 || z <= 0 || M <= 0) {
				this.getInput("electrolysis-I").markError();
				this.getInput("electrolysis-t").markError();
				this.getInput("electrolysis-z").markError();
				this.getInput("electrolysis-M").markError();
				throw new Error("Please enter valid positive numbers for I, t, z, and M.");
			}
			if (z !== Math.floor(z)) {
				this.getInput("electrolysis-z").markError();
				throw new Error("Charge number z must be an integer");
			}
			const n = (I * t) / (faradayConstant * z);
			const mass = n * M;
			this.resultDisplay.showResult("<p>The mass deposited m=" + this.numberFormatter.format(mass, 3) + " g</p>");
		} else if (solveFor === "current") {
			if (isNaN(m) || isNaN(t) || isNaN(z) || isNaN(M) || m <= 0 || t <= 0 || z <= 0 || M <= 0) {
				this.getInput("electrolysis-m").markError();
				this.getInput("electrolysis-t").markError();
				this.getInput("electrolysis-z").markError();
				this.getInput("electrolysis-M").markError();
				throw new Error("Please enter valid positive numbers for m, t, z, and M.");
			}
			if (z !== Math.floor(z)) {
				this.getInput("electrolysis-z").markError();
				throw new Error("Charge number z must be an integer");
			}
			const n = m / M;
			const current = (n * faradayConstant * z) / t;
			this.resultDisplay.showResult("<p>The current I=" + this.numberFormatter.format(current, 3) + " A</p>");
		} else if (solveFor === "time") {
			if (isNaN(m) || isNaN(I) || isNaN(z) || isNaN(M) || m <= 0 || I <= 0 || z <= 0 || M <= 0) {
				this.getInput("electrolysis-m").markError();
				this.getInput("electrolysis-I").markError();
				this.getInput("electrolysis-z").markError();
				this.getInput("electrolysis-M").markError();
				throw new Error("Please enter valid positive numbers for m, I, z, and M.");
			}
			if (z !== Math.floor(z)) {
				this.getInput("electrolysis-z").markError();
				throw new Error("Charge number z must be an integer");
			}
			const n = m / M;
			const time = (n * faradayConstant * z) / I;
			this.resultDisplay.showResult("<p>The time t=" + this.numberFormatter.format(time, 3) + " s</p>");
		} else {
			throw new Error("Invalid solve-for selection");
		}
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		const solveFor = this.getSolveFor(inputs);
		const m = parseFloat(inputs["electrolysis-m"] ?? "");
		const I = parseFloat(inputs["electrolysis-I"] ?? "");
		const t = parseFloat(inputs["electrolysis-t"] ?? "");
		const z = parseFloat(inputs["electrolysis-z"] ?? "");
		const M = parseFloat(inputs["electrolysis-M"] ?? "");
		const faradayConstant = 96485;
		if (solveFor === "mass") {
			if (isNaN(I) || isNaN(t) || isNaN(z) || isNaN(M) || I <= 0 || t <= 0 || z <= 0 || M <= 0) {
				throw new Error("Please enter valid positive numbers for I, t, z, and M.");
			}
			if (z !== Math.floor(z)) {
				throw new Error("Charge number z must be an integer");
			}
			const n = (I * t) / (faradayConstant * z);
			const mass = n * M;
			return {
				value: "Mass deposited m = " + this.numberFormatter.format(mass, 3) + " g",
				explanation: "n = (I*t)/(F*z) = " + this.numberFormatter.format(n, 6) + " mol; m = n*M = " + this.numberFormatter.format(mass, 3) + " g",
				metadata: { mass: mass, moles: n, I: I, t: t, z: z, M: M, solveFor: solveFor }
			};
		} else if (solveFor === "current") {
			if (isNaN(m) || isNaN(t) || isNaN(z) || isNaN(M) || m <= 0 || t <= 0 || z <= 0 || M <= 0) {
				throw new Error("Please enter valid positive numbers for m, t, z, and M.");
			}
			if (z !== Math.floor(z)) {
				throw new Error("Charge number z must be an integer");
			}
			const n = m / M;
			const current = (n * faradayConstant * z) / t;
			return {
				value: "Current I = " + this.numberFormatter.format(current, 3) + " A",
				explanation: "n = m/M = " + this.numberFormatter.format(n, 6) + " mol; I = (n*F*z)/t = " + this.numberFormatter.format(current, 3) + " A",
				metadata: { current: current, moles: n, m: m, t: t, z: z, M: M, solveFor: solveFor }
			};
		} else if (solveFor === "time") {
			if (isNaN(m) || isNaN(I) || isNaN(z) || isNaN(M) || m <= 0 || I <= 0 || z <= 0 || M <= 0) {
				throw new Error("Please enter valid positive numbers for m, I, z, and M.");
			}
			if (z !== Math.floor(z)) {
				throw new Error("Charge number z must be an integer");
			}
			const n = m / M;
			const time = (n * faradayConstant * z) / I;
			return {
				value: "Time t = " + this.numberFormatter.format(time, 3) + " s",
				explanation: "n = m/M = " + this.numberFormatter.format(n, 6) + " mol; t = (n*F*z)/I = " + this.numberFormatter.format(time, 3) + " s",
				metadata: { time: time, moles: n, m: m, I: I, z: z, M: M, solveFor: solveFor }
			};
		} else {
			throw new Error("Invalid solve-for selection");
		}
	}
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateCellPotential(): void {
	new CellPotentialCalculator().calculate();
}

export function calculateNernst(): void {
	new NernstCalculator().calculate();
}

export function calculateElectrolysis(): void {
	new ElectrolysisCalculator().calculate();
}
