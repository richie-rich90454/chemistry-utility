import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient } from "./apiClient.js";
import { ServerCalculator } from "./serverCalculator.js";
import { InputElement } from "./inputElement.js";

class TestServerCalculator extends ServerCalculator {
    constructor(calculatorType: string, resultElementId: string) {
        super(calculatorType, resultElementId);
    }

    public callGatherInputs(): Record<string, string> {
        return this.gatherInputs();
    }

    public addTestInput(elementId: string): void {
        const input = new InputElement(elementId);
        (this.inputElements as InputElement[]).push(input);
    }
}

describe("ServerCalculator", () => {
    let resultEl: HTMLElement;
    let clientPostSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});

        resultEl = document.createElement("div");
        resultEl.id = "result";
        document.body.appendChild(resultEl);

        const client = ApiClient.getInstance();
        clientPostSpy = vi.spyOn(client, "post");
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("returns the calculator type via getCalculatorType", () => {
        const calc = new TestServerCalculator("molar-mass", "result");
        expect(calc.getCalculatorType()).toBe("molar-mass");
    });

    it("returns an empty string calculator type when constructed with empty string", () => {
        const calc = new TestServerCalculator("", "result");
        expect(calc.getCalculatorType()).toBe("");
    });

    it("shows the result when the API call succeeds with a result", async () => {
        clientPostSpy.mockResolvedValue({ result: "18.015 g/mol" });
        const calc = new TestServerCalculator("molar-mass", "result");
        await calc.performCalculation();
        expect(resultEl.innerHTML).toBe("18.015 g/mol");
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("does not show a result when the API returns an empty result", async () => {
        clientPostSpy.mockResolvedValue({ result: "" });
        const calc = new TestServerCalculator("molar-mass", "result");
        resultEl.innerHTML = "previous";
        resultEl.classList.remove("show");
        await calc.performCalculation();
        expect(resultEl.innerHTML).toBe("previous");
        expect(resultEl.classList.contains("show")).toBe(false);
    });

    it("does not show a result when the API returns a falsy result", async () => {
        clientPostSpy.mockResolvedValue({ result: "" });
        const calc = new TestServerCalculator("molar-mass", "result");
        await calc.performCalculation();
        expect(resultEl.classList.contains("show")).toBe(false);
    });

    it("shows the error message when the API call throws an Error", async () => {
        clientPostSpy.mockRejectedValue(new Error("Network failure"));
        const calc = new TestServerCalculator("molar-mass", "result");
        await calc.performCalculation();
        expect(resultEl.innerHTML).toContain("Network failure");
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("shows the generic 'Calculation failed' message when a non-Error is thrown", async () => {
        clientPostSpy.mockRejectedValue("string error");
        const calc = new TestServerCalculator("molar-mass", "result");
        await calc.performCalculation();
        expect(resultEl.innerHTML).toContain("Calculation failed");
        expect(resultEl.classList.contains("show")).toBe(true);
    });

    it("posts to the correct endpoint with the calculator type", async () => {
        clientPostSpy.mockResolvedValue({ result: "ok" });
        const calc = new TestServerCalculator("dilution", "result");
        await calc.performCalculation();
        expect(clientPostSpy).toHaveBeenCalledWith("/api/v1/calculators/dilution", {});
    });

    it("gatherInputs returns an empty object when there are no input elements", () => {
        const calc = new TestServerCalculator("molar-mass", "result");
        expect(calc.callGatherInputs()).toEqual({});
    });

    it("gatherInputs collects values from input elements", () => {
        const inputEl = document.createElement("input");
        inputEl.id = "formula";
        inputEl.value = "H2O";
        document.body.appendChild(inputEl);

        const calc = new TestServerCalculator("molar-mass", "result");
        calc.addTestInput("formula");

        const inputs = calc.callGatherInputs();
        expect(inputs["formula"]).toBe("H2O");
    });

    it("gatherInputs collects values from multiple input elements", () => {
        const input1 = document.createElement("input");
        input1.id = "a";
        input1.value = "1";
        const input2 = document.createElement("input");
        input2.id = "b";
        input2.value = "2";
        document.body.appendChild(input1);
        document.body.appendChild(input2);

        const calc = new TestServerCalculator("molar-mass", "result");
        calc.addTestInput("a");
        calc.addTestInput("b");

        const inputs = calc.callGatherInputs();
        expect(inputs).toEqual({ a: "1", b: "2" });
    });

    it("posts the gathered inputs to the API", async () => {
        const inputEl = document.createElement("input");
        inputEl.id = "formula";
        inputEl.value = "NaCl";
        document.body.appendChild(inputEl);

        clientPostSpy.mockResolvedValue({ result: "58.44" });
        const calc = new TestServerCalculator("molar-mass", "result");
        calc.addTestInput("formula");
        await calc.performCalculation();
        expect(clientPostSpy).toHaveBeenCalledWith("/api/v1/calculators/molar-mass", { formula: "NaCl" });
    });
});
