import { describe, it, expect } from "vitest";
import { SignificantFiguresEngine } from "./significantFiguresEngine.js";

describe("SignificantFiguresEngine", () => {
    describe("countSigFigs", () => {
        it("should count sig figs in simple integers", () => {
            expect(SignificantFiguresEngine.countSigFigs("1")).toBe(1);
            expect(SignificantFiguresEngine.countSigFigs("5")).toBe(1);
            expect(SignificantFiguresEngine.countSigFigs("9")).toBe(1);
        });

        it("should count sig figs in multi-digit integers without zeros", () => {
            expect(SignificantFiguresEngine.countSigFigs("12")).toBe(2);
            expect(SignificantFiguresEngine.countSigFigs("123")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("12345")).toBe(5);
        });

        it("should count sig figs with zeros between non-zero digits", () => {
            expect(SignificantFiguresEngine.countSigFigs("1002")).toBe(4);
            expect(SignificantFiguresEngine.countSigFigs("102")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("10101")).toBe(5);
        });

        it("should count sig figs in decimals", () => {
            expect(SignificantFiguresEngine.countSigFigs("1.23")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("0.123")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("12.34")).toBe(4);
        });

        it("should not count leading zeros as significant", () => {
            expect(SignificantFiguresEngine.countSigFigs("0.002")).toBe(1);
            expect(SignificantFiguresEngine.countSigFigs("0.00123")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("0.0005")).toBe(1);
        });

        it("should count trailing zeros after decimal point as significant", () => {
            expect(SignificantFiguresEngine.countSigFigs("2.00")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("1.500")).toBe(4);
            expect(SignificantFiguresEngine.countSigFigs("3.10")).toBe(3);
        });

        it("should count trailing zeros in whole number with decimal as significant", () => {
            expect(SignificantFiguresEngine.countSigFigs("100.")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("10.")).toBe(2);
        });

        it("should return -1 for ambiguous trailing zeros in whole numbers without decimal", () => {
            expect(SignificantFiguresEngine.countSigFigs("100")).toBe(-1);
            expect(SignificantFiguresEngine.countSigFigs("10")).toBe(-1);
        });

        it("should handle scientific notation", () => {
            expect(SignificantFiguresEngine.countSigFigs("1.00e3")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("1.23e5")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("1.00E3")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("5.0e-2")).toBe(2);
        });

        it("should handle negative numbers", () => {
            expect(SignificantFiguresEngine.countSigFigs("-1.23")).toBe(3);
            expect(SignificantFiguresEngine.countSigFigs("-0.0045")).toBe(2);
        });

        it("should handle zero", () => {
            expect(SignificantFiguresEngine.countSigFigs("0")).toBe(1);
        });

        it("should count sig figs in pure-zero decimal values (not return 0)", () => {
            expect(SignificantFiguresEngine.countSigFigs("0.0")).toBe(1);
            expect(SignificantFiguresEngine.countSigFigs("0.00")).toBe(1);
            expect(SignificantFiguresEngine.countSigFigs("0.000")).toBe(1);
            expect(SignificantFiguresEngine.countSigFigs("00.00")).toBe(1);
        });
    });

    describe("roundToSigFigs", () => {
        it("should round to 1 sig fig", () => {
            expect(SignificantFiguresEngine.roundToSigFigs(123, 1)).toBeCloseTo(100, -1);
            expect(SignificantFiguresEngine.roundToSigFigs(0.456, 1)).toBeCloseTo(0.5, 1);
        });

        it("should round to 2 sig figs", () => {
            expect(SignificantFiguresEngine.roundToSigFigs(123, 2)).toBeCloseTo(120, -1);
            expect(SignificantFiguresEngine.roundToSigFigs(0.456, 2)).toBeCloseTo(0.46, 2);
        });

        it("should round to 3 sig figs", () => {
            expect(SignificantFiguresEngine.roundToSigFigs(1.2345, 3)).toBeCloseTo(1.23, 2);
            expect(SignificantFiguresEngine.roundToSigFigs(12345, 3)).toBeCloseTo(12300, -1);
        });

        it("should handle zero", () => {
            expect(SignificantFiguresEngine.roundToSigFigs(0, 3)).toBe(0);
        });

        it("should handle negative numbers", () => {
            expect(SignificantFiguresEngine.roundToSigFigs(-123, 2)).toBeCloseTo(-120, -1);
        });

        it("should handle very small numbers", () => {
            expect(SignificantFiguresEngine.roundToSigFigs(0.0004567, 2)).toBeCloseTo(0.00046, 4);
        });
    });

    describe("multiply", () => {
        it("should use min sig figs for result", () => {
            let result = SignificantFiguresEngine.multiply(2.5, 2, 3.42, 3);
            expect(result.sigFigs).toBe(2);
            expect(result.result).toBeCloseTo(8.6, 0);
        });

        it("should handle equal sig figs", () => {
            let result = SignificantFiguresEngine.multiply(2.00, 3, 3.00, 3);
            expect(result.sigFigs).toBe(3);
            expect(result.result).toBeCloseTo(6.00, 1);
        });

        it("should handle one sig fig", () => {
            let result = SignificantFiguresEngine.multiply(5, 1, 3.14159, 6);
            expect(result.sigFigs).toBe(1);
        });
    });

    describe("add", () => {
        it("should use min decimal places for result", () => {
            let result = SignificantFiguresEngine.add(1.23, 2, 4.5, 1);
            expect(result.decimalPlaces).toBe(1);
            expect(result.result).toBeCloseTo(5.7, 1);
        });

        it("should handle equal decimal places", () => {
            let result = SignificantFiguresEngine.add(1.23, 2, 4.56, 2);
            expect(result.decimalPlaces).toBe(2);
            expect(result.result).toBeCloseTo(5.79, 2);
        });

        it("should handle zero decimal places", () => {
            let result = SignificantFiguresEngine.add(1, 0, 2, 0);
            expect(result.decimalPlaces).toBe(0);
            expect(result.result).toBeCloseTo(3, 0);
        });
    });

    describe("formatResult", () => {
        it("should format normal numbers", () => {
            let result = SignificantFiguresEngine.formatResult(123.45, 5);
            expect(parseFloat(result)).toBeCloseTo(123.45, 1);
        });

        it("should use scientific notation for very large numbers", () => {
            let result = SignificantFiguresEngine.formatResult(1234567, 4);
            expect(result).toContain("e");
        });

        it("should use scientific notation for very small numbers", () => {
            let result = SignificantFiguresEngine.formatResult(0.000123, 2);
            expect(result).toContain("e");
        });

        it("should format zero", () => {
            let result = SignificantFiguresEngine.formatResult(0, 3);
            expect(result).toContain("0");
        });

        it("should format with correct sig figs", () => {
            let result = SignificantFiguresEngine.formatResult(1.234, 3);
            expect(result).toBe("1.23");
        });
    });

    describe("countDecimalPlaces", () => {
        it("should count decimal places", () => {
            expect(SignificantFiguresEngine.countDecimalPlaces("1.23")).toBe(2);
            expect(SignificantFiguresEngine.countDecimalPlaces("1.0")).toBe(1);
            expect(SignificantFiguresEngine.countDecimalPlaces("1")).toBe(0);
            expect(SignificantFiguresEngine.countDecimalPlaces("0.0045")).toBe(4);
        });

        it("should handle scientific notation", () => {
            // Exponent-aware: 1.23e5 = 123000 has 0 decimal places.
            expect(SignificantFiguresEngine.countDecimalPlaces("1.23e5")).toBe(0);
            expect(SignificantFiguresEngine.countDecimalPlaces("1.0E3")).toBe(0);
            expect(SignificantFiguresEngine.countDecimalPlaces("1.23e-2")).toBe(4);
        });
    });
});
