import type { Calculator } from "./calculator.js";

/**
 * Base class for events emitted during the calculator lifecycle.
 * Carries a reference to the source calculator and a timestamp.
 */
export class CalculatorEvent {
	private source: Calculator;
	private timestamp: Date;

	constructor(source: Calculator) {
		this.source = source;
		this.timestamp = new Date();
	}

	/** Returns the calculator that emitted this event. */
	public getSource(): Calculator {
		return this.source;
	}

	/** Returns the time at which this event was created. */
	public getTimestamp(): Date {
		return this.timestamp;
	}
}

/**
 * Emitted when a calculation starts, before any inputs are read.
 */
export class CalculationStartedEvent extends CalculatorEvent {
	constructor(source: Calculator) {
		super(source);
	}
}

/**
 * Emitted when a calculation completes successfully.
 * Carries the result HTML that was rendered.
 */
export class CalculationCompletedEvent extends CalculatorEvent {
	private resultHtml: string;

	constructor(source: Calculator, resultHtml: string) {
		super(source);
		this.resultHtml = resultHtml;
	}

	/** Returns the HTML that was rendered as the calculation result. */
	public getResultHtml(): string {
		return this.resultHtml;
	}
}

/**
 * Emitted when a calculation fails with an error.
 * Carries the error message.
 */
export class CalculationErrorEvent extends CalculatorEvent {
	private errorMessage: string;

	constructor(source: Calculator, errorMessage: string) {
		super(source);
		this.errorMessage = errorMessage;
	}

	/** Returns the error message from the failed calculation. */
	public getErrorMessage(): string {
		return this.errorMessage;
	}
}
