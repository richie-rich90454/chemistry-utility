/**
 * Visual verification: The Solid-rendered Molar Mass card should match the
 * legacy #mass-calc card in frontend/index.html. Intentional diff: this route
 * formats molar mass to 3 decimal places (legacy used 2 in eventListeners.ts
 * calculateMass). No Playwright screenshot test is added per task spec; parity
 * is verified by manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, onMount} from "solid-js";
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
    function handleCalculate(): void {
        if (loading() || loadError() !== "") {
            return;
        }
        try {
            let mass = calculateMolarMass(formula(), elements());
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
        setFormula(target.value);
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
        if (loadError() !== "") {
            return styles.result + " " + styles.error;
        }
        return styles.result;
    }
    return (
        <CalculatorCard
            title="Molar Mass Calculator - Calculate Molecule/Compound Molar Mass Instantly"
            description="This tool helps you quickly find the molar mass of any compound by adding up the atomic weights of its elements. It is useful when preparing solutions, converting grams to moles, and more. Just enter a chemical formula, and the calculator handles all the isotope-averaging math for you."
            exampleDetails={
                <ExampleDetails>
                    <p>Try entering <strong>H2O</strong> for water (18.015 g/mol) or <strong>C6H12O6</strong> for glucose (180.156 g/mol).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#stoichiometry">After finding molar mass, you can also compute reaction yields using the Stoichiometry Calculator.</SeeAlsoLink>
            }
        >
            <label for="formula-input">Chemical formula</label>
            <input
                type="text"
                class={styles.input}
                id="formula-input"
                placeholder="E.g., CH4"
                aria-label="Chemical formula"
                value={formula()}
                onInput={handleInput}
            />
            <button class={styles.button} onClick={handleCalculate}>Calculate</button>
            <div class={getResultClass()}>
                {getResultText() && <p>{getResultText()}</p>}
            </div>
        </CalculatorCard>
    );
}
export {MolarMass};
