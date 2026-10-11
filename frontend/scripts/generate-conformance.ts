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
} from "../src/modules/calculators/advanced.js";
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

    writeVector("photoelectron-spectroscopy.json", "photoelectron-spectroscopy", [
        pureCase(photoelectronSpectroscopy, "nitrogen", { "pes-peaks": "39.548, 2.466, 1.402" }),
        pureCase(photoelectronSpectroscopy, "oxygen", { "pes-peaks": "52.403, 2.748, 1.314" }),
        pureCase(photoelectronSpectroscopy, "carbon", { "pes-peaks": "27.424, 1.871, 1.086" }),
        pureCase(photoelectronSpectroscopy, "neon", { "pes-peaks": "83.964, 4.676, 2.090" }),
        pureCase(photoelectronSpectroscopy, "hydrogen", { "pes-peaks": "1.312" }),
        pureCase(photoelectronSpectroscopy, "lithium", { "pes-peaks": "5.278, 0.520" }),
        pureCase(photoelectronSpectroscopy, "sodium", { "pes-peaks": "103.320, 6.106, 2.957, 0.496" }),
        pureCase(photoelectronSpectroscopy, "argon", { "pes-peaks": "309.039, 18.127, 12.824, 2.822, 1.526" }),
        pureCase(photoelectronSpectroscopy, "calcium", { "pes-peaks": "389.600, 22.700, 16.800, 3.792, 2.693, 0.605" }),
        pureCase(photoelectronSpectroscopy, "unsorted-input", { "pes-peaks": "1.402, 39.548, 2.466" }),
        pureCase(photoelectronSpectroscopy, "no-input", { "pes-peaks": "" }),
        pureCase(photoelectronSpectroscopy, "non-numeric-peak", { "pes-peaks": "39.548, abc" }),
        pureCase(photoelectronSpectroscopy, "negative-peak", { "pes-peaks": "-39.548, 2.466" }),
        pureCase(photoelectronSpectroscopy, "no-match", { "pes-peaks": "10, 5, 2" }),
        pureCase(photoelectronSpectroscopy, "too-many-peaks", { "pes-peaks": "400, 20, 15, 3, 2, 1, 0.5" })
    ]);

    writeVector("empirical-formula.json", "empirical-formula", [
        pureCase(empiricalFormula, "glucose", { "ef-composition": "C:40,H:6.71,O:53.29" }),
        pureCase(empiricalFormula, "glucose-molar-mass", {
            "ef-composition": "C:40,H:6.71,O:53.29", "ef-molar-mass": "180.156"
        }),
        pureCase(empiricalFormula, "water", { "ef-composition": "H:11.19,O:88.81" }),
        pureCase(empiricalFormula, "zinc-iodide", { "ef-composition": "Zn:20.5,I:79.5" }),
        pureCase(empiricalFormula, "iron-oxide", { "ef-composition": "Fe:69.9,O:30.1" }),
        pureCase(empiricalFormula, "hydrogen-peroxide", { "ef-composition": "H:5.93,O:94.07" }),
        pureCase(empiricalFormula, "no-input", { "ef-composition": "" }),
        pureCase(empiricalFormula, "missing-colon", { "ef-composition": "C40,H6,O53" }),
        pureCase(empiricalFormula, "unknown-element", { "ef-composition": "Xx:100" }),
        pureCase(empiricalFormula, "bad-percent", { "ef-composition": "C:forty,O:60" }),
        pureCase(empiricalFormula, "percent-sum", { "ef-composition": "C:50,H:6.7,O:10" }),
        pureCase(empiricalFormula, "negative-percent", { "ef-composition": "C:-40,H:60" }),
        pureCase(empiricalFormula, "zero-percent", { "ef-composition": "C:100,O:0" }),
        pureCase(empiricalFormula, "duplicate-element", { "ef-composition": "C:40,C:60" }),
        pureCase(empiricalFormula, "negative-molar-mass", {
            "ef-composition": "C:40,H:6.71,O:53.29", "ef-molar-mass": "-180"
        })
    ]);

    writeVector("mass-spectrometry.json", "mass-spectrometry", [
        pureCase(massSpectrometry, "chlorine", { "ms-isotopes": "34.9689,0.7576;36.9659,0.2424" }),
        pureCase(massSpectrometry, "bromine", { "ms-isotopes": "78.9183,0.5069;80.9163,0.4931" }),
        pureCase(massSpectrometry, "chlorine-percent", { "ms-isotopes": "35,75.76;37,24.24" }),
        pureCase(massSpectrometry, "single-isotope", { "ms-isotopes": "197,1" }),
        pureCase(massSpectrometry, "copper-zinc", { "ms-isotopes": "63.929,0.6917;65.926,0.3083" }),
        pureCase(massSpectrometry, "newline-separated", { "ms-isotopes": "34.9689,0.7576\n36.9659,0.2424" }),
        pureCase(massSpectrometry, "no-input", { "ms-isotopes": "" }),
        pureCase(massSpectrometry, "missing-comma", { "ms-isotopes": "34.9689;36.9659" }),
        pureCase(massSpectrometry, "non-numeric", { "ms-isotopes": "abc,0.5;37,0.5" }),
        pureCase(massSpectrometry, "negative-mass", { "ms-isotopes": "-35,0.5;37,0.5" }),
        pureCase(massSpectrometry, "negative-abundance", { "ms-isotopes": "35,-0.5;37,0.5" }),
        pureCase(massSpectrometry, "zero-total-abundance", { "ms-isotopes": "35,0;37,0" })
    ]);

    writeVector("vsepr-geometry.json", "vsepr-geometry", [
        pureCase(vseprGeometry, "water", { "vsepr-central": "O", "vsepr-bonded": "2", "vsepr-lone-pairs": "2" }),
        pureCase(vseprGeometry, "methane", { "vsepr-central": "C", "vsepr-bonded": "4", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "ammonia", { "vsepr-central": "N", "vsepr-bonded": "3", "vsepr-lone-pairs": "1" }),
        pureCase(vseprGeometry, "carbon-dioxide", { "vsepr-central": "C", "vsepr-bonded": "2", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "boron-trifluoride", { "vsepr-central": "B", "vsepr-bonded": "3", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "xenon-tetrafluoride", { "vsepr-central": "Xe", "vsepr-bonded": "4", "vsepr-lone-pairs": "2" }),
        pureCase(vseprGeometry, "phosphorus-pentachloride", { "vsepr-central": "P", "vsepr-bonded": "5", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "sulfur-hexafluoride", { "vsepr-central": "S", "vsepr-bonded": "6", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "sulfur-tetrafluoride", { "vsepr-central": "S", "vsepr-bonded": "4", "vsepr-lone-pairs": "1" }),
        pureCase(vseprGeometry, "chlorine-trifluoride", { "vsepr-central": "Cl", "vsepr-bonded": "3", "vsepr-lone-pairs": "2" }),
        pureCase(vseprGeometry, "lowercase-central", { "vsepr-central": "o", "vsepr-bonded": "2", "vsepr-lone-pairs": "2" }),
        pureCase(vseprGeometry, "missing-central", { "vsepr-central": "", "vsepr-bonded": "2", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "missing-bonded", { "vsepr-central": "O", "vsepr-bonded": "", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "fractional-bonded", { "vsepr-central": "O", "vsepr-bonded": "2.5", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "negative-bonded", { "vsepr-central": "O", "vsepr-bonded": "-1", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "negative-lone-pairs", { "vsepr-central": "O", "vsepr-bonded": "2", "vsepr-lone-pairs": "-1" }),
        pureCase(vseprGeometry, "steric-too-large", { "vsepr-central": "I", "vsepr-bonded": "7", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "unknown-element", { "vsepr-central": "Xx", "vsepr-bonded": "3", "vsepr-lone-pairs": "1" }),
        pureCase(vseprGeometry, "no-domain", { "vsepr-central": "O", "vsepr-bonded": "0", "vsepr-lone-pairs": "0" }),
        pureCase(vseprGeometry, "unsupported-axe", { "vsepr-central": "O", "vsepr-bonded": "1", "vsepr-lone-pairs": "1" })
    ]);

    writeVector("calorimetry.json", "calorimetry", [
        pureCase(calorimetry, "solve-q", {
            "calor-solve-for": "q", "calor-mass": "100", "calor-specific-heat": "4.184", "calor-delta-t": "50"
        }),
        pureCase(calorimetry, "solve-m", {
            "calor-solve-for": "m", "calor-mass": "", "calor-specific-heat": "4.184", "calor-delta-t": "50", "calor-heat": "20920"
        }),
        pureCase(calorimetry, "solve-c", {
            "calor-solve-for": "c", "calor-mass": "100", "calor-specific-heat": "", "calor-delta-t": "50", "calor-heat": "20920"
        }),
        pureCase(calorimetry, "solve-delta-t", {
            "calor-solve-for": "deltaT", "calor-mass": "100", "calor-specific-heat": "4.184", "calor-delta-t": "", "calor-heat": "20920"
        }),
        pureCase(calorimetry, "exothermic-q", {
            "calor-solve-for": "q", "calor-mass": "50", "calor-specific-heat": "4.184", "calor-delta-t": "-20"
        }),
        pureCase(calorimetry, "invalid-solve-for", {
            "calor-solve-for": "nope", "calor-mass": "100"
        }),
        pureCase(calorimetry, "missing-inputs", {
            "calor-solve-for": "q", "calor-mass": "100", "calor-specific-heat": "4.184"
        }),
        pureCase(calorimetry, "zero-specific-heat", {
            "calor-solve-for": "q", "calor-mass": "100", "calor-specific-heat": "0", "calor-delta-t": "50"
        }),
        pureCase(calorimetry, "zero-delta-t-solving-mass", {
            "calor-solve-for": "m", "calor-specific-heat": "4.184", "calor-delta-t": "0", "calor-heat": "20920"
        })
    ]);

    writeVector("gibbs-equilibrium.json", "gibbs-equilibrium", [
        pureCase(gibbsEquilibrium, "solve-k", {
            "geq-solve-for": "K", "geq-delta-g": "46.5", "geq-temperature": "298.15"
        }),
        pureCase(gibbsEquilibrium, "solve-k-default-temperature", {
            "geq-solve-for": "K", "geq-delta-g": "-100", "geq-temperature": ""
        }),
        pureCase(gibbsEquilibrium, "solve-k-zero", {
            "geq-solve-for": "K", "geq-delta-g": "0", "geq-temperature": "298.15"
        }),
        pureCase(gibbsEquilibrium, "solve-k-hot", {
            "geq-solve-for": "K", "geq-delta-g": "46.5", "geq-temperature": "500"
        }),
        pureCase(gibbsEquilibrium, "solve-delta-g", {
            "geq-solve-for": "delta-g", "geq-k": "10", "geq-temperature": "298.15"
        }),
        pureCase(gibbsEquilibrium, "solve-delta-g-tiny-k", {
            "geq-solve-for": "delta-g", "geq-k": "0.0000000001", "geq-temperature": "298.15"
        }),
        pureCase(gibbsEquilibrium, "solve-delta-g-unit-k", {
            "geq-solve-for": "delta-g", "geq-k": "1", "geq-temperature": "298.15"
        }),
        pureCase(gibbsEquilibrium, "invalid-solve-for", {
            "geq-solve-for": "nope", "geq-delta-g": "46.5"
        }),
        pureCase(gibbsEquilibrium, "missing-delta-g", {
            "geq-solve-for": "K", "geq-delta-g": ""
        }),
        pureCase(gibbsEquilibrium, "missing-k", {
            "geq-solve-for": "delta-g", "geq-k": ""
        }),
        pureCase(gibbsEquilibrium, "zero-k", {
            "geq-solve-for": "delta-g", "geq-k": "0"
        }),
        pureCase(gibbsEquilibrium, "negative-k", {
            "geq-solve-for": "delta-g", "geq-k": "-2"
        }),
        pureCase(gibbsEquilibrium, "zero-temperature", {
            "geq-solve-for": "K", "geq-delta-g": "46.5", "geq-temperature": "0"
        })
    ]);

    writeVector("molality.json", "molality", [
        pureCase(molality, "solve-molality", {
            "molality-solve-for": "molality", "molality-solute-mass": "20", "molality-solvent-mass": "500",
            "molality-molar-mass": "39.997"
        }),
        pureCase(molality, "solve-solute-mass", {
            "molality-solve-for": "solute-mass", "molality-solvent-mass": "500",
            "molality-molar-mass": "39.997", "molality-value": "1"
        }),
        pureCase(molality, "solve-solvent-mass", {
            "molality-solve-for": "solvent-mass", "molality-solute-mass": "20",
            "molality-molar-mass": "39.997", "molality-value": "1"
        }),
        pureCase(molality, "solve-molar-mass", {
            "molality-solve-for": "molar-mass", "molality-solute-mass": "20",
            "molality-solvent-mass": "500", "molality-value": "1"
        }),
        pureCase(molality, "zero-molality-solution", {
            "molality-solve-for": "molality", "molality-solute-mass": "0", "molality-solvent-mass": "500",
            "molality-molar-mass": "39.997"
        }),
        pureCase(molality, "invalid-solve-for", {
            "molality-solve-for": "nope", "molality-solute-mass": "20"
        }),
        pureCase(molality, "missing-inputs", {
            "molality-solve-for": "molality", "molality-solute-mass": "20"
        }),
        pureCase(molality, "zero-molar-mass", {
            "molality-solve-for": "molality", "molality-solute-mass": "20", "molality-solvent-mass": "500",
            "molality-molar-mass": "0"
        }),
        pureCase(molality, "negative-solute-mass", {
            "molality-solve-for": "molality", "molality-solute-mass": "-20", "molality-solvent-mass": "500",
            "molality-molar-mass": "39.997"
        }),
        pureCase(molality, "zero-molality-value", {
            "molality-solve-for": "solvent-mass", "molality-solute-mass": "20",
            "molality-molar-mass": "39.997", "molality-value": "0"
        })
    ]);

    writeVector("beer-lambert.json", "beer-lambert", [
        pureCase(beerLambert, "solve-absorbance", {
            "bl-solve-for": "absorbance", "bl-absorptivity": "6239.5", "bl-path-length": "1", "bl-concentration": "0.0001"
        }),
        pureCase(beerLambert, "solve-absorptivity", {
            "bl-solve-for": "absorptivity", "bl-absorbance": "0.699", "bl-path-length": "1", "bl-concentration": "0.0001"
        }),
        pureCase(beerLambert, "solve-path-length", {
            "bl-solve-for": "path-length", "bl-absorbance": "0.699", "bl-absorptivity": "10000", "bl-concentration": "0.0001"
        }),
        pureCase(beerLambert, "solve-concentration", {
            "bl-solve-for": "concentration", "bl-absorbance": "0.699", "bl-absorptivity": "10000", "bl-path-length": "1"
        }),
        pureCase(beerLambert, "transmittance", {
            "bl-solve-for": "transmittance", "bl-absorbance": "0.9"
        }),
        pureCase(beerLambert, "transmittance-zero", {
            "bl-solve-for": "transmittance", "bl-absorbance": "0"
        }),
        pureCase(beerLambert, "invalid-solve-for", {
            "bl-solve-for": "nope", "bl-absorbance": "0.5"
        }),
        pureCase(beerLambert, "missing-inputs", {
            "bl-solve-for": "absorbance", "bl-absorptivity": "6239.5"
        }),
        pureCase(beerLambert, "zero-concentration", {
            "bl-solve-for": "absorptivity", "bl-absorbance": "0.699", "bl-path-length": "1", "bl-concentration": "0"
        }),
        pureCase(beerLambert, "negative-absorbance", {
            "bl-solve-for": "transmittance", "bl-absorbance": "-0.5"
        })
    ]);

    writeVector("serial-dilution.json", "serial-dilution", [
        pureCase(serialDilution, "tenfold-three-steps", {
            "sd-initial-concentration": "1", "sd-dilution-factor": "10", "sd-steps": "3"
        }),
        pureCase(serialDilution, "twofold-five-steps", {
            "sd-initial-concentration": "2", "sd-dilution-factor": "2", "sd-steps": "5"
        }),
        pureCase(serialDilution, "tenfold-six-steps", {
            "sd-initial-concentration": "1", "sd-dilution-factor": "10", "sd-steps": "6"
        }),
        pureCase(serialDilution, "single-step", {
            "sd-initial-concentration": "0.5", "sd-dilution-factor": "5", "sd-steps": "1"
        }),
        pureCase(serialDilution, "invalid-factor", {
            "sd-initial-concentration": "1", "sd-dilution-factor": "1", "sd-steps": "3"
        }),
        pureCase(serialDilution, "zero-steps", {
            "sd-initial-concentration": "1", "sd-dilution-factor": "10", "sd-steps": "0"
        }),
        pureCase(serialDilution, "too-many-steps", {
            "sd-initial-concentration": "1", "sd-dilution-factor": "10", "sd-steps": "11"
        }),
        pureCase(serialDilution, "fractional-steps", {
            "sd-initial-concentration": "1", "sd-dilution-factor": "10", "sd-steps": "1.5"
        }),
        pureCase(serialDilution, "missing-initial", {
            "sd-initial-concentration": "", "sd-dilution-factor": "10", "sd-steps": "3"
        }),
        pureCase(serialDilution, "negative-initial", {
            "sd-initial-concentration": "-1", "sd-dilution-factor": "10", "sd-steps": "3"
        })
    ]);

    writeVector("le-chatelier.json", "le-chatelier", [
        pureCase(leChatelier, "exothermic-heating", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "temperature", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "endothermic-heating", {
            "lc-reaction-type": "endothermic", "lc-stress-type": "temperature", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "exothermic-cooling", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "temperature", "lc-change": "decrease", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "endothermic-cooling", {
            "lc-reaction-type": "endothermic", "lc-stress-type": "temperature", "lc-change": "decrease", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "add-reactant", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "concentration", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "add-product", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "concentration", "lc-change": "increase", "lc-side": "products"
        }),
        pureCase(leChatelier, "remove-reactant", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "concentration", "lc-change": "decrease", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "remove-product", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "concentration", "lc-change": "decrease", "lc-side": "products"
        }),
        pureCase(leChatelier, "pressure-products-fewer", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "pressure", "lc-change": "increase", "lc-side": "products"
        }),
        pureCase(leChatelier, "pressure-reactants-fewer", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "pressure", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "pressure-drop-reactants-fewer", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "pressure", "lc-change": "decrease", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "equal-gas-moles", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "pressure", "lc-change": "increase", "lc-side": "equal"
        }),
        pureCase(leChatelier, "compress-volume", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "volume", "lc-change": "decrease", "lc-side": "products"
        }),
        pureCase(leChatelier, "expand-volume", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "volume", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "catalyst", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "catalyst", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "no-change", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "concentration", "lc-change": "none", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "invalid-reaction-type", {
            "lc-reaction-type": "nope", "lc-stress-type": "temperature", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "invalid-stress-type", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "nope", "lc-change": "increase", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "invalid-change", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "temperature", "lc-change": "nope", "lc-side": "reactants"
        }),
        pureCase(leChatelier, "invalid-side", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "temperature", "lc-change": "increase", "lc-side": "nope"
        }),
        pureCase(leChatelier, "concentration-equal-side", {
            "lc-reaction-type": "exothermic", "lc-stress-type": "concentration", "lc-change": "increase", "lc-side": "equal"
        })
    ]);
}

collect();
process.stdout.write("conformance vectors generated\n");
