import type { InputElement } from "./inputElement.js";

/**
 * Validates calculator inputs. Provides both an {@link InputElement}-based
 * API (for the new OOP infrastructure) and a backwards-compatible raw
 * values/ids API that mirrors the original free function behavior.
 */
export class InputValidator {
	/**
	 * Validates a collection of {@link InputElement} instances. Calls
	 * {@link InputElement.markError} on every element whose value is NaN,
	 * then throws if any element was invalid.
	 */
	public static validate(inputs: InputElement[]): void {
		let hasError = false;
		for (let i = 0; i < inputs.length; i++) {
			if (isNaN(inputs[i].getValue())) {
				inputs[i].markError();
				hasError = true;
			}
		}
		if (hasError) {
			throw new Error("Please fill all required fields with valid numbers");
		}
	}

	/**
	 * Validates raw numeric values, marking the corresponding DOM element (by
	 * id) for the first NaN encountered and throwing immediately. Mirrors the
	 * original free function behavior for backwards compatibility.
	 */
	public static validateValues(values: number[], ids: string[]): void {
		for (let i = 0; i < values.length; i++) {
			if (isNaN(values[i])) {
				if (ids && i < ids.length && ids[i]) {
					const input = document.getElementById(ids[i]) as HTMLInputElement;
					input.classList.add("error");
				}
				throw new Error("Please fill all required fields with valid numbers");
			}
		}
	}
}

/**
 * Backwards-compatible wrapper around {@link InputValidator.validateValues}.
 * Kept so existing callers and tests that import `validateInputs` continue to
 * work during the transition to the class-based API.
 */
export function validateInputs(inputs: number[], ids: string[]): void {
	InputValidator.validateValues(inputs, ids);
}
