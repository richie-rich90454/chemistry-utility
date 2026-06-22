import { ResultDisplay } from "./resultDisplay.js";

/**
 * Error boundary that wraps calculator execution to catch any thrown errors,
 * log them for debugging, and display a user-friendly fallback message in the
 * result area. Implemented as a singleton following OOP patterns.
 *
 * When a {@link ResultDisplay} is provided, the actual error message is shown
 * so that validation errors (e.g. "Initial molarity must be positive") remain
 * visible to the user. When no result display is available, or when the thrown
 * value has no message, the generic fallback "Something went wrong. Please
 * try again." is used instead.
 */
export class ErrorBoundary {
	private static instance: ErrorBoundary;

	/** Fallback message shown when no specific error message is available. */
	private static readonly FALLBACK_MESSAGE: string = "Something went wrong. Please try again.";

	/** Returns the singleton instance of the ErrorBoundary. */
	public static getInstance(): ErrorBoundary {
		if (!ErrorBoundary.instance) {
			ErrorBoundary.instance = new ErrorBoundary();
		}
		return ErrorBoundary.instance;
	}

	/**
	 * Wraps a function call in a try/catch boundary. If `fn` throws, the error
	 * is logged to the console and a user-friendly message is displayed via the
	 * provided {@link ResultDisplay} (when available).
	 *
	 * @param fn - The function to execute.
	 * @param calculatorId - Identifier of the calculator (used for logging).
	 * @param resultDisplay - Optional result display for showing the error UI.
	 * @returns The return value of `fn` on success, or `void` on error.
	 */
	public wrap<T>(fn: () => T, calculatorId: string, resultDisplay?: ResultDisplay): T | void {
		try {
			return fn();
		} catch (error) {
			let message: string;
			if (error instanceof Error && error.message) {
				message = error.message;
			} else {
				message = ErrorBoundary.FALLBACK_MESSAGE;
			}
			console.error("[ErrorBoundary] Calculator \"" + calculatorId + "\" failed:", error);
			if (resultDisplay) {
				resultDisplay.showError(message);
			}
			return;
		}
	}
}
