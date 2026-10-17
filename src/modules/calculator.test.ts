import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Calculator, CalculatorResult } from "./calculator.js";
import { InputElement } from "./inputElement.js";

class NoopCalculator extends Calculator {
    constructor(resultId: string, inputIds: string[]) {
        super(resultId, inputIds);
    }
    protected performCalculation(): void {
        return;
    }
}

class ThrowingPureCalculator extends Calculator {
    constructor(resultId: string, inputIds: string[]) {
        super(resultId, inputIds);
    }
    protected performCalculation(): void {
        return;
    }
    protected override performCalculationPure(_inputs: Record<string, string>): CalculatorResult {
        throw "boom-string";
    }
}

class FailingCalculator extends Calculator {
    constructor(resultId: string, inputIds: string[]) {
        super(resultId, inputIds);
    }
    protected performCalculation(): void {
        throw new Error("calc exploded");
    }
}

function addInput(id: string, value: string): void {
    let input: HTMLInputElement = document.createElement("input");
    input.id = id;
    input.value = value;
    document.body.appendChild(input);
}

function addResultDiv(id: string, text: string): void {
    let div: HTMLDivElement = document.createElement("div");
    div.id = id;
    div.textContent = text;
    document.body.appendChild(div);
}

describe("Calculator base class", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
    });

    afterEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("exposes its result display", () => {
        addResultDiv("r-result", "");
        let calc: NoopCalculator = new NoopCalculator("r-result", []);
        expect(calc.getResultDisplay().getElement()).toBe(document.getElementById("r-result"));
    });

    it("throws for unknown input ids", () => {
        addResultDiv("r-result", "");
        addInput("in-a", "1");
        let calc: NoopCalculator = new NoopCalculator("r-result", ["in-a"]);
        expect(() => (calc as unknown as { getInput(id: string): unknown }).getInput("missing")).toThrow(
            "Input element not found: missing",
        );
    });

    it("returns owned input elements by id", () => {
        addResultDiv("r-result", "");
        addInput("in-a", "1");
        let calc: NoopCalculator = new NoopCalculator("r-result", ["in-a"]);
        let found: InputElement = (
            calc as unknown as { getInput(id: string): InputElement }
        ).getInput("in-a");
        expect(found.getElement().id).toBe("in-a");
    });

    it("clears all input errors", () => {
        addResultDiv("r-result", "");
        addInput("in-a", "1");
        let calc: NoopCalculator = new NoopCalculator("r-result", ["in-a"]);
        document.getElementById("in-a")!.classList.add("error");
        calc.clearAllErrors();
        expect(document.getElementById("in-a")!.classList.contains("error")).toBe(false);
    });

    it("calculatePure surfaces non-Error throws", () => {
        addResultDiv("r-result", "");
        let calc: ThrowingPureCalculator = new ThrowingPureCalculator("r-result", []);
        let out: CalculatorResult = calc.calculatePure({});
        expect(out.value).toBe("");
        expect(out.explanation).toBe("Error: boom-string");
    });

    it("shows a skeleton for empty results and skips it otherwise", async () => {
        addResultDiv("empty-result", "");
        addResultDiv("full-result", "already here");
        let emptyCalc: NoopCalculator = new NoopCalculator("empty-result", []);
        await emptyCalc.calculate();
        expect(document.getElementById("empty-result")!.classList.contains("skeleton")).toBe(false);
        let fullCalc: NoopCalculator = new NoopCalculator("full-result", []);
        await fullCalc.calculate();
        expect(document.getElementById("full-result")!.classList.contains("skeleton")).toBe(false);
    });

    it("tolerates a missing result element", async () => {
        addInput("in-a", "1");
        let calc: NoopCalculator = new NoopCalculator("missing-result", ["in-a"]);
        await calc.calculate();
        expect(calc.getResultDisplay().getElement()).toBeNull();
    });

    it("calculatePure surfaces the default not-implemented error", () => {
        addResultDiv("r-result", "");
        let calc: NoopCalculator = new NoopCalculator("r-result", []);
        let out: CalculatorResult = calc.calculatePure({});
        expect(out.value).toBe("");
        expect(out.explanation).toContain("performCalculationPure not implemented");
    });

    it("surfaces thrown calculation errors", async () => {
        addResultDiv("r-result", "");
        let calc: FailingCalculator = new FailingCalculator("r-result", []);
        await calc.calculate();
        expect(document.getElementById("r-result")!.textContent).toContain("calc exploded");
    });
});
