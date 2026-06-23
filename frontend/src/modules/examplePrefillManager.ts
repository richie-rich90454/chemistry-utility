/**
 * Singleton class that manages worked example pre-fill behavior.
 * When a user clicks a highlighted example value inside a
 * {@code .example-details} section, the corresponding calculator
 * inputs are populated automatically.
 */
export class ExamplePrefillManager {
	private static instance: ExamplePrefillManager;

	/** Maps calculator view IDs to arrays of example input sets. */
	private static readonly examples: Record<string, Record<string, string>[]> = {
		"element-lookup": [
			{ "element-input": "H" },
			{ "element-input": "Fe" }
		],
		"mass-calc": [
			{ "formula-input": "H2O" },
			{ "formula-input": "C6H12O6" }
		],
		"balancing": [
			{ "equation-input": "H2+O2->H2O" },
			{ "equation-input": "Fe+O2->Fe2O3" }
		],
		"dilution-calc": [
			{ "dilution-solve-for": "V2", "dilution-M1": "6", "dilution-V1": "1", "dilution-M2": "3" }
		],
		"mass-percent-calc": [
			{ "mass-solute": "5", "mass-solution": "100", "concentration-unit": "percent" }
		],
		"solution-mixing-calc": [
			{ "mix-C1": "1", "mix-V1": "2", "mix-C2": "3", "mix-V2": "1" }
		],
		"nuclear-chemistry": [
			{ "half-life-solve-for": "remaining", "initial-quantity": "100", "time-input": "10", "half-life-input": "5" }
		],
		"gas-laws-ideal": [
			{ "ideal-solve-for": "V", "ideal-P": "1", "ideal-n": "1", "ideal-T": "273.15", "ideal-R-units": "atm-L" }
		],
		"gas-laws-combined": [
			{ "combined-solve-for": "V2", "combined-P1": "1", "combined-V1": "10", "combined-T1": "300", "combined-P2": "2", "combined-T2": "400" }
		],
		"gas-laws-vdw": [
			{ "vdw-V": "1", "vdw-n": "1", "vdw-T": "300", "vdw-a": "1.39", "vdw-b": "0.0391" }
		],
		"electrochemistry-cell": [
			{ "E1": "0.34", "E2": "-0.76" }
		],
		"electrochemistry-nernst": [
			{ "E-standard": "1.10", "temperature": "298", "n-electrons": "2", "Q-reaction": "0.01" }
		],
		"electrochemistry-electrolysis": [
			{ "electrolysis-solve-for": "mass", "electrolysis-I": "10", "electrolysis-t": "9650", "electrolysis-z": "1", "electrolysis-M": "63.55" }
		],
		"stoichiometry": [
			{ "stoich-equation-input": "2H2+O2->2H2O" }
		],
		"bond-type-predictor": [
			{ "element1-input": "Na", "element2-input": "Cl" },
			{ "element1-input": "H", "element2-input": "O" }
		]
	};

	private constructor() {}

	public static getInstance(): ExamplePrefillManager {
		if (!ExamplePrefillManager.instance) {
			ExamplePrefillManager.instance = new ExamplePrefillManager();
		}
		return ExamplePrefillManager.instance;
	}

	/**
	 * Attaches click handlers to all {@code .example-details strong} elements.
	 * When clicked, the corresponding example values are filled into the
	 * calculator inputs and input events are dispatched so the calculators
	 * respond automatically.
	 */
	public initialize(): void {
		let details = document.querySelectorAll("details.example-details") as NodeListOf<HTMLDetailsElement>;
		details.forEach(function(detail: HTMLDetailsElement): void {
			let card = detail.closest(".main-groups.card") as HTMLElement | null;
			if (!card) return;
			let cardId = card.id;
			let exampleSet = ExamplePrefillManager.findExampleSet(cardId, detail);
			if (!exampleSet || exampleSet.length === 0) return;

			let strongs = detail.querySelectorAll("strong") as NodeListOf<HTMLElement>;
			strongs.forEach(function(strong: HTMLElement, index: number): void {
				strong.setAttribute("role", "button");
				strong.setAttribute("tabindex", "0");
				strong.addEventListener("click", function(e: Event): void {
					e.preventDefault();
					e.stopPropagation();
					let exampleIndex = Math.min(index, exampleSet.length - 1);
					ExamplePrefillManager.getInstance().fillInputs(exampleSet[exampleIndex]);
				});
				strong.addEventListener("keydown", function(e: KeyboardEvent): void {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						let exampleIndex = Math.min(index, exampleSet.length - 1);
						ExamplePrefillManager.getInstance().fillInputs(exampleSet[exampleIndex]);
					}
				});
			});
		});
	}

	/**
	 * Finds the matching example set for a given card and details element.
	 * For cards with multiple sub-calculators (gas-laws, electrochemistry),
	 * the specific sub-section is identified by the details element's position.
	 */
	private static findExampleSet(cardId: string, detail: HTMLDetailsElement): Record<string, string>[] | null {
		// Direct match first
		if (ExamplePrefillManager.examples[cardId]) {
			return ExamplePrefillManager.examples[cardId];
		}

		// For gas-laws, determine which sub-calculator
		if (cardId === "gas-laws") {
			if (detail.closest("#van-der-waals")) {
				return ExamplePrefillManager.examples["gas-laws-vdw"] || null;
			}
			if (detail.closest("#combined-gas-law")) {
				return ExamplePrefillManager.examples["gas-laws-combined"] || null;
			}
			if (detail.closest("#ideal-gas-law")) {
				return ExamplePrefillManager.examples["gas-laws-ideal"] || null;
			}
		}

		// For electrochemistry, determine which sub-calculator
		if (cardId === "electrochemistry") {
			if (detail.closest("#electrolysis")) {
				return ExamplePrefillManager.examples["electrochemistry-electrolysis"] || null;
			}
			if (detail.closest("#nernst-equation")) {
				return ExamplePrefillManager.examples["electrochemistry-nernst"] || null;
			}
			if (detail.closest("#cell-potential")) {
				return ExamplePrefillManager.examples["electrochemistry-cell"] || null;
			}
		}

		return null;
	}

	/**
	 * Fills the calculator inputs with the given example values and
	 * dispatches input/change events so the calculators respond.
	 */
	public fillInputs(values: Record<string, string>): void {
		let keys = Object.keys(values);
		for (let i = 0; i < keys.length; i++) {
			let inputId = keys[i];
			let value = values[inputId];
			let el = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
			if (!el) continue;
			el.value = value;
			let eventType = (el.tagName === "SELECT") ? "change" : "input";
			el.dispatchEvent(new Event(eventType, { bubbles: true }));
		}
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		ExamplePrefillManager.instance = null as any;
	}
}
