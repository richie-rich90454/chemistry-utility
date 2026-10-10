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
        const deltaH = parseFloat(inputs["gibbs-deltaH"] ?? "");
        const deltaS = parseFloat(inputs["gibbs-deltaS"] ?? "");
        const T = parseFloat(inputs["gibbs-T"] ?? "");
        if (isNaN(deltaH) || isNaN(deltaS) || isNaN(T)) {
            throw new Error("Missing or invalid inputs for gibbs-deltaH, gibbs-deltaS, gibbs-T");
        }
        return gibbsFreeEnergy(deltaH, deltaS, T);
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
        return hessLaw(inputs["hess-steps"] ?? "");
    }
}

/** ΔS° = ΣS°(products) - ΣS°(reactants), from two comma-separated lists (J/(mol·K)). */
export class EntropyCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "entropy";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return entropy(inputs["entropy-products"] ?? "", inputs["entropy-reactants"] ?? "");
    }
}

/** q = mcΔT and C = q/ΔT. Solves for q, c, ΔT, or final temperature. */
export class HeatCapacityCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "heat-capacity";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const solveFor = inputs["heat-cap-solve-for"] ?? "";
        const mass = parseFloat(inputs["heat-cap-mass"] ?? "");
        const c = parseFloat(inputs["heat-cap-specific-heat"] ?? "");
        const T_initial = parseFloat(inputs["heat-cap-initial-temp"] ?? "");
        const T_final = parseFloat(inputs["heat-cap-final-temp"] ?? "");
        const q = parseFloat(inputs["heat-cap-heat"] ?? "");
        return heatCapacity(solveFor, mass, c, T_initial, T_final, q);
    }
}

/** Reaction enthalpy from bond energies: ΔH ≈ Σ(bonds broken) - Σ(bonds formed). */
export class BondEnthalpyCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "bond-enthalpy";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return bondEnthalpy(inputs["bond-enthalpy-broken"] ?? "", inputs["bond-enthalpy-formed"] ?? "");
    }
}

/** Lattice energy U from the Born-Haber cycle: ΔHf = ΔHsub + IE + ΔHdiss/2 + EA + U. */
export class BornHaberCycleCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "born-haber";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        const dHf = parseFloat(inputs["born-haber-dHf"] ?? "");
        const dHsub = parseFloat(inputs["born-haber-dHsub"] ?? "");
        const IE = parseFloat(inputs["born-haber-IE"] ?? "");
        const dHdiss = parseFloat(inputs["born-haber-dHdiss"] ?? "");
        const EA = parseFloat(inputs["born-haber-EA"] ?? "");
        if (isNaN(dHf) || isNaN(dHsub) || isNaN(IE) || isNaN(dHdiss) || isNaN(EA)) {
            throw new Error("Missing or invalid inputs for born-haber-dHf, born-haber-dHsub, born-haber-IE, born-haber-dHdiss, born-haber-EA");
        }
        return bornHaber(dHf, dHsub, IE, dHdiss, EA);
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
