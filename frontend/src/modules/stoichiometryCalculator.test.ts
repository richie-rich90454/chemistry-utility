import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    parseBalancedEquation,
    parseTerm,
    calculateStoichiometry,
    getCalculationType,
    Term,
    BalancedEquation,
    StoichiometryCalculator,
} from "./stoichiometryCalculator.js";
import { setOrCreateInput, setOrCreateSelect, getResultHTML } from "../test/helpers.js";

class TestableStoichiometryCalculator extends StoichiometryCalculator {
    constructor() {
        super();
    }
    public callPerformCalculation(): void {
        this.performCalculation();
    }
    public setTestEquation(equation: string): void {
        this.setEquation(equation);
    }
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

        it("should throw for invalid calculation type", () => {
            setOrCreateSelect("calculation-type", "invalid", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant", "invalid",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            setOrCreateInput("reactant-moles", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            expect(() => calculateStoichiometry(equation)).toThrow("Invalid calculation type");
        });
    });

    describe("Term class", () => {
        it("constructs with explicit coefficient", () => {
            const t = new Term("H2O", 2);
            expect(t.getFormula()).toBe("H2O");
            expect(t.getCoefficient()).toBe(2);
        });

        it("defaults coefficient to 1 when not provided", () => {
            const t = new Term("O2");
            expect(t.getCoefficient()).toBe(1);
        });

        it("parses a term with coefficient via static parse", () => {
            const t = Term.parse("3H2");
            expect(t.getFormula()).toBe("H2");
            expect(t.getCoefficient()).toBe(3);
        });

        it("parses a term without coefficient via static parse", () => {
            const t = Term.parse("H2");
            expect(t.getFormula()).toBe("H2");
            expect(t.getCoefficient()).toBe(1);
        });
    });

    describe("BalancedEquation class", () => {
        it("exposes reactants and products via getters", () => {
            const parsed = BalancedEquation.parse("2H2 + O2 -> 2H2O");
            expect(parsed.getReactants().length).toBe(2);
            expect(parsed.getProducts().length).toBe(1);
            expect(parsed.getReactants()[0].getFormula()).toBe("H2");
            expect(parsed.getReactants()[0].getCoefficient()).toBe(2);
        });

        it("throws when equation has no separator", () => {
            expect(() => BalancedEquation.parse("H2 O2")).toThrow("Invalid equation format");
        });

        it("throws when equation has multiple separators", () => {
            expect(() => BalancedEquation.parse("H2 -> O2 -> H2O")).toThrow();
        });
    });

    describe("StoichiometryCalculator class - getCalculationType", () => {
        const equation = "2H2 + O2 -> 2H2O";

        beforeEach(() => {
            const inputsDiv = document.createElement("div");
            inputsDiv.id = "stoich-inputs";
            document.body.appendChild(inputsDiv);

            const resultDiv = document.createElement("div");
            resultDiv.id = "stoich-result";
            document.body.appendChild(resultDiv);

            // calculation-type must live OUTSIDE stoich-inputs because the
            // class method clears stoich-inputs.innerHTML before reading it.
            const typeSelect = document.createElement("select");
            typeSelect.id = "calculation-type";
            typeSelect.innerHTML = "<option value=\"product-from-reactant\"></option>" +
                "<option value=\"reactant-from-product\"></option>" +
                "<option value=\"limiting-reactant\"></option>";
            document.body.appendChild(typeSelect);
        });

        afterEach(() => {
            document.body.innerHTML = "";
        });

        it("renders product-from-reactant inputs via exported getCalculationType", () => {
            const typeSelect = document.getElementById("calculation-type") as HTMLSelectElement;
            typeSelect.value = "product-from-reactant";
            getCalculationType(equation);
            const inputs = document.getElementById("stoich-inputs") as HTMLElement;
            expect(inputs.innerHTML).toContain("reactant-select");
            expect(inputs.innerHTML).toContain("reactant-moles");
            expect(inputs.innerHTML).toContain("product-select");
            expect(inputs.classList.contains("show")).toBe(true);
        });

        it("renders reactant-from-product inputs via exported getCalculationType", () => {
            const typeSelect = document.getElementById("calculation-type") as HTMLSelectElement;
            typeSelect.value = "reactant-from-product";
            getCalculationType(equation);
            const inputs = document.getElementById("stoich-inputs") as HTMLElement;
            expect(inputs.innerHTML).toContain("product-select");
            expect(inputs.innerHTML).toContain("product-moles");
            expect(inputs.innerHTML).toContain("reactant-select");
            expect(inputs.classList.contains("show")).toBe(true);
        });

        it("renders limiting-reactant inputs via exported getCalculationType", () => {
            const typeSelect = document.getElementById("calculation-type") as HTMLSelectElement;
            typeSelect.value = "limiting-reactant";
            getCalculationType(equation);
            const inputs = document.getElementById("stoich-inputs") as HTMLElement;
            expect(inputs.innerHTML).toContain("moles-H2");
            expect(inputs.innerHTML).toContain("moles-O2");
            expect(inputs.innerHTML).toContain("product-select");
            expect(inputs.classList.contains("show")).toBe(true);
        });

        it("clears existing inputs before rendering new ones", () => {
            const typeSelect = document.getElementById("calculation-type") as HTMLSelectElement;
            typeSelect.value = "product-from-reactant";
            const inputsDiv = document.getElementById("stoich-inputs") as HTMLElement;
            inputsDiv.innerHTML = "<p>stale content</p>";
            getCalculationType(equation);
            expect(inputsDiv.innerHTML).not.toContain("stale content");
        });
    });

    describe("StoichiometryCalculator class - performCalculation", () => {
        const equation = "2H2 + O2 -> 2H2O";

        beforeEach(() => {
            const inputsDiv = document.createElement("div");
            inputsDiv.id = "stoich-inputs";
            document.body.appendChild(inputsDiv);

            const resultDiv = document.createElement("div");
            resultDiv.id = "stoich-result";
            document.body.appendChild(resultDiv);
        });

        afterEach(() => {
            document.body.innerHTML = "";
        });

        it("computes product from reactant via class performCalculation", () => {
            setOrCreateSelect("calculation-type", "product-from-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            setOrCreateInput("reactant-moles", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            calc.callPerformCalculation();

            const html = getResultHTML("stoich-result");
            expect(html).toContain("H2O");
            expect(html).toContain("2.00");
        });

        it("computes reactant from product via class performCalculation", () => {
            setOrCreateSelect("calculation-type", "reactant-from-product", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            setOrCreateInput("product-moles", "4", "stoich-inputs");
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            calc.callPerformCalculation();

            const html = getResultHTML("stoich-result");
            expect(html).toContain("H2");
            expect(html).toContain("4.00");
        });

        it("identifies limiting reactant via class performCalculation", () => {
            setOrCreateSelect("calculation-type", "limiting-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateInput("moles-H2", "2", "stoich-inputs");
            setOrCreateInput("moles-O2", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            calc.callPerformCalculation();

            const html = getResultHTML("stoich-result");
            expect(html).toContain("Limiting reactant: H2");
            expect(html).toContain("2.00");
        });

        it("throws for invalid moles in product-from-reactant via class", () => {
            setOrCreateSelect("calculation-type", "product-from-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            setOrCreateInput("reactant-moles", "0", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            expect(() => calc.callPerformCalculation()).toThrow("Invalid moles input");
        });

        it("throws for invalid moles in reactant-from-product via class", () => {
            setOrCreateSelect("calculation-type", "reactant-from-product", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            setOrCreateInput("product-moles", "-1", "stoich-inputs");
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            expect(() => calc.callPerformCalculation()).toThrow("Invalid moles input");
        });

        it("throws for invalid moles in limiting-reactant via class", () => {
            setOrCreateSelect("calculation-type", "limiting-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateInput("moles-H2", "0", "stoich-inputs");
            setOrCreateInput("moles-O2", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            expect(() => calc.callPerformCalculation()).toThrow("Invalid moles for H2");
        });

        it("throws for invalid calculation type via class", () => {
            setOrCreateSelect("calculation-type", "invalid", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant", "invalid",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            setOrCreateInput("reactant-moles", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            expect(() => calc.callPerformCalculation()).toThrow("Invalid calculation type");
        });

        it("removes error class when moles become valid in product-from-reactant", () => {
            setOrCreateSelect("calculation-type", "product-from-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            setOrCreateSelect("reactant-select", "H2", "stoich-inputs", ["H2", "O2"]);
            const molesInput = setOrCreateInput("reactant-moles", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            molesInput.classList.add("error");

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            calc.callPerformCalculation();

            expect(molesInput.classList.contains("error")).toBe(false);
        });

        it("removes error class when moles become valid in limiting-reactant", () => {
            setOrCreateSelect("calculation-type", "limiting-reactant", "stoich-inputs", [
                "product-from-reactant", "reactant-from-product", "limiting-reactant",
            ]);
            const h2Input = setOrCreateInput("moles-H2", "2", "stoich-inputs");
            setOrCreateInput("moles-O2", "2", "stoich-inputs");
            setOrCreateSelect("product-select", "H2O", "stoich-inputs", ["H2O"]);
            h2Input.classList.add("error");

            const calc = new TestableStoichiometryCalculator();
            calc.setTestEquation(equation);
            calc.callPerformCalculation();

            expect(h2Input.classList.contains("error")).toBe(false);
        });
    });
});

describe("StoichiometryCalculator.calculatePure", () => {
    beforeEach(() => {
        // Legacy DOM hooks are still constructed by the calculator; supply
        // a result element so the constructor does not throw.
        const result = document.createElement("div");
        result.id = "stoich-result";
        document.body.appendChild(result);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("computes product-from-reactant: 2 mol H2 -> 2 mol H2O", () => {
        const calc = new StoichiometryCalculator();
        const result = calc.calculatePure({
            "equation": "2H2 + O2 -> 2H2O",
            "calculation-type": "product-from-reactant",
            "reactant-select": "H2",
            "reactant-moles": "2",
            "product-select": "H2O"
        });
        // molesProduct = (2/2)*2 = 2.00
        expect(result.value).toContain("H2O");
        expect(result.value).toContain("2.00");
        expect(result.metadata).toHaveProperty("molesProduct");
        expect(result.metadata).toHaveProperty("calculationType", "product-from-reactant");
    });

    it("returns an error result when moles input is invalid", () => {
        const calc = new StoichiometryCalculator();
        const result = calc.calculatePure({
            "equation": "2H2 + O2 -> 2H2O",
            "calculation-type": "product-from-reactant",
            "reactant-select": "H2",
            "reactant-moles": "0",
            "product-select": "H2O"
        });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error:");
        expect(result.explanation).toContain("Invalid moles input");
    });
});
