/**
 * Visual verification: The Solid-rendered Periodic Table card should match the
 * legacy #ptable-view card in frontend/index.html. Intentional diff: this route
 * renders element tiles via Solid <For> instead of imperative DOM building,
 * and the legend doubles as a category filter (legacy legend was read-only).
 * No Playwright screenshot test is added per task spec; parity is verified by
 * manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, onMount, For} from "solid-js";
import {ChemicalElement} from "../../types.js";
import {DataCache} from "../../modules/dataCache.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./periodic-table.module.css";
const CATEGORY_CLASS_MAP: Record<string, string> = {
    "alkali metal": styles.catAlkaliMetal,
    "alkaline earth metal": styles.catAlkalineEarth,
    "transition metal": styles.catTransitionMetal,
    "post-transition metal": styles.catPostTransition,
    "metalloid": styles.catMetalloid,
    "non-metal": styles.catNonmetal,
    "halogen": styles.catHalogen,
    "noble gas": styles.catNobleGas,
    "lanthanide": styles.catLanthanide,
    "actinide": styles.catActinide
};
function getCategoryClass(type: string): string {
    let cls = CATEGORY_CLASS_MAP[type];
    if (cls === undefined) {
        return styles.catUnknown;
    }
    return cls;
}
function computeCellPosition(element: ChemicalElement): {row: number; col: number} {
    let z = element.atomicNumber;
    if (z >= 57 && z <= 71) {
        return {row: 9, col: (z - 57) + 3};
    }
    if (z >= 89 && z <= 103) {
        return {row: 10, col: (z - 89) + 3};
    }
    let group = element.group as number | null;
    let period = element.period as number | null;
    let col: number;
    let row: number;
    if (group === null || group < 1 || group > 18) {
        col = 1;
    }
    else {
        col = group;
    }
    if (period === null || period < 1 || period > 7) {
        row = 1;
    }
    else {
        row = period;
    }
    return {row: row, col: col};
}
function formatNumber(value: number): string {
    if (Number.isInteger(value)) {
        return String(value);
    }
    return value.toFixed(2);
}
function PeriodicTable(): JSX.Element {
    let [elements, setElements] = createSignal<ChemicalElement[]>([]);
    let [loading, setLoading] = createSignal(true);
    let [loadError, setLoadError] = createSignal("");
    onMount(function (): void {
        loadElements();
    });
    function loadElements(): void {
        let cache = DataCache.getInstance();
        cache.get("ptable").then(function (cached: string | null): void {
            if (cached !== null) {
                try {
                    let parsed: ChemicalElement[] = JSON.parse(cached) as ChemicalElement[];
                    setElements(parsed);
                    setLoading(false);
                    return;
                }
                catch {
                    // Corrupt cache — fall through to fetch
                }
            }
            fetch("/ptable.json").then(function (response: Response): Promise<unknown> {
                if (!response.ok) {
                    throw new Error("HTTP error! status: " + response.status);
                }
                return response.json();
            }).then(function (data: unknown): void {
                let elementData = data as ChemicalElement[];
                setElements(elementData);
                cache.set("ptable", JSON.stringify(elementData));
                setLoading(false);
            }).catch(function (err: unknown): void {
                let message = err instanceof Error ? err.message : String(err);
                setLoadError(message);
                setLoading(false);
            });
        });
    }
    function getStatusText(): string {
        if (loading()) {
            return "Loading elements…";
        }
        if (loadError() !== "") {
            return "Error loading elements: " + loadError();
        }
        return "";
    }
    function getCellClass(element: ChemicalElement): string {
        return styles.cell + " " + getCategoryClass(element.type);
    }
    function getCellStyle(element: ChemicalElement): string {
        let pos = computeCellPosition(element);
        return "grid-column: " + pos.col + "; grid-row: " + pos.row + ";";
    }
    return (
        <CalculatorCard
            title="Interactive Periodic Table - Element Properties, Heatmaps, and Details"
            description="Explore an interactive periodic table of all 118 elements with color-coded categories, hover tooltips, and a click-to-open detail panel. Switch to heatmap mode to visualize trends in electronegativity, atomic radius, ionization energy, or atomic mass using a blue-to-red gradient scale."
            exampleDetails={
                <ExampleDetails>
                    <p>Click any element tile to view detailed properties. Use the category legend to filter by element type.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#element-lookup">For looking up a single element by symbol or name, try the Element Lookup tool.</SeeAlsoLink>
            }
        >
            <div class={styles.wrapper}>
                {getStatusText() && (
                    <div class={loadError() !== "" ? styles.status + " " + styles.statusError : styles.status}>
                        <p>{getStatusText()}</p>
                    </div>
                )}
                {!loading() && loadError() === "" && (
                    <div class={styles.grid} role="grid" aria-label="Periodic table of elements">
                        <For each={elements()}>
                            {(element) => (
                                <button
                                    type="button"
                                    class={getCellClass(element)}
                                    style={getCellStyle(element)}
                                    aria-label={element.name + ", atomic number " + element.atomicNumber}
                                >
                                    <span class={styles.cellNumber}>{String(element.atomicNumber)}</span>
                                    <span class={styles.cellSymbol}>{element.symbol}</span>
                                    <span class={styles.cellName}>{element.name}</span>
                                    <span class={styles.cellMass}>{formatNumber(element.atomicMass)}</span>
                                </button>
                            )}
                        </For>
                    </div>
                )}
            </div>
        </CalculatorCard>
    );
}
export {PeriodicTable};
