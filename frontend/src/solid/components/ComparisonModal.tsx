import type {JSX} from "solid-js";
import {createMemo, onMount, onCleanup, Show, For} from "solid-js";
import {ComparisonManager} from "../../modules/comparisonManager.js";
import type {ComparisonField} from "../../modules/comparisonManager.js";
import {useComparison} from "../stores/comparison";
import styles from "./ComparisonModal.module.css";
function ComparisonModal(): JSX.Element {
    let store = useComparison();
    let manager = ComparisonManager.getInstance();
    let fieldsA = createMemo(function (): ComparisonField[] {
        let list = store.items();
        if (list.length > 0) {
            return manager.extractFields(list[0].data);
        }
        return [];
    });
    let fieldsB = createMemo(function (): ComparisonField[] {
        let list = store.items();
        if (list.length > 1) {
            return manager.extractFields(list[1].data);
        }
        return [];
    });
    let keys = createMemo(function (): string[] {
        if (store.items().length === 2) {
            return manager.mergeKeys(fieldsA(), fieldsB());
        }
        return [];
    });
    onMount(function (): void {
        function handleKey(e: KeyboardEvent): void {
            if (store.isModalOpen() && e.key === "Escape") {
                store.closeModal();
            }
        }
        window.addEventListener("keydown", handleKey);
        onCleanup(function (): void {
            window.removeEventListener("keydown", handleKey);
        });
    });
    function handleBackdropClick(e: MouseEvent): void {
        if (e.target === e.currentTarget) {
            store.closeModal();
        }
    }
    function handleClose(): void {
        store.closeModal();
    }
    function cellClass(same: boolean): string {
        if (same) {
            return styles.comparisonSame;
        }
        return styles.comparisonDifferent;
    }
    function diffText(same: boolean, valA: string, valB: string): string {
        if (same) {
            return "\u2014";
        }
        let pct: string = manager.percentageDifference(valA, valB);
        if (pct === "") {
            return "diff";
        }
        return pct;
    }
    let items = store.items;
    return (
        <Show when={store.isModalOpen()}>
            <div class={styles.comparisonModal} role="dialog" aria-modal="true" aria-label="Comparison" onClick={handleBackdropClick}>
                <div class={styles.comparisonModalContent}>
                    <button type="button" class={styles.comparisonClose} aria-label="Close comparison dialog" onClick={handleClose}>&times;</button>
                    <h2 class={styles.comparisonTitle}>Comparison</h2>
                    <Show when={items().length === 0}>
                        <p class={styles.comparisonEmpty}>Select calculations to compare.</p>
                    </Show>
                    <Show when={items().length === 1}>
                        <p class={styles.comparisonEmpty}>Add one more calculation to compare.</p>
                        <div class={styles.comparisonColumn}>
                            <h3 class={styles.comparisonColumnTitle}>Calculation 1</h3>
                            <For each={fieldsA()}>
                                {(field) => (
                                    <div class={styles.comparisonFieldRow}>
                                        <span class={styles.comparisonFieldLabel}>{field.label}</span>
                                        <span class={styles.comparisonFieldValue}>{field.value}</span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                    <Show when={items().length === 2}>
                        <table class={styles.comparisonTable}>
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Calculation 1</th>
                                    <th>Calculation 2</th>
                                    <th>Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={keys()}>
                                    {(key) => {
                                        let valA: string = manager.findValue(fieldsA(), key);
                                        let valB: string = manager.findValue(fieldsB(), key);
                                        let same: boolean = valA === valB;
                                        return (
                                            <tr>
                                                <td class={styles.comparisonFieldLabel}>{key}</td>
                                                <td class={cellClass(same)}>{valA}</td>
                                                <td class={cellClass(same)}>{valB}</td>
                                                <td class={cellClass(same)}>{diffText(same, valA, valB)}</td>
                                            </tr>
                                        );
                                    }}
                                </For>
                            </tbody>
                        </table>
                    </Show>
                </div>
            </div>
        </Show>
    );
}
export {ComparisonModal};
