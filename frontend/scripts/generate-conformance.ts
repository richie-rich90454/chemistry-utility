import "./env.js";
import {writeFileSync, mkdirSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import {
    DilutionCalculator,
    MassPercentCalculator,
    MixingCalculator,
    BufferSolutionCalculator,
    PKaPKbCalculator,
    KspCalculator,
    ColligativePropertiesCalculator,
    TitrationCurveCalculator,
    DebyeHuckelCalculator,
    CommonIonEffectCalculator
} from "../src/modules/solutionCalculators.js";
import {
    IdealGasLawCalculator,
    CombinedGasLawCalculator,
    VanDerWaalsCalculator,
    HalfLifeCalculator
} from "../src/modules/gasLawCalculators.js";
import {
    ArrheniusCalculator,
    RateLawCalculator,
    IntegratedRateLawCalculator,
    ReactionOrderCalculator,
    CollisionTheoryCalculator
} from "../src/modules/kineticsCalculators.js";
import {
    QuantumNumbersValidator,
    ElectronConfigurationGenerator,
    RydbergCalculator,
    DeBroglieWavelengthCalculator,
    PhotoelectricEffectCalculator,
    HeisenbergUncertaintyCalculator
} from "../src/modules/quantumCalculators.js";
import {
    CellPotentialCalculator,
    NernstCalculator,
    ElectrolysisCalculator
} from "../src/modules/electrochemistryCalculators.js";
import {
    GibbsFreeEnergyCalculator,
    HessLawCalculator,
    EntropyCalculator,
    HeatCapacityCalculator,
    BondEnthalpyCalculator,
    BornHaberCycleCalculator
} from "../src/modules/thermodynamicsCalculators.js";
import {BondTypePredictor} from "../src/modules/bondPredictor.js";
import {bondType} from "../src/modules/calculators/bondType.js";
import {
    cellPotential,
    electrolysis,
    nernst
} from "../src/modules/calculators/electrochemistry.js";
import {
    bondEnthalpy,
    bornHaber,
    entropy,
    gibbsFreeEnergy,
    heatCapacity,
    hessLaw
} from "../src/modules/calculators/thermodynamics.js";
import {
    deBroglie,
    electronConfiguration,
    heisenberg,
    photoelectric,
    quantumNumbers,
    rydberg
} from "../src/modules/calculators/quantum.js";
import {FormulaParser} from "../src/modules/formulaParser.js";
import {balanceEquation, balanceRedox} from "../src/modules/equationBalancer.js";
import {elementsToDataset} from "./conformanceData.js";

interface VectorCase {
    id: string;
    inputs: Record<string, unknown>;
    expect: unknown;
}

interface VectorFile {
    calculator: string;
    contract: string;
    cases: VectorCase[];
}

const CONTRACT = "calc-result-v1";

interface PureCalculator {
    calculatePure(inputs: Record<string, string>): unknown;
}

/**
 * Records the output of a pure calculator function. Thrown errors are
 * captured as the web engine surfaces them: an empty value plus an
 * "Error: …" explanation. That way a vector pins the error message too.
 */
function pureCase(fn: (inputs: Record<string, string>) => unknown, id: string, inputs: Record<string, string>): VectorCase {
    try {
        let out = fn(Object.assign({}, inputs));
        return { "id": id, "inputs": inputs, "expect": out };
    } catch (error) {
        let message = error instanceof Error ? error.message : String(error);
        return { "id": id, "inputs": inputs, "expect": { value: "", explanation: "Error: " + message } };
    }
}

function buildCase(calculator: PureCalculator, id: string, inputs: Record<string, string>): VectorCase {
    let out = calculator.calculatePure(Object.assign({}, inputs));
    return { "id": id, "inputs": inputs, "expect": out };
}

function molarMassCase(id: string, formula: string): VectorCase {
    return {
        "id": id,
        "inputs": { "formula": formula },
        "expect": { "molarMass": FormulaParser.calculateMolarMass(formula, elementsToDataset()) }
    };
}

function balanceCase(id: string, equation: string): VectorCase {
    return {
        "id": id,
        "inputs": { "equation": equation },
        "expect": { "balanced": balanceEquation(equation) }
    };
}

function redoxCase(id: string, equation: string, medium: "acidic" | "basic"): VectorCase {
    return {
        "id": id,
        "inputs": { "equation": equation, "medium": medium },
        "expect": { "balanced": balanceRedox(equation, medium) }
    };
}

function bondCase(id: string, symbol1: string, symbol2: string): VectorCase {
    return {
        "id": id,
        "inputs": { "element1-input": symbol1, "element2-input": symbol2 },
        "expect": bondType({ "element1-input": symbol1, "element2-input": symbol2 })
    };
}

function writeVector(file: string, calculator: string, cases: VectorCase[]): void {
    let payload: VectorFile = { "calculator": calculator, "contract": CONTRACT, "cases": cases };
    let dir = join(__dirname, "..", "..", "conformance");
    mkdirSync(dir, { "recursive": true });
    writeFileSync(join(dir, file), JSON.stringify(payload, null, 2) + "\n", "utf8");
    process.stdout.write("wrote conformance/" + file + " (" + String(cases.length) + " cases)\n");
}

function collect(): void {
    writeVector("molar-mass.json", "molar-mass", [
        molarMassCase("water", "H2O"),
        molarMassCase("glucose", "C6H12O6"),
        molarMassCase("aluminum-sulfate", "Al2(SO4)3"),
        molarMassCase("sodium-chloride", "NaCl"),
        molarMassCase("nested-parens", "Ca(NO2)2"),
        molarMassCase("copper-sulfate-pentahydrate", "CuSO4·5H2O"),
        molarMassCase("double-nested", "K4[Fe(CN)6]"),
        molarMassCase("single-atom", "Fe"),
        molarMassCase("diatomic", "O2")
    ]);

    writeVector("dilution.json", "dilution", [
        buildCase(new DilutionCalculator(), "solve-v2", {
            "dilution-M1": "6", "dilution-V1": "1", "dilution-M2": "3", "dilution-V2": "", "dilution-solve-for": "V2"
        }),
        buildCase(new DilutionCalculator(), "solve-m1", {
            "dilution-M1": "", "dilution-V1": "0.5", "dilution-M2": "0.1", "dilution-V2": "2", "dilution-solve-for": "M1"
        }),
        buildCase(new DilutionCalculator(), "solve-m2", {
            "dilution-M1": "12", "dilution-V1": "0.25", "dilution-M2": "", "dilution-V2": "1", "dilution-solve-for": "M2"
        }),
        buildCase(new DilutionCalculator(), "missing-inputs", {
            "dilution-M1": "", "dilution-V1": "1", "dilution-M2": "", "dilution-V2": "2", "dilution-solve-for": "V2"
        }),
        buildCase(new DilutionCalculator(), "negative-m1", {
            "dilution-M1": "-6", "dilution-V1": "1", "dilution-M2": "3", "dilution-V2": "", "dilution-solve-for": "V2"
        })
    ]);

    writeVector("ideal-gas.json", "ideal-gas", [
        buildCase(new IdealGasLawCalculator(), "solve-v-atm", {
            "ideal-P": "1", "ideal-V": "", "ideal-n": "1", "ideal-T": "273.15",
            "ideal-solve-for": "V", "ideal-R-units": "atm-L", "ideal-volume-unit": "L"
        }),
        buildCase(new IdealGasLawCalculator(), "solve-v-si", {
            "ideal-P": "101325", "ideal-V": "", "ideal-n": "1", "ideal-T": "273.15",
            "ideal-solve-for": "V", "ideal-R-units": "SI", "ideal-volume-unit": "m\u00b3"
        }),
        buildCase(new IdealGasLawCalculator(), "solve-p", {
            "ideal-P": "", "ideal-V": "22.414", "ideal-n": "1", "ideal-T": "273.15",
            "ideal-solve-for": "P", "ideal-R-units": "atm-L", "ideal-volume-unit": "L"
        }),
        buildCase(new IdealGasLawCalculator(), "solve-n", {
            "ideal-P": "1", "ideal-V": "22.414", "ideal-n": "", "ideal-T": "273.15",
            "ideal-solve-for": "n", "ideal-R-units": "atm-L", "ideal-volume-unit": "L"
        }),
        buildCase(new IdealGasLawCalculator(), "solve-t", {
            "ideal-P": "1", "ideal-V": "22.414", "ideal-n": "1", "ideal-T": "",
            "ideal-solve-for": "T", "ideal-R-units": "atm-L", "ideal-volume-unit": "L"
        }),
        buildCase(new IdealGasLawCalculator(), "m3-input-atm", {
            "ideal-P": "", "ideal-V": "0.022414", "ideal-n": "1", "ideal-T": "273.15",
            "ideal-solve-for": "P", "ideal-R-units": "atm-L", "ideal-volume-unit": "m\u00b3"
        }),
        buildCase(new IdealGasLawCalculator(), "zero-volume", {
            "ideal-P": "", "ideal-V": "0", "ideal-n": "1", "ideal-T": "273.15",
            "ideal-solve-for": "P", "ideal-R-units": "atm-L", "ideal-volume-unit": "L"
        })
    ]);

    writeVector("combined-gas.json", "combined-gas", [
        buildCase(new CombinedGasLawCalculator(), "solve-p2", {
            "combined-P1": "1", "combined-V1": "2", "combined-T1": "300",
            "combined-P2": "", "combined-V2": "4", "combined-T2": "600",
            "combined-solve-for": "P2"
        }),
        buildCase(new CombinedGasLawCalculator(), "solve-v2", {
            "combined-P1": "1", "combined-V1": "2", "combined-T1": "300",
            "combined-P2": "2", "combined-V2": "", "combined-T2": "600",
            "combined-solve-for": "V2"
        }),
        buildCase(new CombinedGasLawCalculator(), "solve-t1", {
            "combined-P1": "1", "combined-V1": "2", "combined-T1": "",
            "combined-P2": "0.5", "combined-V2": "4", "combined-T2": "600",
            "combined-solve-for": "T1"
        }),
        buildCase(new CombinedGasLawCalculator(), "solve-p1", {
            "combined-P1": "", "combined-V1": "2", "combined-T1": "300",
            "combined-P2": "1", "combined-V2": "4", "combined-T2": "600",
            "combined-solve-for": "P1"
        }),
        buildCase(new CombinedGasLawCalculator(), "solve-t2", {
            "combined-P1": "1", "combined-V1": "2", "combined-T1": "300",
            "combined-P2": "1", "combined-V2": "4", "combined-T2": "",
            "combined-solve-for": "T2"
        }),
        buildCase(new CombinedGasLawCalculator(), "zero-t2", {
            "combined-P1": "1", "combined-V1": "2", "combined-T1": "300",
            "combined-P2": "", "combined-V2": "4", "combined-T2": "0",
            "combined-solve-for": "P2"
        })
    ]);

    writeVector("van-der-waals.json", "van-der-waals", [
        buildCase(new VanDerWaalsCalculator(), "co2", {
            "vdw-V": "5", "vdw-n": "2", "vdw-T": "400", "vdw-a": "3.592", "vdw-b": "0.0427"
        }),
        buildCase(new VanDerWaalsCalculator(), "ideal-like", {
            "vdw-V": "24.79", "vdw-n": "1", "vdw-T": "298.15", "vdw-a": "0", "vdw-b": "0"
        }),
        buildCase(new VanDerWaalsCalculator(), "volume-too-small", {
            "vdw-V": "0.01", "vdw-n": "1", "vdw-T": "298.15", "vdw-a": "3.592", "vdw-b": "0.0427"
        }),
        buildCase(new VanDerWaalsCalculator(), "negative-a", {
            "vdw-V": "5", "vdw-n": "1", "vdw-T": "300", "vdw-a": "-1", "vdw-b": "0.04"
        })
    ]);

    writeVector("half-life.json", "half-life", [
        buildCase(new HalfLifeCalculator(), "remaining", {
            "initial-quantity": "100", "time-input": "3000", "half-life-input": "1000", "remaining-quantity": "",
            "half-life-solve-for": "remaining"
        }),
        buildCase(new HalfLifeCalculator(), "time", {
            "initial-quantity": "100", "time-input": "", "half-life-input": "1000", "remaining-quantity": "25",
            "half-life-solve-for": "time"
        }),
        buildCase(new HalfLifeCalculator(), "half-life", {
            "initial-quantity": "100", "time-input": "3000", "half-life-input": "", "remaining-quantity": "25",
            "half-life-solve-for": "half-life"
        }),
        buildCase(new HalfLifeCalculator(), "remaining-not-below-initial", {
            "initial-quantity": "100", "time-input": "3000", "half-life-input": "1000", "remaining-quantity": "150",
            "half-life-solve-for": "time"
        })
    ]);

    writeVector("mass-percent.json", "mass-percent", [
        buildCase(new MassPercentCalculator(), "percent", {
            "mass-solute": "10", "mass-solution": "250", "concentration-unit": "percent"
        }),
        buildCase(new MassPercentCalculator(), "ppm", {
            "mass-solute": "0.01", "mass-solution": "1000", "concentration-unit": "ppm"
        }),
        buildCase(new MassPercentCalculator(), "ppb", {
            "mass-solute": "0.000001", "mass-solution": "1000", "concentration-unit": "ppb"
        }),
        buildCase(new MassPercentCalculator(), "zero-solution", {
            "mass-solute": "10", "mass-solution": "0", "concentration-unit": "percent"
        })
    ]);

    writeVector("solution-mixing.json", "solution-mixing", [
        buildCase(new MixingCalculator(), "typical", {
            "mix-C1": "2", "mix-V1": "1", "mix-C2": "0.5", "mix-V2": "3"
        }),
        buildCase(new MixingCalculator(), "zero-v1", {
            "mix-C1": "2", "mix-V1": "0", "mix-C2": "0.5", "mix-V2": "3"
        })
    ]);

    writeVector("buffer-solution.json", "buffer-solution", [
        buildCase(new BufferSolutionCalculator(), "acetic", {
            "buffer-pKa": "4.76", "buffer-HA": "0.1", "buffer-Aminus": "0.1",
            "buffer-pH": "", "buffer-ratio": "", "buffer-solve-for": "pH"
        })
    ]);

    writeVector("pka-pkb.json", "pka-pkb", [
        buildCase(new PKaPKbCalculator(), "ka-to-pka", {
            "pka-pkb-input-type": "Ka", "pka-pkb-input-value": "1.8e-5"
        }),
        buildCase(new PKaPKbCalculator(), "kb-to-pkb", {
            "pka-pkb-input-type": "Kb", "pka-pkb-input-value": "1.8e-5"
        })
    ]);

    writeVector("ksp.json", "ksp", [
        buildCase(new KspCalculator(), "ksp-from-solubility", {
            "ksp-salt-type": "AB", "ksp-solve-for": "Ksp", "ksp-value": "", "ksp-molar-solubility": "1.3e-5"
        }),
        buildCase(new KspCalculator(), "solubility-from-ksp", {
            "ksp-salt-type": "AB", "ksp-solve-for": "solubility", "ksp-value": "1.7e-10", "ksp-molar-solubility": ""
        })
    ]);

    writeVector("colligative.json", "colligative-properties", [
        buildCase(new ColligativePropertiesCalculator(), "water-boiling", {
            "collig-solve-for": "boiling-point", "collig-molality": "1",
            "collig-solvent-molar-mass": "18.015", "collig-kb": "0.512",
            "collig-kf": "1.86", "collig-density": "1", "collig-temp": "298.15"
        })
    ]);

    writeVector("titration.json", "titration-curve", [
        buildCase(new TitrationCurveCalculator(), "strong-strong", {
            "titration-acid-type": "strong", "titration-acid-conc": "0.1", "titration-acid-vol": "25",
            "titration-base-conc": "0.1", "titration-max-vol": "50", "titration-Ka": ""
        }),
        buildCase(new TitrationCurveCalculator(), "weak-strong", {
            "titration-acid-type": "weak", "titration-acid-conc": "0.1", "titration-acid-vol": "25",
            "titration-base-conc": "0.1", "titration-max-vol": "50", "titration-Ka": "1.8e-5"
        })
    ]);

    writeVector("debye-huckel.json", "debye-huckel", [
        buildCase(new DebyeHuckelCalculator(), "typical", {
            "debye-ion-charge": "1", "debye-ionic-strength": "0.01"
        })
    ]);

    writeVector("common-ion.json", "common-ion", [
        buildCase(new CommonIonEffectCalculator(), "typical", {
            "common-ion-salt-type": "AB", "common-ion-Ksp": "1.7e-10", "common-ion-concentration": "0.1"
        })
    ]);

    writeVector("arrhenius.json", "arrhenius", [
        buildCase(new ArrheniusCalculator(), "rate-at-350", {
            "arrhenius-A": "1e10", "arrhenius-Ea": "50000", "arrhenius-T": "350"
        })
    ]);

    writeVector("rate-law.json", "rate-law", [
        buildCase(new RateLawCalculator(), "typical", {
            "rate-k": "0.5", "rate-A": "0.1", "rate-B": "0.2", "rate-order-A": "1", "rate-order-B": "2"
        })
    ]);

    writeVector("integrated-rate-law.json", "integrated-rate-law", [
        buildCase(new IntegratedRateLawCalculator(), "first-order", {
            "irl-order": "first", "irl-A0": "1", "irl-t": "100", "irl-k": "0.01"
        })
    ]);

    writeVector("reaction-order.json", "reaction-order", [
        buildCase(new ReactionOrderCalculator(), "first", {
            "reaction-order-data": "0.1 0.055\n1 0.02"
        })
    ]);

    writeVector("collision-theory.json", "collision-theory", [
        buildCase(new CollisionTheoryCalculator(), "typical", {
            "collision-T": "300", "collision-Ea": "40000"
        })
    ]);

    writeVector("quantum-numbers.json", "quantum-numbers", [
        pureCase(quantumNumbers, "3d-electron", {
            "qn-n": "3", "qn-l": "2", "qn-ml": "1", "qn-ms": "-0.5"
        }),
        pureCase(quantumNumbers, "invalid-m", {
            "qn-n": "2", "qn-l": "0", "qn-ml": "1", "qn-ms": "0.5"
        }),
        pureCase(quantumNumbers, "invalid-l-out-of-range", {
            "qn-n": "2", "qn-l": "2", "qn-ml": "0", "qn-ms": "0.5"
        }),
        pureCase(quantumNumbers, "1s-electron", {
            "qn-n": "1", "qn-l": "0", "qn-ml": "0", "qn-ms": "0.5"
        }),
        pureCase(quantumNumbers, "missing-inputs", {
            "qn-n": "", "qn-l": "1", "qn-ml": "0", "qn-ms": "0.5"
        })
    ]);

    writeVector("electron-configuration.json", "electron-configuration", [
        pureCase(electronConfiguration, "iron", { "ec-atomic-number": "26" }),
        pureCase(electronConfiguration, "uranium", { "ec-atomic-number": "92" }),
        pureCase(electronConfiguration, "hydrogen", { "ec-atomic-number": "1" }),
        pureCase(electronConfiguration, "chromium-exception", { "ec-atomic-number": "24" }),
        pureCase(electronConfiguration, "out-of-range", { "ec-atomic-number": "200" })
    ]);

    writeVector("rydberg.json", "rydberg", [
        pureCase(rydberg, "visible-line", {
            "rydberg-n1": "2", "rydberg-n2": "3"
        }),
        pureCase(rydberg, "lyman-alpha", {
            "rydberg-n1": "1", "rydberg-n2": "2"
        }),
        pureCase(rydberg, "balmer-limit", {
            "rydberg-n1": "2", "rydberg-n2": "99"
        }),
        pureCase(rydberg, "missing-n2", {
            "rydberg-n1": "2", "rydberg-n2": ""
        })
    ]);

    writeVector("debroglie.json", "debroglie-wavelength", [
        pureCase(deBroglie, "electron", {
            "db-mass": "9.109e-31", "db-velocity": "2e6", "db-mass-unit": "kg"
        }),
        pureCase(deBroglie, "proton", {
            "db-mass": "1.673e-27", "db-velocity": "1e5", "db-mass-unit": "kg"
        }),
        pureCase(deBroglie, "ammonia-molecule", {
            "db-mass": "17", "db-velocity": "611", "db-mass-unit": "amu"
        }),
        pureCase(deBroglie, "zero-velocity", {
            "db-mass": "9.109e-31", "db-velocity": "0", "db-mass-unit": "kg"
        })
    ]);

    writeVector("photoelectric.json", "photoelectric-effect", [
        pureCase(photoelectric, "solve-ke", {
            "pe-solve-for": "KE", "pe-work-function": "4.5", "pe-frequency": "2e15"
        }),
        pureCase(photoelectric, "below-threshold", {
            "pe-solve-for": "KE", "pe-work-function": "4.5", "pe-frequency": "1e14"
        }),
        pureCase(photoelectric, "solve-threshold-frequency", {
            "pe-solve-for": "threshold-frequency", "pe-work-function": "4.5", "pe-ke": "1.5"
        }),
        pureCase(photoelectric, "solve-wavelength", {
            "pe-solve-for": "wavelength", "pe-ke": "1.5", "pe-work-function": "4.5"
        }),
        pureCase(photoelectric, "invalid-solve-for", {
            "pe-solve-for": "nope", "pe-work-function": "4.5", "pe-frequency": "2e15"
        })
    ]);

    writeVector("heisenberg.json", "heisenberg-uncertainty", [
        pureCase(heisenberg, "solve-min-delta-p", {
            "heis-solve-for": "min-delta-p", "heis-delta-x": "1e-10"
        }),
        pureCase(heisenberg, "solve-min-delta-x", {
            "heis-solve-for": "min-delta-x", "heis-delta-p": "1e-24"
        }),
        pureCase(heisenberg, "macroscopic-position", {
            "heis-solve-for": "min-delta-p", "heis-delta-x": "1e-3"
        }),
        pureCase(heisenberg, "invalid-solve-for", {
            "heis-solve-for": "nope", "heis-delta-x": "1e-10"
        }),
        pureCase(heisenberg, "missing-delta-x", {
            "heis-solve-for": "min-delta-p", "heis-delta-x": ""
        })
    ]);

    writeVector("cell-potential.json", "cell-potential", [
        buildCase(new CellPotentialCalculator(), "typical", { "E1": "0.80", "E2": "-0.34" })
    ]);

    writeVector("nernst.json", "nernst", [
        buildCase(new NernstCalculator(), "typical", {
            "E-standard": "0.34", "temperature": "298", "n-electrons": "2", "Q-reaction": "0.01"
        })
    ]);

    writeVector("electrolysis.json", "electrolysis", [
        pureCase(electrolysis, "solve-mass", {
            "electrolysis-solve-for": "mass", "electrolysis-I": "2", "electrolysis-t": "1800",
            "electrolysis-z": "2", "electrolysis-M": "63.5"
        }),
        pureCase(electrolysis, "solve-current", {
            "electrolysis-solve-for": "current", "electrolysis-m": "10", "electrolysis-t": "1800",
            "electrolysis-z": "2", "electrolysis-M": "63.5"
        }),
        pureCase(electrolysis, "solve-time", {
            "electrolysis-solve-for": "time", "electrolysis-m": "10", "electrolysis-I": "2",
            "electrolysis-z": "2", "electrolysis-M": "63.5"
        }),
        pureCase(electrolysis, "invalid-solve-for", {
            "electrolysis-solve-for": "nope", "electrolysis-I": "2"
        })
    ]);

    writeVector("gibbs.json", "gibbs-free-energy", [
        buildCase(new GibbsFreeEnergyCalculator(), "spontaneous", {
            "gibbs-deltaH": "-100", "gibbs-deltaS": "-100", "gibbs-T": "298"
        })
    ]);

    writeVector("entropy.json", "entropy", [
        buildCase(new EntropyCalculator(), "typical", {
            "entropy-products": "120, 130", "entropy-reactants": "50, 40"
        })
    ]);

    writeVector("heat-capacity.json", "heat-capacity", [
        pureCase(heatCapacity, "solve-q", {
            "heat-cap-solve-for": "q", "heat-cap-mass": "50", "heat-cap-specific-heat": "4.184",
            "heat-cap-initial-temp": "25", "heat-cap-final-temp": "75"
        }),
        pureCase(heatCapacity, "solve-c", {
            "heat-cap-solve-for": "c", "heat-cap-mass": "50", "heat-cap-heat": "10460",
            "heat-cap-initial-temp": "25", "heat-cap-final-temp": "75"
        }),
        pureCase(heatCapacity, "solve-deltaT", {
            "heat-cap-solve-for": "deltaT", "heat-cap-mass": "50",
            "heat-cap-specific-heat": "4.184", "heat-cap-heat": "10460"
        }),
        pureCase(heatCapacity, "solve-Tfinal", {
            "heat-cap-solve-for": "Tfinal", "heat-cap-mass": "50", "heat-cap-specific-heat": "4.184",
            "heat-cap-heat": "10460", "heat-cap-initial-temp": "25"
        }),
        pureCase(heatCapacity, "invalid-solve-for", {
            "heat-cap-solve-for": "nope", "heat-cap-mass": "50"
        })
    ]);

    writeVector("bond-enthalpy.json", "bond-enthalpy", [
        buildCase(new BondEnthalpyCalculator(), "typical", {
            "bond-enthalpy-broken": "436, 243", "bond-enthalpy-formed": "744, 498"
        })
    ]);

    writeVector("bond-type.json", "bond-type", [
        bondCase("nacl", "Na", "Cl"),
        bondCase("h2", "H", "H"),
        bondCase("hcl", "H", "Cl"),
        bondCase("copper-zinc", "Cu", "Zn"),
        bondCase("oxygen-oxygen", "O", "O")
    ]);

    writeVector("equation-balance.json", "equation-balance", [
        balanceCase("combustion", "C3H8+O2->CO2+H2O"),
        balanceCase("synthesis", "H2+O2->H2O"),
        balanceCase("single-displacement", "Fe+CuSO4->FeSO4+Cu"),
        redoxCase("redox-acidic", "MnO4-+8H++5e-->Mn2++4H2O||Zn->Zn2++2e-", "acidic")
    ]);
}

collect();
process.stdout.write("conformance vectors generated\n");
