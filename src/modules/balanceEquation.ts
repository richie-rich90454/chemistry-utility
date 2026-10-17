import {balance as fastBalance} from "fast-balance";
import {balanceRedox, parseEquation} from "./equationBalancer.js";

export interface BalancedSpecies {
    coefficient: number;
    formula: string;
}
export interface BalanceResult {
    equation: string;
    reactants: BalancedSpecies[];
    products: BalancedSpecies[];
    explanation: {
        method: string;
        steps: string[];
        coefficients: number[];
    };
}
export type RedoxMedium = "acidic" | "basic";

function splitSpecies(s: string): BalancedSpecies {
    let m = /^(\d+)(.*)$/.exec(s);
    if (m) {
        return {coefficient: parseInt(m[1], 10), formula: m[2]};
    }
    return {coefficient: 1, formula: s};
}
function speciesFromTerms(terms: string[]): BalancedSpecies[] {
    return terms.map(splitSpecies);
}

/**
 * Pure equation balancing, shared by the UI hook (sync fallback) and the
 * heavy-calc worker. Throws with a human-readable message on invalid input.
 */
function balanceEquation(equation: string, medium: RedoxMedium): BalanceResult {
    let trimmed = equation.trim();
    if (trimmed.indexOf("||") !== -1) {
        // Redox equations combine two half-reactions; the medium
        // (acidic/basic) selects how H+/OH-/H2O are added.
        let balanced = balanceRedox(trimmed, medium);
        let {reactants, products} = parseEquation(balanced);
        return {
            equation: balanced,
            reactants: speciesFromTerms(reactants),
            products: speciesFromTerms(products),
            explanation: {
                method: "Redox half-reaction method (" + medium + " medium)",
                steps: [
                    "Separated equation into two half-reactions",
                    "Balanced each half-reaction for atoms and charge",
                    "Combined half-reactions and cancelled electrons"
                ],
                coefficients: speciesFromTerms(reactants).map(function (s) { return s.coefficient; })
                    .concat(speciesFromTerms(products).map(function (s) { return s.coefficient; }))
            }
        };
    }
    let res = fastBalance(trimmed, {showOne: false, format: "text"});
    return {
        equation: res.equation,
        reactants: res.reactants.map(function (s) { return {coefficient: s.coefficient, formula: s.formula}; }),
        products: res.products.map(function (s) { return {coefficient: s.coefficient, formula: s.formula}; }),
        explanation: {
            method: "Rational nullspace computation via Gaussian elimination",
            steps: [
                "Parsed " + res.reactants.length + " reactants and " + res.products.length + " products",
                "Built element conservation matrix with charge accounting",
                "Solved homogeneous linear system over rational numbers",
                "Scaled to smallest integer coefficients"
            ],
            coefficients: res.reactants.map(function (s: BalancedSpecies): number { return s.coefficient; })
                .concat(res.products.map(function (s: BalancedSpecies): number { return s.coefficient; }))
        }
    };
}

export {balanceEquation, splitSpecies, speciesFromTerms};
