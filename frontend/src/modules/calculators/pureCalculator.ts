/**
 * Pure calculation layer.
 *
 * This module is the contract boundary between the two engines. Nothing in
 * this file may touch the DOM, the network, or browser storage: the pure
 * classes here are the single source of truth that the Go implementation in
 * core/ mirrors, and the web build executes.
 *
 * Everything that needs a DOM lives in ../dom/ and layers on top of this.
 */

/**
 * Result of a calculator run.
 *
 * `value` is the display string. `explanation` carries the worked
 * derivation when a calculator produces one; an explanation beginning with
 * "Error" marks a failed run. `chartData` is opaque series data for the
 * chart layer, and `metadata` holds machine-readable extras (solve-for
 * target, unit, raw result) for consumers that need more than text.
 */
export interface CalculatorResult {
    value: string;
    explanation?: string;
    chartData?: unknown;
    metadata?: Record<string, unknown>;
}

/**
 * Lifecycle hook payload passed to plugins before a calculation runs.
 * Plugins may transform the inputs in place.
 */
export interface BeforeCalculationPayload {
    calculatorId: string;
    inputs: Record<string, unknown>;
}

/**
 * Lifecycle hook payload passed to plugins after a calculation runs.
 * Plugins may replace the result string.
 */
export interface AfterCalculationPayload {
    calculatorId: string;
    result: unknown;
}

/**
 * Hook sink. Plugins observe and transform calculator traffic; a null sink
 * disables the hook chain entirely, which is how the pure layer avoids
 * depending on the plugin manager.
 */
export interface HookSink {
    executeHook(name: string, payload: unknown): unknown;
}

/**
 * History sink. Records completed calculations; a null sink makes the pure
 * layer storage-free, which is what lets it run under Node in tests and
 * under Go in the desktop build.
 */
export interface HistorySink {
    addToHistory(calculatorId: string, inputs: Record<string, string>, result: string): void;
}

/**
 * Abstract base for all calculators.
 *
 * Subclasses implement {@link performCalculationPure}, which takes a plain
 * input record and returns a {@link CalculatorResult} without reading the
 * DOM. The template method {@link calculatePure} wraps that with the plugin
 * hook chain and error capture so subclasses stay free of both.
 *
 * Unlike the legacy DOM-coupled path this class performs no I/O and holds
 * no element references, so instantiating it is always safe and cheap.
 */
export abstract class PureCalculator {
    /**
     * Stable identifier used by hooks, history, and the calculator
     * registry. Subclasses must return a constant.
     */
    protected abstract getCalculatorId(): string;

    /** Optional hook sink; null disables the hook chain. */
    protected hooks: HookSink | null = null;

    /** Optional history sink; null disables history recording. */
    protected history: HistorySink | null = null;

    /** Installs a hook sink. Pass null to disable. */
    public setHookSink(sink: HookSink | null): void {
        this.hooks = sink;
    }

    /** Installs a history sink. Pass null to disable. */
    public setHistorySink(sink: HistorySink | null): void {
        this.history = sink;
    }

    /** Returns this calculator's stable identifier. */
    public get id(): string {
        return this.getCalculatorId();
    }

    /**
     * DOM-free template method. Reads inputs from the supplied record and
     * returns a {@link CalculatorResult}.
     *
     * Runnable in Node and in the Go port: the only side effect is
     * {@link HistorySink.addToHistory}, and only when a sink is installed.
     * Errors are caught and returned as a result with `value: ""` and an
     * "Error: …" explanation rather than thrown to the caller.
     */
    public calculatePure(inputs: Record<string, string>): CalculatorResult {
        let resolved: Record<string, string> = Object.assign({}, inputs);
        if (this.hooks !== null) {
            let beforePayload: BeforeCalculationPayload = {
                calculatorId: this.getCalculatorId(),
                inputs: resolved as Record<string, unknown>
            };
            let beforeResult: unknown = this.hooks.executeHook("beforeCalculation", beforePayload);
            let beforeFinal: BeforeCalculationPayload = beforeResult as BeforeCalculationPayload;
            if (beforeFinal !== undefined && beforeFinal !== null && beforeFinal.inputs !== undefined) {
                resolved = {};
                let keys: string[] = Object.keys(beforeFinal.inputs);
                for (let i = 0; i < keys.length; i++) {
                    let key: string = keys[i];
                    let v: unknown = beforeFinal.inputs[key];
                    resolved[key] = v === undefined || v === null ? "" : String(v);
                }
            }
        }
        let result: CalculatorResult;
        try {
            result = this.performCalculationPure(resolved);
        } catch (error) {
            let message: string = error instanceof Error ? error.message : String(error);
            return { value: "", explanation: "Error: " + message };
        }
        if (this.hooks !== null) {
            let afterPayload: AfterCalculationPayload = {
                calculatorId: this.getCalculatorId(),
                result: result.value
            };
            let afterResult: unknown = this.hooks.executeHook("afterCalculation", afterPayload);
            let afterFinal: AfterCalculationPayload = afterResult as AfterCalculationPayload;
            if (afterFinal !== undefined && afterFinal !== null &&
                typeof afterFinal.result === "string" && afterFinal.result !== result.value) {
                result = {
                    value: afterFinal.result,
                    explanation: result.explanation,
                    chartData: result.chartData,
                    metadata: result.metadata
                };
            }
        }
        if (this.history !== null) {
            this.history.addToHistory(this.getCalculatorId(), resolved, result.value);
        }
        return result;
    }

    /**
     * Calculator-specific logic. Must be pure: read only from `inputs`,
     * return a fresh {@link CalculatorResult}, throw an {@link Error} with a
     * human-readable message on invalid input.
     */
    protected abstract performCalculationPure(inputs: Record<string, string>): CalculatorResult;
}
