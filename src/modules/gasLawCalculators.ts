import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import {
    combinedGas,
    halfLife,
    idealGas,
    solveCombinedGas,
    solveIdealGas,
    vanDerWaals
} from "./calculators/gasLaws.js";
import type { GasLawDisplay } from "./calculators/gasLaws.js";
import { ResultDisplay } from "./resultDisplay.js";

/**
 * Solves the ideal gas law PV = nRT for any one of P, V, n, or T,
 * determined by the "ideal-solve-for" input. The gas constant R is
 * selected from "ideal-R-units" (atm-L or SI) and the volume unit from
 * the optional "ideal-volume-unit" input.
 */
export class IdealGasLawCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "ideal-gas";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return idealGas(inputs);
    }
}

/**
 * Solves the combined gas law (P1*V1)/T1 = (P2*V2)/T2 for any one of the
 * six variables, determined by the "combined-solve-for" input.
 */
export class CombinedGasLawCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "combined-gas";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return combinedGas(inputs);
    }
}

/** Calculates pressure using the Van der Waals equation of state. */
export class VanDerWaalsCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "van-der-waals";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return vanDerWaals(inputs);
    }
}

/**
 * Solves radioactive decay problems for remaining quantity, time elapsed,
 * or half-life, determined by the "half-life-solve-for" input.
 */
export class HalfLifeCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "half-life";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return halfLife(inputs);
    }
}

const IDEAL_INPUT_IDS: string[] = [
    "ideal-P", "ideal-V", "ideal-n", "ideal-T",
    "ideal-solve-for", "ideal-R-units", "ideal-volume-unit"
];
const COMBINED_INPUT_IDS: string[] = [
    "combined-P1", "combined-V1", "combined-T1",
    "combined-P2", "combined-V2", "combined-T2",
    "combined-solve-for"
];
const VAN_DER_WAALS_INPUT_IDS: string[] = ["vdw-V", "vdw-n", "vdw-T", "vdw-a", "vdw-b"];
const HALF_LIFE_INPUT_IDS: string[] = [
    "initial-quantity", "time-input", "half-life-input",
    "remaining-quantity", "half-life-solve-for"
];
const VAN_DER_WAALS_UNITS_NOTE = " (R = 0.08206 L\u00b7atm/(mol\u00b7K))";

// Backwards-compatible DOM entry points. The calculator classes are
// DOM-free; these free functions exist only for the pre-migration
// index.html wiring and the tests that still drive the legacy element
// ids. Each reads its inputs from the page, delegates the math to the
// pure layer, and renders the outcome the legacy views rendered.

function readDomInputs(ids: string[]): Record<string, string> {
    let inputs: Record<string, string> = {};
    for (let i = 0; i < ids.length; i++) {
        let element = document.getElementById(ids[i]) as HTMLInputElement | HTMLSelectElement | null;
        inputs[ids[i]] = element !== null ? element.value : "";
    }
    return inputs;
}

/**
 * The legacy DOM path reported missing inputs through the InputValidator
 * message; the pure layer words the same failure as "Missing or invalid
 * inputs for ...", so the bridge maps it back for the legacy views.
 */
function legacyMessage(error: unknown): string {
    let message: string = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Missing or invalid inputs")) {
        return "Please fill all required fields with valid numbers";
    }
    return message;
}

function runSolved(
    resultElementId: string,
    inputIds: string[],
    solve: (inputs: Record<string, string>) => GasLawDisplay
): void {
    let display: ResultDisplay = new ResultDisplay(resultElementId);
    let solved: GasLawDisplay;
    try {
        solved = solve(readDomInputs(inputIds));
    } catch (error) {
        display.showError(legacyMessage(error));
        return;
    }
    display.showFormula(solved.formula, solved.result, solved.unit);
}

function runResult(
    resultElementId: string,
    inputIds: string[],
    calculate: (inputs: Record<string, string>) => CalculatorResult,
    render: (value: string) => string
): void {
    let display: ResultDisplay = new ResultDisplay(resultElementId);
    let result: CalculatorResult;
    try {
        result = calculate(readDomInputs(inputIds));
    } catch (error) {
        display.showError(legacyMessage(error));
        return;
    }
    display.showResult(render(result.value));
}

export function calculateIdealGasLaw(): void {
    runSolved("ideal-result", IDEAL_INPUT_IDS, solveIdealGas);
}

export function calculateCombinedGasLaw(): void {
    runSolved("combined-result", COMBINED_INPUT_IDS, solveCombinedGas);
}

export function calculateVanDerWaals(): void {
    runResult("vdw-result", VAN_DER_WAALS_INPUT_IDS, vanDerWaals, function (value: string): string {
        return "<p>" + value + VAN_DER_WAALS_UNITS_NOTE + "</p>";
    });
}

export function calculateHalfLife(): void {
    runResult("half-life-result", HALF_LIFE_INPUT_IDS, halfLife, function (value: string): string {
        return "<p>" + value + "</p>";
    });
}
