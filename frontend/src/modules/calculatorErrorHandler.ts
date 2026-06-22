import { ResultDisplay } from "./resultDisplay.js";
import { DebugLogger } from "./debugLogger.js";

/**
 * Singleton class that centralizes error handling for all calculators.
 * Provides a single point of control for logging errors and displaying
 * user-friendly messages via the registered {@link ResultDisplay} instances.
 */
export class CalculatorErrorHandler {
	private static instance: CalculatorErrorHandler;
	private resultDisplays: Map<string, ResultDisplay>;
	private logger: DebugLogger;

	private constructor() {
		this.resultDisplays = new Map();
		this.logger = DebugLogger.getInstance();
	}

	/** Returns the singleton instance of {@link CalculatorErrorHandler}. */
	public static getInstance(): CalculatorErrorHandler {
		if (!CalculatorErrorHandler.instance) {
			CalculatorErrorHandler.instance = new CalculatorErrorHandler();
		}
		return CalculatorErrorHandler.instance;
	}

	/**
	 * Registers a {@link ResultDisplay} for a given calculator ID.
	 * When {@link handle} is called for that calculator, the error
	 * message will be shown through the registered display.
	 */
	public setResultDisplay(calculatorId: string, display: ResultDisplay): void {
		this.resultDisplays.set(calculatorId, display);
	}

	/**
	 * Handles an error by logging it and displaying a user-friendly
	 * message via the registered {@link ResultDisplay} for the given
	 * calculator ID.
	 */
	public handle(error: Error, calculatorId: string): void {
		this.logError(error, calculatorId);
		const display = this.resultDisplays.get(calculatorId);
		if (display) {
			display.showError(this.formatUserMessage(error));
		}
	}

	/** Logs the error with context about which calculator threw it. */
	private logError(error: Error, calculatorId: string): void {
		this.logger.error("Calculator error in " + calculatorId, {
			calculatorId: calculatorId,
			errorMessage: error.message,
			errorStack: error.stack,
		});
	}

	/** Formats a user-friendly error message from the raw error. */
	private formatUserMessage(error: Error): string {
		return error.message;
	}
}
