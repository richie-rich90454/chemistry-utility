import {calculateMolarMass} from "./formulaParser.js";
import {balanceEquation} from "./equationBalancer.js";
import {UrlStateManager} from "./urlStateManager.js";
import {InputPersistence} from "./inputPersistence.js";
import {ExamplePrefillManager} from "./examplePrefillManager.js";
import {ChemicalElement} from "../types.js";
import {NumberFormatter} from "./i18n/numberFormatter.js";
import * as gasLawCalculators from "./gasLawCalculators.js";
import {CalculatorRegistry} from "./calculatorRegistry.js";

/** Shape of a dynamically-imported calculator module. */
type CalculatorModule = {
	calculateDilution(): void;
	calculateMassPercent(): void;
	calculateMixing(): void;
	calculateIdealGasLaw(): void;
	calculateCombinedGasLaw(): void;
	calculateVanDerWaals(): void;
	calculateHalfLife(): void;
	calculateCellPotential(): void;
	calculateNernst(): void;
	calculateElectrolysis(): void;
	predictBondType(elementsData: ChemicalElement[]): void;
	getCalculationType(equation: string): void;
	calculateStoichiometry(equation: string): void;
	calculateGibbsFreeEnergy(): void;
	calculateHessLaw(): void;
	calculateEntropy(): void;
	calculateHeatCapacity(): void;
	calculateBondEnthalpy(): void;
	calculateBornHaberCycle(): void;
	calculateArrhenius(): void;
	calculateRateLaw(): void;
	calculateIntegratedRateLaw(): void;
	calculateReactionOrder(): void;
	calculateCollisionTheory(): void;
	calculateBufferSolution(): void;
	calculatePKaPKb(): void;
	calculateKsp(): void;
	calculateColligativeProperties(): void;
	calculateTitrationCurve(): void;
	calculateDebyeHuckel(): void;
	calculateCommonIonEffect(): void;
	calculateQuantumNumbers(): void;
	calculateElectronConfiguration(): void;
	calculateRydberg(): void;
	calculateDeBroglie(): void;
	calculatePhotoelectricEffect(): void;
	calculateHeisenbergUncertainty(): void;
};

/**
 * Encapsulates all DOM event listener wiring for the chemistry utility
 * calculators. Uses dynamic {@link import()} to load calculator modules
 * lazily on first use, reducing the initial bundle size. Loaded modules
 * are cached so they are only imported once.
 */
export class EventListenerInitializer {
	private elementsData: ChemicalElement[];

	/** Cache of pending dynamic-import promises keyed by calculator group. */
	private moduleCache: Map<string, Promise<CalculatorModule>> = new Map();

	constructor(elementsData: ChemicalElement[]) {
		this.elementsData = elementsData;
	}

