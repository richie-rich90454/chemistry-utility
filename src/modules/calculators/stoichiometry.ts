import { NumberFormatter } from "../i18n/numberFormatter.js";
import { sanitizeId } from "../equationFormatter.js";
import { normalizeArrows } from "fast-balance";
import type { CalculatorResult } from "./pureCalculator.js";

/**
 * A single term in a chemical equation (e.g., "2H2O").
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
 * A balanced chemical equation split into reactant and product terms.
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
        let normalizedEquation = normalizeArrows(equation);
        let cleanedEquation = normalizedEquation.replace(/\s+/g, "");
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

/** A term of an equation as a plain record, for callers that do not want the class. */
export interface StochTermObject {
    formula: string;
    coefficient: number;
}

/** A parsed equation as plain records, for callers that do not want the class. */
export interface StochEquationObject {
    reactants: StochTermObject[];
    products: StochTermObject[];
}

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

function findTerm(terms: Term[], formula: string): Term | null {
    for (let i = 0; i < terms.length; i++) {
        if (terms[i].getFormula() === formula) {
            return terms[i];
        }
    }
    return null;
}

/**
 * Stoichiometry calculator. Reads the balanced equation from `equation`,
 * the mode from `calculation-type` ("product-from-reactant",
 * "reactant-from-product", or "limiting-reactant"), the selected species
 * from `reactant-select` / `product-select`, and the mole amounts from
 * `reactant-moles`, `product-moles`, or `moles-<sanitized formula>`.
 */
export function stoichiometry(inputs: Record<string, string>): CalculatorResult {
    const equation = inputs["equation"] ?? "";
    const type = inputs["calculation-type"] ?? "";
    const parsed = BalancedEquation.parse(equation);
    const reactants = parsed.getReactants();
    const products = parsed.getProducts();
    if (type === "product-from-reactant") {
        const reactantFormula = inputs["reactant-select"] ?? "";
        const molesReactant = parseFloat(inputs["reactant-moles"] ?? "");
        const productFormula = inputs["product-select"] ?? "";
        const isMolesValid = !isNaN(molesReactant) && molesReactant > 0;
        if (!isMolesValid) {
            throw new Error("Invalid moles input");
        }
        const reactant = findTerm(reactants, reactantFormula);
        const product = findTerm(products, productFormula);
        if (reactant === null || product === null) {
            throw new Error("Selected compound not found");
        }
        const molesProduct = (molesReactant / reactant.getCoefficient()) * product.getCoefficient();
        return {
            value: "Moles of " + productFormula + ": " + formatter().format(molesProduct, 2),
            explanation: "molesProduct = (molesReactant / reactant_coefficient) * product_coefficient = (" + molesReactant + " / " + reactant.getCoefficient() + ") * " + product.getCoefficient() + " = " + formatter().format(molesProduct, 2),
            metadata: {
                calculationType: type,
                reactant: reactantFormula,
                product: productFormula,
                molesReactant: molesReactant,
                molesProduct: molesProduct
            }
        };
    }
    else if (type === "reactant-from-product") {
        const productFormula = inputs["product-select"] ?? "";
        const molesProduct = parseFloat(inputs["product-moles"] ?? "");
        const reactantFormula = inputs["reactant-select"] ?? "";
        const isMolesValid = !isNaN(molesProduct) && molesProduct > 0;
        if (!isMolesValid) {
            throw new Error("Invalid moles input");
        }
        const product = findTerm(products, productFormula);
        const reactant = findTerm(reactants, reactantFormula);
        if (product === null || reactant === null) {
            throw new Error("Selected compound not found");
        }
        const molesReactant = (molesProduct / product.getCoefficient()) * reactant.getCoefficient();
        return {
            value: "Moles of " + reactantFormula + ": " + formatter().format(molesReactant, 2),
            explanation: "molesReactant = (molesProduct / product_coefficient) * reactant_coefficient = (" + molesProduct + " / " + product.getCoefficient() + ") * " + reactant.getCoefficient() + " = " + formatter().format(molesReactant, 2),
            metadata: {
                calculationType: type,
                reactant: reactantFormula,
                product: productFormula,
                molesReactant: molesReactant,
                molesProduct: molesProduct
            }
        };
    }
    else if (type === "limiting-reactant") {
        const reactantMoles: Record<string, number> = {};
        for (let i = 0; i < reactants.length; i++) {
            const reactant = reactants[i];
            const moles = parseFloat(inputs["moles-" + sanitizeId(reactant.getFormula())] ?? "");
            const isMolesValid = !isNaN(moles) && moles > 0;
            if (!isMolesValid) {
                throw new Error("Invalid moles for " + reactant.getFormula());
            }
            reactantMoles[reactant.getFormula()] = moles;
        }
        const productFormula = inputs["product-select"] ?? "";
        const product = findTerm(products, productFormula);
        if (product === null) {
            throw new Error("Selected product not found");
        }
        let minRatio = Infinity;
        let limitingReactant: string | null = null;
        for (let i = 0; i < reactants.length; i++) {
            const reactant = reactants[i];
            const ratio = reactantMoles[reactant.getFormula()] / reactant.getCoefficient();
            if (ratio < minRatio) {
                minRatio = ratio;
                limitingReactant = reactant.getFormula();
            }
        }
        const molesProduct = minRatio * product.getCoefficient();
        return {
            value: "Limiting reactant: " + limitingReactant + "; Moles of " + productFormula + ": " + formatter().format(molesProduct, 2),
            explanation: "minRatio = min(moles_i / coeff_i) = " + formatter().format(minRatio, 4) + " (limiting: " + limitingReactant + "); molesProduct = minRatio * product_coefficient = " + formatter().format(minRatio, 4) + " * " + product.getCoefficient() + " = " + formatter().format(molesProduct, 2),
            metadata: {
                calculationType: type,
                limitingReactant: limitingReactant,
                product: productFormula,
                reactantMoles: reactantMoles,
                minRatio: minRatio,
                molesProduct: molesProduct
            }
        };
    }
    else {
        throw new Error("Invalid calculation type");
    }
}

/** Parses one term ("2H2O") into a plain record. */
export function parseTerm(term: string): StochTermObject {
    let t = Term.parse(term);
    return { formula: t.getFormula(), coefficient: t.getCoefficient() };
}

/** Parses a balanced equation into plain reactant and product records. */
export function parseBalancedEquation(equation: string): StochEquationObject {
    let parsed = BalancedEquation.parse(equation);
    let reactants = parsed.getReactants().map((t) => ({ formula: t.getFormula(), coefficient: t.getCoefficient() }));
    let products = parsed.getProducts().map((t) => ({ formula: t.getFormula(), coefficient: t.getCoefficient() }));
    return { reactants: reactants, products: products };
}
