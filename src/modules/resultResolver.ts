/**
 * Result resolver — handles calculator result output by mapping the
 * result/explanation to error or success signals.
 * Pure TypeScript, no JSX or SolidJS imports. Solid signal setters conform
 * to the (v: string) => void signature.
 *
 * Accepts either a result or a promise of one. The desktop engine returns a
 * promise because every Wails binding is asynchronous, so the resolver
 * treats both shapes the same and routes render from one code path.
 */

interface ResolvableResult {
    value: string;
    explanation?: string;
}

export function resolveResult(
    res: ResolvableResult | Promise<ResolvableResult>,
    setResult: (v: string) => void,
    setError: (v: string) => void,
): void {
    if (res instanceof Promise) {
        void res.then(function (settled: ResolvableResult): void {
            applyResult(settled, setResult, setError);
        }).catch(function (err: unknown): void {
            let message: string = err instanceof Error ? err.message : String(err);
            setError("Error: " + message);
            setResult("");
        });
        return;
    }
    applyResult(res, setResult, setError);
}

function applyResult(
    res: ResolvableResult,
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
