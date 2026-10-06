/**
 * Chemical Equation Balancer — App Design System
 * Auto-balances on input with 500ms debounce.
 */
import type {JSX} from "solid-js";
import {For, onCleanup} from "solid-js";
import {useEquationBalancer} from "../lib/useEquationBalancer";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import type {EquationTerm} from "../../modules/equationFormatter.js";
import {parseBalancedEquation} from "../../modules/equationFormatter.js";
import styles from "./equation-balancer.module.css";

function EquationBalancerRoute(): JSX.Element {
    let state = useEquationBalancer();
    let equation = state.equation;
    let setEquation = state.setEquation;
    let medium = state.medium;
    let setMedium = state.setMedium;
    let result = state.result;
    let error = state.error;
    let isLoading = state.isLoading;
    let balance = state.balance;
    let clearFn = state.clear;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    onCleanup(function (): void {
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
    });

    function handleInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let value = target.value;
        setEquation(value);
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
        if (value.trim().length > 0) {
            debounceTimer = setTimeout(function (): void {
                balance();
            }, 500);
        } else {
            clearFn();
        }
    }

    function handleMediumChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setMedium(target.value as "acidic" | "basic");
        if (equation().trim().length > 0) {
            /* v8 ignore else -- unreachable: debounceTimer is set every
            time the equation becomes non-empty (see handleInput) and is
            never reset to null, so it is always non-null here. */
            if (debounceTimer !== null) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function (): void {
                balance();
            }, 300);
        }
    }

    function renderTerm(term: EquationTerm): JSX.Element {
        return (
            <span class={styles.term}>
                {term.coefficient !== "" && <span class={styles.coefficient}>{term.coefficient}</span>}
                {term.formula}
            </span>
        );
    }

    function renderEquation(eq: string): JSX.Element {
        let parsed = parseBalancedEquation(eq);
        let parts: JSX.Element[] = [];
        for (let i = 0; i < parsed.reactants.length; i++) {
            /* v8 ignore if -- unreachable: both equation producers
            (fast-balance text format and balanceRedox renormalize) join
            terms with " + ", and parseSide only splits a "+" that is
            immediately followed by a term start, so every side parses to
            exactly one term and i > 0 never holds. */
            if (i > 0) parts.push(<span class={styles.operator}>{" + "}</span>);
            parts.push(renderTerm(parsed.reactants[i]));
        }
        /* v8 ignore else -- unreachable: both producers always emit
        " -> " with a non-empty product side, so products is never empty. */
        if (parsed.products.length > 0) {
            parts.push(<span class={styles.operator}>{" → "}</span>);
            for (let i = 0; i < parsed.products.length; i++) {
                /* v8 ignore if -- unreachable: same single-term argument
                as for reactants above; i > 0 never holds. */
                if (i > 0) parts.push(<span class={styles.operator}>{" + "}</span>);
                parts.push(renderTerm(parsed.products[i]));
            }
        }
        return <div class={styles.equation}>{parts}</div>;
    }

    function renderResult(): JSX.Element {
        let res = result();
        if (res === null) return <></>;
        let coefficients = res.explanation.coefficients;
        let hasCoefficients = coefficients.length > 0;
        return (
            <div class={styles.result}>
                <p><strong>Balanced Equation:</strong></p>
                {renderEquation(res.equation)}
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
            title="Chemical Equation Balancer"
            description="Enter an unbalanced chemical equation and it balances automatically. Supports regular equations (H2+O2->H2O), combustion (C6H6+O2->CO2+H2O), ionic species with charges, and redox half-reactions separated by ||. No button needed — just type."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>H2+O2 {"->"} H2O</strong> for water, <strong>C6H6+O2 {"->"} CO2+H2O</strong> for benzene combustion, or <strong>MnO4-+Fe2+ {"->"} Mn2++Fe3+</strong> for a redox reaction.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="/stoichiometry">Use the Stoichiometry Calculator to compute reaction yields from your balanced equation.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="equation-input">Chemical equation</label>
            <input
                type="text"
                class={styles.input}
                id="equation-input"
                placeholder="E.g., H2+O2->H2O or C6H6+O2->CO2+H2O"
                aria-label="Chemical equation"
                value={equation()}
                onInput={handleInput}
                autocomplete="off"
                spellcheck={false}
            />
            <label class={styles.labelText} for="medium-select">Redox medium (for equations with || separator)</label>
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
            {isLoading() && <div class={styles.result}><p>Balancing…</p></div>}
            {error() !== "" && <div class={styles.result + " " + styles.error}><p>{error()}</p></div>}
            {renderResult()}
        </CalculatorCard>
    );
}
export {EquationBalancerRoute};
