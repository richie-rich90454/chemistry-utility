import type { CalculatorResult } from "./calculators/pureCalculator.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";
import { getBindings } from "./dom/wailsBindings.js";
import { RuntimeDetector } from "./runtimeDetector.js";
import {
    arrhenius,
    collisionTheory,
    integratedRateLaw,
    rateLaw,
    reactionOrder
} from "./calculators/kinetics.js";
import {
    bondType
} from "./calculators/bondType.js";
import {
    bufferSolution,
    colligativeProperties,
    commonIonEffect,
    debyeHuckel,
    dilution,
    ksp,
    massPercent,
    pKaPKb,
    solutionMixing,
    titrationCurve
} from "./calculators/solution.js";
import {
    combinedGas,
    halfLife,
    idealGas,
    vanDerWaals
} from "./calculators/gasLaws.js";
import {
    bornHaber,
    bondEnthalpy,
    entropy,
    gibbsFreeEnergy,
    heatCapacity,
    hessLaw
} from "./calculators/thermodynamics.js";
import {
    deBroglie,
    electronConfiguration,
    heisenberg,
    photoelectric,
    quantumNumbers,
    rydberg
} from "./calculators/quantum.js";
import {
    cellPotential,
    electrolysis,
    nernst
} from "./calculators/electrochemistry.js";
import { molarMass } from "./calculators/molarMass.js";
import { loadElements } from "./calculators/elementData.js";
import { stoichiometry } from "./calculators/stoichiometry.js";

/**
 * Calculation engine bridge.
 *
 * This is the only place in the app that knows which engine is running. The
 * web build executes the TypeScript calculators in this directory. The
 * desktop build calls into the Go registry through Wails bindings. Both
 * return the same CalculatorResult, so no route or component branches.
 */
export interface Engine {
    calculate(calculatorID: string, inputs: Record<string, string>): Promise<CalculatorResult>;
    listCalculators(): Promise<string[]>;
    batchCalculate(calculatorID: string, rows: Array<Record<string, string>>): Promise<CalculatorResult[]>;
}

type CalculatorEntry = (inputs: Record<string, string>) => CalculatorResult;

/**
 * The TypeScript calculator registry, keyed by the identifier the Go side
 * uses. Keeping one map means the two engines accept the same ids.
 */
const WEB_CALCULATORS: Record<string, CalculatorEntry> = {
    "arrhenius": arrhenius,
    "bond-enthalpy": bondEnthalpy,
    "bond-type": bondType,
    "born-haber": bornHaber,
    "buffer-solution": bufferSolution,
    "cell-potential": cellPotential,
    "colligative-properties": colligativeProperties,
    "collision-theory": collisionTheory,
    "combined-gas": combinedGas,
    "common-ion": commonIonEffect,
    "debroglie-wavelength": deBroglie,
    "debye-huckel": debyeHuckel,
    "dilution": dilution,
    "electrolysis": electrolysis,
    "electron-configuration": electronConfiguration,
    "entropy": entropy,
    "gibbs-free-energy": gibbsFreeEnergy,
    "half-life": halfLife,
    "heat-capacity": heatCapacity,
    "heisenberg-uncertainty": heisenberg,
    "hess-law": hessLaw,
    "ideal-gas": idealGas,
    "integrated-rate-law": integratedRateLaw,
    "ksp": ksp,
    "mass-percent": massPercent,
    "molar-mass": molarMassResult,
    "nernst": nernst,
    "photoelectric-effect": photoelectric,
    "pka-pkb": pKaPKb,
    "quantum-numbers": quantumNumbers,
    "rate-law": rateLaw,
    "reaction-order": reactionOrder,
    "rydberg": rydberg,
    "solution-mixing": solutionMixing,
    "stoichiometry": stoichiometry,
    "titration-curve": titrationCurve,
    "van-der-waals": vanDerWaals
};

/**
 * The molar-mass parser returns a bare number, so the registry entry
 * wraps it into the shared {@link CalculatorResult} contract the Go side
 * returns for the same id.
 */
function molarMassResult(inputs: Record<string, string>): CalculatorResult {
    const formula = inputs["formula"] ?? "";
    const mass = molarMass(formula, loadElements());
    return {
        value: "Molar Mass: " + NumberFormatter.createFromCurrentLocale().format(mass, 3) + " g/mol",
        metadata: { molarMass: mass, formula: formula }
    };
}

let engineSingleton: Engine | null = null;

/** Returns the engine for the current platform. */
export function getEngine(): Engine {
    if (engineSingleton !== null) {
        return engineSingleton;
    }
    let bindings = getBindings();
    if (bindings !== null && RuntimeDetector.getInstance().isWails) {
        engineSingleton = createNativeEngine(bindings);
    } else {
        engineSingleton = createWebEngine();
    }
    return engineSingleton;
}

function createNativeEngine(bindings: NonNullable<ReturnType<typeof getBindings>>): Engine {
    return {
        "calculate": async function (calculatorID: string, inputs: Record<string, string>): Promise<CalculatorResult> {
            return await bindings.go.main.CalculatorService.Calculate(calculatorID, inputs);
        },
        "listCalculators": async function (): Promise<string[]> {
            return await bindings.go.main.CalculatorService.ListCalculators();
        },
        "batchCalculate": async function (
            calculatorID: string,
            rows: Array<Record<string, string>>
        ): Promise<CalculatorResult[]> {
            return await bindings.go.main.CalculatorService.BatchCalculate(calculatorID, rows);
        }
    };
}

function createWebEngine(): Engine {
    return {
        "calculate": function (calculatorID: string, inputs: Record<string, string>): Promise<CalculatorResult> {
            let fn = WEB_CALCULATORS[calculatorID];
            if (fn === undefined) {
                return Promise.resolve({ value: "", explanation: "Error: unknown calculator: " + calculatorID });
            }
            try {
                return Promise.resolve(fn(inputs));
            } catch (error) {
                let message = error instanceof Error ? error.message : String(error);
                return Promise.resolve({ value: "", explanation: "Error: " + message });
            }
        },
        "listCalculators": function (): Promise<string[]> {
            return Promise.resolve(Object.keys(WEB_CALCULATORS).sort());
        },
        "batchCalculate": function (
            calculatorID: string,
            rows: Array<Record<string, string>>
        ): Promise<CalculatorResult[]> {
            let fn = WEB_CALCULATORS[calculatorID];
            if (fn === undefined) {
                let message = "Error: unknown calculator: " + calculatorID;
                return Promise.resolve(rows.map(() => ({ value: "", explanation: message })));
            }
            let results: CalculatorResult[] = [];
            for (let i = 0; i < rows.length; i++) {
                try {
                    results.push(fn(rows[i]));
                } catch (error) {
                    let message = error instanceof Error ? error.message : String(error);
                    results.push({ value: "", explanation: "Error: " + message });
                }
            }
            return Promise.resolve(results);
        }
    };
}

/** Resets the cached engine. Test-only hook. */
export function resetEngine(): void {
    engineSingleton = null;
}

