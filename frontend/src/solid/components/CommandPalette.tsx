import type {JSX} from "solid-js";
import {createSignal, createMemo, createEffect, onMount, onCleanup, Show, For} from "solid-js";
import {useNavigate} from "@solidjs/router";
import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {fuzzyMatch} from "../lib/fuzzySearch";
import {usePalette} from "../stores/palette";
import {calculatorIdToRoute} from "./Sidebar";
import styles from "./CommandPalette.module.css";
function CommandPalette(): JSX.Element {
    let palette = usePalette();
    let navigate = useNavigate();
    let [query, setQuery] = createSignal("");
    let [calculators, setCalculators] = createSignal<CalculatorInfo[]>([]);
    let inputRef: HTMLInputElement | undefined;
    onMount(function (): void {
        let nav = NavigationManager.getInstance();
        setCalculators(nav.getCalculators());
        function handleGlobalKey(e: KeyboardEvent): void {
            if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
                e.preventDefault();
                palette.toggle();
            }
        }
        window.addEventListener("keydown", handleGlobalKey);
        onCleanup(function (): void {
            window.removeEventListener("keydown", handleGlobalKey);
        });
    });
    let filtered = createMemo(function (): CalculatorInfo[] {
        let q = query();
        let all = calculators();
        if (q === "") {
            return all;
        }
        let result: CalculatorInfo[] = [];
        let i: number;
        for (i = 0; i < all.length; i++) {
            if (fuzzyMatch(q, all[i].name)) {
                result.push(all[i]);
            }
        }
        return result;
    });
    createEffect(function (): void {
        if (palette.isOpen() && inputRef !== undefined) {
            inputRef.focus();
        }
    });
    function handleInput(e: InputEvent): void {
        let target = e.currentTarget as HTMLInputElement;
        setQuery(target.value);
        palette.setSelectedIndex(0);
    }
    function handleClose(): void {
        palette.close();
        setQuery("");
    }
    function navigateToCalculator(id: string): void {
        navigate(calculatorIdToRoute(id));
        handleClose();
    }
    function handleKeyDown(e: KeyboardEvent): void {
        let list = filtered();
        if (e.key === "ArrowDown") {
            e.preventDefault();
            palette.moveSelection(1, list.length);
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            palette.moveSelection(-1, list.length);
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            let idx = palette.selectedIndex();
            if (idx >= 0 && idx < list.length) {
                navigateToCalculator(list[idx].id);
            }
        }
        else if (e.key === "Escape") {
            e.preventDefault();
            handleClose();
        }
    }
    function getItemClass(index: number): string {
        if (index === palette.selectedIndex()) {
            return styles.paletteItem + " " + styles.selected;
        }
        return styles.paletteItem;
    }
    return (
        <Show when={palette.isOpen()}>
            <div class={styles.paletteBackdrop} onClick={handleClose} />
            <div class={styles.commandPalette} role="dialog" aria-modal="true" aria-label="Calculator search">
                <div class={styles.paletteInputWrap}>
                    <span class={styles.paletteSearchIcon}>
                        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
                            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
                            <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </span>
                    <input type="text" ref={inputRef} placeholder="Search calculators..." aria-label="Search calculators" onInput={handleInput} onKeyDown={handleKeyDown} autocomplete="off" spellcheck={false} />
                </div>
                <ul class={styles.paletteList}>
                    <For each={filtered()}>
                        {(calc, index) => (
                            <li>
                                <button type="button" class={function (): string { return getItemClass(index()); }} onClick={function () { navigateToCalculator(calc.id); }}>
                                    <span class={styles.paletteItemName}>{calc.name}</span>
                                    <span class={styles.paletteItemCategory}>{calc.category}</span>
                                </button>
                            </li>
                        )}
                    </For>
                </ul>
            </div>
        </Show>
    );
}
export {CommandPalette};
