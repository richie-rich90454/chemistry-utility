/**
 * Visual verification: The Solid-rendered Element Lookup card should match the
 * legacy #element-lookup card in frontend/index.html. Intentional diff: this
 * route adds a "Look Up" button (legacy relied on keyup only) and accepts
 * atomic number as a query (legacy matched symbol/name only). No Playwright
 * screenshot test is added per task spec; parity is verified by manual diff of
 * the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, onMount} from "solid-js";
import {ChemicalElement} from "../../types.js";
import {DataCache} from "../../modules/dataCache.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./element-lookup.module.css";
function ElementLookup(): JSX.Element {
    let [query, setQuery] = createSignal("");
    let [result, setResult] = createSignal<ChemicalElement | null>(null);
    let [error, setError] = createSignal("");
    let [elements, setElements] = createSignal<ChemicalElement[]>([]);
    let [loading, setLoading] = createSignal(true);
    let [loadError, setLoadError] = createSignal("");
    onMount(function (): void {
        loadElements();
    });
    function loadElements(): void {
        let cache = DataCache.getInstance();
        cache.get("ptable").then(function (cached: string | null): void {
            if (cached !== null) {
                try {
                    let parsed: ChemicalElement[] = JSON.parse(cached) as ChemicalElement[];
                    setElements(parsed);
                    setLoading(false);
                    return;
                }
                catch {
                    // Corrupt cache — fall through to fetch
                }
            }
            fetch("/ptable.json").then(function (response: Response): Promise<unknown> {
                if (!response.ok) {
                    throw new Error("HTTP error! status: " + response.status);
                }
                return response.json();
            }).then(function (data: unknown): void {
                let elementData = data as ChemicalElement[];
                setElements(elementData);
                cache.set("ptable", JSON.stringify(elementData));
                setLoading(false);
            }).catch(function (err: unknown): void {
                let message = err instanceof Error ? err.message : String(err);
                setLoadError(message);
                setLoading(false);
            });
        });
    }
    function findElement(q: string, list: ChemicalElement[]): ChemicalElement | null {
        let trimmed = q.trim().toLowerCase();
        if (trimmed === "") {
            return null;
        }
        for (let i = 0; i < list.length; i++) {
            let el = list[i];
            if (el.symbol.toLowerCase() === trimmed || el.name.toLowerCase() === trimmed || String(el.atomicNumber) === trimmed) {
                return el;
            }
        }
        return null;
    }
    function handleSearch(): void {
        if (loading() || loadError() !== "") {
            return;
        }
        setError("");
        let trimmed = query().trim();
        if (trimmed === "") {
            setResult(null);
            setError("Please enter an element symbol, name, or atomic number");
            return;
        }
        let found = findElement(trimmed, elements());
        if (found === null) {
            setResult(null);
            setError("Element not found");
            return;
        }
        setResult(found);
    }
    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setQuery(target.value);
    }
    function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            handleSearch();
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
