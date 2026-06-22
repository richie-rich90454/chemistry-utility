/**
 * Singleton class that manages calculator state in the URL search params.
 * Enables shareable links like /mass-calc?formula=H2O by serializing and
 * restoring calculator input values to/from the URL.
 */
export class UrlStateManager {
	private static instance: UrlStateManager;

	/** Debounce timer id for the current pending URL update. */
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	/** Debounce interval in milliseconds. */
	private static readonly DEBOUNCE_MS = 500;

	/**
	 * Maps calculator view IDs to their input field definitions.
	 * Each entry maps a DOM element ID to a short URL param name.
	 */
	private static readonly CALCULATOR_PARAMS: Record<string, Record<string, string>> = {
		"element-lookup": {
			"element-input": "q"
		},
		"mass-calc": {
			"formula-input": "formula"
		},
		"balancing": {
			"equation-input": "equation"
		},
		"dilution-calc": {
			"dilution-solve-for": "solve",
			"dilution-M1": "M1",
			"dilution-V1": "V1",
			"dilution-M2": "M2",
			"dilution-V2": "V2"
		},
		"mass-percent-calc": {
			"mass-solute": "solute",
			"mass-solution": "solution",
			"concentration-unit": "unit"
		},
		"solution-mixing-calc": {
			"mix-C1": "C1",
			"mix-V1": "V1",
			"mix-C2": "C2",
			"mix-V2": "V2"
		},
		"nuclear-chemistry": {
			"half-life-solve-for": "solve",
			"initial-quantity": "q0",
			"time-input": "t",
			"half-life-input": "hl",
			"remaining-quantity": "qr"
		},
		"gas-laws": {
			"ideal-solve-for": "isolve",
			"ideal-P": "iP",
			"ideal-V": "iV",
			"ideal-n": "in",
			"ideal-T": "iT",
			"ideal-R-units": "iR",
			"combined-solve-for": "csolve",
			"combined-P1": "cP1",
			"combined-V1": "cV1",
			"combined-T1": "cT1",
			"combined-P2": "cP2",
			"combined-V2": "cV2",
			"combined-T2": "cT2",
			"vdw-V": "vV",
			"vdw-n": "vn",
			"vdw-T": "vT",
			"vdw-a": "va",
			"vdw-b": "vb"
		},
		"electrochemistry": {
			"E1": "E1",
			"E2": "E2",
			"E-standard": "Es",
			"temperature": "T",
			"n-electrons": "ne",
			"Q-reaction": "Q",
			"electrolysis-solve-for": "elsolve",
			"electrolysis-m": "em",
			"electrolysis-I": "eI",
			"electrolysis-t": "et",
			"electrolysis-z": "ez",
			"electrolysis-M": "eM"
		},
		"stoichiometry": {
			"stoich-equation-input": "equation",
			"calculation-type": "type"
		},
		"bond-type-predictor": {
			"element1-input": "e1",
			"element2-input": "e2"
		}
	};

	private constructor() {}

	/** Returns the singleton instance, creating it on first access. */
	public static getInstance(): UrlStateManager {
		if (!UrlStateManager.instance) {
			UrlStateManager.instance = new UrlStateManager();
		}
		return UrlStateManager.instance;
	}

	/**
	 * Serializes calculator input state to a URL search params string.
	 * Only includes params whose values are non-empty.
	 */
	public serializeState(calculatorId: string, inputs: Record<string, string>): string {
		let paramMapping = UrlStateManager.CALCULATOR_PARAMS[calculatorId];
		if (!paramMapping) return "";

		let params = new URLSearchParams();
		let inputIds = Object.keys(inputs);
		for (let i = 0; i < inputIds.length; i++) {
			let inputId = inputIds[i];
			let value = inputs[inputId];
			if (value === "") continue;
			let paramName = paramMapping[inputId];
			if (paramName) {
				params.set(paramName, value);
			}
		}
		let serialized = params.toString();
		return serialized;
	}