	public initialize(): void {
		// Input masking for chemical formula inputs — strip invalid characters
		this.initializeFormulaInputMasking();

		// Contextual help tooltips
		this.initializeContextualHelp();

		// Worked example pre-fill click handlers
		ExamplePrefillManager.getInstance().initialize();

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
				} catch (e: unknown) {
					let result = document.getElementById("stoichiometry-result") as HTMLElement;
					if (result) result.textContent = (e instanceof Error ? e.message : "An error occurred");
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
		// New solution calculators
		(document.getElementById("calculate-buffer") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("buffer").then((mod) => { mod.calculateBufferSolution(); });
		});
		(document.getElementById("calculate-pka-pkb") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("pka-pkb").then((mod) => { mod.calculatePKaPKb(); });
		});
		(document.getElementById("calculate-ksp") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("ksp").then((mod) => { mod.calculateKsp(); });
		});
		(document.getElementById("calculate-colligative") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("colligative").then((mod) => { mod.calculateColligativeProperties(); });
		});
		(document.getElementById("calculate-titration") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("titration").then((mod) => { mod.calculateTitrationCurve(); });
		});
		(document.getElementById("calculate-debye-huckel") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("debye-huckel").then((mod) => { mod.calculateDebyeHuckel(); });
		});
		(document.getElementById("calculate-common-ion") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("common-ion").then((mod) => { mod.calculateCommonIonEffect(); });
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
				} catch (e: unknown) {
					let result = document.getElementById("bond-result") as HTMLElement;
					if (result) result.textContent = (e instanceof Error ? e.message : "An error occurred");
				}
			});
		});
		// Thermodynamics calculators — lazy
		(document.getElementById("calculate-gibbs") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("gibbs").then((mod) => { mod.calculateGibbsFreeEnergy(); });
		});
		(document.getElementById("calculate-hess") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("hess").then((mod) => { mod.calculateHessLaw(); });
		});
		(document.getElementById("calculate-entropy") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("entropy").then((mod) => { mod.calculateEntropy(); });
		});
		(document.getElementById("calculate-heat-capacity") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("heat-capacity").then((mod) => { mod.calculateHeatCapacity(); });
		});
		(document.getElementById("calculate-bond-enthalpy") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("bond-enthalpy").then((mod) => { mod.calculateBondEnthalpy(); });
		});
		(document.getElementById("calculate-born-haber") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("born-haber").then((mod) => { mod.calculateBornHaberCycle(); });
		});
		// Kinetics calculators — lazy
		(document.getElementById("calculate-arrhenius") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("arrhenius").then((mod) => { mod.calculateArrhenius(); });
		});
		(document.getElementById("calculate-rate-law") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("rate-law").then((mod) => { mod.calculateRateLaw(); });
		});
		(document.getElementById("calculate-integrated-rate-law") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("integrated-rate-law").then((mod) => { mod.calculateIntegratedRateLaw(); });
		});
		(document.getElementById("calculate-reaction-order") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("reaction-order").then((mod) => { mod.calculateReactionOrder(); });
		});
		(document.getElementById("calculate-collision-theory") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("collision-theory").then((mod) => { mod.calculateCollisionTheory(); });
		});
		// Quantum & Atomic calculators — lazy
		(document.getElementById("calculate-quantum-numbers") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("quantum-numbers").then((mod) => { mod.calculateQuantumNumbers(); });
		});
		(document.getElementById("calculate-electron-config") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("electron-config").then((mod) => { mod.calculateElectronConfiguration(); });
		});
		(document.getElementById("calculate-rydberg") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("rydberg").then((mod) => { mod.calculateRydberg(); });
		});
		(document.getElementById("calculate-debroglie") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("debroglie").then((mod) => { mod.calculateDeBroglie(); });
		});
		(document.getElementById("calculate-photoelectric") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("photoelectric").then((mod) => { mod.calculatePhotoelectricEffect(); });
		});
		(document.getElementById("calculate-heisenberg") as HTMLButtonElement).addEventListener("click", () => {
			this.ensureCalculator("heisenberg").then((mod) => { mod.calculateHeisenbergUncertainty(); });
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
		// New solution calculators enter key support
		this.addLazyEnterListener("buffer-pKa", "buffer", (mod) => { mod.calculateBufferSolution(); });
		this.addLazyEnterListener("buffer-HA", "buffer", (mod) => { mod.calculateBufferSolution(); });
		this.addLazyEnterListener("buffer-Aminus", "buffer", (mod) => { mod.calculateBufferSolution(); });
		this.addLazyEnterListener("buffer-pH", "buffer", (mod) => { mod.calculateBufferSolution(); });
		this.addLazyEnterListener("buffer-ratio", "buffer", (mod) => { mod.calculateBufferSolution(); });
		this.addLazyEnterListener("pka-pkb-input-value", "pka-pkb", (mod) => { mod.calculatePKaPKb(); });
		this.addLazyEnterListener("ksp-value", "ksp", (mod) => { mod.calculateKsp(); });
		this.addLazyEnterListener("ksp-molar-solubility", "ksp", (mod) => { mod.calculateKsp(); });
		this.addLazyEnterListener("collig-solute-mass", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-molar-mass", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-solvent-mass", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-vanthoff", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-Kb", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-Kf", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-solvent-bp", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-solvent-fp", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("collig-Psolvent", "colligative", (mod) => { mod.calculateColligativeProperties(); });
		this.addLazyEnterListener("titration-acid-conc", "titration", (mod) => { mod.calculateTitrationCurve(); });
		this.addLazyEnterListener("titration-acid-vol", "titration", (mod) => { mod.calculateTitrationCurve(); });
		this.addLazyEnterListener("titration-base-conc", "titration", (mod) => { mod.calculateTitrationCurve(); });
		this.addLazyEnterListener("titration-max-vol", "titration", (mod) => { mod.calculateTitrationCurve(); });
		this.addLazyEnterListener("titration-Ka", "titration", (mod) => { mod.calculateTitrationCurve(); });
		this.addLazyEnterListener("dh-zplus", "debye-huckel", (mod) => { mod.calculateDebyeHuckel(); });
		this.addLazyEnterListener("dh-zminus", "debye-huckel", (mod) => { mod.calculateDebyeHuckel(); });
		this.addLazyEnterListener("dh-concentration", "debye-huckel", (mod) => { mod.calculateDebyeHuckel(); });
		this.addLazyEnterListener("dh-ion-size", "debye-huckel", (mod) => { mod.calculateDebyeHuckel(); });
		this.addLazyEnterListener("common-ion-Ksp", "common-ion", (mod) => { mod.calculateCommonIonEffect(); });
		this.addLazyEnterListener("common-ion-concentration", "common-ion", (mod) => { mod.calculateCommonIonEffect(); });
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

		// Thermodynamics enter key support
		this.addLazyEnterListener("gibbs-deltaH", "gibbs", (mod) => { mod.calculateGibbsFreeEnergy(); });
		this.addLazyEnterListener("gibbs-deltaS", "gibbs", (mod) => { mod.calculateGibbsFreeEnergy(); });
		this.addLazyEnterListener("gibbs-T", "gibbs", (mod) => { mod.calculateGibbsFreeEnergy(); });
		this.addLazyEnterListener("hess-steps", "hess", (mod) => { mod.calculateHessLaw(); });
		this.addLazyEnterListener("entropy-products", "entropy", (mod) => { mod.calculateEntropy(); });
		this.addLazyEnterListener("entropy-reactants", "entropy", (mod) => { mod.calculateEntropy(); });
		this.addLazyEnterListener("heat-cap-mass", "heat-capacity", (mod) => { mod.calculateHeatCapacity(); });
		this.addLazyEnterListener("heat-cap-specific-heat", "heat-capacity", (mod) => { mod.calculateHeatCapacity(); });
		this.addLazyEnterListener("heat-cap-initial-temp", "heat-capacity", (mod) => { mod.calculateHeatCapacity(); });
		this.addLazyEnterListener("heat-cap-final-temp", "heat-capacity", (mod) => { mod.calculateHeatCapacity(); });
		this.addLazyEnterListener("heat-cap-heat", "heat-capacity", (mod) => { mod.calculateHeatCapacity(); });
		this.addLazyEnterListener("bond-enthalpy-broken", "bond-enthalpy", (mod) => { mod.calculateBondEnthalpy(); });
		this.addLazyEnterListener("bond-enthalpy-formed", "bond-enthalpy", (mod) => { mod.calculateBondEnthalpy(); });
		this.addLazyEnterListener("born-haber-dHf", "born-haber", (mod) => { mod.calculateBornHaberCycle(); });
		this.addLazyEnterListener("born-haber-dHsub", "born-haber", (mod) => { mod.calculateBornHaberCycle(); });
		this.addLazyEnterListener("born-haber-IE", "born-haber", (mod) => { mod.calculateBornHaberCycle(); });
		this.addLazyEnterListener("born-haber-dHdiss", "born-haber", (mod) => { mod.calculateBornHaberCycle(); });
		this.addLazyEnterListener("born-haber-EA", "born-haber", (mod) => { mod.calculateBornHaberCycle(); });

		// Kinetics enter key support
		this.addLazyEnterListener("arrhenius-A", "arrhenius", (mod) => { mod.calculateArrhenius(); });
		this.addLazyEnterListener("arrhenius-Ea", "arrhenius", (mod) => { mod.calculateArrhenius(); });
		this.addLazyEnterListener("arrhenius-T", "arrhenius", (mod) => { mod.calculateArrhenius(); });
		this.addLazyEnterListener("arrhenius-k", "arrhenius", (mod) => { mod.calculateArrhenius(); });
		this.addLazyEnterListener("ratelaw-A1", "rate-law", (mod) => { mod.calculateRateLaw(); });
		this.addLazyEnterListener("ratelaw-B1", "rate-law", (mod) => { mod.calculateRateLaw(); });
		this.addLazyEnterListener("ratelaw-rate1", "rate-law", (mod) => { mod.calculateRateLaw(); });
		this.addLazyEnterListener("ratelaw-A2", "rate-law", (mod) => { mod.calculateRateLaw(); });
		this.addLazyEnterListener("ratelaw-B2", "rate-law", (mod) => { mod.calculateRateLaw(); });
		this.addLazyEnterListener("ratelaw-rate2", "rate-law", (mod) => { mod.calculateRateLaw(); });
		this.addLazyEnterListener("irl-A0", "integrated-rate-law", (mod) => { mod.calculateIntegratedRateLaw(); });
		this.addLazyEnterListener("irl-k", "integrated-rate-law", (mod) => { mod.calculateIntegratedRateLaw(); });
		this.addLazyEnterListener("irl-t", "integrated-rate-law", (mod) => { mod.calculateIntegratedRateLaw(); });
		this.addLazyEnterListener("irl-A", "integrated-rate-law", (mod) => { mod.calculateIntegratedRateLaw(); });
		this.addLazyEnterListener("collision-Ea", "collision-theory", (mod) => { mod.calculateCollisionTheory(); });
		this.addLazyEnterListener("collision-T", "collision-theory", (mod) => { mod.calculateCollisionTheory(); });
		this.addLazyEnterListener("collision-Z", "collision-theory", (mod) => { mod.calculateCollisionTheory(); });
		this.addLazyEnterListener("collision-p", "collision-theory", (mod) => { mod.calculateCollisionTheory(); });
		this.addLazyEnterListener("collision-k", "collision-theory", (mod) => { mod.calculateCollisionTheory(); });

		// Quantum & Atomic enter key support
		this.addLazyEnterListener("qn-n", "quantum-numbers", (mod) => { mod.calculateQuantumNumbers(); });
		this.addLazyEnterListener("qn-l", "quantum-numbers", (mod) => { mod.calculateQuantumNumbers(); });
		this.addLazyEnterListener("qn-ml", "quantum-numbers", (mod) => { mod.calculateQuantumNumbers(); });
		this.addLazyEnterListener("qn-ms", "quantum-numbers", (mod) => { mod.calculateQuantumNumbers(); });
		this.addLazyEnterListener("ec-atomic-number", "electron-config", (mod) => { mod.calculateElectronConfiguration(); });
		this.addLazyEnterListener("rydberg-n1", "rydberg", (mod) => { mod.calculateRydberg(); });
		this.addLazyEnterListener("rydberg-n2", "rydberg", (mod) => { mod.calculateRydberg(); });
		this.addLazyEnterListener("db-mass", "debroglie", (mod) => { mod.calculateDeBroglie(); });
		this.addLazyEnterListener("db-velocity", "debroglie", (mod) => { mod.calculateDeBroglie(); });
		this.addLazyEnterListener("pe-wavelength", "photoelectric", (mod) => { mod.calculatePhotoelectricEffect(); });
		this.addLazyEnterListener("pe-frequency", "photoelectric", (mod) => { mod.calculatePhotoelectricEffect(); });
		this.addLazyEnterListener("pe-work-function", "photoelectric", (mod) => { mod.calculatePhotoelectricEffect(); });
		this.addLazyEnterListener("pe-ke", "photoelectric", (mod) => { mod.calculatePhotoelectricEffect(); });
		this.addLazyEnterListener("heis-delta-x", "heisenberg", (mod) => { mod.calculateHeisenbergUncertainty(); });
		this.addLazyEnterListener("heis-delta-p", "heisenberg", (mod) => { mod.calculateHeisenbergUncertainty(); });
		this.addLazyEnterListener("heis-mass", "heisenberg", (mod) => { mod.calculateHeisenbergUncertainty(); });

		// URL state management — attach input/change listeners for debounced URL updates
		this.initializeUrlStateListeners();
	}

	/**
	 * Ensures the calculator module for the given id is loaded.
	 * Uses dynamic {@link import()} on first access and caches the result
	 * so subsequent calls resolve immediately.
	 */
	private async ensureCalculator(calculatorId: string): Promise<CalculatorModule> {
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
	private async loadCalculatorModule(calculatorId: string): Promise<CalculatorModule> {
		switch (calculatorId) {
			case "dilution":
			case "mass-percent":
			case "mixing":
			case "buffer":
			case "pka-pkb":
			case "ksp":
			case "colligative":
			case "titration":
			case "debye-huckel":
			case "common-ion": {
				return import("./solutionCalculators.js").then(function(mod: any): CalculatorModule {
					let registry = CalculatorRegistry.getInstance();
					registry.register("buffer", new mod.BufferSolutionCalculator());
					registry.register("pka-pkb", new mod.PKaPKbCalculator());
					registry.register("ksp", new mod.KspCalculator());
					registry.register("colligative", new mod.ColligativePropertiesCalculator());
					registry.register("titration", new mod.TitrationCurveCalculator());
					registry.register("debye-huckel", new mod.DebyeHuckelCalculator());
					registry.register("common-ion", new mod.CommonIonEffectCalculator());
					return mod as CalculatorModule;
				}) as Promise<unknown> as Promise<CalculatorModule>;
			}
			case "ideal-gas":
			case "combined-gas":
			case "vdw":
			case "half-life": {
				return Promise.resolve(gasLawCalculators as unknown as CalculatorModule);
			}
			case "cell-potential":
			case "nernst":
			case "electrolysis": {
				return import("./electrochemistryCalculators.js") as Promise<unknown> as Promise<CalculatorModule>;
			}
			case "bond-type": {
				return import("./bondPredictor.js") as Promise<unknown> as Promise<CalculatorModule>;
			}
			case "stoichiometry": {
				return import("./stoichiometryCalculator.js") as Promise<unknown> as Promise<CalculatorModule>;
			}
			case "gibbs":
			case "hess":
			case "entropy":
			case "heat-capacity":
			case "bond-enthalpy":
			case "born-haber": {
				return import("./thermodynamicsCalculators.js").then(function(mod: any): CalculatorModule {
					let registry = CalculatorRegistry.getInstance();
					registry.register("gibbs-free-energy", new mod.GibbsFreeEnergyCalculator());
					registry.register("hess-law", new mod.HessLawCalculator());
					registry.register("entropy", new mod.EntropyCalculator());
					registry.register("heat-capacity", new mod.HeatCapacityCalculator());
					registry.register("bond-enthalpy", new mod.BondEnthalpyCalculator());
					registry.register("born-haber", new mod.BornHaberCycleCalculator());
					return mod as CalculatorModule;
				}) as Promise<unknown> as Promise<CalculatorModule>;
			}
			case "arrhenius":
			case "rate-law":
			case "integrated-rate-law":
			case "reaction-order":
			case "collision-theory": {
				return import("./kineticsCalculators.js").then(function(mod: any): CalculatorModule {
					let registry = CalculatorRegistry.getInstance();
					registry.register("arrhenius", new mod.ArrheniusCalculator());
					registry.register("rate-law", new mod.RateLawCalculator());
					registry.register("integrated-rate-law", new mod.IntegratedRateLawCalculator());
					registry.register("reaction-order", new mod.ReactionOrderCalculator());
					registry.register("collision-theory", new mod.CollisionTheoryCalculator());
					return mod as CalculatorModule;
				}) as Promise<unknown> as Promise<CalculatorModule>;
			}
			case "quantum-numbers":
			case "electron-config":
			case "rydberg":
			case "debroglie":
			case "photoelectric":
			case "heisenberg": {
				return import("./quantumCalculators.js").then(function(mod: any): CalculatorModule {
					let registry = CalculatorRegistry.getInstance();
					registry.register("quantum-numbers", new mod.QuantumNumbersValidator());
					registry.register("electron-config", new mod.ElectronConfigurationGenerator());
					registry.register("rydberg", new mod.RydbergCalculator());
					registry.register("debroglie", new mod.DeBroglieWavelengthCalculator());
					registry.register("photoelectric", new mod.PhotoelectricEffectCalculator());
					registry.register("heisenberg", new mod.HeisenbergUncertaintyCalculator());
					return mod as CalculatorModule;
				}) as Promise<unknown> as Promise<CalculatorModule>;
			}
			default:
				throw new Error("Unknown calculator: " + calculatorId);
		}
	}

	private addLazyEnterListener(id: string, calculatorId: string, handler: (mod: CalculatorModule) => void): void {
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
		"buffer-solve-for": "buffer-calc",
		"buffer-pKa": "buffer-calc", "buffer-HA": "buffer-calc",
		"buffer-Aminus": "buffer-calc", "buffer-pH": "buffer-calc",
		"buffer-ratio": "buffer-calc",
		"pka-pkb-input-type": "pka-pkb-calc", "pka-pkb-input-value": "pka-pkb-calc",
		"ksp-solve-for": "ksp-calc", "ksp-salt-type": "ksp-calc",
		"ksp-value": "ksp-calc", "ksp-molar-solubility": "ksp-calc",
		"collig-solute-mass": "colligative-calc", "collig-molar-mass": "colligative-calc",
		"collig-solvent-mass": "colligative-calc", "collig-vanthoff": "colligative-calc",
		"collig-Kb": "colligative-calc", "collig-Kf": "colligative-calc",
		"collig-solvent-bp": "colligative-calc", "collig-solvent-fp": "colligative-calc",
		"collig-Psolvent": "colligative-calc",
		"titration-acid-type": "titration-calc",
		"titration-acid-conc": "titration-calc", "titration-acid-vol": "titration-calc",
		"titration-base-conc": "titration-calc", "titration-max-vol": "titration-calc",
		"titration-Ka": "titration-calc",
		"dh-zplus": "debye-huckel-calc", "dh-zminus": "debye-huckel-calc",
		"dh-concentration": "debye-huckel-calc", "dh-ion-size": "debye-huckel-calc",
		"common-ion-salt-type": "common-ion-calc",
		"common-ion-Ksp": "common-ion-calc", "common-ion-concentration": "common-ion-calc",
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
		"gibbs-deltaH": "thermodynamics", "gibbs-deltaS": "thermodynamics", "gibbs-T": "thermodynamics",
		"hess-steps": "thermodynamics",
		"entropy-products": "thermodynamics", "entropy-reactants": "thermodynamics",
		"heat-cap-solve-for": "thermodynamics",
		"heat-cap-mass": "thermodynamics", "heat-cap-specific-heat": "thermodynamics",
		"heat-cap-initial-temp": "thermodynamics", "heat-cap-final-temp": "thermodynamics",
		"heat-cap-heat": "thermodynamics",
		"bond-enthalpy-broken": "thermodynamics", "bond-enthalpy-formed": "thermodynamics",
		"born-haber-dHf": "thermodynamics", "born-haber-dHsub": "thermodynamics",
		"born-haber-IE": "thermodynamics", "born-haber-dHdiss": "thermodynamics",
		"born-haber-EA": "thermodynamics",
		"arrhenius-solve-for": "kinetics", "arrhenius-A": "kinetics",
		"arrhenius-Ea": "kinetics", "arrhenius-T": "kinetics", "arrhenius-k": "kinetics",
		"ratelaw-A1": "kinetics", "ratelaw-B1": "kinetics", "ratelaw-rate1": "kinetics",
		"ratelaw-A2": "kinetics", "ratelaw-B2": "kinetics", "ratelaw-rate2": "kinetics",
		"irl-solve-for": "kinetics", "irl-order": "kinetics",
		"irl-A0": "kinetics", "irl-k": "kinetics", "irl-t": "kinetics", "irl-A": "kinetics",
		"reaction-order-data": "kinetics",
		"collision-solve-for": "kinetics", "collision-Ea": "kinetics",
		"collision-T": "kinetics", "collision-Z": "kinetics",
		"collision-p": "kinetics", "collision-k": "kinetics",
		"qn-n": "quantum-atomic", "qn-l": "quantum-atomic",
		"qn-ml": "quantum-atomic", "qn-ms": "quantum-atomic",
		"ec-atomic-number": "quantum-atomic",
		"rydberg-n1": "quantum-atomic", "rydberg-n2": "quantum-atomic",
		"db-mass": "quantum-atomic", "db-velocity": "quantum-atomic", "db-mass-unit": "quantum-atomic",
		"pe-solve-for": "quantum-atomic", "pe-wavelength": "quantum-atomic",
		"pe-frequency": "quantum-atomic", "pe-work-function": "quantum-atomic", "pe-ke": "quantum-atomic",
		"heis-solve-for": "quantum-atomic", "heis-delta-x": "quantum-atomic",
		"heis-delta-p": "quantum-atomic", "heis-mass": "quantum-atomic",
	};

	/**
	 * Attaches input/change event listeners to all calculator inputs so that
	 * the URL is updated in real-time as the user types (debounced at 500ms).
	 */
	private initializeUrlStateListeners(): void {
		let urlManager = UrlStateManager.getInstance();
		let persistence = InputPersistence.getInstance();
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
				persistence.save(viewId, inputs);
			});
		}
	}

	/**
	 * Adds input masking to chemical formula inputs that strips invalid characters.
	 * Allows only: letters (a-z, A-Z), digits (0-9), parentheses, +, -, ., >, spaces.
	 */
	private initializeFormulaInputMasking(): void {
		let formulaInputIds = ["element-input", "formula-input"];
		for (let i = 0; i < formulaInputIds.length; i++) {
			let input = document.getElementById(formulaInputIds[i]) as HTMLInputElement;
			if (input) {
				input.addEventListener("input", function(): void {
					input.value = input.value.replace(/[^a-zA-Z0-9()\+\-\.\s>]/g, "");
				});
			}
		}
	}

	/**
	 * Adds contextual help tooltips (title attributes) to calculator inputs
	 * with brief explanations of what to enter.
	 */
	private initializeContextualHelp(): void {
		let tooltips: Record<string, string> = {
			"element-input": "Enter a chemical element symbol or name, like H or Hydrogen",
			"formula-input": "Enter a chemical formula like H2O or NaCl",
			"equation-input": "Enter a chemical equation like H2+O2->H2O",
			"stoich-equation-input": "Enter a balanced chemical equation like 2H2+O2->2H2O",
			"element1-input": "Enter the first element symbol, like Na",
			"element2-input": "Enter the second element symbol, like Cl",
			"ideal-P": "Pressure in atm or Pa (depending on R units)",
			"ideal-V": "Volume in L or m³ (depending on R units)",
			"ideal-n": "Amount of gas in moles (mol)",
			"ideal-T": "Temperature in Kelvin (K)",
			"vdw-V": "Volume in liters (L)",
			"vdw-n": "Amount of gas in moles (mol)",
			"vdw-T": "Temperature in Kelvin (K)",
			"vdw-a": "Van der Waals constant a (L² atm mol⁻²)",
			"vdw-b": "Van der Waals constant b (L mol⁻¹)",
			"E1": "First half-reaction reduction potential in volts (V)",
			"E2": "Second half-reaction reduction potential in volts (V)",
			"E-standard": "Standard cell potential in volts (V)",
			"temperature": "Temperature in Kelvin (K)",
			"n-electrons": "Number of moles of electrons transferred",
			"Q-reaction": "Reaction quotient (dimensionless)"
		};
		let ids = Object.keys(tooltips);
		for (let i = 0; i < ids.length; i++) {
			let el = document.getElementById(ids[i]) as HTMLElement;
			if (el) {
				el.setAttribute("title", tooltips[ids[i]]);
			}
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
