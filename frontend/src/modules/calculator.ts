import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";
import { ExportManager } from "./exportManager.js";

/**
 * Abstract base class implementing the template method pattern for chemistry
 * calculators. The {@link calculate} method is the fixed template: it clears
 * all input errors, delegates the actual work to {@link performCalculation},
 * and surfaces any thrown error via the result display.
 *
 * Subclasses implement {@link performCalculation} to read inputs, validate,
 * compute, and render the result.
 */
export abstract class Calculator {
	protected resultDisplay: ResultDisplay;
	protected inputElements: InputElement[];
	protected numberFormatter: NumberFormatter;
	protected calculatorId: string;

	constructor(resultElementId: string, inputElementIds: string[]) {
		this.resultDisplay = new ResultDisplay(resultElementId);
		this.inputElements = inputElementIds.map((id) => new InputElement(id));
		this.numberFormatter = NumberFormatter.createFromCurrentLocale();
		this.calculatorId = resultElementId.replace(/-result$/, "");
	}

	/**
	 * Template method. Clears errors, shows a loading skeleton, runs the
	 * calculation, and reports any error through the result display.
	 * This method is not meant to be overridden by subclasses.
	 */
	public calculate(): void {
		this.clearAllErrors();
		this.showSkeleton();
		try {
			this.performCalculation();
			this.logToHistory();
		} catch (error) {
			this.resultDisplay.showError((error as Error).message);
		}
		this.hideSkeleton();
	}

	/** Removes the "error" class from every input element owned by this calculator. */
	public clearAllErrors(): void {
		for (let i = 0; i < this.inputElements.length; i++) {
			this.inputElements[i].clearError();
		}
	}

	/** Subclasses implement the calculator-specific logic here. */
	protected abstract performCalculation(): void;

	/**
	 * Finds an input element owned by this calculator by its DOM element id.
	 * Throws if no matching element exists.
	 */
	protected getInput(id: string): InputElement {
		for (let i = 0; i < this.inputElements.length; i++) {
			if (this.inputElements[i].getElement().id === id) {
				return this.inputElements[i];
			}
		}
		throw new Error("Input element not found: " + id);
	}

	/** Returns the result display used by this calculator. */
	public getResultDisplay(): ResultDisplay {
		return this.resultDisplay;
	}

	/** Shows a skeleton loading animation on the result element. */
	protected showSkeleton(): void {
		let resultEl = this.resultDisplay.getElement();
		if (resultEl && !resultEl.textContent?.trim()) {
			resultEl.classList.add("skeleton", "skeleton-result");
		}
	}

	/** Removes the skeleton loading animation from the result element. */
	protected hideSkeleton(): void {
		let resultEl = this.resultDisplay.getElement();
		if (resultEl) {
			resultEl.classList.remove("skeleton", "skeleton-result");
		}
	}

	/** Logs the calculation to the history via ExportManager. */
	protected logToHistory(): void {
		let inputs: Record<string, string> = {};
		for (let i = 0; i < this.inputElements.length; i++) {
			let el = this.inputElements[i].getElement() as HTMLInputElement | HTMLSelectElement;
			inputs[el.id] = el.value;
		}
		let resultEl = this.resultDisplay.getElement();
		let resultText = resultEl ? (resultEl.textContent || "").trim() : "";
		ExportManager.getInstance().addToHistory(this.calculatorId, inputs, resultText);
	}
}
