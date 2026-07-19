import { Calculator } from "./calculator.js";
import { InputElement } from "./inputElement.js";

/**
 * Abstract base class for calculators that solve for a chosen variable. In
 * addition to the standard inputs, it tracks a "solve for" select element
 * whose value determines which variable the subclass should compute.
 */
export abstract class SolveForCalculator extends Calculator {
	protected solveForElement: InputElement;
	protected solveForElementId: string;

	constructor(resultElementId: string, inputElementIds: string[], solveForElementId: string) {
		super(resultElementId, inputElementIds);
		this.solveForElementId = solveForElementId;
		this.solveForElement = new InputElement(solveForElementId);
	}

	/** Returns the current value of the "solve for" select element. */
	public getSolveFor(): string;
	/**
	 * DOM-free variant: returns the "solve for" value read from the supplied
	 * inputs record. The key used is the same solve-for element id this
	 * calculator was constructed with — callers must include that id in the
	 * inputs record (e.g. `inputs["ideal-solve-for"]`).
	 */
	public getSolveFor(inputs: Record<string, string>): string;
	public getSolveFor(inputs?: Record<string, string>): string {
		if (inputs !== undefined) {
			return inputs[this.solveForElementId] ?? "";
		}
		return (this.solveForElement.getElement() as HTMLSelectElement).value;
	}
}
