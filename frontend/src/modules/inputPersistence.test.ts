import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {InputPersistence} from "./inputPersistence.js";
describe("InputPersistence", function (): void {
    beforeEach(function (): void {
        InputPersistence.resetInstance();
        localStorage.clear();
    });
    afterEach(function (): void {
        InputPersistence.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });
    describe("getInstance", function (): void {
        it("returns the same singleton instance on subsequent calls", function (): void {
            let a: InputPersistence = InputPersistence.getInstance();
            let b: InputPersistence = InputPersistence.getInstance();
            expect(a).toBe(b);
        });
        it("creates a new instance after resetInstance", function (): void {
            let first: InputPersistence = InputPersistence.getInstance();
            InputPersistence.resetInstance();
            let second: InputPersistence = InputPersistence.getInstance();
            expect(first).not.toBe(second);
        });
    });
    describe("save", function (): void {
        it("stores values under the prefixed key as JSON", function (): void {
            InputPersistence.getInstance().save("gas-laws", {"ideal-P": "1.5", "ideal-V": "2.0"});
            let stored: string | null = localStorage.getItem("calc-inputs-gas-laws");
            expect(stored).not.toBeNull();
            let parsed: {"ideal-P": string; "ideal-V": string} = JSON.parse(stored as string);
            expect(parsed["ideal-P"]).toBe("1.5");
            expect(parsed["ideal-V"]).toBe("2.0");
        });
        it("overwrites existing values on subsequent save", function (): void {
            InputPersistence.getInstance().save("gas-laws", {"ideal-P": "1.5"});
            InputPersistence.getInstance().save("gas-laws", {"ideal-P": "3.0"});
            let stored: string | null = localStorage.getItem("calc-inputs-gas-laws");
            let parsed: {"ideal-P": string} = JSON.parse(stored as string);
            expect(parsed["ideal-P"]).toBe("3.0");
        });
        it("does not throw when localStorage.setItem throws", function (): void {
            let spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (): void {
                throw new Error("QuotaExceededError");
            });
            expect(function (): void {
                InputPersistence.getInstance().save("any", {"k": "v"});
            }).not.toThrow();
            spy.mockRestore();
        });
        it("stores an empty object without error", function (): void {
            InputPersistence.getInstance().save("empty-calc", {});
            let stored: string | null = localStorage.getItem("calc-inputs-empty-calc");
            expect(stored).toBe("{}");
        });
    });
    describe("restore", function (): void {
        it("returns null when no saved data exists", function (): void {
            let result: Record<string, string> | null = InputPersistence.getInstance().restore("nonexistent");
            expect(result).toBeNull();
        });
        it("returns the saved values record", function (): void {
            localStorage.setItem("calc-inputs-gas-laws", JSON.stringify({"ideal-P": "2.5"}));
            let result: Record<string, string> | null = InputPersistence.getInstance().restore("gas-laws");
            expect(result).not.toBeNull();
            expect((result as Record<string, string>)["ideal-P"]).toBe("2.5");
        });
        it("returns null when localStorage.getItem throws", function (): void {
            let spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (): string {
                throw new Error("unavailable");
            });
            let result: Record<string, string> | null = InputPersistence.getInstance().restore("any");
            expect(result).toBeNull();
            spy.mockRestore();
        });
        it("returns null when stored JSON is corrupt", function (): void {
            localStorage.setItem("calc-inputs-corrupt", "{invalid json}");
            let result: Record<string, string> | null = InputPersistence.getInstance().restore("corrupt");
            expect(result).toBeNull();
        });
        it("returns null for null, array and scalar payloads", function (): void {
            localStorage.setItem("calc-inputs-n", "null");
            expect(InputPersistence.getInstance().restore("n")).toBeNull();
            localStorage.setItem("calc-inputs-a", "[1, 2]");
            expect(InputPersistence.getInstance().restore("a")).toBeNull();
            localStorage.setItem("calc-inputs-s", "\"just a string\"");
            expect(InputPersistence.getInstance().restore("s")).toBeNull();
        });
        it("coerces number and boolean values and drops other types", function (): void {
            localStorage.setItem("calc-inputs-mixed", JSON.stringify({"a": 1, "b": true, "c": "x", "d": null}));
            let result: Record<string, string> | null = InputPersistence.getInstance().restore("mixed");
            expect(result).toEqual({"a": "1", "b": "true", "c": "x"});
        });
    });
    describe("clear", function (): void {
        it("removes the saved data from localStorage", function (): void {
            localStorage.setItem("calc-inputs-gas-laws", JSON.stringify({"ideal-P": "1.0"}));
            InputPersistence.getInstance().clear("gas-laws");
            expect(localStorage.getItem("calc-inputs-gas-laws")).toBeNull();
        });
        it("does not throw when key does not exist", function (): void {
            expect(function (): void {
                InputPersistence.getInstance().clear("nonexistent");
            }).not.toThrow();
        });
        it("does not throw when localStorage.removeItem throws", function (): void {
            let spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (): void {
                throw new Error("unavailable");
            });
            expect(function (): void {
                InputPersistence.getInstance().clear("any");
            }).not.toThrow();
            spy.mockRestore();
        });
    });
    describe("integration", function (): void {
        it("save then restore round-trips values", function (): void {
            let persistence: InputPersistence = InputPersistence.getInstance();
            persistence.save("thermo", {"gibbs-deltaH": "-100", "gibbs-T": "298"});
            let restored: Record<string, string> | null = persistence.restore("thermo");
            expect(restored).not.toBeNull();
            expect((restored as Record<string, string>)["gibbs-deltaH"]).toBe("-100");
            expect((restored as Record<string, string>)["gibbs-T"]).toBe("298");
            persistence.clear("thermo");
            expect(persistence.restore("thermo")).toBeNull();
        });
    });
});
