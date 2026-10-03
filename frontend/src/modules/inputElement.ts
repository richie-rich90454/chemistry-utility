/**
 * Wraps a DOM input or select element by its element ID, providing a typed
 * accessor API for reading values, clearing state, and toggling error styling.
 */
export class InputElement {
	private element: HTMLInputElement | HTMLSelectElement;

	constructor(elementId: string, element?: HTMLInputElement | HTMLSelectElement) {
		this.element = element !== undefined ? element : document.getElementById(elementId) as HTMLInputElement | HTMLSelectElement;
	}

	/** Returns the parsed numeric value of the element (NaN if empty or invalid).
	 * Uses strict parsing: trailing garbage ("12abc") and hex ("0x10") are
	 * rejected as NaN instead of being silently coerced by parseFloat. */
	public getValue(): number {
		let raw: string = this.element.value.trim();
		if (raw === "") {
			return NaN;
		}
		if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) {
			return NaN;
		}
		return parseFloat(raw);
	}

	/** Returns the raw string value of the element. */
	public getStringValue(): string {
		return this.element.value;
	}

	/** Resets the element's value to an empty string. */
	public clear(): void {
		this.element.value = "";
	}

	/** Adds the "error" CSS class to the underlying element. */
	public markError(): void {
		this.element.classList.add("error");
	}

	/** Removes the "error" CSS class from the underlying element. */
	public clearError(): void {
		this.element.classList.remove("error");
	}

	/** Returns the underlying DOM element (input or select). */
	public getElement(): HTMLInputElement | HTMLSelectElement {
		return this.element;
	}
}
