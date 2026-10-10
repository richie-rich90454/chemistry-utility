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
        "expect": bondType(symbol1, symbol2, elementsToDataset())
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
        buildCase(new QuantumNumbersValidator(), "3d-electron", {
            "quantum-n": "3", "quantum-l": "2", "quantum-m": "1", "quantum-s": "-1/2"
        }),
        buildCase(new QuantumNumbersValidator(), "invalid-m", {
            "quantum-n": "2", "quantum-l": "0", "quantum-m": "1", "quantum-s": "1/2"
        })
    ]);

    writeVector("electron-configuration.json", "electron-configuration", [
        buildCase(new ElectronConfigurationGenerator(), "iron", { "electron-config-input": "26" }),
        buildCase(new ElectronConfigurationGenerator(), "uranium", { "electron-config-input": "92" })
    ]);

    writeVector("rydberg.json", "rydberg", [
        buildCase(new RydbergCalculator(), "visible-line", {
            "rydberg-n1": "2", "rydberg-n2": "3"
        })
    ]);

    writeVector("debroglie.json", "debroglie-wavelength", [
        buildCase(new DeBroglieWavelengthCalculator(), "electron", {
            "db-mass": "9.109e-31", "db-velocity": "2e6", "db-mass-unit": "kg"
        })
    ]);

    writeVector("photoelectric.json", "photoelectric-effect", [
        buildCase(new PhotoelectricEffectCalculator(), "typical", {
            "photo-work-function": "4.5", "photo-frequency": "1e15"
        })
    ]);

    writeVector("heisenberg.json", "heisenberg-uncertainty", [
        buildCase(new HeisenbergUncertaintyCalculator(), "typical", {
            "heisenberg-dx": "1e-10"
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
        buildCase(new ElectrolysisCalculator(), "solve-m", {
            "electrolysis-m": "", "electrolysis-I": "2", "electrolysis-t": "1800",
            "electrolysis-z": "2", "electrolysis-M": "63.5", "electrolysis-solve-for": "m"
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
        buildCase(new HeatCapacityCalculator(), "typical", {
            "hc-q": "1000", "hc-m": "50", "hc-deltaT": "10", "hc-c": ""
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
