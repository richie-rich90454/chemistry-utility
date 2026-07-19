import type {JSX} from "solid-js";
import {createSignal, onMount} from "solid-js";
import {ChemicalElement} from "../../types.js";
import {calculateMolarMass} from "../../modules/formulaParser.js";
import {NumberFormatter} from "../../modules/i18n/numberFormatter.js";
import {DataCache} from "../../modules/dataCache.js";
function MolarMass(): JSX.Element {
    let [formula, setFormula] = createSignal("");
    let [result, setResult] = createSignal("");
    let [elements, setElements] = createSignal<ChemicalElement[]>([]);
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
            }).catch(function (err: unknown): void {
                let message = err instanceof Error ? err.message : String(err);
                setResult("Error loading elements: " + message);
            });
        });
    }
    function handleCalculate(): void {
        if (elements().length === 0) {
            return;
        }
        try {
            let mass = calculateMolarMass(formula(), elements());
            let formatted = NumberFormatter.createFromCurrentLocale().format(mass, 3);
            setResult("Molar mass: " + formatted + " g/mol");
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
    return (
        <section class="card">
            <h2>Molar Mass Calculator - Calculate Molecule/Compound Molar Mass Instantly</h2>
            <label for="formula-input">Chemical formula</label>
            <input
                type="text"
                id="formula-input"
                placeholder="E.g., CH4"
                aria-label="Chemical formula"
                value={formula()}
                onInput={handleInput}
            />
            <button class="primary-button" onClick={handleCalculate}>Calculate</button>
            <div class="result">{result()}</div>
        </section>
    );
}
export {MolarMass};
