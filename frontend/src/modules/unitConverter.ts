import { Calculator } from "./calculator.js";

interface UnitDefinition {
    name: string;
    toBase: number;
}

interface TemperatureConversion {
    toBase: (value: number) => number;
    fromBase: (value: number) => number;
}

interface UnitCategory {
    baseUnit: string;
    units: Record<string, UnitDefinition>;
    temperatureConversions?: Record<string, TemperatureConversion>;
}

const CATEGORIES: Record<string, UnitCategory> = {
    length: {
        baseUnit: "m",
        units: {
            "pm": { name: "picometer", toBase: 1e-12 },
            "\u00C5": { name: "angstrom", toBase: 1e-10 },
            "nm": { name: "nanometer", toBase: 1e-9 },
            "\u00B5m": { name: "micrometer", toBase: 1e-6 },
            "mm": { name: "millimeter", toBase: 1e-3 },
            "cm": { name: "centimeter", toBase: 1e-2 },
            "m": { name: "meter", toBase: 1 },
            "km": { name: "kilometer", toBase: 1e3 }
        }
    },
    mass: {
        baseUnit: "g",
        units: {
            "amu": { name: "atomic mass unit", toBase: 1.6605390666e-24 },
            "Da": { name: "dalton", toBase: 1.6605390666e-24 },
            "\u00B5g": { name: "microgram", toBase: 1e-6 },
            "mg": { name: "milligram", toBase: 1e-3 },
            "g": { name: "gram", toBase: 1 },
            "kg": { name: "kilogram", toBase: 1e3 },
            "lb": { name: "pound", toBase: 453.59237 },
            "oz": { name: "ounce", toBase: 28.349523125 }
        }
    },
    volume: {
        baseUnit: "L",
        units: {
            "\u00B5L": { name: "microliter", toBase: 1e-6 },
            "mL": { name: "milliliter", toBase: 1e-3 },
            "cm\u00B3": { name: "cubic centimeter", toBase: 1e-3 },
            "L": { name: "liter", toBase: 1 },
            "m\u00B3": { name: "cubic meter", toBase: 1e3 },
            "gal": { name: "gallon (US)", toBase: 3.785411784 },
            "qt": { name: "quart (US)", toBase: 0.946352946 },
            "ft\u00B3": { name: "cubic foot", toBase: 28.316846592 }
        }
    },
    pressure: {
        baseUnit: "Pa",
        units: {
            "Pa": { name: "pascal", toBase: 1 },
            "kPa": { name: "kilopascal", toBase: 1e3 },
            "bar": { name: "bar", toBase: 1e5 },
            "atm": { name: "atmosphere", toBase: 101325 },
            "mmHg": { name: "millimeters of mercury", toBase: 133.322368421 },
            "torr": { name: "torr", toBase: 133.322368421 },
            "psi": { name: "pounds per square inch", toBase: 6894.757293168 }
        }
    },
    energy: {
        baseUnit: "J",
        units: {
            "erg": { name: "erg", toBase: 1e-7 },
            "J": { name: "joule", toBase: 1 },
            "kJ": { name: "kilojoule", toBase: 1e3 },
            "cal": { name: "calorie", toBase: 4.184 },
            "kcal": { name: "kilocalorie", toBase: 4184 },
            "eV": { name: "electronvolt", toBase: 1.602176634e-19 },
            "BTU": { name: "British thermal unit", toBase: 1055.06 }
        }
    },
    temperature: {
        baseUnit: "K",
        units: {
            "K": { name: "kelvin", toBase: 1 },
            "\u00B0C": { name: "celsius", toBase: 1 },
            "\u00B0F": { name: "fahrenheit", toBase: 1 }
        },
        temperatureConversions: {
            "K": {
                toBase: function(value: number): number { return value; },
                fromBase: function(value: number): number { return value; }
            },
            "\u00B0C": {
                toBase: function(value: number): number { return value + 273.15; },
                fromBase: function(value: number): number { return value - 273.15; }
            },
            "\u00B0F": {
                toBase: function(value: number): number { return (value - 32) * 5 / 9 + 273.15; },
                fromBase: function(value: number): number { return (value - 273.15) * 9 / 5 + 32; }
            }
        }
    },
    concentration: {
        baseUnit: "M",
        units: {
            "\u00B5M": { name: "micromolar", toBase: 1e-6 },
            "mM": { name: "millimolar", toBase: 1e-3 },
            "M": { name: "molar", toBase: 1 },
            "ppt": { name: "parts per trillion", toBase: 1e-12 },
            "ppb": { name: "parts per billion", toBase: 1e-9 },
            "ppm": { name: "parts per million", toBase: 1e-6 },
            "%": { name: "percent", toBase: 1e-2 }
        }
    },
    time: {
        baseUnit: "s",
        units: {
            "\u00B5s": { name: "microsecond", toBase: 1e-6 },
            "ms": { name: "millisecond", toBase: 1e-3 },
            "s": { name: "second", toBase: 1 },
            "min": { name: "minute", toBase: 60 },
            "hr": { name: "hour", toBase: 3600 },
            "day": { name: "day", toBase: 86400 }
        }
    }
};

export interface ConversionResult {
    value: number;
    unit: string;
    unitName: string;
}

export class UnitConverter extends Calculator {

    constructor() {
        super("unit-converter-result", [
            "unit-converter-value",
            "unit-converter-from-unit",
            "unit-converter-to-unit",
            "unit-converter-category"
        ]);
    }

    public static getCategories(): string[] {
        return Object.keys(CATEGORIES);
    }

    public static getUnitsForCategory(category: string): string[] {
        let cat = CATEGORIES[category];
        if (!cat) {
            return [];
        }
        return Object.keys(cat.units);
    }

