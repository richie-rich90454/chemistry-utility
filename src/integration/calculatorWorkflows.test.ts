import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateDilution, calculateMassPercent, calculateMixing } from "../modules/solutionCalculators.js";
import {
    calculateIdealGasLaw,
    calculateCombinedGasLaw,
    calculateVanDerWaals,
    calculateHalfLife,
} from "../modules/gasLawCalculators.js";
import {
    calculateCellPotential,
    calculateNernst,
    calculateElectrolysis,
} from "../modules/electrochemistryCalculators.js";
import { predictBondType } from "../modules/bondPredictor.js";
import { calculateStoichiometry, getCalculationType } from "../modules/stoichiometryCalculator.js";
import { mockElements } from "../test/elementsData.js";

function createContainer(id: string): HTMLDivElement {
    const div = document.createElement("div");
    div.id = id;
    document.body.appendChild(div);
    return div;
}

function createInput(id: string, value: string, parentId: string, type = "number"): HTMLInputElement {
    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.value = value;
    input.step = "any";
    document.getElementById(parentId)!.appendChild(input);
    return input;
}

function createSelect(id: string, value: string, optionValues: string[], parentId: string): HTMLSelectElement {
    const select = document.createElement("select");
    select.id = id;
    for (const v of optionValues) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        select.appendChild(o);
    }
    select.value = value;
    document.getElementById(parentId)!.appendChild(select);
    return select;
}

function createResultDiv(id: string, parentId: string): HTMLDivElement {
    const div = document.createElement("div");
    div.id = id;
    document.getElementById(parentId)!.appendChild(div);
    return div;
}

function getResultText(id: string): string {
    const el = document.getElementById(id);
    return el?.textContent?.trim() || "";
}

