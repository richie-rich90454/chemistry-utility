/**
 * Visual verification: The Solid-rendered Element Lookup card should match the
 * legacy #element-lookup card in frontend/index.html. Intentional diff: this
 * route adds a "Look Up" button (legacy relied on keyup only) and accepts
 * atomic number as a query (legacy matched symbol/name only). No Playwright
 * screenshot test is added per task spec; parity is verified by manual diff of
 * the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {useElementLookup} from "../lib/useElementLookup";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./element-lookup.module.css";
function ElementLookup(): JSX.Element {
    let state = useElementLookup();
    let query = state.query;
    let setQuery = state.setQuery;
    let result = state.result;
    let error = state.error;
    let loading = state.loading;
    let loadError = state.loadError;
    let search = state.search;
    function handleSearch(): void {
        search();
    }
    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setQuery(target.value);
    }
    function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            search();
        }
    }
    function formatOptional(value: number | null | undefined, suffix: string): string {
        if (value === null || value === undefined) {
            return "N/A";
        }
        return String(value) + suffix;
    }
    function renderResult(): JSX.Element {
        let el = result();
        if (el === null) {
            return <></>;
        }
        return (
            <div class={styles.elementResult}>
                <p><strong>Symbol:</strong> {el.symbol}</p>
                <p><strong>Name:</strong> {el.name}</p>
                <p><strong>Atomic Mass:</strong> {String(el.atomicMass)} u</p>
                <p><strong>Atomic Number:</strong> {String(el.atomicNumber)}</p>
                <p><strong>Electronegativity:</strong> {formatOptional(el.electronegativity, "")}</p>
                <p><strong>Electron Affinity:</strong> {formatOptional(el.electronAffinity, " kJ/mol")}</p>
                <p><strong>Atomic Radius:</strong> {formatOptional(el.atomicRadius, " pm")}</p>
                <p><strong>Ionization Energy:</strong> {formatOptional(el.ionizationEnergy, " kJ/mol")}</p>
                <p><strong>Valence Electrons:</strong> {String(el.valenceElectrons)}</p>
                <p><strong>Total Electrons:</strong> {String(el.totalElectrons)}</p>
                <p><strong>Group:</strong> {String(el.group)}</p>
                <p><strong>Period:</strong> {String(el.period)}</p>
                <p><strong>Type:</strong> {el.type}</p>
            </div>
        );
    }
    function getStatusText(): string {
        if (loading()) {
            return "Loading elements…";
        }
        if (loadError() !== "") {
            return "Error loading elements: " + loadError();
        }
        return "";
    }
    return (
        <CalculatorCard
            title="Element Information Lookup - Atomic Number, Mass, Electron Configuration and more"
            description="Quickly look up any chemical element to find its atomic number, mass, electron configuration, and group on the periodic table. This tool is perfect for students, teachers, or hobbyists who need fast reference information. Just type the element name, symbol, or atomic number and get accurate, reliable data instantly."
            exampleDetails={
                <ExampleDetails>
                    <p>Try typing <strong>H</strong> for Hydrogen, <strong>Fe</strong> for Iron, or <strong>6</strong> for Carbon to see element properties.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#mass-calc">To compute masses using this elemental data, try the Molar Mass Calculator.</SeeAlsoLink>
            }
        >
            <label for="element-input">Element symbol, name, or atomic number</label>
            <input
                type="text"
                class={styles.input}
                id="element-input"
                placeholder="E.g., H, Hydrogen, or 1"
                aria-label="Element symbol, name, or atomic number"
                value={query()}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
            />
            <button class={styles.button} onClick={handleSearch}>Look Up</button>
            {getStatusText() && <div class={styles.result}><p>{getStatusText()}</p></div>}
            {error() !== "" && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {renderResult()}
        </CalculatorCard>
    );
}
export {ElementLookup};
