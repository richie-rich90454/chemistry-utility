import { Calculator } from "./calculator.js";

/**
 * Represents a single term in a chemical equation (e.g., "2H2O").
 */
export class Term {
    private formula: string;
    private coefficient: number;

    constructor(formula: string, coefficient: number = 1) {
        this.formula = formula;
        this.coefficient = coefficient;
    }

    public getFormula(): string {
        return this.formula;
    }

    public getCoefficient(): number {
        return this.coefficient;
    }

    public static parse(term: string): Term {
        let match = term.match(/^(\d+)?(.+)$/);
        if (!match) {
            throw new Error("Invalid term: " + term);
        }
        let coefficient = match[1] ? parseInt(match[1]) : 1;
        let formula = match[2];
        return new Term(formula, coefficient);
    }
}

/**
 * Represents a balanced chemical equation with reactants and products.
 */
export class BalancedEquation {
    private reactants: Term[];
    private products: Term[];

    constructor(reactants: Term[], products: Term[]) {
        this.reactants = reactants;
        this.products = products;
    }

    public getReactants(): Term[] {
        return this.reactants;
    }

    public getProducts(): Term[] {
        return this.products;
    }

    public static parse(equation: string): BalancedEquation {
        let cleanedEquation = equation.replace(/\s+/g, "");
        let parts = cleanedEquation.split(/->|=/);
        if (parts.length != 2) {
            throw new Error("Invalid equation format: missing \"->\"");
        }
        let reactants = parts[0].split("+");
        let products = parts[1].split("+");
        let parsedReactants: Term[] = [];
        let parsedProducts: Term[] = [];
        for (let i = 0; i < reactants.length; i++) {
            parsedReactants.push(Term.parse(reactants[i]));
        }
        for (let i = 0; i < products.length; i++) {
            parsedProducts.push(Term.parse(products[i]));
        }
        return new BalancedEquation(parsedReactants, parsedProducts);
    }
}

/**
 * Stoichiometry calculator that extends the abstract Calculator class.
 * Supports product-from-reactant, reactant-from-product, and limiting-reactant calculations.
 */
export class StoichiometryCalculator extends Calculator {
    private equation: string = "";

    constructor() {
        super("stoich-result", []);
    }

    public setEquation(equation: string): void {
        this.equation = equation;
    }

