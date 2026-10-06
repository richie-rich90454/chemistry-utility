import { describe, it, expect } from "vitest";
import { resolveResult } from "./resultResolver.js";

describe("resolveResult", () => {
    it("routes empty value to setError with explanation", () => {
        let result = "unset";
        let error = "unset";
        resolveResult(
            { value: "", explanation: "Error: bad input" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("Error: bad input");
        expect(result).toBe("");
    });

    it("routes empty value with no explanation to generic failure", () => {
        let result = "unset";
        let error = "unset";
        resolveResult(
            { value: "" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("Calculation failed");
        expect(result).toBe("");
    });

    it("routes Error-prefixed explanation to setError even with value", () => {
        let result = "unset";
        let error = "unset";
        resolveResult(
            { value: "42", explanation: "Error: exploded" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("Error: exploded");
        expect(result).toBe("");
    });

    it("routes Error-prefixed empty explanation fallback when value present but explanation empty", () => {
        let result = "unset";
        let error = "unset";
        resolveResult(
            { value: "", explanation: "" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("Calculation failed");
        expect(result).toBe("");
    });

    it("sets result to explanation when explanation is non-empty success", () => {
        let result = "";
        let error = "unset";
        resolveResult(
            { value: "42", explanation: "forty-two" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("");
        expect(result).toBe("forty-two");
    });

    it("sets result to value when explanation is missing", () => {
        let result = "";
        let error = "unset";
        resolveResult(
            { value: "42" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("");
        expect(result).toBe("42");
    });

    it("sets result to value when explanation is empty string", () => {
        let result = "";
        let error = "unset";
        resolveResult(
            { value: "42", explanation: "" },
            (v) => { result = v; },
            (v) => { error = v; },
        );
        expect(error).toBe("");
        expect(result).toBe("42");
    });
});
