/**
 * Visual verification: The Solid-rendered Bond Type Predictor card should
 * match the legacy #bond-type-predictor card in frontend/index.html.
 * Intentional diff: this route adds a Clear button (legacy lacked one) and
 * surfaces the ΔEN explanation behind the result text. Loads elemental
 * electronegativity data via DataCache + fetch("/ptable.json"), then
 * routes the two symbol inputs through BondTypePredictor.calculatePure.
 * No Playwright screenshot test is added per task spec; parity is
 * verified by manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, onMount} from "solid-js";
import {BondTypePredictor} from "../../modules/bondPredictor.js";
import {ChemicalElement} from "../../types.js";
import {DataCache} from "../../modules/dataCache.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import {resolveResult} from "../../modules/resultResolver.js";
import styles from "./bond-type.module.css";
function BondType(): JSX.Element {
    let [element1, setElement1] = createSignal("");
    let [element2, setElement2] = createSignal("");
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    let [predictor, setPredictor] = createSignal<BondTypePredictor | null>(null);
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
                    setPredictor(new BondTypePredictor(parsed));
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
                cache.set("ptable", JSON.stringify(elementData));
                setPredictor(new BondTypePredictor(elementData));
                setLoading(false);
            }).catch(function (err: unknown): void {
                let message = err instanceof Error ? err.message : String(err);
                setLoadError(message);
                setLoading(false);
            });
        });
    }
    function handleElement1Input(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setElement1(target.value);
    }
    function handleElement2Input(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setElement2(target.value);
    }
    function handleCalculate(): void {
        let p = predictor();
        if (p === null) {
            setError("Elements data not loaded yet");
            setResult("");
            return;
        }
        let inputs: Record<string, string> = {"element1-input": element1(), "element2-input": element2()};
        resolveResult(p.calculatePure(inputs), setResult, setError);
    }
    function handleClear(): void {
        setElement1("");
        setElement2("");
        setResult("");
        setError("");
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
            title="Bond Type Predictor - Ionic, Covalent, or Metallic"
            description="Predict whether a bond is ionic, covalent, or metallic based on electronegativity differences and periodic table trends. This tool is ideal for students learning about chemical bonding. Simply enter the two element symbols, and get a clear prediction with the ΔEN calculation and the metal/non-metal classification that drove the decision."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>Na</strong> and <strong>Cl</strong> for an ionic bond (ΔEN ≈ 2.18), or <strong>H</strong> and <strong>O</strong> for a polar covalent bond (ΔEN ≈ 1.24). Try <strong>Fe</strong> and <strong>Cu</strong> for a metallic bond.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/stoichiometry">Once you know the bond type, use the Stoichiometry Calculator to work out mole ratios for the reaction.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText}>Element symbols</label>
            <div class={styles.inputGroup}>
                <input type="text" id="element1-input" class={styles.input} placeholder="First element (e.g., Na)" aria-label="First element symbol" value={element1()} onInput={handleElement1Input} autocomplete="off" spellcheck={false} />
                <input type="text" id="element2-input" class={styles.input} placeholder="Second element (e.g., Cl)" aria-label="Second element symbol" value={element2()} onInput={handleElement2Input} autocomplete="off" spellcheck={false} />
            </div>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleCalculate} disabled={loading()}>Predict Bond Type</button>
                <button class={styles.secondaryButton} onClick={handleClear} disabled={loading()}>Clear</button>
            </div>
            {getStatusText() !== "" && <div class={styles.result}><p>{getStatusText()}</p></div>}
            {error() !== "" && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {result() !== "" && <div class={styles.result}><p>{result()}</p></div>}
        </CalculatorCard>
    );
}
export {BondType};
