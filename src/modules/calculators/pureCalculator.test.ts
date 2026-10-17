import { describe, it, expect } from "vitest";
import { PureCalculator } from "./pureCalculator.js";
import type {
    CalculatorResult,
    HookSink,
    HistorySink
} from "./pureCalculator.js";

class EchoCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "echo";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return {
            value: "value:" + (inputs["a"] ?? ""),
            explanation: "explanation",
            chartData: [1, 2],
            metadata: { a: inputs["a"] }
        };
    }
}

class ThrowingCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "throwing";
    }

    protected performCalculationPure(_inputs: Record<string, string>): CalculatorResult {
        throw new Error("boom");
    }
}

class NonErrorThrowingCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "throwing-non-error";
    }

    protected performCalculationPure(_inputs: Record<string, string>): CalculatorResult {
        throw "string-failure";
    }
}

class StubHookSink implements HookSink {
    private readonly handler: (name: string, payload: unknown) => unknown;

    public constructor(handler: (name: string, payload: unknown) => unknown) {
        this.handler = handler;
    }

    public executeHook(name: string, payload: unknown): unknown {
        return this.handler(name, payload);
    }
}

class RecordingHistory implements HistorySink {
    public calls: Array<{ id: string; inputs: Record<string, string>; result: string }> = [];

    public addToHistory(id: string, inputs: Record<string, string>, result: string): void {
        this.calls.push({ id: id, inputs: inputs, result: result });
    }
}

describe("PureCalculator", function () {
    it("reports its stable id through the id getter", function (): void {
        expect(new EchoCalculator().id).toBe("echo");
    });

    it("returns the performCalculationPure result when no sinks are installed", function (): void {
        const result = new EchoCalculator().calculatePure({ "a": "x" });
        expect(result.value).toBe("value:x");
        expect(result.explanation).toBe("explanation");
    });

    it("stops recording after a sink is reset to null", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.setHookSink(new StubHookSink(function (): unknown {
            return undefined;
        }));
        calc.calculatePure({ "a": "1" });
        calc.setHistorySink(null);
        calc.setHookSink(null);
        calc.calculatePure({ "a": "2" });
        expect(history.calls).toHaveLength(1);
        expect(history.calls[0].id).toBe("echo");
    });

    it("transforms and stringifies inputs through the before hook", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            if (name === "beforeCalculation") {
                return { calculatorId: "echo", inputs: { "x": "1", "y": null, "z": undefined, "w": 5 } };
            }
            return undefined;
        }));
        calc.calculatePure({ "a": "orig" });
        expect(history.calls).toHaveLength(1);
        expect(history.calls[0].inputs).toEqual({ "x": "1", "y": "", "z": "", "w": "5" });
    });

    it("ignores an undefined before-hook result", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.setHookSink(new StubHookSink(function (): unknown {
            return undefined;
        }));
        calc.calculatePure({ "a": "keep" });
        expect(history.calls[0].inputs).toEqual({ "a": "keep" });
    });

    it("ignores a null before-hook result", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "beforeCalculation" ? null : undefined;
        }));
        calc.calculatePure({ "a": "keep" });
        expect(history.calls[0].inputs).toEqual({ "a": "keep" });
    });

    it("ignores a before-hook result without an inputs field", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "beforeCalculation" ? {} : undefined;
        }));
        calc.calculatePure({ "a": "keep" });
        expect(history.calls[0].inputs).toEqual({ "a": "keep" });
    });

    it("ignores an undefined after-hook result", function (): void {
        const calc = new EchoCalculator();
        calc.setHookSink(new StubHookSink(function (): unknown {
            return undefined;
        }));
        expect(calc.calculatePure({ "a": "keep" }).value).toBe("value:keep");
    });

    it("ignores a null after-hook result", function (): void {
        const calc = new EchoCalculator();
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "afterCalculation" ? null : undefined;
        }));
        expect(calc.calculatePure({ "a": "keep" }).value).toBe("value:keep");
    });

    it("ignores an after-hook result without a result field", function (): void {
        const calc = new EchoCalculator();
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "afterCalculation" ? {} : undefined;
        }));
        expect(calc.calculatePure({ "a": "keep" }).value).toBe("value:keep");
    });

    it("ignores a non-string after-hook result", function (): void {
        const calc = new EchoCalculator();
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "afterCalculation" ? { calculatorId: "echo", result: 5 } : undefined;
        }));
        expect(calc.calculatePure({ "a": "keep" }).value).toBe("value:keep");
    });

    it("ignores an after-hook result equal to the original value", function (): void {
        const calc = new EchoCalculator();
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "afterCalculation" ? { calculatorId: "echo", result: "value:keep" } : undefined;
        }));
        expect(calc.calculatePure({ "a": "keep" }).value).toBe("value:keep");
    });

    it("replaces the value but preserves the rest when the after hook returns a different string", function (): void {
        const calc = new EchoCalculator();
        calc.setHookSink(new StubHookSink(function (name: string): unknown {
            return name === "afterCalculation" ? { calculatorId: "echo", result: "changed" } : undefined;
        }));
        const result = calc.calculatePure({ "a": "keep" });
        expect(result.value).toBe("changed");
        expect(result.explanation).toBe("explanation");
        expect(result.chartData).toEqual([1, 2]);
        expect(result.metadata).toEqual({ a: "keep" });
    });

    it("captures a thrown Error as an error result", function (): void {
        const result = new ThrowingCalculator().calculatePure({});
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: boom");
    });

    it("captures a thrown non-Error as an error result", function (): void {
        const result = new NonErrorThrowingCalculator().calculatePure({});
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: string-failure");
    });
});
