/**
 * Visual verification: The Solid-rendered Stoichiometry card should match
 * the legacy #stoichiometry card in frontend/index.html. Intentional diff:
 * this route uses a createEffect to parse the equation reactively and
 * rebuilds the dynamic input section as a Solid-rendered <div> (legacy
 * rebuilt innerHTML strings). Each calculation type surfaces its own
 * labeled inputs in a dashed .dynamicInputs container so the user can
 * see exactly which fields apply to the current mode. No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, createEffect, For} from "solid-js";
import {StoichiometryCalculator, parseBalancedEquation} from "../../modules/stoichiometryCalculator.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import {sanitizeId} from "../../modules/equationFormatter.js";
import {resolveResult} from "../../modules/resultResolver.js";
import styles from "./stoichiometry.module.css";
interface TermObject {
    formula: string;
    coefficient: number;
}
interface ParsedEquation {
    reactants: TermObject[];
    products: TermObject[];
}
function containsFormula(terms: TermObject[], formula: string): boolean {
    for (let i = 0; i < terms.length; i++) {
        if (terms[i].formula === formula) {
            return true;
        }
    }
    return false;
}
function molesMapsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
    let aKeys: string[] = Object.keys(a);
    let bKeys: string[] = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    for (let i = 0; i < aKeys.length; i++) {
        if (a[aKeys[i]] !== b[aKeys[i]]) {
            return false;
        }
    }
    return true;
}
let sharedCalculator: StoichiometryCalculator | null = null;
function getCalculator(): StoichiometryCalculator {
    // Lazy: constructing at module scope would run document.getElementById
    // at import time (before any DOM exists, or in non-DOM environments).
    if (sharedCalculator === null) {
        sharedCalculator = new StoichiometryCalculator();
    }
    return sharedCalculator;
}
let calculationTypeOptions: {"value": string; "label": string}[] = [
    {"value": "product-from-reactant", "label": "Product from Reactant"},
    {"value": "reactant-from-product", "label": "Reactant from Product"},
    {"value": "limiting-reactant", "label": "Limiting Reactant"}
];
function Stoichiometry(): JSX.Element {
    let [equation, setEquation] = createSignal("");
    let [calcType, setCalcType] = createSignal("product-from-reactant");
    let [parsedEquation, setParsedEquation] = createSignal<ParsedEquation | null>(null);
    let [loadError, setLoadError] = createSignal("");
    let [result, setResult] = createSignal("");
    let [error, setError] = createSignal("");
    let [reactantSelect, setReactantSelect] = createSignal("");
    let [productSelect, setProductSelect] = createSignal("");
    let [reactantMoles, setReactantMoles] = createSignal("");
    let [productMoles, setProductMoles] = createSignal("");
    let [reactantMolesMap, setReactantMolesMap] = createSignal<Record<string, string>>({});
    createEffect(function (): void {
        let trimmed: string = equation().trim();
        if (trimmed === "") {
            setParsedEquation(null);
            setLoadError("");
            return;
        }
        try {
            let parsed = parseBalancedEquation(trimmed);
            let reactants = parsed.reactants;
            let products = parsed.products;
            let sanitizedMap: Record<string, string> = {};
            let previousMap: Record<string, string> = reactantMolesMap();
            for (let i = 0; i < reactants.length; i++) {
                let formula: string = reactants[i].formula;
                // Preserve already-entered moles when the formula survives
                // re-parsing (e.g. typing the next character must not wipe
                // the user's inputs); default new formulas to "".
                if (previousMap[formula] !== undefined) {
                    sanitizedMap[formula] = previousMap[formula];
                } else {
                    sanitizedMap[formula] = "";
                }
            }
            // Write only on actual change: unconditionally replacing the
            // map object re-triggers this effect forever (infinite loop).
            if (!molesMapsEqual(previousMap, sanitizedMap)) {
                setReactantMolesMap(sanitizedMap);
            }
            // Keep the user's selections when they still exist; otherwise
            // fall back to the first available option.
            if (!containsFormula(reactants, reactantSelect())) {
                setReactantSelect(reactants[0].formula);
            }
            if (!containsFormula(products, productSelect())) {
                setProductSelect(products[0].formula);
            }
            setParsedEquation({"reactants": reactants, "products": products});
            setLoadError("");
        }
        catch (err: unknown) {
            // All throw sites reachable here (Term.parse, BalancedEquation.parse
            // over pure string ops in normalizeArrows) throw Error instances.
            /* v8 ignore next -- String(err) unreachable: no non-Error throw site exists */
            let message: string = err instanceof Error ? err.message : String(err);
            setParsedEquation(null);
            setLoadError(message);
        }
    });
    function handleEquationInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setEquation(target.value);
    }
    function handleCalcTypeChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setCalcType(target.value);
    }
    function handleReactantSelectChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setReactantSelect(target.value);
    }
    function handleProductSelectChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setProductSelect(target.value);
    }
    function handleReactantMolesInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setReactantMoles(target.value);
    }
    function handleProductMolesInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setProductMoles(target.value);
    }
    function handleLimitingReactantMolesInput(formula: string, e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let current = reactantMolesMap();
        let next: Record<string, string> = {};
        let keys = Object.keys(current);
        for (let i = 0; i < keys.length; i++) {
            next[keys[i]] = current[keys[i]];
        }
        next[formula] = target.value;
        setReactantMolesMap(next);
    }
    function handleCalculate(): void {
        let parsed = parsedEquation();
        if (parsed === null) {
            setError("Enter a valid balanced equation first");
            setResult("");
            return;
        }
        let inputs: Record<string, string> = {"equation": equation(), "calculation-type": calcType()};
        let type = calcType();
        if (type === "product-from-reactant") {
            inputs["reactant-select"] = reactantSelect();
            inputs["reactant-moles"] = reactantMoles();
            inputs["product-select"] = productSelect();
        }
        else if (type === "reactant-from-product") {
            inputs["product-select"] = productSelect();
            inputs["product-moles"] = productMoles();
            inputs["reactant-select"] = reactantSelect();
        }
        else {
            // Only remaining select option is "limiting-reactant".
            let map = reactantMolesMap();
            let keys = Object.keys(map);
            for (let i = 0; i < keys.length; i++) {
                inputs["moles-" + sanitizeId(keys[i])] = map[keys[i]];
            }
            inputs["product-select"] = productSelect();
        }
        resolveResult(getCalculator().calculatePure(inputs), setResult, setError);
    }
    function handleClear(): void {
        setEquation("");
        setCalcType("product-from-reactant");
        setParsedEquation(null);
        setLoadError("");
        setResult("");
        setError("");
        setReactantSelect("");
        setProductSelect("");
        setReactantMoles("");
        setProductMoles("");
        setReactantMolesMap({});
    }
    function renderDynamicInputs(): JSX.Element {
        let parsed = parsedEquation();
        if (parsed === null) {
            return <></>;
        }
        let type = calcType();
        if (type === "product-from-reactant") {
            return (
                <div class={styles.dynamicInputs}>
                    <label class={styles.labelText} for="reactant-select">Select reactant</label>
                    <select id="reactant-select" class={styles.select} aria-label="Select reactant" value={reactantSelect()} onChange={handleReactantSelectChange}>
                        <For each={parsed.reactants}>
                            {(term) => <option value={term.formula}>{term.formula}</option>}
                        </For>
                    </select>
                    <label class={styles.labelText} for="reactant-moles">Moles of reactant</label>
                    <input type="number" id="reactant-moles" class={styles.input} placeholder="Moles of reactant" aria-label="Moles of reactant" value={reactantMoles()} onInput={handleReactantMolesInput} min="0" step="any" autocomplete="off" spellcheck={false} />
                    <label class={styles.labelText} for="product-select">Select product</label>
                    <select id="product-select" class={styles.select} aria-label="Select product" value={productSelect()} onChange={handleProductSelectChange}>
                        <For each={parsed.products}>
                            {(term) => <option value={term.formula}>{term.formula}</option>}
                        </For>
                    </select>
                </div>
            );
        }
        if (type === "reactant-from-product") {
            return (
                <div class={styles.dynamicInputs}>
                    <label class={styles.labelText} for="product-select">Select product</label>
                    <select id="product-select" class={styles.select} aria-label="Select product" value={productSelect()} onChange={handleProductSelectChange}>
                        <For each={parsed.products}>
                            {(term) => <option value={term.formula}>{term.formula}</option>}
                        </For>
                    </select>
                    <label class={styles.labelText} for="product-moles">Moles of product</label>
                    <input type="number" id="product-moles" class={styles.input} placeholder="Moles of product" aria-label="Moles of product" value={productMoles()} onInput={handleProductMolesInput} min="0" step="any" autocomplete="off" spellcheck={false} />
                    <label class={styles.labelText} for="reactant-select">Select reactant</label>
                    <select id="reactant-select" class={styles.select} aria-label="Select reactant" value={reactantSelect()} onChange={handleReactantSelectChange}>
                        <For each={parsed.reactants}>
                            {(term) => <option value={term.formula}>{term.formula}</option>}
                        </For>
                    </select>
                </div>
            );
        }
        return (
            <div class={styles.dynamicInputs}>
                <For each={parsed.reactants}>
                    {(term) => (
                        <div>
                            <label class={styles.labelText} for={"moles-" + sanitizeId(term.formula)}>Moles of {term.formula}</label>
                            {/* reactantMolesMap is rebuilt from these same reactants in the
                                parse effect, so every formula is always present. */}
                            <input type="number" id={"moles-" + sanitizeId(term.formula)} class={styles.input} placeholder={"Moles of " + term.formula} aria-label={"Moles of " + term.formula} value={reactantMolesMap()[term.formula]} onInput={function (e: Event): void { handleLimitingReactantMolesInput(term.formula, e); }} min="0" step="any" autocomplete="off" spellcheck={false} />
                        </div>
                    )}
                </For>
                <label class={styles.labelText} for="product-select">Select product to calculate</label>
                <select id="product-select" class={styles.select} aria-label="Select product to calculate" value={productSelect()} onChange={handleProductSelectChange}>
                    <For each={parsed.products}>
                        {(term) => <option value={term.formula}>{term.formula}</option>}
                    </For>
                </select>
            </div>
        );
    }
    return (
        <CalculatorCard
            title="Stoichiometry Calculator - Moles, Mass, and Limiting Reactants"
            description="Enter a balanced chemical equation, choose a calculation type, and the calculator walks you through stoichiometric conversions — moles of product from moles of reactant, moles of reactant needed for a target product, or the limiting reactant and product yield given all reactant masses. Coefficients from the balanced equation are used directly."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>2H2 + O2 {"->"} 2H2O</strong> with "Product from Reactant", enter 4 for moles of H2, and the calculator returns 4 moles of H2O. For "Limiting Reactant", enter 4 moles of H2 and 1 mole of O2 to find O2 is limiting with 2 moles of H2O produced.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/molar-mass">Need compound masses? Use the Molar Mass Calculator to get accurate molar masses for any formula.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="stoich-equation-input">Balanced chemical equation</label>
            <input type="text" id="stoich-equation-input" class={styles.input} placeholder="E.g., 2H2 + O2 -> 2H2O" aria-label="Balanced chemical equation" value={equation()} onInput={handleEquationInput} autocomplete="off" spellcheck={false} />
            <label class={styles.labelText} for="calculation-type">Calculation type</label>
            <select id="calculation-type" class={styles.select} aria-label="Select stoichiometry calculation type" value={calcType()} onChange={handleCalcTypeChange}>
                <For each={calculationTypeOptions}>
                    {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
            </select>
            {loadError() !== "" && <div class={styles.result + " " + styles.error} role="alert"><p>{loadError()}</p></div>}
            {renderDynamicInputs()}
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleCalculate}>Calculate</button>
                <button class={styles.secondaryButton} onClick={handleClear}>Clear</button>
            </div>
            {error() !== "" && <div class={styles.result + " " + styles.error} role="alert"><p>{error()}</p></div>}
            {result() !== "" && <div class={styles.result} aria-live="polite"><p>{result()}</p></div>}
        </CalculatorCard>
    );
}
export {Stoichiometry};
