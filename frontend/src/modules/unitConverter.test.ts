import { describe, it, expect } from "vitest";
import { UnitConverter } from "./unitConverter.js";

describe("UnitConverter", () => {
    describe("getCategories", () => {
        it("should return all unit categories", () => {
            let categories = UnitConverter.getCategories();
            expect(categories).toContain("length");
            expect(categories).toContain("mass");
            expect(categories).toContain("volume");
            expect(categories).toContain("pressure");
            expect(categories).toContain("energy");
            expect(categories).toContain("temperature");
            expect(categories).toContain("concentration");
            expect(categories).toContain("time");
        });
    });

    describe("getUnitsForCategory", () => {
        it("should return length units", () => {
            let units = UnitConverter.getUnitsForCategory("length");
            expect(units).toContain("m");
            expect(units).toContain("cm");
            expect(units).toContain("km");
            expect(units).toContain("nm");
            expect(units).toContain("pm");
            expect(units).toContain("\u00C5");
            expect(units).toContain("\u00B5m");
            expect(units).toContain("mm");
        });

        it("should return empty array for unknown category", () => {
            let units = UnitConverter.getUnitsForCategory("unknown");
            expect(units).toHaveLength(0);
        });
    });

    describe("convert - pressure", () => {
        it("should convert 1 atm to Pa", () => {
            let result = UnitConverter.convert(1, "atm", "Pa", "pressure");
            expect(result.value).toBeCloseTo(101325, 0);
            expect(result.unit).toBe("Pa");
        });

        it("should convert 1 atm to kPa", () => {
            let result = UnitConverter.convert(1, "atm", "kPa", "pressure");
            expect(result.value).toBeCloseTo(101.325, 1);
        });

        it("should convert 1 atm to bar", () => {
            let result = UnitConverter.convert(1, "atm", "bar", "pressure");
            expect(result.value).toBeCloseTo(1.01325, 2);
        });

        it("should convert 1 atm to mmHg", () => {
            let result = UnitConverter.convert(1, "atm", "mmHg", "pressure");
            expect(result.value).toBeCloseTo(760, 0);
        });

        it("should convert 1 atm to torr", () => {
            let result = UnitConverter.convert(1, "atm", "torr", "pressure");
            expect(result.value).toBeCloseTo(760, 0);
        });

        it("should convert 1 atm to psi", () => {
            let result = UnitConverter.convert(1, "atm", "psi", "pressure");
            expect(result.value).toBeCloseTo(14.696, 0);
        });

        it("should reverse convert Pa to atm", () => {
            let result = UnitConverter.convert(101325, "Pa", "atm", "pressure");
            expect(result.value).toBeCloseTo(1, 3);
        });
    });

    describe("convert - temperature", () => {
        it("should convert 298 K to Celsius", () => {
            let result = UnitConverter.convert(298, "K", "\u00B0C", "temperature");
            expect(result.value).toBeCloseTo(24.85, 1);
        });

        it("should convert 298 K to Fahrenheit", () => {
            let result = UnitConverter.convert(298, "K", "\u00B0F", "temperature");
            expect(result.value).toBeCloseTo(76.73, 0);
        });

        it("should convert 0 C to K", () => {
            let result = UnitConverter.convert(0, "\u00B0C", "K", "temperature");
            expect(result.value).toBeCloseTo(273.15, 1);
        });

        it("should convert 100 C to Fahrenheit", () => {
            let result = UnitConverter.convert(100, "\u00B0C", "\u00B0F", "temperature");
            expect(result.value).toBeCloseTo(212, 0);
        });

        it("should convert 32 F to Celsius", () => {
            let result = UnitConverter.convert(32, "\u00B0F", "\u00B0C", "temperature");
            expect(result.value).toBeCloseTo(0, 1);
        });

        it("should convert -40 F to Celsius", () => {
            let result = UnitConverter.convert(-40, "\u00B0F", "\u00B0C", "temperature");
            expect(result.value).toBeCloseTo(-40, 1);
        });

        it("should convert 0 K to Celsius", () => {
            let result = UnitConverter.convert(0, "K", "\u00B0C", "temperature");
            expect(result.value).toBeCloseTo(-273.15, 1);
        });

        it("should handle negative Celsius temperatures", () => {
            let result = UnitConverter.convert(-273.15, "\u00B0C", "K", "temperature");
            expect(result.value).toBeCloseTo(0, 2);
        });
    });

    describe("convert - concentration", () => {
        it("should convert 1 M to mM", () => {
            let result = UnitConverter.convert(1, "M", "mM", "concentration");
            expect(result.value).toBeCloseTo(1000, 0);
        });

        it("should convert 1 M to uM", () => {
            let result = UnitConverter.convert(1, "M", "\u00B5M", "concentration");
            expect(result.value).toBeCloseTo(1e6, 0);
        });

        it("should reverse convert mM to M", () => {
            let result = UnitConverter.convert(500, "mM", "M", "concentration");
            expect(result.value).toBeCloseTo(0.5, 3);
        });
    });

    describe("convert - energy", () => {
        it("should convert 1 eV to J", () => {
            let result = UnitConverter.convert(1, "eV", "J", "energy");
            expect(result.value).toBeCloseTo(1.602176634e-19, 25);
        });

        it("should convert 1 eV to kJ", () => {
            let result = UnitConverter.convert(1, "eV", "kJ", "energy");
            expect(result.value).toBeCloseTo(1.602176634e-22, 30);
        });

        it("should convert 1 kJ to J", () => {
            let result = UnitConverter.convert(1, "kJ", "J", "energy");
            expect(result.value).toBeCloseTo(1000, 0);
        });

        it("should convert 1 kcal to cal", () => {
            let result = UnitConverter.convert(1, "kcal", "cal", "energy");
            expect(result.value).toBeCloseTo(1000, 0);
        });
    });

    describe("convert - length", () => {
        it("should convert 1 m to cm", () => {
            let result = UnitConverter.convert(1, "m", "cm", "length");
            expect(result.value).toBeCloseTo(100, 0);
        });

        it("should convert 1 nm to m", () => {
            let result = UnitConverter.convert(1, "nm", "m", "length");
            expect(result.value).toBeCloseTo(1e-9, 12);
        });
    });

    describe("convertToAll", () => {
        it("should convert 1 atm to all pressure units", () => {
            let results = UnitConverter.convertToAll(1, "atm", "pressure");
            expect(results.length).toBeGreaterThan(0);
            // Should not include the from unit itself
            for (let i = 0; i < results.length; i++) {
                expect(results[i].unit).not.toBe("atm");
            }
        });
    });

    describe("edge cases", () => {
        it("should handle zero value", () => {
            let result = UnitConverter.convert(0, "atm", "Pa", "pressure");
            expect(result.value).toBe(0);
        });

        it("should handle negative temperature", () => {
            let result = UnitConverter.convert(-40, "\u00B0F", "\u00B0C", "temperature");
            expect(result.value).toBeCloseTo(-40, 1);
        });

        it("should throw for unknown category", () => {
            expect(function(): void {
                UnitConverter.convert(1, "m", "cm", "unknown");
            }).toThrow("Unknown category");
        });

        it("should throw for unknown from unit", () => {
            expect(function(): void {
                UnitConverter.convert(1, "xyz", "cm", "length");
            }).toThrow("Unknown unit");
        });

        it("should throw for unknown to unit", () => {
            expect(function(): void {
                UnitConverter.convert(1, "m", "xyz", "length");
            }).toThrow("Unknown unit");
        });
    });

    describe("formatValue", () => {
        it("should format zero", () => {
            expect(UnitConverter.formatValue(0)).toBe("0");
        });

        it("should format large numbers", () => {
            let result = UnitConverter.formatValue(1000000);
            expect(result).toContain("e");
        });

        it("should format very small numbers", () => {
            let result = UnitConverter.formatValue(1e-10);
            expect(result).toContain("e");
        });

        it("should format normal numbers", () => {
            let result = UnitConverter.formatValue(42.5);
            expect(parseFloat(result)).toBeCloseTo(42.5, 1);
        });
    });
});