    public static getUnitName(category: string, unit: string): string {
        let cat = CATEGORIES[category];
        if (!cat || !cat.units[unit]) {
            return unit;
        }
        return cat.units[unit].name;
    }

    /**
     * Molarity (M) and mass fractions (ppm/ppb/ppt/%) share one linear
     * scale in the table above, but converting between the two families
     * is NOT linear: it needs the solute molar mass and the solution
     * density. These helpers keep within-family conversions working while
     * refusing cross-family ones with an explicit message instead of a
     * silently wrong number (which would assume water-like density).
     */
    private static concentrationGroup(unit: string): "molar" | "mass" {
        // Every validated concentration unit belongs to a family below;
        // anything else cannot reach here (convert/convertToAll validate
        // units first) and is treated as mass-family so cross-family
        // conversion still refuses rather than silently converting.
        if (unit === "µM" || unit === "mM" || unit === "M") {
            return "molar";
        }
        return "mass";
    }

    public static convert(value: number, fromUnit: string, toUnit: string, category: string): ConversionResult {
        let cat = CATEGORIES[category];
        if (!cat) {
            throw new Error("Unknown category: " + category);
        }
        if (!cat.units[fromUnit]) {
            throw new Error("Unknown unit: " + fromUnit);
        }
        if (!cat.units[toUnit]) {
            throw new Error("Unknown unit: " + toUnit);
        }
        if (category === "concentration") {
            let fromGroup = UnitConverter.concentrationGroup(fromUnit);
            let toGroup = UnitConverter.concentrationGroup(toUnit);
            // Groups are never null for validated units (see above).
            if (fromGroup !== toGroup) {
                throw new Error("Cannot convert " + fromUnit + " to " + toUnit + ": molarity/mass-fraction conversion requires the solute molar mass and solution density");
            }
        }
        if (category === "temperature" && cat.temperatureConversions) {
            let baseValue = cat.temperatureConversions[fromUnit].toBase(value);
            let result = cat.temperatureConversions[toUnit].fromBase(baseValue);
            return {
                value: result,
                unit: toUnit,
                unitName: cat.units[toUnit].name
            };
        }
        let baseValue = value * cat.units[fromUnit].toBase;
        let result = baseValue / cat.units[toUnit].toBase;
        return {
            value: result,
            unit: toUnit,
            unitName: cat.units[toUnit].name
        };
    }

    public static convertToAll(value: number, fromUnit: string, category: string): ConversionResult[] {
        let cat = CATEGORIES[category];
        if (!cat) {
            throw new Error("Unknown category: " + category);
        }
        if (!cat.units[fromUnit]) {
            throw new Error("Unknown unit: " + fromUnit);
        }
        let results: ConversionResult[] = [];
        let unitKeys = Object.keys(cat.units);
        // For concentration, only list same-family targets: cross-family
        // pairs throw in convert(), and "convert to all" must not error out.
        let fromGroup: "molar" | "mass" | null = null;
        if (category === "concentration") {
            fromGroup = UnitConverter.concentrationGroup(fromUnit);
        }
        for (let i = 0; i < unitKeys.length; i++) {
            let toUnit = unitKeys[i];
            if (toUnit === fromUnit) {
                continue;
            }
            if (fromGroup !== null && UnitConverter.concentrationGroup(toUnit) !== fromGroup) {
                continue;
            }
            results.push(UnitConverter.convert(value, fromUnit, toUnit, category));
        }
        return results;
    }

    protected performCalculation(): void {
        let valueInput = this.getInput("unit-converter-value");
        let value = valueInput.getValue();
        if (isNaN(value)) {
            let inputEl = document.getElementById("unit-converter-value") as HTMLInputElement;
            if (inputEl) {
                inputEl.classList.add("error");
            }
            throw new Error("Please enter a valid numeric value");
        }
        let fromSelect = document.getElementById("unit-converter-from-unit") as HTMLSelectElement;
        let toSelect = document.getElementById("unit-converter-to-unit") as HTMLSelectElement;
        let categorySelect = document.getElementById("unit-converter-category") as HTMLSelectElement;
        let fromUnit = fromSelect.value;
        let toUnit = toSelect.value;
        let category = categorySelect.value;

        if (toUnit === "all") {
            let results = UnitConverter.convertToAll(value, fromUnit, category);
            let html = "<p>Converting " + value + " " + fromUnit + " to all " + category + " units:</p>";
            html += "<table class=\"conversion-table\"><thead><tr><th>Unit</th><th>Value</th></tr></thead><tbody>";
            for (let i = 0; i < results.length; i++) {
                html += "<tr><td>" + results[i].unit + " (" + results[i].unitName + ")</td>";
                html += "<td>" + UnitConverter.formatValue(results[i].value) + "</td></tr>";
            }
            html += "</tbody></table>";
            this.resultDisplay.showResult(html);
        } else {
            let result = UnitConverter.convert(value, fromUnit, toUnit, category);
            let html = "<p>" + value + " " + fromUnit + " = " + UnitConverter.formatValue(result.value) + " " + result.unit + "</p>";
            this.resultDisplay.showResult(html);
        }
    }

    public static formatValue(value: number): string {
        if (value === 0) {
            return "0";
        }
        let absValue = Math.abs(value);
        if (absValue >= 1e6 || (absValue < 1e-4 && absValue !== 0)) {
            return value.toExponential(6);
        }
        if (absValue >= 100) {
            return value.toFixed(4);
        }
        if (absValue >= 1) {
            return value.toFixed(6);
        }
        return value.toFixed(8);
    }
}

export function calculateUnitConversion(): void {
    let converter = new UnitConverter();
    converter.calculate();
}
