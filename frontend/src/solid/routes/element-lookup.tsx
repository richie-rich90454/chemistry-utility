/**
 * Element Lookup — CGUI V3.0
 * Auto-searches on input with 300ms debounce. No button needed.
 */
import type {JSX} from "solid-js";
import {onCleanup} from "solid-js";
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
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    onCleanup(function (): void {
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
    });

    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let value = target.value;
        setQuery(value);
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(function (): void {
            search();
        }, 300);
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
            title="Element Lookup"
            description="Type an element symbol, name, or atomic number and properties appear automatically. No button needed — just type. Supports all 118 elements with full property data."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>H</strong> for Hydrogen, <strong>Fe</strong> for Iron, <strong>Au</strong> for Gold, or <strong>6</strong> for Carbon.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/molar-mass">Use the Molar Mass Calculator once you know your elements.</SeeAlsoLink>
            }
        >
            <label for="element-input" class={styles.label}>Element symbol, name, or atomic number</label>
            <input
                type="text"
                class={styles.input}
                id="element-input"
                placeholder="E.g., H, Hydrogen, Fe, Au, or 6"
                aria-label="Element symbol, name, or atomic number"
                value={query()}
                onInput={handleInput}
                autocomplete="off"
                spellcheck={false}
            />
            {getStatusText() && <div class={styles.result}><p>{getStatusText()}</p></div>}
            {error() !== "" && result() === null && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {renderResult()}
        </CalculatorCard>
    );
}
export {ElementLookup};
