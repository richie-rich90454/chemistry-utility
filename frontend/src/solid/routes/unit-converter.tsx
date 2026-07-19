/**
 * Visual verification: The Solid-rendered Unit Converter card should match the
 * legacy #unit-converter card. Intentional diff: legacy only initialized the
 * card after a hash navigation via eventListeners (now removed); this route
 * mounts declaratively, exposes a "Convert to all units" target via the
 * to-unit dropdown, and surfaces a Clear button (legacy lacked one). No
 * Playwright screenshot test is added per task spec; parity is verified by
 * manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, For} from "solid-js";
import {UnitConverter, ConversionResult} from "../../modules/unitConverter.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./unit-converter.module.css";
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
function UnitConverterRoute(): JSX.Element {
    let categories: string[] = UnitConverter.getCategories();
    let [category, setCategorySignal] = createSignal(categories[0]);
    let [fromUnit, setFromUnitSignal] = createSignal(UnitConverter.getUnitsForCategory(categories[0])[0]);
    let [toUnit, setToUnitSignal] = createSignal(UnitConverter.getUnitsForCategory(categories[0])[1] || UnitConverter.getUnitsForCategory(categories[0])[0]);
    let [value, setValueSignal] = createSignal("");
    let [result, setResult] = createSignal<ConversionDisplay | null>(null);
    let [error, setError] = createSignal("");
    function setCategory(next: string): void {
        setCategorySignal(next);
        let units = UnitConverter.getUnitsForCategory(next);
        if (units.length === 0) {
            setFromUnitSignal("");
            setToUnitSignal("");
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
                    let c = conversions[i];
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
    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setValue(target.value);
    }
    function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            convert();
        }
    }
    function handleCategoryChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setCategory(target.value);
    }
    function handleFromUnitChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setFromUnit(target.value);
    }
    function handleToUnitChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setToUnit(target.value);
    }
    function getInputClass(): string {
        if (error() !== "") {
            return styles.input + " " + styles.error;
        }
        return styles.input;
    }
    function renderResult(): JSX.Element {
        let res = result();
        if (res === null) {
            return <></>;
        }
        if (res.isTable) {
            return (
                <div class={styles.result}>
                    <p>{"Converting " + res.sourceValue + " " + res.sourceUnit + " to " + res.targetUnitName + ":"}</p>
                    <table class={styles.conversionTable}>
                        <thead>
                            <tr>
                                <th>{"Unit"}</th>
                                <th>{"Value"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={res.rows}>
                                {(row) => (
                                    <tr>
                                        <td>{row.unit + " (" + row.unitName + ")"}</td>
                                        <td class={styles.value}>{row.value}</td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            );
        }
        return (
            <div class={styles.result}>
                <p>{res.sourceValue + " " + res.sourceUnit + " = " + res.targetValue + " " + res.targetUnit}</p>
                <p class={styles.labelText}>{res.targetUnitName}</p>
            </div>
        );
    }
    return (
        <CalculatorCard
            title="Unit Converter - Length, Mass, Temperature, Pressure, Energy & More"
            description="Convert between SI and common chemistry units across length, mass, volume, pressure, energy, temperature, concentration, and time. The converter uses exact conversion factors and handles non-linear temperature scales (Celsius, Fahrenheit, Kelvin) separately. Pick a category, enter a value, and choose the source and target units to get a precise result."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>1 m {"->"} cm</strong> for length (100 cm), <strong>1 kg {"->"} g</strong> for mass (1000 g), <strong>0 {"\u00B0C"} {"->"} {"\u00B0F"}</strong> for temperature (32 {"\u00B0F"}), or pick <strong>all</strong> as the target unit to see every conversion at once.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#mass-calc">Once you have your value, you can compute molar mass or stoichiometric yields with the Molar Mass Calculator.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="unit-converter-category">Category</label>
            <select
                id="unit-converter-category"
                class={styles.select}
                aria-label="Unit category"
                value={category()}
                onChange={handleCategoryChange}
            >
                <For each={categories}>
                    {(cat) => <option value={cat}>{cat}</option>}
                </For>
            </select>
            <label class={styles.labelText} for="unit-converter-value">Value</label>
            <input
                type="number"
                class={getInputClass()}
                id="unit-converter-value"
                placeholder="E.g., 1"
                aria-label="Value to convert"
                value={value()}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
            />
            <label class={styles.labelText} for="unit-converter-from-unit">From unit</label>
            <select
                id="unit-converter-from-unit"
                class={styles.select}
                aria-label="From unit"
                value={fromUnit()}
                onChange={handleFromUnitChange}
            >
                <For each={UnitConverter.getUnitsForCategory(category())}>
                    {(unit) => <option value={unit}>{unit}</option>}
                </For>
            </select>
            <label class={styles.labelText} for="unit-converter-to-unit">To unit</label>
            <select
                id="unit-converter-to-unit"
                class={styles.select}
                aria-label="To unit"
                value={toUnit()}
                onChange={handleToUnitChange}
            >
                <option value="all">{"all"}</option>
                <For each={UnitConverter.getUnitsForCategory(category())}>
                    {(unit) => <option value={unit}>{unit}</option>}
                </For>
            </select>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={convert}>Convert</button>
                <button class={styles.secondaryButton} onClick={clear}>Clear</button>
            </div>
            {error() !== "" && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {renderResult()}
        </CalculatorCard>
    );
}
export default UnitConverterRoute;
