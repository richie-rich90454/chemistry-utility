import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import { cellPotential, electrolysis, nernst } from "./calculators/electrochemistry.js";
import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";

/**
 * Calculates the standard cell potential E°_cell from two half-reaction
 * potentials. The higher potential is the cathode, the lower is the anode.
 */
export class CellPotentialCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "cell-potential";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return cellPotential(parseFloat(inputs["E1"] ?? ""), parseFloat(inputs["E2"] ?? ""));
	}
}

/**
 * Calculates the cell potential under non-standard conditions using the
 * Nernst equation: E = E° - (RT)/(nF) * ln(Q).
 */
export class NernstCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "nernst";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return nernst(
			parseFloat(inputs["E-standard"] ?? ""),
			parseFloat(inputs["temperature"] ?? ""),
			parseFloat(inputs["n-electrons"] ?? ""),
			parseFloat(inputs["Q-reaction"] ?? "")
		);
	}
}

/**
 * Solves Faraday's law of electrolysis for mass deposited, current, or
 * time, determined by the "electrolysis-solve-for" select element.
 */
export class ElectrolysisCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "electrolysis";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return electrolysis(
			inputs["electrolysis-solve-for"] ?? "",
			parseFloat(inputs["electrolysis-m"] ?? ""),
			parseFloat(inputs["electrolysis-I"] ?? ""),
			parseFloat(inputs["electrolysis-t"] ?? ""),
			parseFloat(inputs["electrolysis-z"] ?? ""),
			parseFloat(inputs["electrolysis-M"] ?? "")
		);
	}
}

function readValue(id: string): string {
	return new InputElement(id).getStringValue();
}

// Legacy DOM entry points. The calculator classes are DOM-free; these
// free functions exist only for the pre-migration index.html wiring and
// the tests that still drive the legacy element ids.
function runLegacy(
	calculator: PureCalculator,
	resultElementId: string,
	inputIds: string[],
	solveForId: string | null,
	render: (metadata: Record<string, number>, nf: NumberFormatter) => string
): void {
	let inputs: Record<string, string> = {};
	for (let i = 0; i < inputIds.length; i++) {
		inputs[inputIds[i]] = readValue(inputIds[i]);
	}
	if (solveForId !== null) {
		inputs[solveForId] = readValue(solveForId);
	}
	let result: CalculatorResult = calculator.calculatePure(inputs);
	let explanation: string = result.explanation ?? "";
	let display: ResultDisplay = new ResultDisplay(resultElementId);
	if (explanation.startsWith("Error")) {
		display.showError(explanation.slice("Error: ".length));
		return;
	}
	display.showResult(render(result.metadata as Record<string, number>, NumberFormatter.createFromCurrentLocale()));
}

export function calculateCellPotential(): void {
	runLegacy(
		new CellPotentialCalculator(),
		"cell-potential-result",
		["E1", "E2"],
		null,
		(metadata: Record<string, number>, nf: NumberFormatter) =>
			"<p>The half-reaction with E&deg;=" + nf.format(metadata["E_cathode"], 3) + " V is the cathode, and the one with E&deg;=" + nf.format(metadata["E_anode"], 3) + " V is the anode.</p>" +
			"<p>The standard cell potential E&deg;_cell=" + nf.format(metadata["E_cell"], 3) + " V</p>"
	);
}

export function calculateNernst(): void {
	runLegacy(
		new NernstCalculator(),
		"nernst-result",
		["E-standard", "temperature", "n-electrons", "Q-reaction"],
		null,
		(metadata: Record<string, number>, nf: NumberFormatter) => "<p>The cell potential E=" + nf.format(metadata["E"], 3) + " V</p>"
	);
}

export function calculateElectrolysis(): void {
	runLegacy(
		new ElectrolysisCalculator(),
		"electrolysis-result",
		["electrolysis-m", "electrolysis-I", "electrolysis-t", "electrolysis-z", "electrolysis-M"],
		"electrolysis-solve-for",
		(metadata: Record<string, number>, nf: NumberFormatter) => {
			if (metadata["mass"] !== undefined) {
				return "<p>The mass deposited m=" + nf.format(metadata["mass"], 3) + " g</p>";
			}
			if (metadata["current"] !== undefined) {
				return "<p>The current I=" + nf.format(metadata["current"], 3) + " A</p>";
			}
			return "<p>The time t=" + nf.format(metadata["time"], 3) + " s</p>";
		}
	);
}
