import {calculateMolarMass} from "./formulaParser.js";
import {balanceEquation} from "./equationBalancer.js";
import {UrlStateManager} from "./urlStateManager.js";
import {ChemicalElement} from "../types.js";
import {NumberFormatter} from "./i18n/numberFormatter.js";

/**
 * Encapsulates all DOM event listener wiring for the chemistry utility
 * calculators. Uses dynamic {@link import()} to load calculator modules
 * lazily on first use, reducing the initial bundle size. Loaded modules
 * are cached so they are only imported once.
 */
export class EventListenerInitializer {
	private elementsData: ChemicalElement[];

	/** Cache of pending dynamic-import promises keyed by calculator group. */
	private moduleCache: Map<string, Promise<void>> = new Map();

	constructor(elementsData: ChemicalElement[]) {
		this.elementsData = elementsData;
	}

	public initialize(): void {
		// Element lookup — always available
		(document.getElementById("element-input") as HTMLInputElement).addEventListener("keyup", () => {
			this.lookUpElement();
		});
		// Molar mass — always available
		(document.getElementById("formula-input") as HTMLInputElement).addEventListener("keyup", () => {
			this.calculateMass();
		});
		// Equation balancing — always available
		(document.getElementById("balance-button") as HTMLButtonElement).addEventListener("click", () => {
			this.balanceEquations();
		});
		// Stoichiometry — lazy
		(document.getElementById("calculation-type") as HTMLSelectElement).addEventListener("change", () => {
			let equation = (document.getElementById("stoich-equation-input") as HTMLInputElement).value.trim();
			if (equation) {
				this.ensureCalculator("stoichiometry").then((mod) => {
					mod.getCalculationType(equation);
				});
			}
		});
		(document.getElementById("calculate-stoich-button") as HTMLButtonElement).addEventListener("click", () => {
			let equation = (document.getElementById("stoich-equation-input") as HTMLInputElement).value.trim();
			this.ensureCalculator("stoichiometry").then((mod) => {
				try {
					mod.calculateStoichiometry(equation);
				} catch (e: any) {
					let result = document.getElementById("stoichiometry-result") as HTMLElement;
					if (result) result.textContent = e.message || "An error occurred";
				}
			});
		});
		// Solution calculators — lazy
		(document.getElementById("calculate-dilution") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("dilution").then((mod) => { mod.calculateDilution(); });
		});
		(document.getElementById("calculate-mass-percent") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("mass-percent").then((mod) => { mod.calculateMassPercent(); });
		});
		(document.getElementById("calculate-mixing") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("mixing").then((mod) => { mod.calculateMixing(); });
		});
		// Gas law calculators — lazy
		(document.getElementById("calculate-ideal") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("ideal-gas").then((mod) => { mod.calculateIdealGasLaw(); });
		});
		(document.getElementById("calculate-combined") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("combined-gas").then((mod) => { mod.calculateCombinedGasLaw(); });
		});
		(document.getElementById("calculate-vdw") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("vdw").then((mod) => { mod.calculateVanDerWaals(); });
		});
		(document.getElementById("ideal-R-units") as HTMLSelectElement).addEventListener("change", function(this: HTMLSelectElement){
			let units = this.value;
			if (units == "atm-L") {
				(document.getElementById("ideal-P") as HTMLInputElement).setAttribute("placeholder", "P (atm)");
				(document.getElementById("ideal-V") as HTMLInputElement).setAttribute("placeholder", "V (L)");
			}
			else if (units == "SI") {
				(document.getElementById("ideal-P") as HTMLInputElement).setAttribute("placeholder", "P (Pa)");
				(document.getElementById("ideal-V") as HTMLInputElement).setAttribute("placeholder", "V (m³)");
			}
		});
		(document.getElementById("calculate-half-life") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("half-life").then((mod) => { mod.calculateHalfLife(); });
		});
		(document.getElementById("half-life-solve-for") as HTMLSelectElement).addEventListener("change", function(this: HTMLSelectElement){
			let solveFor = this.value;
			let displayStyle = (solveFor == "time" || solveFor == "half-life") ? "block" : "none";
			(document.getElementById("remaining-quantity-group") as HTMLElement).style.display = displayStyle;
		});
		// Electrochemistry calculators — lazy
		(document.getElementById("calculate-cell-potential") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("cell-potential").then((mod) => { mod.calculateCellPotential(); });
		});
		(document.getElementById("calculate-nernst") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("nernst").then((mod) => { mod.calculateNernst(); });
		});
		(document.getElementById("calculate-electrolysis") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("electrolysis").then((mod) => { mod.calculateElectrolysis(); });
		});
		// Bond type predictor — lazy
		(document.getElementById("calculate-bond-type") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("bond-type").then((mod) => {
				try {
					mod.predictBondType(this.elementsData);
				} catch (e: any) {
					let result = document.getElementById("bond-result") as HTMLElement;
					if (result) result.textContent = e.message || "An error occurred";
				}
			});
		});
		// Enter key support for calculator inputs — lazy
		this.addLazyEnterListener("dilution-M1", "dilution", (mod) => { mod.calculateDilution(); });
		this.addLazyEnterListener("dilution-V1", "dilution", (mod) => { mod.calculateDilution(); });
		this.addLazyEnterListener("dilution-M2", "dilution", (mod) => { mod.calculateDilution(); });
		this.addLazyEnterListener("dilution-V2", "dilution", (mod) => { mod.calculateDilution(); });
		this.addLazyEnterListener("mass-solute", "mass-percent", (mod) => { mod.calculateMassPercent(); });
		this.addLazyEnterListener("mass-solution", "mass-percent", (mod) => { mod.calculateMassPercent(); });
		this.addLazyEnterListener("mix-C1", "mixing", (mod) => { mod.calculateMixing(); });
		this.addLazyEnterListener("mix-V1", "mixing", (mod) => { mod.calculateMixing(); });
		this.addLazyEnterListener("mix-C2", "mixing", (mod) => { mod.calculateMixing(); });
		this.addLazyEnterListener("mix-V2", "mixing", (mod) => { mod.calculateMixing(); });
		this.addLazyEnterListener("ideal-P", "ideal-gas", (mod) => { mod.calculateIdealGasLaw(); });
		this.addLazyEnterListener("ideal-V", "ideal-gas", (mod) => { mod.calculateIdealGasLaw(); });
		this.addLazyEnterListener("ideal-n", "ideal-gas", (mod) => { mod.calculateIdealGasLaw(); });
		this.addLazyEnterListener("ideal-T", "ideal-gas", (mod) => { mod.calculateIdealGasLaw(); });
		this.addLazyEnterListener("combined-P1", "combined-gas", (mod) => { mod.calculateCombinedGasLaw(); });
		this.addLazyEnterListener("combined-V1", "combined-gas", (mod) => { mod.calculateCombinedGasLaw(); });
		this.addLazyEnterListener("combined-T1", "combined-gas", (mod) => { mod.calculateCombinedGasLaw(); });
		this.addLazyEnterListener("combined-P2", "combined-gas", (mod) => { mod.calculateCombinedGasLaw(); });
		this.addLazyEnterListener("combined-V2", "combined-gas", (mod) => { mod.calculateCombinedGasLaw(); });
		this.addLazyEnterListener("combined-T2", "combined-gas", (mod) => { mod.calculateCombinedGasLaw(); });
		this.addLazyEnterListener("vdw-V", "vdw", (mod) => { mod.calculateVanDerWaals(); });
		this.addLazyEnterListener("vdw-n", "vdw", (mod) => { mod.calculateVanDerWaals(); });
		this.addLazyEnterListener("vdw-T", "vdw", (mod) => { mod.calculateVanDerWaals(); });
		this.addLazyEnterListener("vdw-a", "vdw", (mod) => { mod.calculateVanDerWaals(); });
		this.addLazyEnterListener("vdw-b", "vdw", (mod) => { mod.calculateVanDerWaals(); });
		this.addLazyEnterListener("E1", "cell-potential", (mod) => { mod.calculateCellPotential(); });
		this.addLazyEnterListener("E2", "cell-potential", (mod) => { mod.calculateCellPotential(); });
		this.addLazyEnterListener("E-standard", "nernst", (mod) => { mod.calculateNernst(); });
		this.addLazyEnterListener("temperature", "nernst", (mod) => { mod.calculateNernst(); });
		this.addLazyEnterListener("n-electrons", "nernst", (mod) => { mod.calculateNernst(); });
		this.addLazyEnterListener("Q-reaction", "nernst", (mod) => { mod.calculateNernst(); });
		this.addLazyEnterListener("electrolysis-m", "electrolysis", (mod) => { mod.calculateElectrolysis(); });
		this.addLazyEnterListener("electrolysis-I", "electrolysis", (mod) => { mod.calculateElectrolysis(); });
		this.addLazyEnterListener("electrolysis-t", "electrolysis", (mod) => { mod.calculateElectrolysis(); });
		this.addLazyEnterListener("electrolysis-z", "electrolysis", (mod) => { mod.calculateElectrolysis(); });
		this.addLazyEnterListener("electrolysis-M", "electrolysis", (mod) => { mod.calculateElectrolysis(); });
		this.addLazyEnterListener("element1-input", "bond-type", (mod) => { mod.predictBondType(this.elementsData); });
		this.addLazyEnterListener("element2-input", "bond-type", (mod) => { mod.predictBondType(this.elementsData); });

		// URL state management — attach input/change listeners for debounced URL updates
		this.initializeUrlStateListeners();
	}

	/**
	 * Ensures the calculator module for the given id is loaded.
	 * Uses dynamic {@link import()} on first access and caches the result
	 * so subsequent calls resolve immediately.
	 */
	private async ensureCalculator(calculatorId: string): Promise<any> {
		let pending = this.moduleCache.get(calculatorId);
		if (pending) return pending;

		let promise = this.loadCalculatorModule(calculatorId);
		this.moduleCache.set(calculatorId, promise);
		return promise;
	}

	/**
	 * Dynamically imports the calculator module for the given id.
	 * Returns the module exports so callers can invoke calculator functions.
	 */
	private async loadCalculatorModule(calculatorId: string): Promise<any> {
		switch (calculatorId) {
			case "dilution":
			case "mass-percent":
			case "mixing": {
				return import("./solutionCalculators.js");
			}
			case "ideal-gas":
			case "combined-gas":
			case "vdw":
			case "half-life": {
				return import("./gasLawCalculators.js");
			}
			case "cell-potential":
			case "nernst":
			case "electrolysis": {
				return import("./electrochemistryCalculators.js");
			}
			case "bond-type": {
				return import("./bondPredictor.js");
			}
			case "stoichiometry": {
				return import("./stoichiometryCalculator.js");
			}
			default:
				throw new Error("Unknown calculator: " + calculatorId);
		}
	}

	private addLazyEnterListener(id: string, calculatorId: string, handler: (mod: any) => void): void {
		let el = document.getElementById(id) as HTMLInputElement;
		if (el) el.addEventListener("keyup", (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				this.ensureCalculator(calculatorId).then(handler);
			}
		});
	}

	/** Maps input element IDs to calculator view IDs for URL state management. */
	private static readonly inputToViewId: Record<string, string> = {
		"element-input": "element-lookup",
		"formula-input": "mass-calc",
		"equation-input": "balancing",
		"dilution-solve-for": "dilution-calc",
		"dilution-M1": "dilution-calc", "dilution-V1": "dilution-calc",
		"dilution-M2": "dilution-calc", "dilution-V2": "dilution-calc",
		"mass-solute": "mass-percent-calc", "mass-solution": "mass-percent-calc",
		"concentration-unit": "mass-percent-calc",
		"mix-C1": "solution-mixing-calc", "mix-V1": "solution-mixing-calc",
		"mix-C2": "solution-mixing-calc", "mix-V2": "solution-mixing-calc",
		"half-life-solve-for": "nuclear-chemistry",
		"initial-quantity": "nuclear-chemistry", "time-input": "nuclear-chemistry",
		"half-life-input": "nuclear-chemistry", "remaining-quantity": "nuclear-chemistry",
		"ideal-solve-for": "gas-laws", "ideal-P": "gas-laws", "ideal-V": "gas-laws",
		"ideal-n": "gas-laws", "ideal-T": "gas-laws", "ideal-R-units": "gas-laws",
		"combined-solve-for": "gas-laws", "combined-P1": "gas-laws", "combined-V1": "gas-laws",
		"combined-T1": "gas-laws", "combined-P2": "gas-laws", "combined-V2": "gas-laws",
		"combined-T2": "gas-laws",
		"vdw-V": "gas-laws", "vdw-n": "gas-laws", "vdw-T": "gas-laws",
		"vdw-a": "gas-laws", "vdw-b": "gas-laws",
		"E1": "electrochemistry", "E2": "electrochemistry",
		"E-standard": "electrochemistry", "temperature": "electrochemistry",
		"n-electrons": "electrochemistry", "Q-reaction": "electrochemistry",
		"electrolysis-solve-for": "electrochemistry",
		"electrolysis-m": "electrochemistry", "electrolysis-I": "electrochemistry",
		"electrolysis-t": "electrochemistry", "electrolysis-z": "electrochemistry",
		"electrolysis-M": "electrochemistry",
		"stoich-equation-input": "stoichiometry", "calculation-type": "stoichiometry",
		"element1-input": "bond-type-predictor", "element2-input": "bond-type-predictor",
	};

	/**
	 * Attaches input/change event listeners to all calculator inputs so that
	 * the URL is updated in real-time as the user types (debounced at 500ms).
	 */
	private initializeUrlStateListeners(): void {
		let urlManager = UrlStateManager.getInstance();
		let entries = Object.entries(EventListenerInitializer.inputToViewId);
		for (let i = 0; i < entries.length; i++) {
			let inputId = entries[i][0];
			let viewId = entries[i][1];
			let el = document.getElementById(inputId) as HTMLInputElement | HTMLSelectElement | null;
			if (!el) continue;
			let eventType = (el.tagName === "SELECT") ? "change" : "input";
			el.addEventListener(eventType, function(): void {
				let inputs = urlManager.readInputsFromDom(viewId);
				urlManager.updateUrl(viewId, inputs);
			});
		}
	}

	private lookUpElement(): void {
		let input = document.getElementById("element-input") as HTMLInputElement;
		let inputValue = input.value.trim().toLowerCase();
		input.classList.remove("error");
		let element: ChemicalElement | null = null;
		for (let i = 0; i < this.elementsData.length; i++) {
			let currentElement = this.elementsData[i];
			if (currentElement.symbol.toLowerCase() == inputValue || currentElement.name.toLowerCase() == inputValue) {
				element = currentElement;
				break;
			}
		}
		let elementInfo = document.getElementById("element-info") as HTMLElement;
		if (element != null) {
			let info = "<p><strong>Symbol:</strong> " + EventListenerInitializer.escapeHtml(element.symbol) + "</p>" +
				"<p><strong>Name:</strong> " + EventListenerInitializer.escapeHtml(element.name) + "</p>" +
				"<p><strong>Atomic Mass:</strong> " + EventListenerInitializer.escapeHtml(element.atomicMass) + " u</p>" +
				"<p><strong>Atomic Number:</strong> " + EventListenerInitializer.escapeHtml(element.atomicNumber) + "</p>" +
				"<p><strong>Electronegativity:</strong> " + (element.electronegativity != null ? EventListenerInitializer.escapeHtml(element.electronegativity) : "N/A") + "</p>" +
				"<p><strong>Electron Affinity:</strong> " + (element.electronAffinity != null ? EventListenerInitializer.escapeHtml(element.electronAffinity) : "N/A") + " kJ/mol</p>" +
				"<p><strong>Atomic Radius:</strong> " + (element.atomicRadius != null ? EventListenerInitializer.escapeHtml(element.atomicRadius) : "N/A") + " pm</p>" +
				"<p><strong>Ionization Energy:</strong> " + (element.ionizationEnergy != null ? EventListenerInitializer.escapeHtml(element.ionizationEnergy) : "N/A") + " kJ/mol</p>" +
				"<p><strong>Valence Electrons:</strong> " + EventListenerInitializer.escapeHtml(element.valenceElectrons) + "</p>" +
				"<p><strong>Total Electrons:</strong> " + EventListenerInitializer.escapeHtml(element.totalElectrons) + "</p>" +
				"<p><strong>Group:</strong> " + EventListenerInitializer.escapeHtml(element.group) + "</p>" +
				"<p><strong>Period:</strong> " + EventListenerInitializer.escapeHtml(element.period) + "</p>" +
				"<p><strong>Type:</strong> " + EventListenerInitializer.escapeHtml(element.type) + "</p>";
			elementInfo.innerHTML = info;
			elementInfo.classList.add("show");
		}
		else {
			elementInfo.innerHTML = "<p>Element not found</p>";
			elementInfo.classList.add("show");
			input.classList.add("error");
		}
	}

	private calculateMass(): void {
		let input = document.getElementById("formula-input") as HTMLInputElement;
		let formula = input.value.trim();
		input.classList.remove("error");
		let massResult = document.getElementById("mass-result") as HTMLElement;
		if (formula == "") {
			massResult.innerHTML = "<p>Please enter a chemical formula</p>";
			massResult.classList.add("show");
			input.classList.add("error");
			return;
		}
		try {
			let totalMass = calculateMolarMass(formula, this.elementsData);
			massResult.innerHTML = "<p>Molar Mass: " + NumberFormatter.createFromCurrentLocale().format(totalMass, 2) + " g/mol</p>";
			massResult.classList.add("show");
		}
		catch (error) {
			massResult.innerHTML = "<p>" + (error as Error).message + "</p>";
			massResult.classList.add("show");
			input.classList.add("error");
		}
	}

	private balanceEquations(): void {
		let input = document.getElementById("equation-input") as HTMLInputElement;
		let equation = input.value.trim();
		input.classList.remove("error");
		let balanceResult = document.getElementById("balance-result") as HTMLElement;
		if (equation == "") {
			balanceResult.innerHTML = "<p>Please enter a chemical equation</p>";
			balanceResult.classList.add("show");
			input.classList.add("error");
			return;
		}
		try {
			balanceResult.innerHTML = "Balancing...";
			balanceResult.classList.add("show");
			let balancedEquation = balanceEquation(equation);
			balanceResult.innerHTML = "<p>Balanced Equation: " + balancedEquation + "</p>";
			balanceResult.classList.add("show");
		}
		catch (error) {
			balanceResult.innerHTML = "<p>" + (error as Error).message + "</p>";
			balanceResult.classList.add("show");
			input.classList.add("error");
		}
	}

	private static escapeHtml(str: string | number | undefined | null): string {
		if (str == null) return "";
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}
}

/**
 * Backwards-compatible wrapper that creates an {@link EventListenerInitializer}
 * instance and runs the initialization.
 */
export function initializeEventListeners(elementsData: ChemicalElement[]): void {
	new EventListenerInitializer(elementsData).initialize();
}
