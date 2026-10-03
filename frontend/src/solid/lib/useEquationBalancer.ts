import {createSignal} from "solid-js";
import {balance as fastBalance} from "fast-balance";
import {balanceRedox, parseEquation} from "../../modules/equationBalancer.js";

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

function useEquationBalancer(): {
    equation: () => string;
    setEquation: (next: string) => void;
    medium: () => "acidic" | "basic";
    setMedium: (next: "acidic" | "basic") => void;
    result: () => BalanceResult | null;
    error: () => string;
    isLoading: () => boolean;
    balance: () => void;
    clear: () => void;
} {
    let [equation, setEquationSignal] = createSignal("");
    let [medium, setMediumSignal] = createSignal<"acidic" | "basic">("acidic");
    let [result, setResult] = createSignal<BalanceResult | null>(null);
    let [error, setError] = createSignal("");
    let [isLoading, setLoading] = createSignal(false);

    function setEquation(next: string): void {
        setEquationSignal(next);
    }
    function setMedium(next: "acidic" | "basic"): void {
        setMediumSignal(next);
    }
    function clear(): void {
        setEquationSignal("");
        setResult(null);
        setError("");
        setLoading(false);
    }

    function balance(): void {
        setError("");
        setResult(null);
        let trimmed = equation().trim();
        if (trimmed === "") {
            setError("Please enter a chemical equation");
            return;
        }
        setLoading(true);
        try {
            if (trimmed.indexOf("||") !== -1) {
                // Redox equations combine two half-reactions; the medium
                // (acidic/basic) selects how H+/OH-/H2O are added.
                let balanced = balanceRedox(trimmed, medium());
                let {reactants, products} = parseEquation(balanced);
                setResult({
                    equation: balanced,
                    reactants: speciesFromTerms(reactants),
                    products: speciesFromTerms(products),
                    explanation: {
                        method: "Redox half-reaction method (" + medium() + " medium)",
                        steps: [
                            "Separated equation into two half-reactions",
                            "Balanced each half-reaction for atoms and charge",
                            "Combined half-reactions and cancelled electrons"
                        ],
                        coefficients: speciesFromTerms(reactants).map(function (s) { return s.coefficient; })
                            .concat(speciesFromTerms(products).map(function (s) { return s.coefficient; }))
                    }
                });
                setLoading(false);
                return;
            }
            let res = fastBalance(trimmed, {showOne: false, format: "text"});
            setResult({
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
            });
        }
        catch (err: unknown) {
            let message = err instanceof Error ? err.message : String(err);
            setError(message);
        }
        finally {
            setLoading(false);
        }
    }

    return {
        equation: equation,
        setEquation: setEquation,
        medium: medium,
        setMedium: setMedium,
        result: result,
        error: error,
        isLoading: isLoading,
        balance: balance,
        clear: clear
    };
}
export {useEquationBalancer, splitSpecies, speciesFromTerms};
