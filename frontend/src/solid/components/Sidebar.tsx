import type {JSX} from "solid-js";
import {For, createSignal, onMount} from "solid-js";
import {A} from "@solidjs/router";
import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";
import {ThemeToggle} from "./ThemeToggle";
import {WorkspaceList} from "./WorkspaceList";
import styles from "./Sidebar.module.css";
interface GroupedCalculators {
    category: string;
    items: CalculatorInfo[];
}
function calculatorIdToRoute(id: string): string {
    if (id === "mass-calc") {
        return "/molar-mass";
    }
    return "/" + id;
}
function groupByCategory(calculators: CalculatorInfo[]): GroupedCalculators[] {
    let groups: GroupedCalculators[] = [];
    let i: number;
    for (i = 0; i < calculators.length; i++) {
        let calc = calculators[i];
        let last: GroupedCalculators | null;
        if (groups.length > 0) {
            last = groups[groups.length - 1];
        }
        else {
            last = null;
        }
        if (last !== null && last.category === calc.category) {
            last.items.push(calc);
        }
        else {
            groups.push({category: calc.category, items: [calc]});
        }
    }
    return groups;
}
function Sidebar(): JSX.Element {
    let [calculators, setCalculators] = createSignal<CalculatorInfo[]>([]);
    let fileInputRef: HTMLInputElement | undefined;
    onMount(function (): void {
        let nav = NavigationManager.getInstance();
        setCalculators(nav.getCalculators());
    });
    function handleExport(): void {
        DataPortabilityManager.getInstance().exportToFile();
    }
    function handleImportClick(): void {
        if (fileInputRef !== undefined) {
            fileInputRef.click();
        }
    }
    function handleFileChange(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        if (target.files === null) {
            return;
        }
        if (target.files.length === 0) {
            return;
        }
        let file = target.files[0];
        DataPortabilityManager.getInstance().importFromFile(file);
    }
    return (
        <aside class={styles.sidebar} role="navigation" aria-label="Calculator sidebar">
            <div class={styles.sidebarHeader}>
                <h1>Chemistry Utility</h1>
                <div class={styles.headerTop}>
                    <div class={styles.logoIcon}>
                        <svg width="16" height="16" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="6" fill="currentColor" />
                        </svg>
                    </div>
                    <button class={styles.sidebarToggle} type="button" aria-label="Toggle sidebar">
                        <svg width="16" height="16" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </button>
                    <ThemeToggle />
                </div>
            </div>
            <div class={styles.sidebarSearch} role="search">
                <span class={styles.searchIcon}>
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16">
                        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
                        <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" />
                    </svg>
                </span>
                <input type="text" placeholder="Search calculators..." aria-label="Search calculators" />
            </div>
            <WorkspaceList />
            <div class={styles.navRecent} />
            <nav class={styles.sidebarNav}>
                <ul>
                    <For each={groupByCategory(calculators())}>
                        {(group) => (
                            <>
                                <li class={styles.navCategory}>{group.category}</li>
                                <For each={group.items}>
                                    {(calc) => (
                                        <li>
                                            <A href={calculatorIdToRoute(calc.id)} class={styles.navLink} activeClass={styles.active}>
                                                <svg class={styles.navIcon} aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                                                </svg>
                                                <span class={styles.navLabel}>{calc.name}</span>
                                            </A>
                                        </li>
                                    )}
                                </For>
                            </>
                        )}
                    </For>
                </ul>
            </nav>
            <div class={styles.sidebarFooter}>
                <div class={styles.sidebarFooterActions}>
                    <button type="button" class={styles.sidebarFooterButton} onClick={handleExport}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Export Data</span>
                    </button>
                    <button type="button" class={styles.sidebarFooterButton} onClick={handleImportClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Import Data</span>
                    </button>
                    <input type="file" ref={fileInputRef} style={{display: "none"}} accept=".chemutil,.json,application/json" onChange={handleFileChange} />
                </div>
                <p>&copy; 2026 Richard's Blogs</p>
                <p>Main site: <a href="https://www.richardsblogs.com" target="_blank" rel="noopener noreferrer">www.richardsblogs.com</a></p>
            </div>
        </aside>
    );
}
export {Sidebar, calculatorIdToRoute};
