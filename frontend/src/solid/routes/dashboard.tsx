/**
 * Visual verification: The Solid-rendered Dashboard view should match the
 * legacy #dashboard-view section in frontend/index.html. Intentional diff:
 * the legacy DashboardManager imperatively built DOM nodes for stats,
 * recent, activity, and favorites into a container it owned; this route
 * owns the DOM via JSX and calls the manager only for its read APIs
 * (loadDashboardData populates lastCalculations; getLastCalculations
 * returns the cached array). The manager's render* methods are no-ops
 * when its container is null (we never call init/render), so calling
 * loadDashboardData is safe and only populates the data cache. The
 * weekly activity chart is wired in a later subtask. No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import type {CalculationRecord, DashboardStats} from "../../modules/dashboardManager.js";
import {createSignal, onMount, For, Show} from "solid-js";
import {DashboardManager} from "../../modules/dashboardManager.js";
import styles from "./dashboard.module.css";
function computeStats(calculations: CalculationRecord[]): DashboardStats {
    let totalCalculations: number = calculations.length;
    let favoriteCount: number = 0;
    let thisWeekCount: number = 0;
    let calculatorTypes: Record<string, boolean> = {};
    let now: number = Date.now();
    let weekAgo: number = now - 7 * 24 * 60 * 60 * 1000;
    let i: number;
    for (i = 0; i < calculations.length; i++) {
        let calc: CalculationRecord = calculations[i];
        if (calc.Starred) {
            favoriteCount++;
        }
        let created: number = new Date(calc.CreatedAt).getTime();
        if (!isNaN(created) && created >= weekAgo) {
            thisWeekCount++;
        }
        calculatorTypes[calc.CalculatorType] = true;
    }
    let calculatorsUsed: number = Object.keys(calculatorTypes).length;
    return {
        "totalCalculations": totalCalculations,
        "favoriteCount": favoriteCount,
        "thisWeekCount": thisWeekCount,
        "calculatorsUsed": calculatorsUsed
    };
}
function filterFavorites(calculations: CalculationRecord[]): CalculationRecord[] {
    let favorites: CalculationRecord[] = [];
    let i: number;
    for (i = 0; i < calculations.length; i++) {
        if (calculations[i].Starred) {
            favorites.push(calculations[i]);
        }
    }
    return favorites;
}
function formatDate(iso: string): string {
    let d: Date = new Date(iso);
    if (isNaN(d.getTime())) {
        return "";
    }
    let year: number = d.getFullYear();
    let month: number = d.getMonth() + 1;
    let day: number = d.getDate();
    let monthStr: string = month < 10 ? "0" + String(month) : String(month);
    let dayStr: string = day < 10 ? "0" + String(day) : String(day);
    return year + "-" + monthStr + "-" + dayStr;
}
function Dashboard(): JSX.Element {
    let manager = DashboardManager.getInstance();
    let [calculations, setCalculations] = createSignal<CalculationRecord[]>([]);
    let [loading, setLoading] = createSignal(false);
    let [error, setError] = createSignal("");
    onMount(function (): void {
        void refresh();
    });
    async function refresh(): Promise<void> {
        if (loading()) {
            return;
        }
        setLoading(true);
        setError("");
        try {
            await manager.loadDashboardData();
            setCalculations(manager.getLastCalculations());
        }
        catch (e: unknown) {
            let message: string = e instanceof Error ? e.message : "Unknown error";
            setError("Failed to load dashboard: " + message);
        }
        finally {
            setLoading(false);
        }
    }
    function renderStatCards(): JSX.Element {
        let stats: DashboardStats = computeStats(calculations());
        let cards: {"label": string; "value": string}[] = [
            {"label": "Total Calculations", "value": String(stats.totalCalculations)},
            {"label": "Favorites", "value": String(stats.favoriteCount)},
            {"label": "This Week", "value": String(stats.thisWeekCount)},
            {"label": "Calculators Used", "value": String(stats.calculatorsUsed)}
        ];
        return (
            <div class={styles.stats}>
                <For each={cards}>
                    {(card) => (
                        <div class={styles.statCard}>
                            <div class={styles.statLabel}>{card.label}</div>
                            <div class={styles.statValue}>{card.value}</div>
                        </div>
                    )}
                </For>
            </div>
        );
    }
    function renderRecent(): JSX.Element {
        let recents: CalculationRecord[] = calculations();
        return (
            <div class={styles.section}>
                <h3 class={styles.sectionTitle}>Recent Calculations</h3>
                <Show when={recents.length > 0} fallback={<p class={styles.empty}>No calculations yet. Try a calculator to get started.</p>}>
                    <ul class={styles.list}>
                        <For each={recents}>
                            {(calc) => (
                                <li class={styles.listItem}>
                                    <span class={styles.listType}>{calc.CalculatorType}</span>
                                    <span class={styles.listPreview}>{calc.Inputs}</span>
                                    <span class={styles.listDate}>{formatDate(calc.CreatedAt)}</span>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </div>
        );
    }
    function renderActivity(): JSX.Element {
        return (
            <div class={styles.section}>
                <h3 class={styles.sectionTitle}>Weekly Activity</h3>
                <p class={styles.empty}>Weekly activity chart will be available here.</p>
            </div>
        );
    }
    function renderFavorites(): JSX.Element {
        let favorites: CalculationRecord[] = filterFavorites(calculations());
        return (
            <div class={styles.section}>
                <h3 class={styles.sectionTitle}>Favorites</h3>
                <Show when={favorites.length > 0} fallback={<p class={styles.empty}>No favorite calculations yet. Star a calculation to pin it here.</p>}>
                    <ul class={styles.list}>
                        <For each={favorites}>
                            {(calc) => (
                                <li class={styles.listItem}>
                                    <span class={styles.listType}>{calc.CalculatorType}</span>
                                    <span class={styles.listPreview}>{calc.Inputs}</span>
                                    <span class={styles.listDate}>{formatDate(calc.CreatedAt)}</span>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </div>
        );
    }
    return (
        <section class={styles.dashboard} aria-label="User dashboard">
            <div class={styles.container}>
                <h2 class={styles.header}>Dashboard</h2>
                <Show when={loading()}>
                    <div class={styles.loading}>Loading dashboard...</div>
                </Show>
                <Show when={error() !== ""}>
                    <div class={styles.error} role="alert">{error()}</div>
                </Show>
                {renderStatCards()}
                {renderRecent()}
                {renderActivity()}
                {renderFavorites()}
            </div>
        </section>
    );
}
export {Dashboard};
