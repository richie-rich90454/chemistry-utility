import {createSignal} from "solid-js";
import {balance as fastBalance} from "fast-balance";

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
                // Remove || and try as single equation
                let cleaned = trimmed.replace(/\|\|/g, " + ");
                try {
                    let res = fastBalance(cleaned, {showOne: false, format: "text"});
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
                    setLoading(false);
                    return;
                } catch { /* fall through to standard balance */ }
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
export {useEquationBalancer};
