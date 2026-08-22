import type {JSX} from "solid-js";
import {For, Show, createSignal, onMount} from "solid-js";
import {A} from "@solidjs/router";
import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {NavigationManager} from "../../modules/navigationManager.js";
import {groupByCategory, calculatorIdToRoute} from "../../modules/calculatorHelper.js";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";
import {ThemeToggle} from "./ThemeToggle";
import {WorkspaceList} from "./WorkspaceList";
import {ExportImportButtons} from "./ExportImportButtons";
import {PluginManagerPanel} from "./PluginManagerPanel";
import styles from "./Sidebar.module.css";

function getIconContent(id: string): JSX.Element {
    switch (id) {
        case "element-lookup": return <><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>;
        case "periodic-table": return <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>;
        case "molar-mass": return <><path d="M3 6l3-4 3 4"/><path d="M3 14l3 4 3-4"/><line x1="6" y1="2" x2="6" y2="18"/><circle cx="16" cy="14" r="4"/></>;
        case "equation-balancer": return <><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/></>;
        case "unit-converter": return <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9h2l.5-2h3l.5 2h2M9 9v4M9 13l1.5 3h3L15 13"/></>;
        case "compound-search": return <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>;
        case "dilution": return <><path d="M8 3h8l-1 5v8a3 3 0 01-6 0V8z"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="18" y2="12"/></>;
        case "mass-percent": return <><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>;
        case "solution-mixing": return <path d="M9 3h6l-4 8v6a2 2 0 01-4 0v-6z"/>;
        case "buffer": return <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>;
        case "pka-pkb": return <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>;
        case "ksp": return <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>;
        case "colligative": return <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>;
        case "titration": return <><line x1="10" y1="2" x2="10" y2="18"/><line x1="7" y1="15" x2="13" y2="15"/><path d="M12 18v4M10 22h4"/></>;
        case "debye-huckel": return <path d="M18 20V10M12 20V4M6 20v-6"/>;
        case "common-ion": return <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>;
        case "nuclear": return <><circle cx="12" cy="12" r="3"/><path d="M12 9l4-7M12 9L8 2M12 15l5 8.5M12 15L7 23.5M19 13l-2.5-4.5M5 13l2.5-4.5M15.5 18.5L13 13M10.5 18.5L11 13"/></>;
        case "gas-laws": return <><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></>;
        case "electrochemistry": return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>;
        case "thermodynamics": return <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6.5 1.901 2.086 3.036 4.682 2 6.5-.5 1-.5 1.62 0 3a2.5 2.5 0 002.5 2.5"/>;
        case "kinetics": return <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>;
        case "quantum-atomic": return <><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></>;
        case "stoichiometry": return <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>;
        case "bond-type": return <><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 9v12M18 9V6M6 15l4 2 4-2 4 2"/></>;
        case "molecular-viewer": return <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>;
        case "batch-calc": return <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>;
        case "dashboard": return <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>;
        default: return <circle cx="12" cy="12" r="3" fill="currentColor"/>;
    }
}

function Sidebar(props: {collapsed?: boolean; onToggle?: () => void}): JSX.Element {
    let [calculators, setCalculators] = createSignal<CalculatorInfo[]>([]);
    let [searchQuery, setSearchQuery] = createSignal("");
    let collapsed = () => props.collapsed ?? false;
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
        if (props.onToggle) props.onToggle();
    }
    return (
        <aside class={styles.sidebar} role="navigation" aria-label="Calculator sidebar" data-collapsed={collapsed() || undefined} data-tour="sidebar">
            <div class={styles.sidebarHeader}>
                <h1>Chemistry Utility</h1>
                <div class={styles.headerTop}>
                    <div class={styles.logoIcon}>
                        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="6" fill="currentColor" />
                        </svg>
                    </div>
                    <button class={styles.sidebarToggle} type="button" aria-label={collapsed() ? "Expand sidebar" : "Collapse sidebar"} onClick={handleToggleSidebar}>
                        <svg width="22" height="22" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            {collapsed() ?
                                <polyline points="9 18 15 12 9 6" /> :
                                <polyline points="15 18 9 12 15 6" />
                            }
                        </svg>
                    </button>
                    <ThemeToggle />
                </div>
            </div>
            <div class={styles.sidebarSearch} role="search" data-tour="sidebar-search">
                <span class={styles.searchIcon}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
                        <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" />
                    </svg>
                </span>
                <input type="text" placeholder="Search calculators..." aria-label="Search calculators" value={searchQuery()} onInput={handleSearchInput} autocomplete="off" spellcheck={false} />
            </div>
            <WorkspaceList />
            <div class={styles.navRecent} />
            <nav class={styles.sidebarNav} data-tour="sidebar-nav">
                <ul>
                    <For each={groupByCategory(filteredCalculators())}>
                        {(group) => (
                            <>
                                <li class={styles.navCategory}>{group.category}</li>
                                <For each={group.items}>
                                    {(calc) => (
                                        <li>
                                            <A href={calculatorIdToRoute(calc.id)} class={styles.navLink} activeClass={styles.active} title={calc.name}>
                                                <svg class={styles.navIcon} aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    {getIconContent(calc.id)}
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
                <Show when={!RuntimeDetector.getInstance().isWebMode}>
                    <ExportImportButtons />
                    <PluginManagerPanel />
                </Show>
                <p>&copy; 2026 Richard's Blogs</p>
                <p>Main site: <a href="https://www.richardsblogs.com" target="_blank" rel="noopener noreferrer">www.richardsblogs.com</a></p>
            </div>
        </aside>
    );
}
export {Sidebar};
// Re-export for backward compatibility with files that import calculatorIdToRoute from Sidebar
export {calculatorIdToRoute} from "../../modules/calculatorHelper.js";
