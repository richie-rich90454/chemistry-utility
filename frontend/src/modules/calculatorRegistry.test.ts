import { describe, it, expect, beforeEach } from "vitest";
import { CalculatorRegistry } from "./calculatorRegistry.js";
import { Calculator } from "./calculator.js";

class StubCalculator extends Calculator {
    constructor(resultId: string, inputs: string[]) {
        super(resultId, inputs);
    }
    protected performCalculation(): void {
        return;
    }
    public getId(): string {
        return "stub";
    }
}

function setupDOM(): void {
    document.body.innerHTML = "";
    const result = document.createElement("div");
    result.id = "stub-result";
    document.body.appendChild(result);
    for (const id of ["in-a", "in-b"]) {
        const input = document.createElement("input");
        input.id = id;
        document.body.appendChild(input);
    }
}

describe("CalculatorRegistry", () => {
    beforeEach(() => {
        setupDOM();
        CalculatorRegistry.getInstance().clear();
    });

    it("returns the same singleton instance", () => {
        expect(CalculatorRegistry.getInstance()).toBe(CalculatorRegistry.getInstance());
    });

    it("registers and retrieves a calculator by id", () => {
        const calc = new StubCalculator("stub-result", ["in-a"]);
        CalculatorRegistry.getInstance().register("stub", calc);
        expect(CalculatorRegistry.getInstance().get("stub")).toBe(calc);
    });

    it("returns undefined for an unregistered id", () => {
        expect(CalculatorRegistry.getInstance().get("missing")).toBeUndefined();
    });

    it("replaces an existing entry on re-register", () => {
        const first = new StubCalculator("stub-result", ["in-a"]);
        const second = new StubCalculator("stub-result", ["in-b"]);
        const registry = CalculatorRegistry.getInstance();
        registry.register("stub", first);
        registry.register("stub", second);
        expect(registry.get("stub")).toBe(second);
    });

    it("unregisters an entry", () => {
        const calc = new StubCalculator("stub-result", ["in-a"]);
        const registry = CalculatorRegistry.getInstance();
        registry.register("stub", calc);
        registry.unregister("stub");
        expect(registry.get("stub")).toBeUndefined();
    });

    it("unregistering a missing id does not throw", () => {
        expect(() => CalculatorRegistry.getInstance().unregister("nope")).not.toThrow();
    });

    it("getAll returns the live map and clear empties it", () => {
        const calc = new StubCalculator("stub-result", ["in-a"]);
        const registry = CalculatorRegistry.getInstance();
        registry.register("stub", calc);
        expect(registry.getAll().get("stub")).toBe(calc);
        expect(registry.getAll().size).toBe(1);
        registry.clear();
        expect(registry.getAll().size).toBe(0);
    });
});
