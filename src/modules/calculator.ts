import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";
import { ExportManager } from "./exportManager.js";

/**
 * Result returned by the DOM-free {@link Calculator.calculatePure} entry
 * point. The pure API keeps the legacy DOM-coupled {@link Calculator.calculate}
 * path intact while exposing a structured return value for Solid components
 * and other consumers that do not (and should not) read from the DOM.
 */
export interface CalculatorResult {
	value: string;
	explanation?: string;
	chartData?: unknown;
	metadata?: Record<string, unknown>;
}

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
	 * calculation, and reports any error through the result display. This
	 * method is not meant to be overridden by subclasses.
	 */
	public async calculate(): Promise<void> {
		this.clearAllErrors();
		this.showSkeleton();
		try {
			await this.performCalculation();
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

	/**
	 * Subclasses implement the calculator-specific logic here. May be async;
	 * calculate() awaits the result before running after-hooks.
	 */
	protected abstract performCalculation(): void | Promise<void>;

	/**
	 * DOM-free calculation hook. Subclasses override this to expose the same
	 * math as {@link performCalculation} but reading from the supplied
	 * inputs record and returning a structured {@link CalculatorResult}
	 * instead of writing to the DOM. The default implementation throws so
	 * subclasses can opt in incrementally without breaking the legacy
	 * hierarchy.
	 */
	protected performCalculationPure(_inputs: Record<string, string>): CalculatorResult {
		throw new Error("performCalculationPure not implemented for " + this.calculatorId);
	}

	/**
	 * DOM-free template method. Mirrors {@link calculate} but reads inputs
	 * from a record and returns a {@link CalculatorResult} instead of
	 * touching the DOM. The only side-effect is appending to the calculation
	 * history via {@link ExportManager.addToHistory} (which is DOM-free and
	 * persists to localStorage). Errors are caught and surfaced as a
	 * {@link CalculatorResult} with `value: ""` and an "Error: …"
	 * explanation rather than being thrown to the caller.
	 */
	public calculatePure(inputs: Record<string, string>): CalculatorResult {
		try {
			let result: CalculatorResult = this.performCalculationPure(inputs);
			ExportManager.getInstance().addToHistory(this.calculatorId, inputs, result.value, result.explanation);
			return result;
		} catch (error) {
			let message: string = error instanceof Error ? error.message : String(error);
			return { value: "", explanation: "Error: " + message };
		}
	}

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
