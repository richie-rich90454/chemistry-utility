import type { Calculator } from "./calculator.js";
import type { PureCalculator } from "./calculators/pureCalculator.js";
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
	public create(calculatorId: string): Calculator | PureCalculator | undefined {
		switch (calculatorId) {
			case "dilution":
				return new DilutionCalculator();
			case "mass-percent":
				return new MassPercentCalculator();
			case "mixing":
				return new MixingCalculator();
			case "ideal-gas":
				return new IdealGasLawCalculator();
			case "combined-gas":
				return new CombinedGasLawCalculator();
			case "vdw":
				return new VanDerWaalsCalculator();
			case "half-life":
				return new HalfLifeCalculator();
			case "cell-potential":
				return new CellPotentialCalculator();
			case "nernst":
				return new NernstCalculator();
			case "electrolysis":
				return new ElectrolysisCalculator();
			case "bond-type":
				return new BondTypePredictor(this.elementsData);
			case "stoichiometry":
				return new StoichiometryCalculator();
			default:
				return undefined;
		}
	}
}
