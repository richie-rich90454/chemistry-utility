import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CalculatorBuilder, BuiltCalculator } from "./calculatorBuilder.js";
import type { InputProvider } from "./inputProvider.js";

function createMockInputProvider(values: Record<string, string> = {}): InputProvider {
    return {
        getValue: (id: string) => parseFloat(values[id] ?? ""),
        getStringValue: (id: string) => values[id] ?? "",
        getElement: (id: string) => {
            const el = document.getElementById(id);
            return el;
        },
    };
}

describe("CalculatorBuilder", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("throws when build is called without setting a result display id", () => {
        const builder = new CalculatorBuilder().setCalculation(() => {});
        expect(() => builder.build()).toThrow("result display id is required");
    });

    it("throws when build is called without setting a calculation function", () => {
        const builder = new CalculatorBuilder().setResultDisplay("result");
        expect(() => builder.build()).toThrow("calculation function is required");
    });

    it("throws when build is called with neither result display nor calculation", () => {
        const builder = new CalculatorBuilder();
        expect(() => builder.build()).toThrow("result display id is required");
    });

    it("builds a calculator when result display and calculation are provided", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const builder = new CalculatorBuilder()
            .setResultDisplay("result")
            .setCalculation(() => {});

        const calc = builder.build();
        expect(calc).toBeInstanceOf(BuiltCalculator);
    });

    it("uses DomInputProvider by default when no provider is set", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        const inputEl = document.createElement("input");
        inputEl.id = "my-input";
        inputEl.value = "10";
        document.body.appendChild(resultEl);
        document.body.appendChild(inputEl);

        const builder = new CalculatorBuilder()
            .addInput("value", "my-input")
            .setResultDisplay("result")
            .setCalculation(() => {});

        const calc = builder.build();
        expect(calc).toBeInstanceOf(BuiltCalculator);
    });

    it("uses the custom InputProvider when one is set", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const provider = createMockInputProvider({ "my-input": "20" });
        const builder = new CalculatorBuilder()
            .addInput("value", "my-input")
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {});

        const calc = builder.build();
        expect(calc).toBeInstanceOf(BuiltCalculator);
    });

    it("supports fluent chaining that returns the builder instance", () => {
        const builder = new CalculatorBuilder();
        expect(builder.addInput("a", "a-id")).toBe(builder);
        expect(builder.addSolveFor("solve-id")).toBe(builder);
        expect(builder.setResultDisplay("result")).toBe(builder);
        expect(builder.setCalculation(() => {})).toBe(builder);
        expect(builder.setCalculationPure((inputs) => ({ value: inputs["a"] ?? "" }))).toBe(builder);
    });

    it("setInputProvider returns the builder instance for chaining", () => {
        const builder = new CalculatorBuilder();
        const provider = createMockInputProvider();
        expect(builder.setInputProvider(provider)).toBe(builder);
    });

    it("builds a calculator with a solve-for select element", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        const selectEl = document.createElement("select");
        selectEl.id = "solve-for";
        const option = document.createElement("option");
        option.value = "P";
        option.selected = true;
        selectEl.appendChild(option);
        document.body.appendChild(resultEl);
        document.body.appendChild(selectEl);

        const provider = createMockInputProvider();
        const builder = new CalculatorBuilder()
            .addSolveFor("solve-for")
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {});

        const calc = builder.build();
        expect(calc.getSolveFor()).toBe("P");
    });

    it("returns empty string from getSolveFor when no solve-for element is configured", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const provider = createMockInputProvider();
        const builder = new CalculatorBuilder()
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {});

        const calc = builder.build();
        expect(calc.getSolveFor()).toBe("");
    });
});

describe("BuiltCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("invokes the calculation function with itself when calculate is called", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const provider = createMockInputProvider();
        const receivedCalc: BuiltCalculator[] = [];
        const builder = new CalculatorBuilder()
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(function (calc: BuiltCalculator): void {
                receivedCalc.push(calc);
            });

        const calc = builder.build();
        calc.calculate();
        expect(receivedCalc.length).toBe(1);
        expect(receivedCalc[0]).toBe(calc);
    });

    it("reads solve-for value from the provider's element", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        const selectEl = document.createElement("select");
        selectEl.id = "solve-for-2";
        const option = document.createElement("option");
        option.value = "V";
        option.selected = true;
        selectEl.appendChild(option);
        document.body.appendChild(resultEl);
        document.body.appendChild(selectEl);

        const provider = createMockInputProvider();
        const builder = new CalculatorBuilder()
            .addSolveFor("solve-for-2")
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {});

        const calc = builder.build();
        expect(calc.getSolveFor()).toBe("V");
    });

    it("can access the calculation function via calculate and produce side effects", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        let called = 0;
        const provider = createMockInputProvider();
        const builder = new CalculatorBuilder()
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {
                called++;
            });

        const calc = builder.build();
        calc.calculate();
        calc.calculate();
        expect(called).toBe(2);
    });

    it("delegates calculatePure to the pure function when set", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const provider = createMockInputProvider();
        const builder = new CalculatorBuilder()
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {})
            .setCalculationPure((inputs) => ({ value: "pure:" + (inputs["a"] ?? "") }));

        const calc = builder.build();
        expect(calc.calculatePure({ a: "7" })).toEqual({ value: "pure:7" });
    });

    it("calculatePure surfaces the default error when no pure function is set", () => {
        const resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const provider = createMockInputProvider();
        const builder = new CalculatorBuilder()
            .setResultDisplay("result")
            .setInputProvider(provider)
            .setCalculation(() => {});

        const calc = builder.build();
        const result = calc.calculatePure({ a: "7" });
        expect(result.value).toBe("");
        expect(result.explanation).toContain("Error");
    });
});
