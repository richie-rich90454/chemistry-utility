import { describe, it, expect } from "vitest";
import { formatOptional } from "./elementFormatter.js";

describe("formatOptional", () => {
    it("returns N/A for null", () => {
        expect(formatOptional(null, " eV")).toBe("N/A");
    });

    it("returns N/A for undefined", () => {
        expect(formatOptional(undefined, " eV")).toBe("N/A");
    });

    it("formats a number with the suffix", () => {
        expect(formatOptional(1.5, " eV")).toBe("1.5 eV");
    });

    it("formats zero with the suffix", () => {
        expect(formatOptional(0, " pm")).toBe("0 pm");
    });

    it("formats negative numbers with the suffix", () => {
        expect(formatOptional(-3, "")).toBe("-3");
    });
});
