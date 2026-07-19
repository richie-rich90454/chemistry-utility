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
import {For} from "solid-js";
import {useUnitConverter} from "../lib/useUnitConverter";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./unit-converter.module.css";
function UnitConverterRoute(): JSX.Element {
    let state = useUnitConverter();
    let category = state.category;
    let setCategory = state.setCategory;
    let fromUnit = state.fromUnit;
    let setFromUnit = state.setFromUnit;
    let toUnit = state.toUnit;
    let setToUnit = state.setToUnit;
    let value = state.value;
    let setValue = state.setValue;
    let result = state.result;
    let error = state.error;
    let convert = state.convert;
    let clear = state.clear;
    let categories = state.categories;
    let unitsForCategory = state.unitsForCategory;
    function handleConvert(): void {
        convert();
    }
    function handleClear(): void {
        clear();
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
                <For each={categories()}>
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
                <For each={unitsForCategory(category())}>
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
                <For each={unitsForCategory(category())}>
                    {(unit) => <option value={unit}>{unit}</option>}
                </For>
            </select>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleConvert}>Convert</button>
                <button class={styles.secondaryButton} onClick={handleClear}>Clear</button>
            </div>
            {error() !== "" && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {renderResult()}
        </CalculatorCard>
    );
}
export default UnitConverterRoute;