describe("Integration: Calculator Workflows", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("Dilution workflow", () => {
        beforeEach(() => {
            createContainer("dilution-calc");
            createSelect("dilution-solve-for", "M2", ["M1", "V1", "M2", "V2"], "dilution-calc");
            createInput("dilution-M1", "2", "dilution-calc");
            createInput("dilution-V1", "1", "dilution-calc");
            createInput("dilution-M2", "", "dilution-calc");
            createInput("dilution-V2", "2", "dilution-calc");
            createResultDiv("dilution-result", "dilution-calc");
        });

        it("solves for M2 with M1=2, V1=1, V2=2", () => {
            calculateDilution();
            const result = getResultText("dilution-result");
            expect(result).toContain("1.0000");
            expect(result).toContain("M");
        });

        it("solves for V2 with M1=2, V1=1, M2=1", () => {
            (document.getElementById("dilution-solve-for") as HTMLSelectElement).value = "V2";
            (document.getElementById("dilution-M2") as HTMLInputElement).value = "1";
            calculateDilution();
            const result = getResultText("dilution-result");
            expect(result).toContain("2.0000");
            expect(result).toContain("L");
        });
    });

    describe("Ideal gas law workflow", () => {
        beforeEach(() => {
            createContainer("ideal-gas-law");
            createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
            createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
            createInput("ideal-P", "", "ideal-gas-law");
            createInput("ideal-V", "22.4", "ideal-gas-law");
            createInput("ideal-n", "1", "ideal-gas-law");
            createInput("ideal-T", "273", "ideal-gas-law");
            createResultDiv("ideal-result", "ideal-gas-law");
        });

        it("solves for P with V=22.4, n=1, T=273 using atm-L units", () => {
            calculateIdealGasLaw();
            const result = getResultText("ideal-result");
            // P = nRT/V = 1 * 0.08206 * 273 / 22.4 = 1.0001
            expect(result).toContain("1.0001");
            expect(result).toContain("atm");
        });

        it("solves for V with P=1, n=1, T=273", () => {
            (document.getElementById("ideal-solve-for") as HTMLSelectElement).value = "V";
            (document.getElementById("ideal-P") as HTMLInputElement).value = "1";
            (document.getElementById("ideal-n") as HTMLInputElement).value = "1";
            (document.getElementById("ideal-T") as HTMLInputElement).value = "273";
            calculateIdealGasLaw();
            const result = getResultText("ideal-result");
            expect(result).toContain("22.");
            expect(result).toContain("L");
        });
    });

    describe("Combined gas law workflow", () => {
        beforeEach(() => {
            createContainer("combined-gas-law");
            createSelect("combined-solve-for", "P2", ["P1", "V1", "T1", "P2", "V2", "T2"], "combined-gas-law");
            createInput("combined-P1", "1", "combined-gas-law");
            createInput("combined-V1", "2", "combined-gas-law");
            createInput("combined-T1", "300", "combined-gas-law");
            createInput("combined-P2", "", "combined-gas-law");
            createInput("combined-V2", "1", "combined-gas-law");
            createInput("combined-T2", "300", "combined-gas-law");
            createResultDiv("combined-result", "combined-gas-law");
        });

        it("solves for P2 with P1=1, V1=2, T1=300, V2=1, T2=300", () => {
            calculateCombinedGasLaw();
            const result = getResultText("combined-result");
            expect(result).toContain("2.0000");
        });
    });

    describe("Van der Waals workflow", () => {
        beforeEach(() => {
            createContainer("van-der-waals");
            createInput("vdw-V", "22.4", "van-der-waals");
            createInput("vdw-n", "1", "van-der-waals");
            createInput("vdw-T", "273", "van-der-waals");
            createInput("vdw-a", "1.36", "van-der-waals");
            createInput("vdw-b", "0.0318", "van-der-waals");
            createResultDiv("vdw-result", "van-der-waals");
        });

        it("calculates real gas pressure with V=22.4, n=1, T=273", () => {
            calculateVanDerWaals();
            const result = getResultText("vdw-result");
            expect(result).toContain("atm");
            expect(result).not.toContain("Error");
        });
    });

    describe("Half-life workflow", () => {
        beforeEach(() => {
            createContainer("half-life-calc");
            createSelect("half-life-solve-for", "remaining", ["remaining", "time", "half-life"], "half-life-calc");
            createInput("initial-quantity", "100", "half-life-calc");
            createInput("time-input", "10", "half-life-calc");
            createInput("half-life-input", "5", "half-life-calc");
            createInput("remaining-quantity", "", "half-life-calc");
            createResultDiv("half-life-result", "half-life-calc");
        });

        it("calculates remaining quantity with N0=100, t=10, t_half=5", () => {
            calculateHalfLife();
            const result = getResultText("half-life-result");
            expect(result).toContain("25.0000");
        });
    });

    describe("Cell potential workflow", () => {
        beforeEach(() => {
            createContainer("cell-potential");
            createInput("E1", "0.34", "cell-potential");
            createInput("E2", "-0.76", "cell-potential");
            createResultDiv("cell-potential-result", "cell-potential");
        });

        it("calculates E_cell with E1=0.34, E2=-0.76", () => {
            calculateCellPotential();
            const result = getResultText("cell-potential-result");
            expect(result).toContain("1.100");
            expect(result).toContain("V");
        });
    });

    describe("Nernst equation workflow", () => {
        beforeEach(() => {
            createContainer("nernst-equation");
            createInput("E-standard", "1.1", "nernst-equation");
            createInput("temperature", "298", "nernst-equation");
            createInput("n-electrons", "2", "nernst-equation");
            createInput("Q-reaction", "1", "nernst-equation");
            createResultDiv("nernst-result", "nernst-equation");
        });

        it("calculates E with E0=1.1, T=298, n=2, Q=1", () => {
            calculateNernst();
            const result = getResultText("nernst-result");
            expect(result).toContain("1.100");
            expect(result).toContain("V");
        });
    });

    describe("Electrolysis workflow", () => {
        beforeEach(() => {
            createContainer("electrolysis");
            createSelect("electrolysis-solve-for", "mass", ["mass", "current", "time"], "electrolysis");
            createInput("electrolysis-m", "", "electrolysis");
            createInput("electrolysis-I", "1", "electrolysis");
            createInput("electrolysis-t", "965", "electrolysis");
            createInput("electrolysis-z", "1", "electrolysis");
            createInput("electrolysis-M", "63.5", "electrolysis");
            createResultDiv("electrolysis-result", "electrolysis");
        });

        it("calculates mass with I=1, t=965, z=1, M=63.5", () => {
            calculateElectrolysis();
            const result = getResultText("electrolysis-result");
            expect(result).toContain("g");
            expect(result).not.toContain("Error");
        });
    });

    describe("Mass percent workflow", () => {
        beforeEach(() => {
            createContainer("mass-percent-calc");
            createInput("mass-solute", "10", "mass-percent-calc");
            createInput("mass-solution", "100", "mass-percent-calc");
            createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
            createResultDiv("mass-percent-result", "mass-percent-calc");
        });

        it("calculates mass percent with solute=10, solution=100", () => {
            calculateMassPercent();
            const result = getResultText("mass-percent-result");
            expect(result).toContain("10.0000");
            expect(result).toContain("%");
        });
    });

    describe("Solution mixing workflow", () => {
        beforeEach(() => {
            createContainer("solution-mixing-calc");
            createInput("mix-C1", "1", "solution-mixing-calc");
            createInput("mix-V1", "1", "solution-mixing-calc");
            createInput("mix-C2", "2", "solution-mixing-calc");
            createInput("mix-V2", "1", "solution-mixing-calc");
            createResultDiv("mixing-result", "solution-mixing-calc");
        });

        it("calculates final concentration with C1=1, V1=1, C2=2, V2=1", () => {
            calculateMixing();
            const result = getResultText("mixing-result");
            expect(result).toContain("1.5000");
            expect(result).toContain("M");
        });
    });

    describe("Bond predictor workflow", () => {
        beforeEach(() => {
            createContainer("bond-type-predictor");
            // Bond predictor uses text inputs, not number inputs
            createInput("element1-input", "Na", "bond-type-predictor", "text");
            createInput("element2-input", "Cl", "bond-type-predictor", "text");
            createResultDiv("bond-type-result", "bond-type-predictor");
        });

        it("predicts ionic bond for Na and Cl", () => {
            predictBondType(mockElements);
            const result = getResultText("bond-type-result");
            expect(result).toContain("Ionic");
        });
    });

    describe("Stoichiometry workflow", () => {
        beforeEach(() => {
            createContainer("stoichiometry");
            createSelect("calculation-type", "product-from-reactant", ["product-from-reactant", "reactant-from-product", "limiting-reactant"], "stoichiometry");
            createResultDiv("stoich-inputs", "stoichiometry");
            createResultDiv("stoich-result", "stoichiometry");
        });

        it("calculates product moles from reactant with 2H2+O2->2H2O", () => {
            getCalculationType("2H2+O2->2H2O");

            const reactantSelect = document.getElementById("reactant-select") as HTMLSelectElement;
            expect(reactantSelect).toBeTruthy();

            const molesInput = document.getElementById("reactant-moles") as HTMLInputElement;
            molesInput.value = "2";

            const productSelect = document.getElementById("product-select") as HTMLSelectElement;
            productSelect.value = "H2O";

            calculateStoichiometry("2H2+O2->2H2O");
            const result = getResultText("stoich-result");
            expect(result).toContain("2.00");
        });
    });
});
