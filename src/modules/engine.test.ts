import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEngine, resetEngine } from "./engine.js";
import { RuntimeDetector } from "./runtimeDetector.js";

const DILUTION_INPUTS = {
    "dilution-solve-for": "V2",
    "dilution-M1": "6",
    "dilution-V1": "1",
    "dilution-M2": "3"
};

function stubCalculatorService(
    calculate: unknown,
    list: unknown,
    batch: unknown
): void {
    Object.defineProperty(window, "go", {
        "configurable": true,
        "writable": true,
        "value": {
            "main": {
                "CalculatorService": {
                    "Calculate": calculate,
                    "ListCalculators": list,
                    "BatchCalculate": batch
                }
            }
        }
    });
}

function goCalculator(result: unknown, list: string[] = []): void {
    stubCalculatorService(
        vi.fn().mockResolvedValue(result),
        vi.fn().mockResolvedValue(list),
        vi.fn().mockResolvedValue([])
    );
}

describe("engine", function (): void {
    beforeEach(function (): void {
        resetEngine();
        delete (window as unknown as { go?: unknown }).go;
    });
    afterEach(function (): void {
        resetEngine();
        delete (window as unknown as { go?: unknown }).go;
        vi.restoreAllMocks();
    });

    it("computes with the TypeScript calculators on the web build", async function (): Promise<void> {
        let result = await getEngine().calculate("dilution", DILUTION_INPUTS);
        expect(result.value).not.toBe("");
        expect(result.explanation ?? "").toContain("V2");
    });

    it("returns the error contract for an unknown calculator on the web build", async function (): Promise<void> {
        let result = await getEngine().calculate("nope", {});
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: unknown calculator: nope");
    });

    it("delegates to the Go registry inside the Wails runtime", async function (): Promise<void> {
        goCalculator({ "value": "from-go" }, ["dilution"]);
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let result = await getEngine().calculate("dilution", DILUTION_INPUTS);
        expect(result.value).toBe("from-go");
    });

    it("falls back to the bundled calculator when Go does not implement the id", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn().mockRejectedValue(new Error("unknown calculator: dilution (available: molar-mass)")),
            vi.fn().mockResolvedValue(["molar-mass"]),
            vi.fn().mockResolvedValue([])
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let result = await getEngine().calculate("dilution", DILUTION_INPUTS);
        expect(result.value).not.toBe("");
        expect(result.explanation ?? "").toContain("V2");
    });

    it("surfaces a non-registry Go error instead of recomputing", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn().mockRejectedValue(new Error("runtime exploded")),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockResolvedValue([])
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let result = await getEngine().calculate("dilution", DILUTION_INPUTS);
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: runtime exploded");
    });

    it("lists the union of the Go registry and the bundled calculators", async function (): Promise<void> {
        goCalculator({ "value": "x" }, ["dilution", "molar-mass"]);
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let ids = await getEngine().listCalculators();
        expect(ids).toContain("dilution");
        expect(ids).toContain("molar-mass");
        expect(ids).toContain("beer-lambert");
        expect(ids).toEqual([...ids].sort());
    });

    it("falls back to the bundled batch when Go does not implement the id", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn(),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockRejectedValue(new Error("unknown calculator: dilution (available: molar-mass)"))
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let results = await getEngine().batchCalculate("dilution", [DILUTION_INPUTS, DILUTION_INPUTS]);
        expect(results.length).toBe(2);
        expect(results[0].value).not.toBe("");
    });

    it("reuses the cached engine on later calls", function (): void {
        let first = getEngine();
        expect(getEngine()).toBe(first);
    });

    it("wraps the molar-mass calculator into the CalculatorResult contract", async function (): Promise<void> {
        let result = await getEngine().calculate("molar-mass", { "formula": "H2O" });
        expect(result.value).toContain("Molar Mass");
        expect(result.metadata).toMatchObject({ "formula": "H2O" });
    });

    it("defaults a missing molar-mass formula to the empty string", async function (): Promise<void> {
        let result = await getEngine().calculate("molar-mass", {});
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: Empty formula");
    });

    it("maps a throwing TypeScript calculator to the error contract", async function (): Promise<void> {
        let result = await getEngine().calculate("dilution", {});
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: Invalid calculation type");
    });

    it("returns the error contract for an unknown id through the native fallback", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn().mockRejectedValue(new Error("unknown calculator: nope")),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockResolvedValue([])
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let result = await getEngine().calculate("nope", {});
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: unknown calculator: nope");
    });

    it("stringifies a non-Error Go rejection", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn().mockRejectedValue("go boom"),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockResolvedValue([])
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let result = await getEngine().calculate("dilution", DILUTION_INPUTS);
        expect(result.explanation).toBe("Error: go boom");
    });

    it("maps a non-registry batch rejection to an error row per input", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn(),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockRejectedValue(new Error("batch exploded"))
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let results = await getEngine().batchCalculate("dilution", [DILUTION_INPUTS, DILUTION_INPUTS]);
        expect(results).toEqual([
            { "value": "", "explanation": "Error: batch exploded" },
            { "value": "", "explanation": "Error: batch exploded" }
        ]);
    });

    it("maps an unknown-id batch rejection to an error row per input", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn(),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockRejectedValue(new Error("unknown calculator: nope"))
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let results = await getEngine().batchCalculate("nope", [DILUTION_INPUTS]);
        expect(results).toEqual([{ "value": "", "explanation": "Error: unknown calculator: nope" }]);
    });

    it("lists the bundled calculators on the web build", async function (): Promise<void> {
        let ids = await getEngine().listCalculators();
        expect(ids).toContain("dilution");
        expect(ids).toContain("beer-lambert");
        expect(ids).toEqual([...ids].sort());
    });

    it("batch-calculates on the web build", async function (): Promise<void> {
        let results = await getEngine().batchCalculate("dilution", [DILUTION_INPUTS, DILUTION_INPUTS]);
        expect(results.length).toBe(2);
        expect(results[0].value).not.toBe("");
    });

    it("stringifies a non-Error batch rejection", async function (): Promise<void> {
        stubCalculatorService(
            vi.fn(),
            vi.fn().mockResolvedValue([]),
            vi.fn().mockRejectedValue("batch boom")
        );
        vi.spyOn(RuntimeDetector.prototype, "isWails", "get").mockReturnValue(true);
        let results = await getEngine().batchCalculate("dilution", [DILUTION_INPUTS]);
        expect(results).toEqual([{ "value": "", "explanation": "Error: batch boom" }]);
    });

    it("stringifies a non-Error thrown by a bundled calculator", async function (): Promise<void> {
        vi.resetModules();
        vi.doMock("./calculators/molarMass.js", function () {
            return {
                "molarMass": function (): number {
                    throw "molarmass boom";
                }
            };
        });
        let fresh = await import("./engine.js");
        let result = await fresh.getEngine().calculate("molar-mass", { "formula": "H2O" });
        expect(result.value).toBe("");
        expect(result.explanation).toBe("Error: molarmass boom");
        vi.doUnmock("./calculators/molarMass.js");
        vi.resetModules();
    });
});
