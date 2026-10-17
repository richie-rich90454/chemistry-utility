import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import {
    gibbsFreeEnergy,
    hessLaw,
    entropy,
    heatCapacity,
    bondEnthalpy,
    bornHaber
} from "./calculators/thermodynamics.js";

/** ΔG = ΔH - TΔS. Inputs: deltaH (kJ/mol), deltaS (J/(mol·K)), temperature (K). */
export class GibbsFreeEnergyCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "gibbs";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return gibbsFreeEnergy(inputs);
    }
}

/**
 * Total enthalpy change using Hess's Law: sum of 2-10 comma-separated
 * ΔH values (kJ/mol).
 */
export class HessLawCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "hess";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return hessLaw(inputs);
    }
}

/** ΔS° = ΣS°(products) - ΣS°(reactants), from two comma-separated lists (J/(mol·K)). */
export class EntropyCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "entropy";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return entropy(inputs);
    }
}

/** q = mcΔT and C = q/ΔT. Solves for q, c, ΔT, or final temperature. */
export class HeatCapacityCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "heat-capacity";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return heatCapacity(inputs);
    }
}

/** Reaction enthalpy from bond energies: ΔH ≈ Σ(bonds broken) - Σ(bonds formed). */
export class BondEnthalpyCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "bond-enthalpy";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return bondEnthalpy(inputs);
    }
}

/** Lattice energy U from the Born-Haber cycle: ΔHf = ΔHsub + IE + ΔHdiss/2 + EA + U. */
export class BornHaberCycleCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "born-haber";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return bornHaber(inputs);
    }
}

// Legacy DOM entry points. Each reads its inputs from the page, delegates the
// math to the pure calculator, and renders the worked result. Kept only for
// the DOM-coverage tests; the Solid routes call calculatePure directly.
function readDomInputs(ids: string[]): Record<string, string> {
    const inputs: Record<string, string> = {};
    for (const id of ids) {
        const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
        inputs[id] = el ? el.value : "";
    }
    return inputs;
}

function runDom(resultId: string, inputs: Record<string, string>, calculator: PureCalculator): void {
    const result = calculator.calculatePure(inputs);
    const el = document.getElementById(resultId);
    if (el) {
        el.innerHTML = result.explanation || result.value;
    }
}

export function calculateGibbsFreeEnergy(): void {
    runDom("gibbs-result", readDomInputs(["gibbs-deltaH", "gibbs-deltaS", "gibbs-T"]), new GibbsFreeEnergyCalculator());
}

export function calculateHessLaw(): void {
    runDom("hess-result", readDomInputs(["hess-steps"]), new HessLawCalculator());
}

export function calculateEntropy(): void {
    runDom("entropy-result", readDomInputs(["entropy-products", "entropy-reactants"]), new EntropyCalculator());
}

export function calculateHeatCapacity(): void {
    runDom("heat-capacity-result", readDomInputs([
        "heat-cap-mass", "heat-cap-specific-heat", "heat-cap-initial-temp",
        "heat-cap-final-temp", "heat-cap-heat", "heat-cap-solve-for"
    ]), new HeatCapacityCalculator());
}

export function calculateBondEnthalpy(): void {
    runDom("bond-enthalpy-result", readDomInputs(["bond-enthalpy-broken", "bond-enthalpy-formed"]), new BondEnthalpyCalculator());
}

export function calculateBornHaberCycle(): void {
    runDom("born-haber-result", readDomInputs([
        "born-haber-dHf", "born-haber-dHsub", "born-haber-IE",
        "born-haber-dHdiss", "born-haber-EA"
    ]), new BornHaberCycleCalculator());
}
