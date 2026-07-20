/**
 * Chemical Equation Balancer — CGUI V3.0
 * Auto-balances on input with 500ms debounce.
 */
import type {JSX} from "solid-js";
import {For, onCleanup} from "solid-js";
import {useEquationBalancer} from "../lib/useEquationBalancer";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./equation-balancer.module.css";

interface EquationTerm {
    coefficient: string;
    formula: string;
}

function parseSide(side: string): EquationTerm[] {
    let terms = side.split(" + ");
    let result: EquationTerm[] = [];
    for (let i = 0; i < terms.length; i++) {
        let term = terms[i];
        let match = term.match(/^(\d+)\s+(.+)$/);
        if (match !== null) {
            result.push({coefficient: match[1], formula: match[2]});
        }
        else {
            result.push({coefficient: "", formula: term.trim()});
        }
    }
    return result;
}

function parseBalancedEquation(equation: string): {reactants: EquationTerm[], products: EquationTerm[]} {
    let sides = equation.split(" -> ");
    if (sides.length !== 2) {
        sides = equation.split(" = ");
    }
    if (sides.length !== 2) {
        return {reactants: [{coefficient: "", formula: equation}], products: []};
    }
    return {reactants: parseSide(sides[0]), products: parseSide(sides[1])};
}

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
            if (i > 0) parts.push(<span class={styles.operator}>{" + "}</span>);
            parts.push(renderTerm(parsed.reactants[i]));
        }
        if (parsed.products.length > 0) {
            parts.push(<span class={styles.operator}>{" → "}</span>);
            for (let i = 0; i < parsed.products.length; i++) {
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
