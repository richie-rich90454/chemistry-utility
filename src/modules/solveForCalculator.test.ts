import { describe, it, expect, beforeEach } from "vitest";
import { SolveForCalculator } from "./solveForCalculator.js";

class ConcreteSolveFor extends SolveForCalculator {
    protected performCalculation(): void {
        return;
    }
}

describe("SolveForCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        const result = document.createElement("div");
        result.id = "calc-result";
        document.body.appendChild(result);
        const input = document.createElement("input");
        input.id = "amount";
        document.body.appendChild(input);
        const select = document.createElement("select");
        select.id = "solve-for";
        for (const v of ["amount", "pressure"]) {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            select.appendChild(opt);
        }
        select.value = "pressure";
        document.body.appendChild(select);
    });

    it("reads the solve-for value from the DOM", () => {
        const calc = new ConcreteSolveFor("calc-result", ["amount"], "solve-for");
        expect(calc.getSolveFor()).toBe("pressure");
    });

    it("reads the solve-for value from an inputs record", () => {
        const calc = new ConcreteSolveFor("calc-result", ["amount"], "solve-for");
        expect(calc.getSolveFor({ "solve-for": "amount" })).toBe("amount");
    });

    it("returns empty string when the key is missing from inputs", () => {
        const calc = new ConcreteSolveFor("calc-result", ["amount"], "solve-for");
        expect(calc.getSolveFor({})).toBe("");
    });

    it("exposes the solve-for element id", () => {
        const calc = new ConcreteSolveFor("calc-result", ["amount"], "solve-for");
        expect((calc as unknown as { solveForElementId: string }).solveForElementId).toBe("solve-for");
    });
});
