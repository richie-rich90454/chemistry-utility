import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    parseBalancedEquation,
    parseTerm,
    calculateStoichiometry,
} from "./stoichiometryCalculator";

function setOrCreateInput(id: string, value: string, parentId: string) {
    let input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) {
        input = document.createElement("input");
        input.id = id;
        document.getElementById(parentId)!.appendChild(input);
    }
    input.value = value;
    input.classList.remove("error");
}

function setOrCreateSelect(id: string, value: string, parentId: string, optionValues?: string[]) {
    let select = document.getElementById(id) as HTMLSelectElement | null;
    if (!select) {
        select = document.createElement("select");
        select.id = id;
        const opts = optionValues || [value];
        for (const v of opts) {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = v;
            select.appendChild(o);
        }
        document.getElementById(parentId)!.appendChild(select);
    }
    select.value = value;
}

function getResultHTML(id: string): string {
    const el = document.getElementById(id);
    return el ? el.innerHTML : "";
}

describe("stoichiometryCalculator", () => {
    describe("parseBalancedEquation", () => {
        it("should parse '2H2 + O2 -> 2H2O' correctly", () => {
            const result = parseBalancedEquation("2H2 + O2 -> 2H2O");
            expect(result.reactants).toEqual([
                { formula: "H2", coefficient: 2 },
                { formula: "O2", coefficient: 1 },
            ]);
            expect(result.products).toEqual([
                { formula: "H2O", coefficient: 2 },
            ]);
        });

        it("should parse equation with = separator", () => {
            const result = parseBalancedEquation("2H2 + O2 = 2H2O");
            expect(result.reactants).toEqual([
                { formula: "H2", coefficient: 2 },
                { formula: "O2", coefficient: 1 },
            ]);
            expect(result.products).toEqual([
                { formula: "H2O", coefficient: 2 },
            ]);
        });

        it("should parse single reactant equation '2H2O -> 2H2 + O2'", () => {
            const result = parseBalancedEquation("2H2O -> 2H2 + O2");
            expect(result.reactants).toEqual([
                { formula: "H2O", coefficient: 2 },
            ]);
            expect(result.products).toEqual([
                { formula: "H2", coefficient: 2 },
                { formula: "O2", coefficient: 1 },
            ]);
        });

        it("should throw for invalid equation format (missing separator)", () => {
            expect(() => parseBalancedEquation("H2 O2")).toThrow();
        });
    });

    describe("parseTerm", () => {
        it("should parse term with coefficient", () => {
            expect(parseTerm("2H2")).toEqual({ formula: "H2", coefficient: 2 });
        });

        it("should default coefficient to 1 when omitted", () => {
            expect(parseTerm("O2")).toEqual({ formula: "O2", coefficient: 1 });
        });
    });

    describe("calculateStoichiometry", () => {
        const equation = "2H2 + O2 -> 2H2O";

        beforeEach(() => {
            // The source code references these IDs directly via document.getElementById
            const inputsDiv = document.createElement("div");
            inputsDiv.id = "stoich-inputs";
            document.body.appendChild(inputsDiv);

            const resultDiv = document.createElement("div");
            resultDiv.id = "stoich-result";
            document.body.appendChild(resultDiv);
        });

        afterEach(() => {
            ["stoich-inputs", "stoich-result"].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
        });

        it("should calculate product from reactant: 2 moles H2 → 2 moles H2O", () => {
            setOrCreateSelect("calculation-type", "product-from-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            setOrCreateInput("reactant-moles", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            calculateStoichiometry(equation);
            const html = getResultHTML("stoich-result");
            // molesProduct = (2/2)*2 = 2.00
            expect(html).toContain("2.00");
            expect(html).toContain("H2O");
        });

        it("should calculate reactant from product: 4 moles H2O → 4 moles H2", () => {
            setOrCreateSelect("calculation-type", "reactant-from-product", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            setOrCreateInput("product-moles", "4", "stoich-inputs");
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            calculateStoichiometry(equation);
            const html = getResultHTML("stoich-result");
            // molesReactant = (4/2)*2 = 4.00
            expect(html).toContain("4.00");
            expect(html).toContain("H2");
        });

        it("should identify limiting reactant", () => {
            setOrCreateSelect("calculation-type", "limiting-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            // For 2H2 + O2 -> 2H2O, if we have 2 mol H2 and 2 mol O2:
            // H2 ratio: 2/2 = 1, O2 ratio: 2/1 = 2 → H2 is limiting
            // Product moles = 1 * 2 = 2.00
            setOrCreateInput("moles-H2", "2", "stoich-inputs");
            setOrCreateInput("moles-O2", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            calculateStoichiometry(equation);
            const html = getResultHTML("stoich-result");
            expect(html).toContain("Limiting reactant: H2");
            expect(html).toContain("2.00");
        });

        it("should throw for invalid moles input (product-from-reactant)", () => {
            setOrCreateSelect("calculation-type", "product-from-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            setOrCreateInput("reactant-moles", "0", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            expect(() => calculateStoichiometry(equation)).toThrow("Invalid moles input");
        });

        it("should throw for invalid moles input (reactant-from-product)", () => {
            setOrCreateSelect("calculation-type", "reactant-from-product", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            setOrCreateInput("product-moles", "-1", "stoich-inputs");
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            expect(() => calculateStoichiometry(equation)).toThrow("Invalid moles input");
        });

        it("should throw for invalid moles in limiting reactant", () => {
            setOrCreateSelect("calculation-type", "limiting-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateInput("moles-H2", "0", "stoich-inputs");
            setOrCreateInput("moles-O2", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            expect(() => calculateStoichiometry(equation)).toThrow("Invalid moles for H2");
        });

        it("should throw for invalid equation format", () => {
            setOrCreateSelect("calculation-type", "product-from-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2"]);
            setOrCreateInput("reactant-moles", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            expect(() => calculateStoichiometry("invalid equation")).toThrow();
        });
    });
});
