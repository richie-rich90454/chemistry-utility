import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { calculateDilution, calculateMassPercent, calculateMixing } from "../modules/solutionCalculators.js";
import {
    calculateIdealGasLaw,
    calculateVanDerWaals,
    calculateHalfLife,
} from "../modules/gasLawCalculators.js";
import {
    calculateNernst,
    calculateElectrolysis,
} from "../modules/electrochemistryCalculators.js";
import { balanceEquation } from "../modules/equationBalancer.js";
import { calculateMolarMass } from "../modules/formulaParser.js";
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

describe("Edge Cases: Extreme Values", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("Very large numbers in gas law", () => {
        beforeEach(() => {
            createContainer("ideal-gas-law");
            createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
            createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
            createInput("ideal-P", "", "ideal-gas-law");
            createInput("ideal-V", "1e15", "ideal-gas-law");
            createInput("ideal-n", "1e15", "ideal-gas-law");
            createInput("ideal-T", "273", "ideal-gas-law");
            createResultDiv("ideal-result", "ideal-gas-law");
        });

        it("handles very large input values without Infinity or NaN in result", () => {
            calculateIdealGasLaw();
            const result = getResultText("ideal-result");
            expect(result).not.toContain("NaN");
            expect(result).not.toContain("Infinity");
            expect(result).not.toContain("Error");
        });
    });

    describe("Very small numbers in electrochemistry", () => {
        beforeEach(() => {
            createContainer("nernst-equation");
            createInput("E-standard", "1e-15", "nernst-equation");
            createInput("temperature", "298", "nernst-equation");
            createInput("n-electrons", "2", "nernst-equation");
            createInput("Q-reaction", "1", "nernst-equation");
            createResultDiv("nernst-result", "nernst-equation");
        });

        it("handles very small E_standard value", () => {
            calculateNernst();
            const result = getResultText("nernst-result");
            expect(result).not.toContain("NaN");
            expect(result).not.toContain("Infinity");
        });
    });

    describe("Zero temperature in ideal gas law", () => {
        beforeEach(() => {
            createContainer("ideal-gas-law");
            createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
            createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
            createInput("ideal-P", "", "ideal-gas-law");
            createInput("ideal-V", "22.4", "ideal-gas-law");
            createInput("ideal-n", "1", "ideal-gas-law");
            createInput("ideal-T", "0", "ideal-gas-law");
            createResultDiv("ideal-result", "ideal-gas-law");
        });

        it("produces zero pressure when T=0", () => {
            calculateIdealGasLaw();
            const result = getResultText("ideal-result");
            expect(result).toContain("0.0000");
        });
    });

    describe("Negative concentration in dilution", () => {
        beforeEach(() => {
            createContainer("dilution-calc");
            createSelect("dilution-solve-for", "M2", ["M1", "V1", "M2", "V2"], "dilution-calc");
            createInput("dilution-M1", "-1", "dilution-calc");
            createInput("dilution-V1", "1", "dilution-calc");
            createInput("dilution-M2", "", "dilution-calc");
            createInput("dilution-V2", "2", "dilution-calc");
            createResultDiv("dilution-result", "dilution-calc");
        });

        it("shows error for negative molarity", () => {
            calculateDilution();
            const result = getResultText("dilution-result");
            expect(result).toContain("Error");
        });
    });

    describe("Division by zero in gas law", () => {
        beforeEach(() => {
            createContainer("ideal-gas-law");
            createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
            createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
            createInput("ideal-P", "", "ideal-gas-law");
            createInput("ideal-V", "0", "ideal-gas-law");
            createInput("ideal-n", "1", "ideal-gas-law");
            createInput("ideal-T", "273", "ideal-gas-law");
            createResultDiv("ideal-result", "ideal-gas-law");
        });

        it("produces Infinity when V=0", () => {
            calculateIdealGasLaw();
            const result = getResultText("ideal-result");
            // V=0 causes P = nRT/0 = Infinity, which toFixed renders as "Infinity"
            expect(result).toContain("Infinity");
        });
    });

    describe("Scientific notation input in gas law", () => {
        beforeEach(() => {
            createContainer("ideal-gas-law");
            createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
            createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
            createInput("ideal-P", "", "ideal-gas-law");
            createInput("ideal-V", "1.5e-3", "ideal-gas-law");
            createInput("ideal-n", "1", "ideal-gas-law");
            createInput("ideal-T", "273", "ideal-gas-law");
            createResultDiv("ideal-result", "ideal-gas-law");
        });

        it("parses scientific notation input correctly", () => {
            calculateIdealGasLaw();
            const result = getResultText("ideal-result");
            expect(result).not.toContain("Error");
            expect(result).not.toContain("NaN");
        });
    });

    describe("Very long formula string", () => {
        it("throws error for unknown element in long formula", () => {
            // Xx is not in the periodic table
            expect(() => calculateMolarMass("Xx", mockElements)).toThrow("Element not found");
        });

        it("handles long but valid formula", () => {
            // H repeated 100 times is valid since H exists
            const longFormula = "H".repeat(100);
            const mass = calculateMolarMass(longFormula, mockElements);
            expect(mass).toBeCloseTo(1.008 * 100, 1);
        });
    });

    describe("Empty inputs in dilution", () => {
        beforeEach(() => {
            createContainer("dilution-calc");
            createSelect("dilution-solve-for", "M2", ["M1", "V1", "M2", "V2"], "dilution-calc");
            createInput("dilution-M1", "", "dilution-calc");
            createInput("dilution-V1", "", "dilution-calc");
            createInput("dilution-M2", "", "dilution-calc");
            createInput("dilution-V2", "", "dilution-calc");
            createResultDiv("dilution-result", "dilution-calc");
        });

        it("shows error for empty inputs", () => {
            calculateDilution();
            const result = getResultText("dilution-result");
            expect(result).toContain("Error");
        });
    });

    describe("Impossible equation in balancer", () => {
        it("throws for equation with element only on one side", () => {
            expect(() => balanceEquation("H2 + O2 -> H2O + C")).toThrow();
        });

        it("throws for equation without separator", () => {
            expect(() => balanceEquation("H2 + O2")).toThrow();
        });
    });

    describe("Van der Waals with V equal to n*b", () => {
        beforeEach(() => {
            createContainer("van-der-waals");
            createInput("vdw-V", "0.0318", "van-der-waals");
            createInput("vdw-n", "1", "van-der-waals");
            createInput("vdw-T", "273", "van-der-waals");
            createInput("vdw-a", "1.36", "van-der-waals");
            createInput("vdw-b", "0.0318", "van-der-waals");
            createResultDiv("vdw-result", "van-der-waals");
        });

        it("shows error when V equals n*b", () => {
            calculateVanDerWaals();
            const result = getResultText("vdw-result");
            expect(result).toContain("Error");
            expect(result).toContain("too small");
        });
    });

    describe("Half-life with zero initial quantity", () => {
        beforeEach(() => {
            createContainer("half-life-calc");
            createSelect("half-life-solve-for", "remaining", ["remaining", "time", "half-life"], "half-life-calc");
            createInput("initial-quantity", "0", "half-life-calc");
            createInput("time-input", "10", "half-life-calc");
            createInput("half-life-input", "5", "half-life-calc");
            createInput("remaining-quantity", "", "half-life-calc");
            createResultDiv("half-life-result", "half-life-calc");
        });

        it("shows error for zero initial quantity", () => {
            calculateHalfLife();
            const result = getResultText("half-life-result");
            expect(result).toContain("Error");
        });
    });

    describe("Electrolysis with zero current", () => {
        beforeEach(() => {
            createContainer("electrolysis");
            createSelect("electrolysis-solve-for", "mass", ["mass", "current", "time"], "electrolysis");
            createInput("electrolysis-m", "", "electrolysis");
            createInput("electrolysis-I", "0", "electrolysis");
            createInput("electrolysis-t", "965", "electrolysis");
            createInput("electrolysis-z", "1", "electrolysis");
            createInput("electrolysis-M", "63.5", "electrolysis");
            createResultDiv("electrolysis-result", "electrolysis");
        });

        it("shows error for zero current", () => {
            calculateElectrolysis();
            const result = getResultText("electrolysis-result");
            expect(result).toContain("valid positive");
        });
    });

    describe("Mass percent with zero solution mass", () => {
        beforeEach(() => {
            createContainer("mass-percent-calc");
            createInput("mass-solute", "10", "mass-percent-calc");
            createInput("mass-solution", "0", "mass-percent-calc");
            createSelect("concentration-unit", "percent", ["percent", "ppm", "ppb"], "mass-percent-calc");
            createResultDiv("mass-percent-result", "mass-percent-calc");
        });

        it("shows error for zero solution mass", () => {
            calculateMassPercent();
            const result = getResultText("mass-percent-result");
            expect(result).toContain("Error");
        });
    });

    describe("Solution mixing with negative volume", () => {
        beforeEach(() => {
            createContainer("solution-mixing-calc");
            createInput("mix-C1", "1", "solution-mixing-calc");
            createInput("mix-V1", "-1", "solution-mixing-calc");
            createInput("mix-C2", "2", "solution-mixing-calc");
            createInput("mix-V2", "1", "solution-mixing-calc");
            createResultDiv("mixing-result", "solution-mixing-calc");
        });

        it("shows error for negative volume", () => {
            calculateMixing();
            const result = getResultText("mixing-result");
            expect(result).toContain("Error");
        });
    });
});
