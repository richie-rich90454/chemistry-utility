/**
 * BondEditor — dynamic editor for the Bond Enthalpy calculator.
 * Renders two editable lists (bonds broken, bonds formed) where each
 * row is a bond-type <select> + count <input> + remove button. On
 * Calculate, serializes both lists into the "TYPE:count,TYPE:count"
 * format expected by BondEnthalpyCalculator.calculatePure under the
 * "bond-enthalpy-broken" and "bond-enthalpy-formed" input keys.
 * Reuses CalculatorForm.module.css for shared button/result/label
 * styles; BondEditor.module.css supplies row-specific layout.
 */
import type {JSX} from "solid-js";
import {createSignal, Index, Show, For} from "solid-js";
import formStyles from "./CalculatorForm.module.css";
import styles from "./BondEditor.module.css";
interface BondEntry {
    bondType: string;
    count: string;
}
interface BondEditorProps {
    onCalculate: (inputs: Record<string, string>) => void;
    onClear?: () => void;
    result: () => string;
    error: () => string;
    calculateLabel?: string;
}
let bondOptions: {value: string; label: string}[] = [
    {"value": "C-H", "label": "C-H (413 kJ/mol)"},
    {"value": "C-C", "label": "C-C (348 kJ/mol)"},
    {"value": "C=C", "label": "C=C (614 kJ/mol)"},
    {"value": "C\u2261C", "label": "C\u2261C (839 kJ/mol)"},
    {"value": "O-H", "label": "O-H (463 kJ/mol)"},
    {"value": "O=O", "label": "O=O (495 kJ/mol)"},
    {"value": "N\u2261N", "label": "N\u2261N (941 kJ/mol)"},
    {"value": "C-O", "label": "C-O (358 kJ/mol)"},
    {"value": "C=O", "label": "C=O (799 kJ/mol)"},
    {"value": "H-H", "label": "H-H (436 kJ/mol)"}
];
function makeEntry(): BondEntry {
    return {"bondType": "C-H", "count": "1"};
}
function serializeBonds(entries: BondEntry[]): string {
    let parts: string[] = [];
    for (let i = 0; i < entries.length; i++) {
        let entry: BondEntry = entries[i];
        let countNum: number = parseFloat(entry.count);
        if (isNaN(countNum) || countNum <= 0) {
            continue;
        }
        if (countNum === 1) {
            parts.push(entry.bondType);
        }
        else {
            parts.push(entry.bondType + ":" + entry.count);
        }
    }
    return parts.join(",");
}
function BondEditor(props: BondEditorProps): JSX.Element {
    let [broken, setBroken] = createSignal<BondEntry[]>([]);
    let [formed, setFormed] = createSignal<BondEntry[]>([]);
    function addBroken(): void {
        setBroken(function (prev: BondEntry[]): BondEntry[] { return prev.concat([makeEntry()]); });
    }
    function addFormed(): void {
        setFormed(function (prev: BondEntry[]): BondEntry[] { return prev.concat([makeEntry()]); });
    }
    function removeBroken(idx: number): void {
        setBroken(function (prev: BondEntry[]): BondEntry[] {
            let next: BondEntry[] = prev.slice();
            next.splice(idx, 1);
            return next;
        });
    }
    function removeFormed(idx: number): void {
        setFormed(function (prev: BondEntry[]): BondEntry[] {
            let next: BondEntry[] = prev.slice();
            next.splice(idx, 1);
            return next;
        });
    }
    function updateBrokenType(idx: number, bondType: string): void {
        setBroken(function (prev: BondEntry[]): BondEntry[] {
            let next: BondEntry[] = prev.slice();
            next[idx] = {"bondType": bondType, "count": next[idx].count};
            return next;
        });
    }
    function updateBrokenCount(idx: number, count: string): void {
        setBroken(function (prev: BondEntry[]): BondEntry[] {
            let next: BondEntry[] = prev.slice();
            next[idx] = {"bondType": next[idx].bondType, "count": count};
            return next;
        });
    }
    function updateFormedType(idx: number, bondType: string): void {
        setFormed(function (prev: BondEntry[]): BondEntry[] {
            let next: BondEntry[] = prev.slice();
            next[idx] = {"bondType": bondType, "count": next[idx].count};
            return next;
        });
    }
    function updateFormedCount(idx: number, count: string): void {
        setFormed(function (prev: BondEntry[]): BondEntry[] {
            let next: BondEntry[] = prev.slice();
            next[idx] = {"bondType": next[idx].bondType, "count": count};
            return next;
        });
    }
    function handleCalculate(): void {
        let inputs: Record<string, string> = {
            "bond-enthalpy-broken": serializeBonds(broken()),
            "bond-enthalpy-formed": serializeBonds(formed())
        };
        props.onCalculate(inputs);
    }
    function handleClear(): void {
        setBroken([]);
        setFormed([]);
        if (props.onClear !== undefined) {
            props.onClear();
        }
    }
    return (
        <div>
            <label class={formStyles.labelText}>Bonds broken</label>
            <Index each={broken()}>
                {(entry, i) => (
                    <div class={styles.row}>
                        <select
                            class={styles.rowSelect}
                            aria-label="Bonds broken bond type"
                            value={entry().bondType}
                            onChange={function (e: Event): void {
                                let target = e.currentTarget as HTMLSelectElement;
                                updateBrokenType(i, target.value);
                            }}
                        >
                            <For each={bondOptions}>
                                {(opt) => <option value={opt.value}>{opt.label}</option>}
                            </For>
                        </select>
                        <input
                            type="number"
                            class={styles.rowInput}
                            aria-label="Bonds broken count"
                            value={entry().count}
                            onInput={function (e: Event): void {
                                let target = e.currentTarget as HTMLInputElement;
                                updateBrokenCount(i, target.value);
                            }}
                        />
                        <button
                            type="button"
                            class={styles.removeButton}
                            aria-label="Remove broken bond"
                            onClick={function (): void { removeBroken(i); }}
                        >Remove</button>
                    </div>
                )}
            </Index>
            <Show when={broken().length === 0}>
                <p class={styles.emptyHint}>No broken bonds added yet.</p>
            </Show>
            <div class={styles.addButtonRow}>
                <button type="button" class={formStyles.secondaryButton} aria-label="Add broken bond" onClick={addBroken}>Add broken bond</button>
            </div>
            <label class={formStyles.labelText}>Bonds formed</label>
            <Index each={formed()}>
                {(entry, i) => (
                    <div class={styles.row}>
                        <select
                            class={styles.rowSelect}
                            aria-label="Bonds formed bond type"
                            value={entry().bondType}
                            onChange={function (e: Event): void {
                                let target = e.currentTarget as HTMLSelectElement;
                                updateFormedType(i, target.value);
                            }}
                        >
                            <For each={bondOptions}>
                                {(opt) => <option value={opt.value}>{opt.label}</option>}
                            </For>
                        </select>
                        <input
                            type="number"
                            class={styles.rowInput}
                            aria-label="Bonds formed count"
                            value={entry().count}
                            onInput={function (e: Event): void {
                                let target = e.currentTarget as HTMLInputElement;
                                updateFormedCount(i, target.value);
                            }}
                        />
                        <button
                            type="button"
                            class={styles.removeButton}
                            aria-label="Remove formed bond"
                            onClick={function (): void { removeFormed(i); }}
                        >Remove</button>
                    </div>
                )}
            </Index>
            <Show when={formed().length === 0}>
                <p class={styles.emptyHint}>No formed bonds added yet.</p>
            </Show>
            <div class={styles.addButtonRow}>
                <button type="button" class={formStyles.secondaryButton} aria-label="Add formed bond" onClick={addFormed}>Add formed bond</button>
            </div>
            <div class={formStyles.buttonRow}>
                <button class={formStyles.button} onClick={handleCalculate}>{props.calculateLabel !== undefined ? props.calculateLabel : "Calculate"}</button>
                <button class={formStyles.secondaryButton} onClick={handleClear}>Clear</button>
            </div>
            <Show when={props.error() !== ""}>
                <div class={formStyles.result + " " + formStyles.error}><p>{props.error()}</p></div>
            </Show>
            <Show when={props.result() !== ""}>
                <div class={formStyles.result}><p>{props.result()}</p></div>
            </Show>
        </div>
    );
}
export {BondEditor};
