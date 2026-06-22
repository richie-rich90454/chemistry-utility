import type { Calculator } from "./calculator.js";
import type { InputProvider } from "./inputProvider.js";
import type { ChemicalElement } from "../types.js";
import { DilutionCalculator, MassPercentCalculator, MixingCalculator } from "./solutionCalculators.js";
import { IdealGasLawCalculator, CombinedGasLawCalculator, VanDerWaalsCalculator, HalfLifeCalculator } from "./gasLawCalculators.js";
import { CellPotentialCalculator, NernstCalculator, ElectrolysisCalculator } from "./electrochemistryCalculators.js";
import { BondTypePredictor } from "./bondPredictor.js";
import { StoichiometryCalculator } from "./stoichiometryCalculator.js";

/**
 * Factory for creating {@link Calculator} instances from a calculator id.
 * Injects an {@link InputProvider} dependency into each created calculator,
 * enabling testability via mock providers.
 */
export class CalculatorFactory {
	private elementsData: ChemicalElement[];

	constructor(elementsData: ChemicalElement[]) {
		this.elementsData = elementsData;
	}

	/**
	 * Creates a calculator instance for the given id, optionally injecting
	 * a custom {@link InputProvider}. Returns undefined for unknown ids.
	 */
	public create(calculatorId: string, inputProvider?: InputProvider): Calculator | undefined {
		switch (calculatorId) {
			case "dilution":
				return new DilutionCalculator(inputProvider);
			case "mass-percent":
				return new MassPercentCalculator(inputProvider);
			case "mixing":
				return new MixingCalculator(inputProvider);
			case "ideal-gas":
				return new IdealGasLawCalculator(inputProvider);
			case "combined-gas":
				return new CombinedGasLawCalculator(inputProvider);
			case "vdw":
				return new VanDerWaalsCalculator(inputProvider);
			case "half-life":
				return new HalfLifeCalculator(inputProvider);
			case "cell-potential":
				return new CellPotentialCalculator(inputProvider);
			case "nernst":
				return new NernstCalculator(inputProvider);
			case "electrolysis":
				return new ElectrolysisCalculator(inputProvider);
			case "bond-type":
				return new BondTypePredictor(this.elementsData, inputProvider);
			case "stoichiometry":
				return new StoichiometryCalculator(inputProvider);
			default:
				return undefined;
		}
	}
}
