import type {JSX} from "solid-js";
import {createSignal, For, Show} from "solid-js";
import styles from "./CalculatorForm.module.css";
interface CalculatorField {
    id: string;
    label: string;
    placeholder: string;
    ariaLabel: string;
}
interface CalculatorSelectOption {
    value: string;
    label: string;
}
interface CalculatorSelect {
    id: string;
    label: string;
    ariaLabel: string;
    options: CalculatorSelectOption[];
    defaultValue?: string;
}
interface CalculatorFormProps {
    fields: CalculatorField[];
    selects?: CalculatorSelect[];
    inputGroupLabel?: string;
    onCalculate: (inputs: Record<string, string>) => void;
    onClear?: () => void;
    result: () => string;
    error: () => string;
    calculateLabel?: string;
    children?: JSX.Element;
}
function getSelectInitial(sel: CalculatorSelect): string {
    if (sel.defaultValue !== undefined) {
        return sel.defaultValue;
    }
    if (sel.options.length > 0) {
        return sel.options[0].value;
    }
    return "";
}
function CalculatorForm(props: CalculatorFormProps): JSX.Element {
    let fields: CalculatorField[] = props.fields;
    let selects: CalculatorSelect[] = props.selects !== undefined ? props.selects : [];
    let calculateLabel: string = props.calculateLabel !== undefined ? props.calculateLabel : "Calculate";
    let fieldSignals: Record<string, () => string> = {};
    let fieldSetters: Record<string, (next: string) => void> = {};
    for (let i = 0; i < fields.length; i++) {
        let f: CalculatorField = fields[i];
        let [get, set] = createSignal("");
        fieldSignals[f.id] = get;
        fieldSetters[f.id] = set;
    }
    let selectSignals: Record<string, () => string> = {};
    let selectSetters: Record<string, (next: string) => void> = {};
    for (let i = 0; i < selects.length; i++) {
        let s: CalculatorSelect = selects[i];
        let [get, set] = createSignal(getSelectInitial(s));
        selectSignals[s.id] = get;
        selectSetters[s.id] = set;
    }
    function handleFieldInput(id: string, e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let setter = fieldSetters[id];
        if (setter !== undefined) {
            setter(target.value);
        }
    }
    function handleSelectChange(id: string, e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        let setter = selectSetters[id];
        if (setter !== undefined) {
            setter(target.value);
        }
    }
    function handleCalculate(): void {
        let inputs: Record<string, string> = {};
        let fieldIds: string[] = Object.keys(fieldSignals);
        for (let i = 0; i < fieldIds.length; i++) {
            inputs[fieldIds[i]] = fieldSignals[fieldIds[i]]();
        }
        let selectIds: string[] = Object.keys(selectSignals);
        for (let i = 0; i < selectIds.length; i++) {
            inputs[selectIds[i]] = selectSignals[selectIds[i]]();
        }
        props.onCalculate(inputs);
    }
    function handleClear(): void {
        let fieldIds: string[] = Object.keys(fieldSetters);
        for (let i = 0; i < fieldIds.length; i++) {
            fieldSetters[fieldIds[i]]("");
        }
        for (let i = 0; i < selects.length; i++) {
            let s: CalculatorSelect = selects[i];
            selectSetters[s.id](getSelectInitial(s));
        }
        if (props.onClear !== undefined) {
            props.onClear();
        }
    }
    function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            handleCalculate();
        }
    }
    return (
        <div>
            <For each={selects}>
                {(sel) => (
                    <div>
                        <label class={styles.labelText} for={sel.id}>{sel.label}</label>
                        <select
                            id={sel.id}
                            class={styles.select}
                            aria-label={sel.ariaLabel}
                            value={selectSignals[sel.id]()}
                            onChange={function (e: Event): void { handleSelectChange(sel.id, e); }}
                        >
                            <For each={sel.options}>
                                {(opt) => <option value={opt.value}>{opt.label}</option>}
                            </For>
                        </select>
                    </div>
                )}
            </For>
            <Show when={props.inputGroupLabel !== undefined}>
                <label class={styles.labelText}>{props.inputGroupLabel}</label>
            </Show>
            <div class={styles.inputGroup}>
                <For each={props.fields}>
                    {(f) => (
                        <input
                            type="number"
                            class={styles.input}
                            id={f.id}
                            placeholder={f.placeholder}
                            aria-label={f.ariaLabel}
                            value={fieldSignals[f.id]()}
                            onInput={function (e: Event): void { handleFieldInput(f.id, e); }}
                            onKeyDown={handleKeyDown}
                        />
                    )}
                </For>
            </div>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleCalculate}>{calculateLabel}</button>
                <button class={styles.secondaryButton} onClick={handleClear}>Clear</button>
            </div>
            <Show when={props.error() !== ""}>
                <div class={styles.result + " " + styles.error}><p>{props.error()}</p></div>
            </Show>
            <Show when={props.result() !== ""}>
                <div class={styles.result}><p>{props.result()}</p></div>
            </Show>
            <Show when={props.children !== undefined}>
                {props.children}
            </Show>
        </div>
    );
}
export {CalculatorForm};
export type {CalculatorField, CalculatorSelect, CalculatorSelectOption, CalculatorFormProps};