	/**
	 * Reads URL search params and returns input values for the given calculator.
	 * Returns null if no params exist for this calculator.
	 */
	public restoreState(calculatorId: string): Record<string, string> | null {
		let paramMapping = UrlStateManager.CALCULATOR_PARAMS[calculatorId];
		if (!paramMapping) return null;

		let searchParams = new URLSearchParams(window.location.search);
		let result: Record<string, string> = {};

		// Build reverse mapping: paramName -> inputId
		let reverseMapping: Record<string, string> = {};
		let inputIds = Object.keys(paramMapping);
		for (let i = 0; i < inputIds.length; i++) {
			reverseMapping[paramMapping[inputIds[i]]] = inputIds[i];
		}

		let hasAny = false;
		let paramNames = Object.keys(reverseMapping);
		for (let i = 0; i < paramNames.length; i++) {
			let paramName = paramNames[i];
			let value = searchParams.get(paramName);
			if (value !== null) {
				result[reverseMapping[paramName]] = value;
				hasAny = true;
			}
		}

		return hasAny ? result : null;
	}

	/**
	 * Updates the browser URL with the serialized calculator state.
	 * Debounced at 500ms to avoid excessive history entries.
	 * Uses history.replaceState() to avoid filling the history stack.
	 */
	public updateUrl(calculatorId: string, inputs: Record<string, string>): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout((): void => {
			this.doUpdateUrl(calculatorId, inputs);
			this.debounceTimer = null;
		}, UrlStateManager.DEBOUNCE_MS);
	}

	/**
	 * Immediately updates the URL without debouncing.
	 * Used when restoring state on page load to avoid a flash of empty inputs.
	 */
	public updateUrlImmediate(calculatorId: string, inputs: Record<string, string>): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		this.doUpdateUrl(calculatorId, inputs);
	}

	/** Internal method that performs the actual URL update. */
	private doUpdateUrl(calculatorId: string, inputs: Record<string, string>): void {
		let serialized = this.serializeState(calculatorId, inputs);
		let path = "/" + calculatorId;
		let newUrl = serialized ? path + "?" + serialized : path;
		history.replaceState(null, "", newUrl);
	}

	/** Removes search params from the URL, leaving only the path. */
	public clearState(): void {
		if (this.debounceTimer !== null) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		let path = window.location.pathname;
		history.replaceState(null, "", path);
	}

	/**
	 * Reads current input values from the DOM for the given calculator
	 * and returns them as a Record<inputId, value>.
	 */
	public readInputsFromDom(calculatorId: string): Record<string, string> {
		let paramMapping = UrlStateManager.CALCULATOR_PARAMS[calculatorId];
		if (!paramMapping) return {};

		let inputs: Record<string, string> = {};
		let inputIds = Object.keys(paramMapping);
		for (let i = 0; i < inputIds.length; i++) {
			let inputId = inputIds[i];
			let el = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
			if (el) {
				inputs[inputId] = el.value;
			}
		}
		return inputs;
	}

	/**
	 * Fills calculator inputs in the DOM from the given values record.
	 * Also dispatches 'input' and 'change' events so that any listeners
	 * (e.g. calculate-on-type) are triggered.
	 */
	public fillInputs(_calculatorId: string, values: Record<string, string>): void {
		let inputIds = Object.keys(values);
		for (let i = 0; i < inputIds.length; i++) {
			let inputId = inputIds[i];
			let el = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
			if (el) {
				el.value = values[inputId];
				let eventType = (el.tagName === "SELECT") ? "change" : "input";
				el.dispatchEvent(new Event(eventType, { bubbles: true }));
			}
		}
	}

	/**
	 * Returns the list of input element IDs for a given calculator.
	 * Used by event listeners to attach URL-update handlers.
	 */
	public getInputIds(calculatorId: string): string[] {
		let paramMapping = UrlStateManager.CALCULATOR_PARAMS[calculatorId];
		if (!paramMapping) return [];
		return Object.keys(paramMapping);
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		UrlStateManager.instance = null as any;
	}
}
