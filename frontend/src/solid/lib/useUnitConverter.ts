import {createSignal} from "solid-js";
import {UnitConverter, ConversionResult} from "../../modules/unitConverter.js";
interface ConversionRow {
    unit: string;
    unitName: string;
    value: string;
}
interface ConversionDisplay {
    sourceValue: string;
    sourceUnit: string;
    targetValue: string;
    targetUnit: string;
    targetUnitName: string;
    isTable: boolean;
    rows: ConversionRow[];
}
function useUnitConverter(): {
    category: () => string;
    setCategory: (next: string) => void;
    fromUnit: () => string;
    setFromUnit: (next: string) => void;
    toUnit: () => string;
    setToUnit: (next: string) => void;
    value: () => string;
    setValue: (next: string) => void;
    result: () => ConversionDisplay | null;
    error: () => string;
    convert: () => void;
    clear: () => void;
    categories: () => string[];
    unitsForCategory: (category: string) => string[];
} {
    let categories: string[] = UnitConverter.getCategories();
    let initialCategory: string = categories[0];
    let initialUnits: string[] = UnitConverter.getUnitsForCategory(initialCategory);
    let initialFrom: string = initialUnits[0];
    let initialTo: string = initialUnits.length > 1 ? initialUnits[1] : initialUnits[0];
    let [category, setCategorySignal] = createSignal(initialCategory);
    let [fromUnit, setFromUnitSignal] = createSignal(initialFrom);
    let [toUnit, setToUnitSignal] = createSignal(initialTo);
    let [value, setValueSignal] = createSignal("");
    let [result, setResult] = createSignal<ConversionDisplay | null>(null);
    let [error, setError] = createSignal("");
    function setCategory(next: string): void {
        setCategorySignal(next);
        let units = UnitConverter.getUnitsForCategory(next);
        if (units.length === 0) {
            setFromUnitSignal("");
            setToUnitSignal("");
            setResult(null);
            setError("");
            return;
        }
        setFromUnitSignal(units[0]);
        setToUnitSignal(units.length > 1 ? units[1] : units[0]);
        setResult(null);
        setError("");
    }
    function setFromUnit(next: string): void {
        setFromUnitSignal(next);
    }
    function setToUnit(next: string): void {
        setToUnitSignal(next);
    }
    function setValue(next: string): void {
        setValueSignal(next);
    }
    function convert(): void {
        setError("");
        setResult(null);
        let trimmed = value().trim();
        if (trimmed === "") {
            setError("Please enter a numeric value");
            return;
        }
        let numeric = Number(trimmed);
        if (isNaN(numeric)) {
            setError("Please enter a valid numeric value");
            return;
        }
        let currentCategory = category();
        let currentFrom = fromUnit();
        let currentTo = toUnit();
        try {
            if (currentTo === "all") {
                let conversions = UnitConverter.convertToAll(numeric, currentFrom, currentCategory);
                let rows: ConversionRow[] = [];
                for (let i = 0; i < conversions.length; i++) {
                    let c: ConversionResult = conversions[i];
                    rows.push({
                        unit: c.unit,
                        unitName: c.unitName,
                        value: UnitConverter.formatValue(c.value)
                    });
                }
                setResult({
                    sourceValue: trimmed,
                    sourceUnit: currentFrom,
                    targetValue: "",
                    targetUnit: "all",
                    targetUnitName: "all " + currentCategory + " units",
                    isTable: true,
                    rows: rows
                });
                return;
            }
            let res: ConversionResult = UnitConverter.convert(numeric, currentFrom, currentTo, currentCategory);
            setResult({
                sourceValue: trimmed,
                sourceUnit: currentFrom,
                targetValue: UnitConverter.formatValue(res.value),
                targetUnit: res.unit,
                targetUnitName: res.unitName,
                isTable: false,
                rows: []
            });
        }
        catch (err) {
            let message = err instanceof Error ? err.message : String(err);
            setError(message);
        }
    }
    function clear(): void {
        setValueSignal("");
        setResult(null);
        setError("");
    }
    function unitsForCategory(cat: string): string[] {
        return UnitConverter.getUnitsForCategory(cat);
    }
    return {
        category: category,
        setCategory: setCategory,
        fromUnit: fromUnit,
        setFromUnit: setFromUnit,
        toUnit: toUnit,
        setToUnit: setToUnit,
        value: value,
        setValue: setValue,
        result: result,
        error: error,
        convert: convert,
        clear: clear,
        categories: function (): string[] {
            return categories;
        },
        unitsForCategory: unitsForCategory
    };
}
export {useUnitConverter};
export type {ConversionDisplay, ConversionRow};
