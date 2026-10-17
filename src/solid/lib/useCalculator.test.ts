import { describe, it, expect, beforeEach } from "vitest";
import { useCalculator } from "./useCalculator";
import { Calculator, CalculatorResult } from "../../modules/calculator.js";

class EchoCalculator extends Calculator {
    constructor() {
        super("echo-result", []);
    }
    protected performCalculation(): void {
        return;
    }
    protected override performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return { value: inputs["a"] ?? "", explanation: "echo:" + (inputs["a"] ?? "") };
    }
}

function setupDOM(): void {
    document.body.innerHTML = "";
    const div = document.createElement("div");
    div.id = "echo-result";
    document.body.appendChild(div);
}

describe("useCalculator", () => {
    beforeEach(() => {
        setupDOM();
    });

    it("starts with empty inputs and empty result", () => {
        const hook = useCalculator(new EchoCalculator());
        expect(hook.inputs()).toEqual({});
        expect(hook.result()).toEqual({ value: "", explanation: "" });
    });

    it("setInputs updates the inputs signal", () => {
        const hook = useCalculator(new EchoCalculator());
        hook.setInputs({ a: "5" });
        expect(hook.inputs()).toEqual({ a: "5" });
    });

    it("calculate runs the pure calculation and stores the result", () => {
        const hook = useCalculator(new EchoCalculator());
        hook.setInputs({ a: "hello" });
        hook.calculate();
        expect(hook.result()).toEqual({ value: "hello", explanation: "echo:hello" });
    });

    it("calculate reflects updated inputs on each call", () => {
        const hook = useCalculator(new EchoCalculator());
        hook.setInputs({ a: "one" });
        hook.calculate();
        expect(hook.result().value).toBe("one");
        hook.setInputs({ a: "two" });
        hook.calculate();
        expect(hook.result().value).toBe("two");
    });
});
