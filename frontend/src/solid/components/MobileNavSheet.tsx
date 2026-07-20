import type {JSX} from "solid-js";
import {createSignal, onMount, Show, For} from "solid-js";
import {A} from "@solidjs/router";
import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {useNavSheet} from "../stores/navSheet";
import {calculatorIdToRoute} from "./Sidebar";
import styles from "./MobileNavSheet.module.css";

interface GroupedCalculators {
    category: string;
    items: CalculatorInfo[];
}

function groupByCategory(calculators: CalculatorInfo[]): GroupedCalculators[] {
    let groups: GroupedCalculators[] = [];
    for (let i = 0; i < calculators.length; i++) {
        let calc = calculators[i];
        let last = groups.length > 0 ? groups[groups.length - 1] : null;
        if (last !== null && last.category === calc.category) {
            last.items.push(calc);
        } else {
            groups.push({category: calc.category, items: [calc]});
        }
    }
    return groups;
}

function MobileNavSheet(): JSX.Element {
    let sheet = useNavSheet();
    let [calculators, setCalculators] = createSignal<CalculatorInfo[]>([]);

    onMount(function (): void {
        let nav = NavigationManager.getInstance();
        setCalculators(nav.getCalculators());
    });

    function handleClose(): void {
        sheet.close();
    }

    return (
        <Show when={sheet.isOpen()}>
            <div class={styles.navSheetBackdrop} onClick={handleClose} />
            <div class={styles.navSheet} role="dialog" aria-modal="true" aria-label="Navigation menu">
                <ul class={styles.navSheetList}>
                    <For each={groupByCategory(calculators())}>
                        {(group) => (
                            <>
                                <li class={styles.navCategory}>{group.category}</li>
                                <For each={group.items}>
                                    {(calc) => (
                                        <li>
                                            <A
                                                href={calculatorIdToRoute(calc.id)}
                                                class={styles.sheetItem}
                                                activeClass={styles.active}
                                                onClick={handleClose}
                                            >
                                                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
                                                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                                                </svg>
                                                <span>{calc.name}</span>
                                            </A>
                                        </li>
                                    )}
                                </For>
                            </>
                        )}
                    </For>
                </ul>
            </div>
        </Show>
    );
}

export {MobileNavSheet};
