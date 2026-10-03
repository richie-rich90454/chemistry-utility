/**
 * Molar Mass Calculator — App Design System
 * Auto-calculates on input with 300ms debounce. No button needed.
 */
import type {JSX} from "solid-js";
import {createSignal, onCleanup, onMount} from "solid-js";
import {ChemicalElement} from "../../types.js";
import {calculateMolarMass} from "../../modules/formulaParser.js";
import {NumberFormatter} from "../../modules/i18n/numberFormatter.js";
import {DataCache} from "../../modules/dataCache.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./molar-mass.module.css";

function MolarMass(): JSX.Element {
    let [formula, setFormula] = createSignal("");
    let [result, setResult] = createSignal("");
    let [elements, setElements] = createSignal<ChemicalElement[]>([]);
    let [loading, setLoading] = createSignal(true);
    let [loadError, setLoadError] = createSignal("");
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let aborter: AbortController | null = null;
    let disposed: boolean = false;

    onMount(function (): void {
        loadElements();
    });

    onCleanup(function (): void {
        disposed = true;
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
        if (aborter !== null) {
            aborter.abort();
        }
    });

    function loadElements(): void {
        let cache = DataCache.getInstance();
        cache.get("ptable").then(function (cached: string | null): void {
            if (disposed) {
                return;
            }
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
            aborter = new AbortController();
            // Relative URL keeps subpath deployments working.
            fetch("ptable.json", {signal: aborter.signal}).then(function (response: Response): Promise<unknown> {
                if (!response.ok) {
                    throw new Error("HTTP error! status: " + response.status);
                }
                return response.json();
            }).then(function (data: unknown): void {
                if (disposed) {
                    return;
                }
                let elementData = data as ChemicalElement[];
                setElements(elementData);
                cache.set("ptable", JSON.stringify(elementData));
                setLoading(false);
            }).catch(function (err: unknown): void {
                if (disposed) {
                    return;
                }
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                let message = err instanceof Error ? err.message : String(err);
                setLoadError(message);
                setLoading(false);
            });
        });
    }

    function doCalculate(f: string): void {
        if (loading() || loadError() !== "") {
            return;
        }
        let trimmed = f.trim();
        if (trimmed === "") {
            setResult("");
            return;
        }
        try {
            let mass = calculateMolarMass(trimmed, elements());
            let formatted = NumberFormatter.createFromCurrentLocale().format(mass, 3);
            setResult("Molar Mass: " + formatted + " g/mol");
        }
        catch (err: unknown) {
            let message = err instanceof Error ? err.message : String(err);
            setResult("Error: " + message);
        }
    }

    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let value = target.value;
        setFormula(value);
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(function (): void {
            doCalculate(value);
        }, 300);
    }

    function getResultText(): string {
        if (loading()) {
            return "Loading elements…";
        }
        if (loadError() !== "") {
            return "Error loading elements: " + loadError();
        }
        return result();
    }

    function getResultClass(): string {
        if (result().startsWith("Error")) {
            return styles.result + " " + styles.error;
        }
        return styles.result;
    }

    return (
        <CalculatorCard
            title="Molar Mass Calculator"
            description="Enter a chemical formula and the molar mass is calculated automatically. Supports nested parentheses, hydrates, and complex formulas. No button needed — just type."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>H2O</strong> for water (18.015 g/mol), <strong>C6H12O6</strong> for glucose (180.156 g/mol), or <strong>Al2(SO4)3</strong> for aluminum sulfate (342.151 g/mol).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/stoichiometry">Use the Stoichiometry Calculator for reaction yield calculations.</SeeAlsoLink>
            }
        >
            <label for="formula-input" class={styles.label}>Chemical formula</label>
            <input
                type="text"
                class={styles.input}
                id="formula-input"
                placeholder="E.g., H2O, C6H12O6, Al2(SO4)3"
                aria-label="Chemical formula"
                value={formula()}
                onInput={handleInput}
                autocomplete="off"
                spellcheck={false}
            />
            <div class={getResultClass()} role={result().startsWith("Error") ? "alert" : undefined} aria-live="polite">
                {getResultText() && <p>{getResultText()}</p>}
            </div>
        </CalculatorCard>
    );
}
export {MolarMass};
