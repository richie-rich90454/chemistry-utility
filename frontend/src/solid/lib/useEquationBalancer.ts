import {createSignal} from "solid-js";
import {balanceEquation, balanceIonic, balanceRedox, BalanceResult} from "../../modules/equationBalancer.js";
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
    function buildRedoxResult(balanced: string, mediumValue: "acidic" | "basic"): BalanceResult {
        let steps: string[] = [];
        steps.push("Detected || separator; balancing as redox half-reaction in " + mediumValue + " medium.");
        steps.push("Balanced each half-reaction (atoms then charge via electrons).");
        steps.push("Scaled half-reactions to cancel electrons and combined.");
        steps.push("Final balanced equation: " + balanced);
        return {
            equation: balanced,
            explanation: {
                method: "Half-reaction method for redox equations (" + mediumValue + " medium)",
                steps: steps,
                coefficients: []
            }
        };
    }
    function buildIonicFallback(balanced: string, reason: string): BalanceResult {
        let steps: string[] = [];
        steps.push("Standard atomic balancing failed: " + reason + ".");
        steps.push("Fell back to charge-conserving ionic balancing.");
        steps.push("Final balanced equation: " + balanced);
        return {
            equation: balanced,
            explanation: {
                method: "Ionic balancing with charge conservation",
                steps: steps,
                coefficients: []
            }
        };
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
                let balanced = balanceRedox(trimmed, medium());
                setResult(buildRedoxResult(balanced, medium()));
            }
            else {
                let res = balanceEquation(trimmed, 10000, true) as BalanceResult;
                setResult(res);
            }
        }
        catch (err) {
            let message = err instanceof Error ? err.message : String(err);
            if (trimmed.indexOf("||") === -1) {
                try {
                    let balanced = balanceIonic(trimmed);
                    setResult(buildIonicFallback(balanced, message));
                    setLoading(false);
                    return;
                }
                catch {
                    // Fall through to error display below.
                }
            }
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
