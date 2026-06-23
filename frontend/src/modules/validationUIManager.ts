import { InputValidator } from "./validation.js";

/**
 * Singleton class that manages inline form validation UI.
 * Provides visual feedback (error/valid states) on calculator inputs
 * when the user blurs away from them.
 */
export class ValidationUIManager {
	private static instance: ValidationUIManager;

	private constructor() {}

	/** Returns the singleton instance of {@link ValidationUIManager}. */
	public static getInstance(): ValidationUIManager {
		if (!ValidationUIManager.instance) {
			ValidationUIManager.instance = new ValidationUIManager();
		}
		return ValidationUIManager.instance;
	}

	/**
	 * Validates an input element and shows appropriate UI feedback.
	 * Returns true if valid, false otherwise.
	 */
	public validateInput(input: HTMLInputElement): boolean {
		let value = input.value.trim();
		let isRequired = input.hasAttribute("required") || input.type === "number";

		// Empty optional fields are valid
		if (!value && !isRequired) {
			this.clearError(input);
			return true;
		}

		// Empty required fields are invalid
		if (!value && isRequired) {
			this.showError(input, "This field is required");
			return false;
		}

		// Number inputs must be parseable
		if (input.type === "number") {
			let num = parseFloat(value);
			if (isNaN(num)) {
				this.showError(input, "Please enter a valid number");
				return false;
			}
		}

		// Text inputs for formulas must match allowed characters
		if (input.type === "text" && this.isFormulaInput(input)) {
			if (!/^[A-Za-z0-9\(\)\[\]\.\+\-]+$/.test(value)) {
				this.showError(input, "Formula contains invalid characters");
				return false;
			}
		}

		this.showValid(input);
		return true;
	}

	/**
	 * Shows an error state on the input with a message below it.
	 */
	public showError(input: HTMLInputElement, message: string): void {
		input.classList.remove("input-valid");
		input.classList.add("input-error");

		// Remove any existing error message
		this.clearErrorMessage(input);

		// Insert error message span after the input
		let errorSpan = document.createElement("span");
		errorSpan.className = "error-message";
		errorSpan.textContent = message;
		errorSpan.setAttribute("role", "alert");
		input.parentNode!.insertBefore(errorSpan, input.nextSibling);
	}

	/**
	 * Clears the error state from an input.
	 */
	public clearError(input: HTMLInputElement): void {
		input.classList.remove("input-error");
		this.clearErrorMessage(input);
	}

	/**
	 * Shows a valid state indicator on the input.
	 */
	public showValid(input: HTMLInputElement): void {
		input.classList.remove("input-error");
		this.clearErrorMessage(input);
		input.classList.add("input-valid");
	}

	/**
	 * Attaches blur-event validation listeners to all calculator inputs
	 * within the given root element (defaults to document).
	 */
	public attachBlurValidators(root: HTMLElement | Document = document): void {
		let inputs = root.querySelectorAll(
			'.main-groups input[type="number"], .main-groups input[type="text"]'
		) as NodeListOf<HTMLInputElement>;

		let self = this;
		inputs.forEach(function (input: HTMLInputElement): void {
			input.addEventListener("blur", function (): void {
				self.validateInput(input);
			});
			// Clear error on focus so user can re-type
			input.addEventListener("focus", function (): void {
				self.clearError(input);
				input.classList.remove("input-valid");
			});
		});
	}

	/** Removes any existing error message span after the input. */
	private clearErrorMessage(input: HTMLInputElement): void {
		let next = input.nextElementSibling;
		if (next && next.classList.contains("error-message")) {
			next.remove();
		}
	}

	/** Checks if a text input is for chemical formulas. */
	private isFormulaInput(input: HTMLInputElement): boolean {
		let id = input.id || "";
		return id === "formula-input" ||
			id === "equation-input" ||
			id === "stoich-equation-input" ||
			id === "element1-input" ||
			id === "element2-input" ||
			id === "element-input";
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		ValidationUIManager.instance = null as any;
	}
}
