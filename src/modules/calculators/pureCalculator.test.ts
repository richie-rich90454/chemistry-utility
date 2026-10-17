import { describe, it, expect } from "vitest";
import { PureCalculator } from "./pureCalculator.js";
import type {
    CalculatorResult,
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

    it("records history when a sink is installed", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.calculatePure({ "a": "1" });
        expect(history.calls).toHaveLength(1);
        expect(history.calls[0].id).toBe("echo");
        expect(history.calls[0].inputs).toEqual({ "a": "1" });
        expect(history.calls[0].result).toBe("value:1");
    });

    it("stops recording after a sink is reset to null", function (): void {
        const calc = new EchoCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.calculatePure({ "a": "1" });
        calc.setHistorySink(null);
        calc.calculatePure({ "a": "2" });
        expect(history.calls).toHaveLength(1);
        expect(history.calls[0].id).toBe("echo");
    });

    it("does not record history for a failed calculation", function (): void {
        const calc = new ThrowingCalculator();
        const history = new RecordingHistory();
        calc.setHistorySink(history);
        calc.calculatePure({});
        expect(history.calls).toHaveLength(0);
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
