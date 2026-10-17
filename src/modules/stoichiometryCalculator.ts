import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import { stoichiometry } from "./calculators/stoichiometry.js";

/**
 * Stoichiometry calculator that extends the pure calculator base.
 * Supports product-from-reactant, reactant-from-product, and limiting-reactant
 * calculations. All math lives in ./calculators/stoichiometry.js and the
 * legacy DOM entry points live in ./dom/stoichiometryDom.js.
 */
export class StoichiometryCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "stoichiometry";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return stoichiometry(inputs);
    }
}
