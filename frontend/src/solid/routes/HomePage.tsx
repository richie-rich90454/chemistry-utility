import type {JSX} from "solid-js";
import {createMemo, For, Show} from "solid-js";
import {A} from "@solidjs/router";
import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {GroupedCalculators, groupByCategory, calculatorIdToRoute} from "../../modules/calculatorHelper.js";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";
import styles from "./HomePage.module.css";
function HomePage(): JSX.Element {
    let calculators = createMemo(function (): CalculatorInfo[] {
        let nav = NavigationManager.getInstance();
        return nav.getCalculators();
    });
    let groups = createMemo(function (): GroupedCalculators[] {
        return groupByCategory(calculators());
    });
    return (
        <section class={styles.home} aria-label="Chemistry Utility home">
            <div class={styles.container}>
                <div class={styles.hero}>
                    <h1 class={styles.heroTitle}>Chemistry Utility</h1>
                    <p class={styles.heroSubtitle}>A collection of chemistry calculators, reference tools, and data lookups. Pick a calculator below or use the sidebar to navigate.</p>
                </div>
                <div class={styles.intro}>
                    <h2 class={styles.introTitle}>Getting Started</h2>
                    <p class={styles.introText}>Use the Molar Mass calculator for any formula, the Equation Balancer to balance reactions, the Periodic Table for element data, or the Compound Database Search to look up substances by name, formula, CAS, or SMILES.<Show when={!RuntimeDetector.getInstance().isWebMode}> The Batch Calculator can process many inputs at once from a CSV file.</Show></p>
                </div>
                <For each={groups()}>
                    {(group) => (
                        <div class={styles.group}>
                            <h2 class={styles.groupTitle}>{group.category}</h2>
                            <div class={styles.grid}>
                                <For each={group.items}>
                                    {(calc) => (
                                        <A href={calculatorIdToRoute(calc.id)} class={styles.card}>
                                            <span class={styles.cardName}>{calc.name}</span>
                                            <span class={styles.cardDescription}>{calc.description}</span>
                                        </A>
                                    )}
                                </For>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </section>
    );
}
export {HomePage};