    private static sanitizeId(formula: string): string {
        return formula.replace(/[\(\)\[\]\{\}\,\s]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    }

    public getCalculationType(equation: string): void {
        let parsed = BalancedEquation.parse(equation);
        let inputsDiv = document.getElementById("stoich-inputs") as HTMLElement;
        inputsDiv.innerHTML = "";
        let type = (document.getElementById("calculation-type") as HTMLSelectElement).value;
        let reactants = parsed.getReactants();
        let products = parsed.getProducts();
        if (type == "product-from-reactant") {
            let reactantOptions = "";
            for (let i = 0; i < reactants.length; i++) {
                let reactant = reactants[i];
                reactantOptions = reactantOptions + "<option value=\"" + reactant.getFormula() + "\">" + reactant.getFormula() + "</option>";
            }
            let reactantSelect = "<select id=\"reactant-select\">" + reactantOptions + "</select>";
            let molesInput = "<input type=\"number\" id=\"reactant-moles\" placeholder=\"Moles of reactant\" min=\"0\" step=\"any\">";
            let productOptions = "";
            for (let i = 0; i < products.length; i++) {
                let product = products[i];
                productOptions = productOptions + "<option value=\"" + product.getFormula() + "\">" + product.getFormula() + "</option>";
            }
            let productSelect = "<select id=\"product-select\">" + productOptions + "</select>";
            inputsDiv.innerHTML = "<label for=\"reactant-select\">Select reactant</label>" + reactantSelect + "<label for=\"reactant-moles\">Enter moles</label>" + molesInput + "<label for=\"product-select\">Select product</label>" + productSelect;
            inputsDiv.classList.add("show");
        }
        else if (type == "reactant-from-product") {
            let productOptions = "";
            for (let i = 0; i < products.length; i++) {
                let product = products[i];
                productOptions = productOptions + "<option value=\"" + product.getFormula() + "\">" + product.getFormula() + "</option>";
            }
            let productSelect = "<select id=\"product-select\">" + productOptions + "</select>";
            let molesInput = "<input type=\"number\" id=\"product-moles\" placeholder=\"Moles of product\" min=\"0\" step=\"any\">";
            let reactantOptions = "";
            for (let i = 0; i < reactants.length; i++) {
                let reactant = reactants[i];
                reactantOptions = reactantOptions + "<option value=\"" + reactant.getFormula() + "\">" + reactant.getFormula() + "</option>";
            }
            let reactantSelect = "<select id=\"reactant-select\">" + reactantOptions + "</select>";
            inputsDiv.innerHTML = "<label for=\"product-select\">Select product</label>" + productSelect + "<label for=\"product-moles\">Enter moles</label>" + molesInput + "<label for=\"reactant-select\">Select reactant</label>" + reactantSelect;
            inputsDiv.classList.add("show");
        }
        else if (type == "limiting-reactant") {
            let reactantInputs = "";
            for (let i = 0; i < reactants.length; i++) {
                let reactant = reactants[i];
                let sanitizedId = StoichiometryCalculator.sanitizeId(reactant.getFormula());
                reactantInputs = reactantInputs + "<label for=\"moles-" + sanitizedId + "\">Moles of " + reactant.getFormula() + "</label><input type=\"number\" id=\"moles-" + sanitizedId + "\" placeholder=\"Moles of " + reactant.getFormula() + "\" min=\"0\" step=\"any\">";
            }
            let productOptions = "";
            for (let i = 0; i < products.length; i++) {
                let product = products[i];
                productOptions = productOptions + "<option value=\"" + product.getFormula() + "\">" + product.getFormula() + "</option>";
            }
            let productSelect = "<select id=\"product-select\">" + productOptions + "</select>";
            inputsDiv.innerHTML = reactantInputs + "<label for=\"product-select\">Select product to calculate</label>" + productSelect;
            inputsDiv.classList.add("show");
        }
    }

    protected performCalculation(): void {
        let type = (document.getElementById("calculation-type") as HTMLSelectElement).value;
        let parsed = BalancedEquation.parse(this.equation);
        let reactants = parsed.getReactants();
        let products = parsed.getProducts();
        if (type == "product-from-reactant") {
            let reactantSelect = document.getElementById("reactant-select") as HTMLSelectElement;
            let reactantFormula = reactantSelect.value;
            let molesInput = document.getElementById("reactant-moles") as HTMLInputElement;
            let molesReactant = parseFloat(molesInput.value);
            let productSelect = document.getElementById("product-select") as HTMLSelectElement;
            let productFormula = productSelect.value;
            let isMolesValid = !isNaN(molesReactant) && molesReactant > 0;
            if (!isMolesValid) {
                molesInput.classList.add("error");
                throw new Error("Invalid moles input");
            }
            molesInput.classList.remove("error");
            let reactant: Term | null = null;
            for (let i = 0; i < reactants.length; i++) {
                if (reactants[i].getFormula() == reactantFormula) {
                    reactant = reactants[i];
                    break;
                }
            }
            let product: Term | null = null;
            for (let i = 0; i < products.length; i++) {
                if (products[i].getFormula() == productFormula) {
                    product = products[i];
                    break;
                }
            }
            if (reactant == null || product == null) {
                throw new Error("Selected compound not found");
            }
            let molesProduct = (molesReactant / reactant.getCoefficient()) * product.getCoefficient();
            this.resultDisplay.showResult("<p>Moles of " + productFormula + ": " + molesProduct.toFixed(2) + "</p>");
        }
        else if (type == "reactant-from-product") {
            let productSelect = document.getElementById("product-select") as HTMLSelectElement;
            let productFormula = productSelect.value;
            let molesInput = document.getElementById("product-moles") as HTMLInputElement;
            let molesProduct = parseFloat(molesInput.value);
            let reactantSelect = document.getElementById("reactant-select") as HTMLSelectElement;
            let reactantFormula = reactantSelect.value;
            let isMolesValid = !isNaN(molesProduct) && molesProduct > 0;
            if (!isMolesValid) {
                molesInput.classList.add("error");
                throw new Error("Invalid moles input");
            }
            molesInput.classList.remove("error");
            let product: Term | null = null;
            for (let i = 0; i < products.length; i++) {
                if (products[i].getFormula() == productFormula) {
                    product = products[i];
                    break;
                }
            }
            let reactant: Term | null = null;
            for (let i = 0; i < reactants.length; i++) {
                if (reactants[i].getFormula() == reactantFormula) {
                    reactant = reactants[i];
                    break;
                }
            }
            if (product == null || reactant == null) {
                throw new Error("Selected compound not found");
            }
            let molesReactant = (molesProduct / product.getCoefficient()) * reactant.getCoefficient();
            this.resultDisplay.showResult("<p>Moles of " + reactantFormula + ": " + molesReactant.toFixed(2) + "</p>");
        }
        else if (type == "limiting-reactant") {
            let reactantMoles: Record<string, number> = {};
            for (let i = 0; i < reactants.length; i++) {
                let reactant = reactants[i];
                let molesInput = document.getElementById("moles-" + StoichiometryCalculator.sanitizeId(reactant.getFormula())) as HTMLInputElement;
                let moles = parseFloat(molesInput.value);
                let isMolesValid = !isNaN(moles) && moles > 0;
                if (!isMolesValid) {
                    molesInput.classList.add("error");
                    throw new Error("Invalid moles for " + reactant.getFormula());
                }
                molesInput.classList.remove("error");
                reactantMoles[reactant.getFormula()] = moles;
            }
            let productSelect = document.getElementById("product-select") as HTMLSelectElement;
            let productFormula = productSelect.value;
            let product: Term | null = null;
            for (let i = 0; i < products.length; i++) {
                if (products[i].getFormula() == productFormula) {
                    product = products[i];
                    break;
                }
            }
            if (product == null) {
                throw new Error("Selected product not found");
            }
            let minRatio = Infinity;
            let limitingReactant: string | null = null;
            for (let i = 0; i < reactants.length; i++) {
                let reactant = reactants[i];
                let ratio = reactantMoles[reactant.getFormula()] / reactant.getCoefficient();
                if (ratio < minRatio) {
                    minRatio = ratio;
                    limitingReactant = reactant.getFormula();
                }
            }
            let molesProduct = minRatio * product.getCoefficient();
            this.resultDisplay.showResult("<p>Limiting reactant: " + limitingReactant + "</p><p>Moles of " + productFormula + ": " + molesProduct.toFixed(2) + "</p>");
        }
    }
}

// Standalone functions for backwards compatibility with tests

interface TermObject {
    formula: string;
    coefficient: number;
}

interface BalancedEquationObject {
    reactants: TermObject[];
    products: TermObject[];
}

function sanitizeId(formula: string): string {
    return formula.replace(/[\(\)\[\]\{\}\,\s]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function parseBalancedEquation(equation: string): BalancedEquationObject {
    let parsed = BalancedEquation.parse(equation);
    let reactants = parsed.getReactants().map((t) => ({ formula: t.getFormula(), coefficient: t.getCoefficient() }));
    let products = parsed.getProducts().map((t) => ({ formula: t.getFormula(), coefficient: t.getCoefficient() }));
    return { reactants: reactants, products: products };
}

export function parseTerm(term: string): TermObject {
    let t = Term.parse(term);
    return { formula: t.getFormula(), coefficient: t.getCoefficient() };
}

export function getCalculationType(equation: string): void {
    let calc = new StoichiometryCalculator();
    calc.getCalculationType(equation);
}

export function calculateStoichiometry(equation: string): void {
    let type = (document.getElementById("calculation-type") as HTMLSelectElement).value;
    let resultDiv = document.getElementById("stoich-result") as HTMLElement;
    let parsed = parseBalancedEquation(equation);
    if (type == "product-from-reactant") {
        let reactantSelect = document.getElementById("reactant-select") as HTMLSelectElement;
        let reactantFormula = reactantSelect.value;
        let molesInput = document.getElementById("reactant-moles") as HTMLInputElement;
        let molesReactant = parseFloat(molesInput.value);
        let productSelect = document.getElementById("product-select") as HTMLSelectElement;
        let productFormula = productSelect.value;
        let isMolesValid = !isNaN(molesReactant) && molesReactant > 0;
        if (!isMolesValid) {
            molesInput.classList.add("error");
            throw new Error("Invalid moles input");
        }
        molesInput.classList.remove("error");
        let reactant: TermObject | null = null;
        for (let i = 0; i < parsed.reactants.length; i++) {
            if (parsed.reactants[i].formula == reactantFormula) {
                reactant = parsed.reactants[i];
                break;
            }
        }
        let product: TermObject | null = null;
        for (let i = 0; i < parsed.products.length; i++) {
            if (parsed.products[i].formula == productFormula) {
                product = parsed.products[i];
                break;
            }
        }
        if (reactant == null || product == null) {
            throw new Error("Selected compound not found");
        }
        let molesProduct = (molesReactant / reactant.coefficient) * product.coefficient;
        resultDiv.innerHTML = "<p>Moles of " + productFormula + ": " + molesProduct.toFixed(2) + "</p>";
        resultDiv.classList.add("show");
    }
    else if (type == "reactant-from-product") {
        let productSelect = document.getElementById("product-select") as HTMLSelectElement;
        let productFormula = productSelect.value;
        let molesInput = document.getElementById("product-moles") as HTMLInputElement;
        let molesProduct = parseFloat(molesInput.value);
        let reactantSelect = document.getElementById("reactant-select") as HTMLSelectElement;
        let reactantFormula = reactantSelect.value;
        let isMolesValid = !isNaN(molesProduct) && molesProduct > 0;
        if (!isMolesValid) {
            molesInput.classList.add("error");
            throw new Error("Invalid moles input");
        }
        molesInput.classList.remove("error");
        let product: TermObject | null = null;
        for (let i = 0; i < parsed.products.length; i++) {
            if (parsed.products[i].formula == productFormula) {
                product = parsed.products[i];
                break;
            }
        }
        let reactant: TermObject | null = null;
        for (let i = 0; i < parsed.reactants.length; i++) {
            if (parsed.reactants[i].formula == reactantFormula) {
                reactant = parsed.reactants[i];
                break;
            }
        }
        if (product == null || reactant == null) {
            throw new Error("Selected compound not found");
        }
        let molesReactant = (molesProduct / product.coefficient) * reactant.coefficient;
        resultDiv.innerHTML = "<p>Moles of " + reactantFormula + ": " + molesReactant.toFixed(2) + "</p>";
        resultDiv.classList.add("show");
    }
    else if (type == "limiting-reactant") {
        let reactantMoles: Record<string, number> = {};
        for (let i = 0; i < parsed.reactants.length; i++) {
            let reactant = parsed.reactants[i];
            let molesInput = document.getElementById("moles-" + sanitizeId(reactant.formula)) as HTMLInputElement;
            let moles = parseFloat(molesInput.value);
            let isMolesValid = !isNaN(moles) && moles > 0;
            if (!isMolesValid) {
                molesInput.classList.add("error");
                throw new Error("Invalid moles for " + reactant.formula);
            }
            molesInput.classList.remove("error");
            reactantMoles[reactant.formula] = moles;
        }
        let productSelect = document.getElementById("product-select") as HTMLSelectElement;
        let productFormula = productSelect.value;
        let product: TermObject | null = null;
        for (let i = 0; i < parsed.products.length; i++) {
            if (parsed.products[i].formula == productFormula) {
                product = parsed.products[i];
                break;
            }
        }
        if (product == null) {
            throw new Error("Selected product not found");
        }
        let minRatio = Infinity;
        let limitingReactant: string | null = null;
        for (let i = 0; i < parsed.reactants.length; i++) {
            let reactant = parsed.reactants[i];
            let ratio = reactantMoles[reactant.formula] / reactant.coefficient;
            if (ratio < minRatio) {
                minRatio = ratio;
                limitingReactant = reactant.formula;
            }
        }
        let molesProduct = minRatio * product.coefficient;
        resultDiv.innerHTML = "<p>Limiting reactant: " + limitingReactant + "</p><p>Moles of " + productFormula + ": " + molesProduct.toFixed(2) + "</p>";
        resultDiv.classList.add("show");
    }
}
