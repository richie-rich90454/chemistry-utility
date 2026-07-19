import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";
import { ExportManager } from "./exportManager.js";
import { PluginManager } from "./pluginManager.js";

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
 * Shape of the payload passed through the "beforeCalculation" hook.
 */
interface BeforeCalculationPayload {
	calculatorId: string;
	inputs: Record<string, unknown>;
}

/**
 * Shape of the payload passed through the "afterCalculation" hook.
 */
interface AfterCalculationPayload {
	calculatorId: string;
	result: unknown;
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
	 * calculation, and reports any error through the result display.
	 * Lifecycle hooks ("beforeCalculation", "afterCalculation") are
	 * dispatched to enabled plugins via the PluginManager so plugins can
	 * transform inputs or results. This method is not meant to be
	 * overridden by subclasses.
	 */
	public calculate(): void {
		this.clearAllErrors();
		this.showSkeleton();
		try {
			let pm: PluginManager = PluginManager.getInstance();
			let inputs: Record<string, unknown> = this.readInputsForHook();
			let beforePayload: BeforeCalculationPayload = {
				calculatorId: this.calculatorId,
				inputs: inputs
			};
			let beforeResult: unknown = pm.executeHook("beforeCalculation", beforePayload);
			let beforeFinal: BeforeCalculationPayload = beforeResult as BeforeCalculationPayload;
			this.applyHookInputs(beforeFinal.inputs);
			this.performCalculation();
			let resultText: string = this.readResultForHook();
			let afterPayload: AfterCalculationPayload = {
				calculatorId: this.calculatorId,
				result: resultText
			};
			let afterResult: unknown = pm.executeHook("afterCalculation", afterPayload);
			let afterFinal: AfterCalculationPayload = afterResult as AfterCalculationPayload;
			if (typeof afterFinal.result === "string" && afterFinal.result !== resultText) {
				this.applyHookResult(afterFinal.result);
			}
			this.logToHistory();
		} catch (error) {
			this.resultDisplay.showError((error as Error).message);
		}
		this.hideSkeleton();
	}

	/** Reads the current values of every owned input element into a record. */
	protected readInputsForHook(): Record<string, unknown> {
		let inputs: Record<string, unknown> = {};
		for (let i = 0; i < this.inputElements.length; i++) {
			let el = this.inputElements[i].getElement() as HTMLInputElement | HTMLSelectElement;
			inputs[el.id] = el.value;
		}
		return inputs;
	}

	/** Writes the (possibly transformed) inputs back to the DOM elements. */
	protected applyHookInputs(inputs: Record<string, unknown>): void {
		for (let i = 0; i < this.inputElements.length; i++) {
			let el = this.inputElements[i].getElement() as HTMLInputElement | HTMLSelectElement;
			let value: unknown = inputs[el.id];
			if (value !== undefined && value !== null) {
				el.value = String(value);
			}
		}
	}

	/** Returns the trimmed text content of the result display element. */
	protected readResultForHook(): string {
		let resultEl = this.resultDisplay.getElement();
		return resultEl ? (resultEl.textContent || "").trim() : "";
	}

	/** Replaces the result display's text content with the supplied string. */
	protected applyHookResult(result: string): void {
		let resultEl = this.resultDisplay.getElement();
		if (resultEl) {
			resultEl.textContent = result;
		}
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
