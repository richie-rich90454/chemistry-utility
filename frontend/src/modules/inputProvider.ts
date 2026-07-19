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

/**
 * DOM-free implementation of {@link InputProvider} that reads values from an
 * in-memory record. Used by Solid components and unit tests to construct
 * calculators (typically via {@link CalculatorBuilder.setInputProvider})
 * without touching the DOM. {@link getElement} always returns null because
 * there is no underlying DOM node — calculators that rely solely on the pure
 * {@link Calculator.calculatePure} path never call it.
 */
export class PureInputProvider implements InputProvider {
	private values: Record<string, string>;

	constructor(values: Record<string, string>) {
		this.values = values;
	}

	public getValue(id: string): number {
		return parseFloat(this.values[id] ?? "");
	}

	public getStringValue(id: string): string {
		return this.values[id] ?? "";
	}

	public getElement(_id: string): HTMLElement | null {
		return null;
	}
}
