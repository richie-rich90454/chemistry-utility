import { Calculator } from "./calculator.js";
import type { CalculatorResult } from "./calculator.js";
import type { InputProvider } from "./inputProvider.js";
import { DomInputProvider } from "./inputProvider.js";

/**
 * Pure calculation function signature used by the DOM-free
 * {@link Calculator.calculatePure} entry point.
 */
export type PureCalculationFn = (inputs: Record<string, string>) => CalculatorResult;

/**
 * Builder for constructing {@link Calculator} instances with a fluent API.
 * Allows incremental assembly of calculators that have many inputs, a
 * solve-for select, and a result display — without requiring subclasses.
 */
export class CalculatorBuilder {
	private inputEntries: Array<{ name: string; id: string }> = [];
	private solveForId: string | null = null;
	private resultDisplayId: string | null = null;
	private inputProviderValue: InputProvider | null = null;
	private calculationFn: ((calc: BuiltCalculator) => void) | null = null;
	private calculationPureFn: PureCalculationFn | null = null;

	/** Adds a named input element mapped to the given DOM id. */
	public addInput(name: string, id: string): CalculatorBuilder {
		this.inputEntries.push({ name: name, id: id });
		return this;
	}

	/** Sets the DOM id of the "solve for" select element. */
	public addSolveFor(id: string): CalculatorBuilder {
		this.solveForId = id;
		return this;
	}

	/** Sets the DOM id of the result display element. */
	public setResultDisplay(display: string): CalculatorBuilder {
		this.resultDisplayId = display;
		return this;
	}

	/** Sets a custom {@link InputProvider} for the built calculator. */
	public setInputProvider(provider: InputProvider): CalculatorBuilder {
		this.inputProviderValue = provider;
		return this;
	}

	/** Sets the calculation logic for the built calculator. */
	public setCalculation(fn: (calc: BuiltCalculator) => void): CalculatorBuilder {
		this.calculationFn = fn;
		return this;
	}

	/**
	 * Sets a DOM-free calculation function for the built calculator. When
	 * set, the resulting {@link BuiltCalculator} overrides
	 * {@link Calculator.performCalculationPure} to invoke this function;
	 * when not set, calling {@link Calculator.calculatePure} on the built
	 * calculator throws the default "performCalculationPure not implemented"
	 * error.
	 */
	public setCalculationPure(fn: PureCalculationFn): CalculatorBuilder {
		this.calculationPureFn = fn;
		return this;
	}

	/**
	 * Builds and returns a {@link BuiltCalculator} from the accumulated
	 * configuration. Throws if required fields (result display, calculation)
	 * are missing.
	 */
	public build(): BuiltCalculator {
		if (this.resultDisplayId === null) {
			throw new Error("CalculatorBuilder: result display id is required");
		}
		if (this.calculationFn === null) {
			throw new Error("CalculatorBuilder: calculation function is required");
		}
		let provider = this.inputProviderValue !== null ? this.inputProviderValue : new DomInputProvider();
		let inputIds = this.inputEntries.map((entry) => entry.id);
		return new BuiltCalculator(
			this.resultDisplayId,
			inputIds,
			this.solveForId,
			provider,
			this.calculationFn,
			this.calculationPureFn
		);
	}
}

/**
 * A concrete {@link Calculator} produced by {@link CalculatorBuilder}.
 * Delegates {@link performCalculation} to the function supplied via
 * {@link CalculatorBuilder.setCalculation} and optionally delegates
 * {@link performCalculationPure} to the function supplied via
 * {@link CalculatorBuilder.setCalculationPure}.
 */
export class BuiltCalculator extends Calculator {
	private solveForElement: HTMLSelectElement | null;
	private inputProvider: InputProvider;
	private calculationFn: (calc: BuiltCalculator) => void;
	private calculationPureFn: PureCalculationFn | null;

	constructor(
		resultElementId: string,
		inputElementIds: string[],
		solveForElementId: string | null,
		inputProvider: InputProvider,
		calculationFn: (calc: BuiltCalculator) => void,
		calculationPureFn: PureCalculationFn | null = null
	) {
		super(resultElementId, inputElementIds);
		this.inputProvider = inputProvider;
		if (solveForElementId !== null) {
			this.solveForElement = this.inputProvider.getElement(solveForElementId) as HTMLSelectElement;
		} else {
			this.solveForElement = null;
		}
		this.calculationFn = calculationFn;
		this.calculationPureFn = calculationPureFn;
	}

	/** Returns the current value of the "solve for" select, or empty string if none. */
	public getSolveFor(): string {
		if (this.solveForElement !== null) {
			return this.solveForElement.value;
		}
		return "";
	}

	protected performCalculation(): void {
		this.calculationFn(this);
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		if (this.calculationPureFn === null) {
			return super.performCalculationPure(inputs);
		}
		return this.calculationPureFn(inputs);
	}
}
