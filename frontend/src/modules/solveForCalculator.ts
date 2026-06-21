import { Calculator } from "./calculator.js";

/**
 * Abstract base class for calculators that solve for a chosen variable. In
 * addition to the standard inputs, it tracks a "solve for" select element
 * whose value determines which variable the subclass should compute.
 */
export abstract class SolveForCalculator extends Calculator {
	protected solveForElement: HTMLSelectElement;

	constructor(resultElementId: string, inputElementIds: string[], solveForElementId: string) {
		super(resultElementId, inputElementIds);
		this.solveForElement = document.getElementById(solveForElementId) as HTMLSelectElement;
	}

	/** Returns the current value of the "solve for" select element. */
	public getSolveFor(): string {
		return this.solveForElement.value;
	}
}
