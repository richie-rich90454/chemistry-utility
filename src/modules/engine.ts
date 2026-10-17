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
import {
    beerLambert,
    calorimetry,
    empiricalFormula,
    gibbsEquilibrium,
    leChatelier,
    massSpectrometry,
    molality,
    photoelectronSpectroscopy,
    serialDilution,
    vseprGeometry
} from "./calculators/advanced.js";
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
    "beer-lambert": beerLambert,
    "bond-enthalpy": bondEnthalpy,
    "bond-type": bondType,
    "born-haber": bornHaber,
    "buffer-solution": bufferSolution,
    "calorimetry": calorimetry,
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
    "empirical-formula": empiricalFormula,
    "entropy": entropy,
    "gibbs-equilibrium": gibbsEquilibrium,
    "gibbs-free-energy": gibbsFreeEnergy,
    "half-life": halfLife,
    "heat-capacity": heatCapacity,
    "heisenberg-uncertainty": heisenberg,
    "hess-law": hessLaw,
    "ideal-gas": idealGas,
    "integrated-rate-law": integratedRateLaw,
    "ksp": ksp,
    "le-chatelier": leChatelier,
    "mass-percent": massPercent,
    "mass-spectrometry": massSpectrometry,
    "molality": molality,
    "molar-mass": molarMassResult,
    "nernst": nernst,
    "photoelectric-effect": photoelectric,
    "photoelectron-spectroscopy": photoelectronSpectroscopy,
    "pka-pkb": pKaPKb,
    "quantum-numbers": quantumNumbers,
    "rate-law": rateLaw,
    "reaction-order": reactionOrder,
    "rydberg": rydberg,
    "serial-dilution": serialDilution,
    "solution-mixing": solutionMixing,
    "stoichiometry": stoichiometry,
    "titration-curve": titrationCurve,
    "van-der-waals": vanDerWaals,
    "vsepr-geometry": vseprGeometry
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
            try {
                return await bindings.go.main.CalculatorService.Calculate(calculatorID, inputs);
            } catch (error) {
                // The Go registry ports a subset of the calculators. An id it
                // does not implement falls back to the calculator bundled in
                // the desktop app, so the desktop exposes the full set.
                let message = error instanceof Error ? error.message : String(error);
                if (isUnknownCalculator(message) && WEB_CALCULATORS[calculatorID] !== undefined) {
                    return runWebCalculator(calculatorID, inputs);
                }
                return { value: "", explanation: "Error: " + message };
            }
        },
        "listCalculators": async function (): Promise<string[]> {
            let native = await bindings.go.main.CalculatorService.ListCalculators();
            return Array.from(new Set(native.concat(webCalculatorIDs()))).sort();
        },
        "batchCalculate": async function (
            calculatorID: string,
            rows: Array<Record<string, string>>
        ): Promise<CalculatorResult[]> {
            try {
                return await bindings.go.main.CalculatorService.BatchCalculate(calculatorID, rows);
            } catch (error) {
                let message = error instanceof Error ? error.message : String(error);
                if (isUnknownCalculator(message) && WEB_CALCULATORS[calculatorID] !== undefined) {
                    return runWebBatch(calculatorID, rows);
                }
                return rows.map(function (): CalculatorResult {
                    return { value: "", explanation: "Error: " + message };
                });
            }
        }
    };
}

/** True when a Go error names a calculator the native registry does not have. */
function isUnknownCalculator(message: string): boolean {
    return message.indexOf("unknown calculator") !== -1;
}

/** Runs one TypeScript calculator, mapping a throw to the error contract. */
function runWebCalculator(calculatorID: string, inputs: Record<string, string>): CalculatorResult {
    let fn = WEB_CALCULATORS[calculatorID];
    if (fn === undefined) {
        return { value: "", explanation: "Error: unknown calculator: " + calculatorID };
    }
    try {
        return fn(inputs);
    } catch (error) {
        let message = error instanceof Error ? error.message : String(error);
        return { value: "", explanation: "Error: " + message };
    }
}

/** Runs one TypeScript calculator over many rows. */
function runWebBatch(calculatorID: string, rows: Array<Record<string, string>>): CalculatorResult[] {
    return rows.map(function (row: Record<string, string>): CalculatorResult {
        return runWebCalculator(calculatorID, row);
    });
}

/** The TypeScript calculator ids, sorted. */
function webCalculatorIDs(): string[] {
    return Object.keys(WEB_CALCULATORS).sort();
}

function createWebEngine(): Engine {
    return {
        "calculate": function (calculatorID: string, inputs: Record<string, string>): Promise<CalculatorResult> {
            return Promise.resolve(runWebCalculator(calculatorID, inputs));
        },
        "listCalculators": function (): Promise<string[]> {
            return Promise.resolve(webCalculatorIDs());
        },
        "batchCalculate": function (
            calculatorID: string,
            rows: Array<Record<string, string>>
        ): Promise<CalculatorResult[]> {
            return Promise.resolve(runWebBatch(calculatorID, rows));
        }
    };
}

/** Resets the cached engine. Test-only hook. */
export function resetEngine(): void {
    engineSingleton = null;
}

