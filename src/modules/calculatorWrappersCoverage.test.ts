// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";

vi.mock("./calculators/bondType.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/bondType.js")>("./calculators/bondType.js");
    return {
        ...actual,
        bondType: function (): unknown {
            return { value: "mocked-bond" };
        }
    };
});

vi.mock("./calculators/electrochemistry.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/electrochemistry.js")>("./calculators/electrochemistry.js");
    return {
        ...actual,
        cellPotential: function (): unknown {
            return { value: "mocked-cell", metadata: { E_cathode: 1, E_anode: 0, E_cell: 1 } };
        }
    };
});

vi.mock("./calculators/gasLaws.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/gasLaws.js")>("./calculators/gasLaws.js");
    return {
        ...actual,
        solveIdealGas: function (): never {
            throw "string-solve-failure";
        }
    };
});

vi.mock("./calculators/kinetics.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/kinetics.js")>("./calculators/kinetics.js");
    return {
        ...actual,
        arrhenius: function (): unknown {
            return { value: "mocked-arrhenius", metadata: { formula: "f", result: 1, unit: "u" } };
        },
        integratedRateLaw: function (): unknown {
            return { value: "mocked-irl", explanation: "ok", chartData: "not-an-array", metadata: { formula: "f", result: 1, unit: "u" } };
        }
    };
});

vi.mock("./calculators/quantum.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/quantum.js")>("./calculators/quantum.js");
    return {
        ...actual,
        quantumNumbers: function (): unknown {
            return {
                value: "mocked-qn",
                metadata: {
                    n: 1, l: 0, ml: 0, ms: 0.5, shell: "K", subshell: "s",
                    orbitalDesignation: "1s", maxElectrons: 2, valid: true, errors: []
                }
            };
        }
    };
});

vi.mock("./calculators/solution.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/solution.js")>("./calculators/solution.js");
    return {
        ...actual,
        massPercent: function (): unknown {
            return { value: "mocked-mass" };
        },
        titrationCurve: function (): unknown {
            return { value: "mocked-titration", explanation: "ok", chartData: "not-an-array", metadata: { equivalenceVolume: 1 } };
        }
    };
});

vi.mock("./calculators/thermodynamics.js", async function () {
    const actual = await vi.importActual<typeof import("./calculators/thermodynamics.js")>("./calculators/thermodynamics.js");
    return {
        ...actual,
        gibbsFreeEnergy: function (): unknown {
            return { value: "mocked-gibbs" };
        }
    };
});

import { predictBondType, BondTypePredictor } from "./bondPredictor.js";
import {
    calculateCellPotential,
    CellPotentialCalculator,
    NernstCalculator,
    ElectrolysisCalculator
} from "./electrochemistryCalculators.js";
import {
    calculateIdealGasLaw,
    IdealGasLawCalculator,
    CombinedGasLawCalculator,
    VanDerWaalsCalculator,
    HalfLifeCalculator
} from "./gasLawCalculators.js";
import {
    calculateArrhenius,
    calculateIntegratedRateLaw,
    ArrheniusCalculator,
    RateLawCalculator,
    IntegratedRateLawCalculator,
    ReactionOrderCalculator,
    CollisionTheoryCalculator
} from "./kineticsCalculators.js";
import {
    calculateQuantumNumbers,
    QuantumNumbersValidator,
    ElectronConfigurationGenerator,
    RydbergCalculator,
    DeBroglieWavelengthCalculator,
    PhotoelectricEffectCalculator,
    HeisenbergUncertaintyCalculator
} from "./quantumCalculators.js";
import {
    calculateMassPercent,
    calculateTitrationCurve,
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
} from "./solutionCalculators.js";
import {
    calculateGibbsFreeEnergy,
    calculateHessLaw,
    GibbsFreeEnergyCalculator,
    HessLawCalculator,
    EntropyCalculator,
    HeatCapacityCalculator,
    BondEnthalpyCalculator,
    BornHaberCycleCalculator
} from "./thermodynamicsCalculators.js";
import { StoichiometryCalculator } from "./stoichiometryCalculator.js";

function addInput(id: string, value = ""): HTMLInputElement {
    const el = document.createElement("input");
    el.id = id;
    el.value = value;
    document.body.appendChild(el);
    return el;
}

function addSelect(id: string, value = "0"): HTMLSelectElement {
    const el = document.createElement("select");
    el.id = id;
    for (const option of ["0", "1", "2"]) {
        const o = document.createElement("option");
        o.value = option;
        el.appendChild(o);
    }
    el.value = value;
    document.body.appendChild(el);
    return el;
}

function addResult(id: string): HTMLDivElement {
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    return el;
}

