import { NumberFormatter } from "./i18n/numberFormatter.js";

/**
 * Wraps a result display DOM element by ID, providing helpers to render
 * calculation results, errors, and formula output with consistent styling.
 */
export class ResultDisplay {
	private element: HTMLElement;
	private numberFormatter: NumberFormatter;

	constructor(resultElementId: string) {
		this.element = document.getElementById(resultElementId) as HTMLElement;
		this.numberFormatter = NumberFormatter.createFromCurrentLocale();
	}

	/** Sets the inner HTML and makes the result visible. */
	public showResult(html: string): void {
		this.element.innerHTML = html;
		this.element.classList.add("show");
	}

	/** Renders an error message and makes the result visible. */
	public showError(message: string): void {
		this.element.innerHTML = "<p>Error: " + message + "</p>";
		this.element.classList.add("show");
	}

	/** Renders a formula and its numeric result with a unit, then makes it visible. */
	public showFormula(formula: string, result: number, unit: string): void {
		this.element.innerHTML =
			"<p>" + formula + "</p><p>Result: " + this.numberFormatter.format(result, 4) + " " + unit + "</p>";
		this.element.classList.add("show");
	}

	/** Clears the inner HTML and hides the result. */
	public clear(): void {
		this.element.innerHTML = "";
		this.element.classList.remove("show");
	}

	/** Makes the result visible by adding the "show" class. */
	public show(): void {
		this.element.classList.add("show");
	}

	/** Hides the result by removing the "show" class. */
	public hide(): void {
		this.element.classList.remove("show");
	}

	/** Returns the underlying DOM element. */
	public getElement(): HTMLElement {
		return this.element;
	}
}
