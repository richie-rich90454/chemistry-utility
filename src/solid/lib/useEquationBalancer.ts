import {createSignal} from "solid-js";
import {splitSpecies, speciesFromTerms} from "../../modules/balanceEquation.js";
import type {BalanceResult, RedoxMedium} from "../../modules/balanceEquation.js";
import {runBalance} from "../../modules/heavyCalcClient.js";

function useEquationBalancer(): {
    equation: () => string;
    setEquation: (next: string) => void;
    medium: () => RedoxMedium;
    setMedium: (next: RedoxMedium) => void;
    result: () => BalanceResult | null;
    error: () => string;
    isLoading: () => boolean;
    balanceAsync: () => Promise<void>;
    clear: () => void;
} {
    let [equation, setEquationSignal] = createSignal("");
    let [medium, setMediumSignal] = createSignal<RedoxMedium>("acidic");
    let [result, setResult] = createSignal<BalanceResult | null>(null);
    let [error, setError] = createSignal("");
    let [isLoading, setLoading] = createSignal(false);

    function setEquation(next: string): void {
        setEquationSignal(next);
    }
    function setMedium(next: RedoxMedium): void {
        setMediumSignal(next);
    }
    function clear(): void {
        setEquationSignal("");
        setResult(null);
        setError("");
        setLoading(false);
    }

    // Worker-backed balancing when a worker is available, with the same
    // synchronous computation as the fallback.
    function balanceAsync(): Promise<void> {
        setError("");
        setResult(null);
        let trimmed = equation().trim();
        if (trimmed === "") {
            setError("Please enter a chemical equation");
            return Promise.resolve();
        }
        setLoading(true);
        return runBalance(trimmed, medium())
            .then(function (res: BalanceResult): void {
                setResult(res);
            }, function (err: unknown): void {
                let message = err instanceof Error ? err.message : String(err);
                setError(message);
            })
            .then(function (): void {
                setLoading(false);
            });
    }

    return {
        equation: equation,
        setEquation: setEquation,
        medium: medium,
        setMedium: setMedium,
        result: result,
        error: error,
        isLoading: isLoading,
        balanceAsync: balanceAsync,
        clear: clear
    };
}
export {useEquationBalancer, splitSpecies, speciesFromTerms};
export type {BalanceResult, RedoxMedium};
