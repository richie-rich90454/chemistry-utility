import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { UnitConverter, calculateUnitConversion } from "./unitConverter.js";

class TestableUnitConverter extends UnitConverter {
    constructor() {
        super();
    }
    public callPerformCalculation(): void {
        this.performCalculation();
    }
}

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

        it("should format numbers >= 100 using toFixed(4)", () => {
            let result = UnitConverter.formatValue(123.456);
            expect(result).toBe("123.4560");
        });

        it("should format numbers >= 1 and < 100 using toFixed(6)", () => {
            let result = UnitConverter.formatValue(42.5);
            expect(result).toBe("42.500000");
        });

        it("should format numbers < 1 using toFixed(8)", () => {
            let result = UnitConverter.formatValue(0.5);
            expect(result).toBe("0.50000000");
        });

        it("should format negative numbers >= 1e6 in exponential", () => {
            let result = UnitConverter.formatValue(-2000000);
            expect(result).toContain("e");
        });

        it("should format negative numbers between 100 and 1e6 using toFixed(4)", () => {
            let result = UnitConverter.formatValue(-150);
            expect(result).toBe("-150.0000");
        });

        it("should format -0 as zero", () => {
            let result = UnitConverter.formatValue(-0);
            expect(result).toBe("0");
        });
    });

    describe("getUnitName", () => {
        it("should return the name of a known unit", () => {
            expect(UnitConverter.getUnitName("length", "m")).toBe("meter");
            expect(UnitConverter.getUnitName("length", "km")).toBe("kilometer");
            expect(UnitConverter.getUnitName("mass", "kg")).toBe("kilogram");
            expect(UnitConverter.getUnitName("pressure", "atm")).toBe("atmosphere");
            expect(UnitConverter.getUnitName("temperature", "K")).toBe("kelvin");
            expect(UnitConverter.getUnitName("energy", "eV")).toBe("electronvolt");
            expect(UnitConverter.getUnitName("time", "min")).toBe("minute");
        });

        it("should return the unit symbol when category is unknown", () => {
            expect(UnitConverter.getUnitName("unknown", "m")).toBe("m");
        });

        it("should return the unit symbol when unit is unknown within a category", () => {
            expect(UnitConverter.getUnitName("length", "lightyear")).toBe("lightyear");
        });
    });

    describe("convertToAll - errors", () => {
        it("should throw for unknown category", () => {
            expect((): void => {
                UnitConverter.convertToAll(1, "m", "unknown");
            }).toThrow("Unknown category");
        });

        it("should throw for unknown from unit", () => {
            expect((): void => {
                UnitConverter.convertToAll(1, "lightyear", "length");
            }).toThrow("Unknown unit");
        });
    });

    describe("convert - mass", () => {
        it("should convert 1 kg to g", () => {
            let result = UnitConverter.convert(1, "kg", "g", "mass");
            expect(result.value).toBeCloseTo(1000, 0);
            expect(result.unitName).toBe("gram");
        });

        it("should convert 1 lb to g", () => {
            let result = UnitConverter.convert(1, "lb", "g", "mass");
            expect(result.value).toBeCloseTo(453.59237, 2);
        });

        it("should convert 1 amu to Da (same value)", () => {
            let result = UnitConverter.convert(1, "amu", "Da", "mass");
            expect(result.value).toBeCloseTo(1, 5);
        });
    });

    describe("convert - volume", () => {
        it("should convert 1 L to mL", () => {
            let result = UnitConverter.convert(1, "L", "mL", "volume");
            expect(result.value).toBeCloseTo(1000, 0);
            expect(result.unitName).toBe("milliliter");
        });

        it("should convert 1 gal to L", () => {
            let result = UnitConverter.convert(1, "gal", "L", "volume");
            expect(result.value).toBeCloseTo(3.785411784, 5);
        });

        it("should convert 1 m^3 to L", () => {
            let result = UnitConverter.convert(1, "m\u00B3", "L", "volume");
            expect(result.value).toBeCloseTo(1000, 0);
        });
    });

    describe("convert - time", () => {
        it("should convert 1 hr to s", () => {
            let result = UnitConverter.convert(1, "hr", "s", "time");
            expect(result.value).toBeCloseTo(3600, 0);
            expect(result.unitName).toBe("second");
        });

        it("should convert 1 day to hr", () => {
            let result = UnitConverter.convert(1, "day", "hr", "time");
            expect(result.value).toBeCloseTo(24, 0);
        });

        it("should convert 1 min to s", () => {
            let result = UnitConverter.convert(1, "min", "s", "time");
            expect(result.value).toBeCloseTo(60, 0);
        });
    });

    describe("convertToAll - normal", () => {
        it("should convert 1 m to all length units (skips source unit)", () => {
            let results = UnitConverter.convertToAll(1, "m", "length");
            expect(results.length).toBe(7);
            let cmValue: number | undefined;
            for (let i = 0; i < results.length; i++) {
                expect(results[i].unit).not.toBe("m");
                if (results[i].unit === "cm") {
                    cmValue = results[i].value;
                }
            }
            expect(cmValue).toBeDefined();
            expect(cmValue).toBeCloseTo(100, 0);
        });

        it("should convert 1 K to all temperature units", () => {
            let results = UnitConverter.convertToAll(1, "K", "temperature");
            expect(results.length).toBe(2);
            let celsiusValue: number | undefined;
            for (let i = 0; i < results.length; i++) {
                if (results[i].unit === "\u00B0C") {
                    celsiusValue = results[i].value;
                }
            }
            expect(celsiusValue).toBeDefined();
            expect(celsiusValue).toBeCloseTo(-272.15, 1);
        });
    });

    describe("performCalculation", () => {
        let resultEl: HTMLElement;
        let valueInput: HTMLInputElement;
        let fromSelect: HTMLSelectElement;
        let toSelect: HTMLSelectElement;
        let categorySelect: HTMLSelectElement;

        beforeEach((): void => {
            document.body.innerHTML = "";
            resultEl = document.createElement("div");
            resultEl.id = "unit-converter-result";
            document.body.appendChild(resultEl);

            valueInput = document.createElement("input");
            valueInput.id = "unit-converter-value";
            document.body.appendChild(valueInput);

            fromSelect = document.createElement("select");
            fromSelect.id = "unit-converter-from-unit";
            fromSelect.innerHTML = '<option value="atm">atm</option>';
            document.body.appendChild(fromSelect);

            toSelect = document.createElement("select");
            toSelect.id = "unit-converter-to-unit";
            document.body.appendChild(toSelect);

            categorySelect = document.createElement("select");
            categorySelect.id = "unit-converter-category";
            categorySelect.innerHTML = '<option value="pressure">pressure</option>';
            document.body.appendChild(categorySelect);
        });

        afterEach((): void => {
            document.body.innerHTML = "";
        });

        it("should compute and display a single-unit conversion", () => {
            valueInput.value = "1";
            fromSelect.value = "atm";
            toSelect.innerHTML = '<option value="Pa">Pa</option>';
            toSelect.value = "Pa";
            categorySelect.value = "pressure";

            let converter = new TestableUnitConverter();
            converter.callPerformCalculation();

            expect(resultEl.innerHTML).toContain("1");
            expect(resultEl.innerHTML).toContain("Pa");
            expect(resultEl.classList.contains("show")).toBe(true);
        });

        it("should render a table when target unit is 'all'", () => {
            valueInput.value = "1";
            fromSelect.value = "atm";
            toSelect.innerHTML = '<option value="all">all</option>';
            toSelect.value = "all";
            categorySelect.value = "pressure";

            let converter = new TestableUnitConverter();
            converter.callPerformCalculation();

            expect(resultEl.innerHTML).toContain("conversion-table");
            expect(resultEl.innerHTML).toContain("Pa");
            expect(resultEl.innerHTML).toContain("mmHg");
            expect(resultEl.innerHTML).toContain("psi");
        });

        it("should add error class and throw when value is NaN", () => {
            valueInput.value = "not-a-number";
            fromSelect.value = "atm";
            toSelect.innerHTML = '<option value="Pa">Pa</option>';
            toSelect.value = "Pa";
            categorySelect.value = "pressure";

            let converter = new TestableUnitConverter();
            expect((): void => {
                converter.callPerformCalculation();
            }).toThrow("Please enter a valid numeric value");
            expect(valueInput.classList.contains("error")).toBe(true);
        });

        it("should add error class and throw when value is empty", () => {
            valueInput.value = "";
            fromSelect.value = "atm";
            toSelect.innerHTML = '<option value="Pa">Pa</option>';
            toSelect.value = "Pa";
            categorySelect.value = "pressure";

            let converter = new TestableUnitConverter();
            expect((): void => {
                converter.callPerformCalculation();
            }).toThrow("Please enter a valid numeric value");
            expect(valueInput.classList.contains("error")).toBe(true);
        });

        it("should support temperature category conversions via DOM", () => {
            valueInput.value = "298";
            fromSelect.innerHTML = '<option value="K">K</option>';
            fromSelect.value = "K";
            toSelect.innerHTML = '<option value="\u00B0C">\u00B0C</option>';
            toSelect.value = "\u00B0C";
            categorySelect.innerHTML = '<option value="temperature">temperature</option>';
            categorySelect.value = "temperature";

            let converter = new TestableUnitConverter();
            converter.callPerformCalculation();

            expect(resultEl.innerHTML).toContain("298");
            expect(resultEl.innerHTML).toContain("\u00B0C");
        });
    });

    describe("calculateUnitConversion", () => {
        let resultEl: HTMLElement;
        let valueInput: HTMLInputElement;
        let fromSelect: HTMLSelectElement;
        let toSelect: HTMLSelectElement;
        let categorySelect: HTMLSelectElement;

        beforeEach((): void => {
            document.body.innerHTML = "";
            resultEl = document.createElement("div");
            resultEl.id = "unit-converter-result";
            document.body.appendChild(resultEl);

            valueInput = document.createElement("input");
            valueInput.id = "unit-converter-value";
            document.body.appendChild(valueInput);

            fromSelect = document.createElement("select");
            fromSelect.id = "unit-converter-from-unit";
            fromSelect.innerHTML = '<option value="m">m</option>';
            document.body.appendChild(fromSelect);

            toSelect = document.createElement("select");
            toSelect.id = "unit-converter-to-unit";
            toSelect.innerHTML = '<option value="cm">cm</option>';
            document.body.appendChild(toSelect);

            categorySelect = document.createElement("select");
            categorySelect.id = "unit-converter-category";
            categorySelect.innerHTML = '<option value="length">length</option>';
            document.body.appendChild(categorySelect);
        });

        afterEach((): void => {
            document.body.innerHTML = "";
        });

        it("runs the full calculate() flow via the exported helper and renders a result", () => {
            valueInput.value = "2";
            fromSelect.value = "m";
            toSelect.value = "cm";
            categorySelect.value = "length";

            calculateUnitConversion();

            expect(resultEl.innerHTML).toContain("200");
            expect(resultEl.innerHTML).toContain("cm");
        });
    });
});
