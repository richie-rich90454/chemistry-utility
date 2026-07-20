import type {JSX} from "solid-js";
import {For, createSignal, onMount} from "solid-js";
import {A} from "@solidjs/router";
import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {GroupedCalculators, groupByCategory, calculatorIdToRoute} from "../../modules/calculatorHelper.js";
import {ThemeToggle} from "./ThemeToggle";
import {WorkspaceList} from "./WorkspaceList";
import {ExportImportButtons} from "./ExportImportButtons";
import {PluginManagerPanel} from "./PluginManagerPanel";
import styles from "./Sidebar.module.css";
function Sidebar(): JSX.Element {
    let [calculators, setCalculators] = createSignal<CalculatorInfo[]>([]);
    let [searchQuery, setSearchQuery] = createSignal("");
    let [collapsed, setCollapsed] = createSignal(false);
    onMount(function (): void {
        let nav = NavigationManager.getInstance();
        setCalculators(nav.getCalculators());
    });

    function filteredCalculators(): CalculatorInfo[] {
        let q = searchQuery().toLowerCase().trim();
        if (q === "") {
            return calculators();
        }
        return calculators().filter(function (calc: CalculatorInfo): boolean {
            return calc.name.toLowerCase().indexOf(q) !== -1 ||
                calc.category.toLowerCase().indexOf(q) !== -1 ||
                calc.description.toLowerCase().indexOf(q) !== -1;
        });
    }

    function handleSearchInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setSearchQuery(target.value);
    }

    function handleToggleSidebar(): void {
        setCollapsed(!collapsed());
    }
    return (
        <aside class={styles.sidebar} role="navigation" aria-label="Calculator sidebar" data-collapsed={collapsed() || undefined}>
            <div class={styles.sidebarHeader}>
                <h1>Chemistry Utility</h1>
                <div class={styles.headerTop}>
                    <div class={styles.logoIcon}>
                        <svg width="16" height="16" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="6" fill="currentColor" />
                        </svg>
                    </div>
                    <button class={styles.sidebarToggle} type="button" aria-label={collapsed() ? "Expand sidebar" : "Collapse sidebar"} onClick={handleToggleSidebar}>
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
                <input type="text" placeholder="Search calculators..." aria-label="Search calculators" value={searchQuery()} onInput={handleSearchInput} autocomplete="off" spellcheck={false} />
            </div>
            <WorkspaceList />
            <div class={styles.navRecent} />
            <nav class={styles.sidebarNav}>
                <ul>
                    <For each={groupByCategory(filteredCalculators())}>
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
                <ExportImportButtons />
                <PluginManagerPanel />
                <p>&copy; 2026 Richard's Blogs</p>
                <p>Main site: <a href="https://www.richardsblogs.com" target="_blank" rel="noopener noreferrer">www.richardsblogs.com</a></p>
            </div>
        </aside>
    );
}
export {Sidebar};
// Re-export for backward compatibility with files that import calculatorIdToRoute from Sidebar
export {calculatorIdToRoute} from "../../modules/calculatorHelper.js";
