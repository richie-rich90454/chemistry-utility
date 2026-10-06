import type {JSX} from "solid-js";
import {createEffect, createMemo, createSignal, untrack, For, Show} from "solid-js";
import styles from "./CalculatorForm.module.css";
interface CalculatorField {
    id: string;
    label: string;
    placeholder: string;
    ariaLabel: string;
    type?: string;
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
    // Read props inside memos (tracked scopes) so field/select/label updates
    // propagate instead of being snapshotted once at setup.
    let fieldsMemo = createMemo(function (): CalculatorField[] {
        return props.fields;
    });
    let selectsMemo = createMemo(function (): CalculatorSelect[] {
        return props.selects !== undefined ? props.selects : [];
    });
    let labelMemo = createMemo(function (): string {
        return props.calculateLabel !== undefined ? props.calculateLabel : "Calculate";
    });
    let fieldSignals: Record<string, () => string> = {};
    let fieldSetters: Record<string, (next: string) => void> = {};
    // Initial snapshot is intentional: the sync effect below takes over for
    // later prop updates. untrack marks it as a deliberate one-time read.
    let initialFields: CalculatorField[] = untrack(fieldsMemo);
    for (let i = 0; i < initialFields.length; i++) {
        let f: CalculatorField = initialFields[i];
        let [get, set] = createSignal("");
        fieldSignals[f.id] = get;
        fieldSetters[f.id] = set;
    }
    let selectSignals: Record<string, () => string> = {};
    let selectSetters: Record<string, (next: string) => void> = {};
    let initialSelects: CalculatorSelect[] = untrack(selectsMemo);
    for (let i = 0; i < initialSelects.length; i++) {
        let s: CalculatorSelect = initialSelects[i];
        let [get, set] = createSignal(getSelectInitial(s));
        selectSignals[s.id] = get;
        selectSetters[s.id] = set;
    }
    // Keep signal maps in sync when the parent swaps field/select configs
    // (e.g. reusing one form across calculators): add signals for new ids
    // and drop stale ones instead of throwing on unknown ids or leaking.
    createEffect(function (): void {
        let fields: CalculatorField[] = fieldsMemo();
        for (let i = 0; i < fields.length; i++) {
            let id: string = fields[i].id;
            if (fieldSignals[id] === undefined) {
                let [get, set] = createSignal("");
                fieldSignals[id] = get;
                fieldSetters[id] = set;
            }
        }
        for (let id of Object.keys(fieldSignals)) {
            let found: boolean = false;
            for (let i = 0; i < fields.length; i++) {
                if (fields[i].id === id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                delete fieldSignals[id];
                delete fieldSetters[id];
            }
        }
        let selects: CalculatorSelect[] = selectsMemo();
        for (let i = 0; i < selects.length; i++) {
            let s: CalculatorSelect = selects[i];
            if (selectSignals[s.id] === undefined) {
                let [get, set] = createSignal(getSelectInitial(s));
                selectSignals[s.id] = get;
                selectSetters[s.id] = set;
            }
        }
        for (let id of Object.keys(selectSignals)) {
            let found: boolean = false;
            for (let i = 0; i < selects.length; i++) {
                if (selects[i].id === id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                delete selectSignals[id];
                delete selectSetters[id];
            }
        }
    });
    function handleFieldInput(id: string, e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let setter = fieldSetters[id];
        /* v8 ignore next -- rendered fields always have signals by event time: the sync effect adds a signal for every configured id on each change */
        if (setter !== undefined) {
            setter(target.value);
        }
    }
    function handleSelectChange(id: string, e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        let setter = selectSetters[id];
        /* v8 ignore next -- rendered selects always have signals by event time (same sync-effect guarantee as fields) */
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
        let selects: CalculatorSelect[] = selectsMemo();
        for (let i = 0; i < selects.length; i++) {
            let s: CalculatorSelect = selects[i];
            let setter = selectSetters[s.id];
            /* v8 ignore next -- the sync effect adds a signal for every configured select id on each change, so the setter exists by event time */
            if (setter !== undefined) {
                setter(getSelectInitial(s));
            }
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
            <For each={selectsMemo()}>
                {(sel) => (
                    <div>
                        <label class={styles.labelText} for={sel.id}>{sel.label}</label>
                        <select
                            id={sel.id}
                            class={styles.select}
                            aria-label={sel.ariaLabel}
                            value={selectSignals[sel.id] !== undefined ? selectSignals[sel.id]() : getSelectInitial(sel)}
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
                    <For each={fieldsMemo()}>
                    {(f) => (
                        <>
                            <label class={styles.labelText} for={f.id}>{f.label}</label>
                            <input
                                type={f.type !== undefined ? f.type : "number"}
                                class={styles.input}
                                id={f.id}
                                placeholder={f.placeholder}
                                aria-label={f.ariaLabel}
                                value={fieldSignals[f.id] !== undefined ? fieldSignals[f.id]() : ""}
                                onInput={function (e: Event): void { handleFieldInput(f.id, e); }}
                                onKeyDown={handleKeyDown}
                                autocomplete="off"
                                spellcheck={false}
                            />
                        </>
                    )}
                </For>
            </div>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleCalculate}>{labelMemo()}</button>
                <button class={styles.secondaryButton} onClick={handleClear}>Clear</button>
            </div>
            <Show when={props.error() !== ""}>
                <div class={styles.result + " " + styles.error} role="alert"><p>{props.error()}</p></div>
            </Show>
            <Show when={props.result() !== ""}>
                <div class={styles.result} aria-live="polite"><p>{props.result()}</p></div>
            </Show>
            <Show when={props.children !== undefined}>
                {props.children}
            </Show>
        </div>
    );
}
export {CalculatorForm};
export type {CalculatorField, CalculatorSelect, CalculatorSelectOption, CalculatorFormProps};
