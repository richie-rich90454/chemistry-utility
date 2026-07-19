/**
 * Visual verification: The Solid-rendered Equation Balancer card should match
 * the legacy #balancing card in frontend/index.html. Intentional diff: this
 * route surfaces a redox medium selector (legacy was atomic-only), exposes
 * the step-by-step explanation behind a <details> toggle, and highlights
 * stoichiometric coefficients in their own chip. No Playwright screenshot
 * test is added per task spec; parity is verified by manual diff of the
 * rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {For} from "solid-js";
import {useEquationBalancer} from "../lib/useEquationBalancer";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./equation-balancer.module.css";
function EquationBalancer(): JSX.Element {
    let state = useEquationBalancer();
    let equation = state.equation;
    let setEquation = state.setEquation;
    let medium = state.medium;
    let setMedium = state.setMedium;
    let result = state.result;
    let error = state.error;
    let isLoading = state.isLoading;
    let balance = state.balance;
    let clear = state.clear;
    function handleBalance(): void {
        balance();
    }
    function handleClear(): void {
        clear();
    }
    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setEquation(target.value);
    }
    function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            balance();
        }
    }
    function handleMediumChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setMedium(target.value as "acidic" | "basic");
    }
    function renderResult(): JSX.Element {
        let res = result();
        if (res === null) {
            return <></>;
        }
        let coefficients = res.explanation.coefficients;
        let hasCoefficients = coefficients.length > 0;
        return (
            <div class={styles.result}>
                <p><strong>Balanced Equation:</strong></p>
                <div class={styles.equation}>{res.equation}</div>
                <details class={styles.explanationDetails}>
                    <summary>Show Explanation</summary>
                    <div class={styles.explanationBody}>
                        <p><strong>Method:</strong> {res.explanation.method}</p>
                        <ol>
                            <For each={res.explanation.steps}>
                                {(step) => <li>{step}</li>}
                            </For>
                        </ol>
                        {hasCoefficients && (
                            <p><strong>Coefficients:</strong> [{coefficients.join(", ")}]</p>
                        )}
                    </div>
                </details>
            </div>
        );
    }
    return (
        <CalculatorCard
            title="Chemical Equation Balancer - Balance Equations Instantly"
            description="Enter an unbalanced chemical equation like H2 + O2 -> H2O and the balancer finds the smallest whole-number coefficients using Gaussian elimination over the rationals. Supports nested parentheses, hydrates, ionic species, and redox half-reactions in acidic or basic medium."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>H2 + O2 {"->"} H2O</strong> for water synthesis, <strong>C3H8 + O2 {"->"} CO2 + H2O</strong> for propane combustion, or <strong>MnO4- {"->"} Mn2+ || Fe2+ {"->"} Fe3+</strong> for a redox equation (use the medium selector for acidic vs basic).</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#stoichiometry">Once balanced, you can analyze reactants and yields with the Stoichiometry Calculator.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="equation-input">Chemical equation</label>
            <input
                type="text"
                class={styles.input}
                id="equation-input"
                placeholder="E.g., H2 + O2 -> H2O"
                aria-label="Chemical equation"
                value={equation()}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
            />
            <label class={styles.labelText} for="medium-select">Redox medium (used when equation contains ||)</label>
            <select
                id="medium-select"
                class={styles.select}
                aria-label="Redox medium"
                value={medium()}
                onChange={handleMediumChange}
            >
                <option value="acidic">Acidic</option>
                <option value="basic">Basic</option>
            </select>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleBalance} disabled={isLoading()}>Balance Equation</button>
                <button class={styles.secondaryButton} onClick={handleClear} disabled={isLoading()}>Clear</button>
            </div>
            {isLoading() && <div class={styles.result}><p>Balancing…</p></div>}
            {error() !== "" && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {renderResult()}
        </CalculatorCard>
    );
}
export {EquationBalancer};