describe("calculatorWrappers: id getters", function () {
    it("reports every wrapper calculator id", function (): void {
        expect(new BondTypePredictor().id).toBe("bond-type");
        expect(new StoichiometryCalculator().id).toBe("stoichiometry");
        expect(new CellPotentialCalculator().id).toBe("cell-potential");
        expect(new NernstCalculator().id).toBe("nernst");
        expect(new ElectrolysisCalculator().id).toBe("electrolysis");
        expect(new IdealGasLawCalculator().id).toBe("ideal-gas");
        expect(new CombinedGasLawCalculator().id).toBe("combined-gas");
        expect(new VanDerWaalsCalculator().id).toBe("van-der-waals");
        expect(new HalfLifeCalculator().id).toBe("half-life");
        expect(new ArrheniusCalculator().id).toBe("arrhenius");
        expect(new RateLawCalculator().id).toBe("rate-law");
        expect(new IntegratedRateLawCalculator().id).toBe("integrated-rate-law");
        expect(new ReactionOrderCalculator().id).toBe("reaction-order");
        expect(new CollisionTheoryCalculator().id).toBe("collision-theory");
        expect(new QuantumNumbersValidator().id).toBe("quantum-numbers");
        expect(new ElectronConfigurationGenerator().id).toBe("electron-config");
        expect(new RydbergCalculator().id).toBe("rydberg");
        expect(new DeBroglieWavelengthCalculator().id).toBe("debroglie");
        expect(new PhotoelectricEffectCalculator().id).toBe("photoelectric");
        expect(new HeisenbergUncertaintyCalculator().id).toBe("heisenberg");
        expect(new DilutionCalculator().id).toBe("dilution");
        expect(new MassPercentCalculator().id).toBe("mass-percent");
        expect(new MixingCalculator().id).toBe("mixing");
        expect(new BufferSolutionCalculator().id).toBe("buffer");
        expect(new PKaPKbCalculator().id).toBe("pka-pkb");
        expect(new KspCalculator().id).toBe("ksp");
        expect(new ColligativePropertiesCalculator().id).toBe("colligative");
        expect(new TitrationCurveCalculator().id).toBe("titration");
        expect(new DebyeHuckelCalculator().id).toBe("debye-huckel");
        expect(new CommonIonEffectCalculator().id).toBe("common-ion");
        expect(new GibbsFreeEnergyCalculator().id).toBe("gibbs");
        expect(new HessLawCalculator().id).toBe("hess");
        expect(new EntropyCalculator().id).toBe("entropy");
        expect(new HeatCapacityCalculator().id).toBe("heat-capacity");
        expect(new BondEnthalpyCalculator().id).toBe("bond-enthalpy");
        expect(new BornHaberCycleCalculator().id).toBe("born-haber");
    });
});

describe("calculatorWrappers: defensive DOM branches", function () {
    beforeEach(function (): void {
        document.body.innerHTML = "";
    });

    it("bondPredictor reports an error when the input elements are missing", function (): void {
        addResult("bond-type-result");
        predictBondType();
        expect(document.getElementById("bond-type-result")!.innerHTML).toContain("Error");
    });

    it("bondPredictor renders a result whose calculator omits the explanation", function (): void {
        addInput("element1-input", "Na");
        addInput("element2-input", "Cl");
        addResult("bond-type-result");
        predictBondType();
        expect(document.getElementById("bond-type-result")!.innerHTML).toContain("mocked-bond");
    });

    it("electrochemistry renders a result whose calculator omits the explanation", function (): void {
        addInput("E1", "1");
        addInput("E2", "0");
        addResult("cell-potential-result");
        calculateCellPotential();
        expect(document.getElementById("cell-potential-result")!.innerHTML).toContain("1.000");
    });

    it("gasLaw maps a non-Error throw through String()", function (): void {
        addResult("ideal-result");
        calculateIdealGasLaw();
        expect(document.getElementById("ideal-result")!.innerHTML).toContain("string-solve-failure");
    });

    it("kinetics renders a formula when the calculator omits the explanation", function (): void {
        addInput("arrhenius-A", "1e10");
        addInput("arrhenius-Ea", "50");
        addInput("arrhenius-T", "298");
        addInput("arrhenius-k", "");
        addInput("arrhenius-solve-for", "k");
        addResult("arrhenius-result");
        calculateArrhenius();
        expect(document.getElementById("arrhenius-result")!.innerHTML).toContain("Result: 1.0000 u");
    });

    it("kinetics skips the chart when chartData is not an array", function (): void {
        addSelect("irl-order", "1");
        addInput("irl-solve-for", "concentration");
        addInput("irl-A0", "1");
        addInput("irl-k", "0.1");
        addInput("irl-t", "10");
        addInput("irl-A", "");
        addResult("integrated-rate-law-result");
        calculateIntegratedRateLaw();
        expect(document.getElementById("integrated-rate-law-result")!.innerHTML).toContain("Result: 1.0000 u");
    });

    it("quantum renders a result whose calculator omits the explanation", function (): void {
        addInput("qn-n", "3");
        addInput("qn-l", "2");
        addInput("qn-ml", "0");
        addInput("qn-ms", "0.5");
        addResult("quantum-numbers-result");
        calculateQuantumNumbers();
        expect(document.getElementById("quantum-numbers-result")!.innerHTML).toContain("Orbital designation");
    });

    it("solution renders a result whose calculator omits the explanation", function (): void {
        addResult("mass-percent-result");
        calculateMassPercent();
        expect(document.getElementById("mass-percent-result")!.innerHTML).toContain("mocked-mass");
    });

    it("solution skips the chart when chartData is not an array", function (): void {
        addResult("titration-result");
        calculateTitrationCurve();
        expect(document.getElementById("titration-result")!.innerHTML).toContain("ok");
    });

    it("thermodynamics reads missing inputs as empty and renders a value without explanation", function (): void {
        addResult("gibbs-result");
        calculateGibbsFreeEnergy();
        expect(document.getElementById("gibbs-result")!.innerHTML).toContain("mocked-gibbs");
    });

    it("thermodynamics skips rendering when the result element is absent", function (): void {
        calculateHessLaw();
        expect(document.getElementById("hess-result")).toBeNull();
    });
});
