/**
 * Abstraction over DOM input access. Enables testability by allowing unit
 * tests to inject a mock implementation that does not touch the real DOM.
 */
export interface InputProvider {
	/** Returns the parsed numeric value of the element with the given id (NaN if missing or invalid). */
	getValue(id: string): number;

	/** Returns the raw string value of the element with the given id. */
	getStringValue(id: string): string;

	/** Returns the underlying HTMLElement for the given id, or null if not found. */
	getElement(id: string): HTMLElement | null;
}

/**
 * Production implementation of {@link InputProvider} that reads values
 * directly from the DOM via {@link document.getElementById}.
 */
export class DomInputProvider implements InputProvider {
	public getValue(id: string): number {
		let element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
		if (!element) {
			return NaN;
		}
		return parseFloat(element.value);
	}

	public getStringValue(id: string): string {
		let element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
		if (!element) {
			return "";
		}
		return element.value;
	}

	public getElement(id: string): HTMLElement | null {
		return document.getElementById(id);
	}
}
