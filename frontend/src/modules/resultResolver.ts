/**
 * Result resolver — handles calculator result output by mapping the
 * result/explanation to error or success signals.
 * Pure TypeScript, no JSX or SolidJS imports. Solid signal setters conform
 * to the (v: string) => void signature.
 */

export function resolveResult(
    res: { value: string; explanation?: string },
    setResult: (v: string) => void,
    setError: (v: string) => void,
): void {
    let value: string = res.value;
    let explanation: string = res.explanation !== undefined ? res.explanation : "";
    if (value === "" || explanation.startsWith("Error")) {
        setError(explanation !== "" ? explanation : "Calculation failed");
        setResult("");
        return;
    }
    setError("");
    setResult(explanation !== "" ? explanation : value);
}
