/**
 * Visual verification: The Solid-rendered Dashboard view should match the
 * legacy #dashboard-view section in frontend/index.html. Intentional diff:
 * the legacy DashboardManager imperatively built DOM nodes for stats,
 * recent, activity, and favorites into a container it owned; this route
 * owns the DOM via JSX and reads reactive state from the useDashboard
 * store wrapper, which calls DashboardManager.loadDashboardData to
 * populate lastCalculations and then derives stats, recent, activity,
 * and favorites signals from getLastCalculations. The manager's render*
 * methods are no-ops when its container is null (we never call
 * init/render), so calling loadDashboardData is safe and only populates
 * the data cache. The weekly activity chart is rendered via the
 * ChartCanvas Solid wrapper (bar type) using ActivityPoint data from the
 * store, mirroring the legacy ChartRenderer.renderActivityChart output.
 * No Playwright screenshot test is added per task spec; parity is
 * verified by manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import type {CalculationRecord} from "../../modules/dashboardManager.js";
import type {ChartData, ChartOptions} from "../../modules/chartRenderer.js";
import {onMount, createMemo, For, Show} from "solid-js";
import {useDashboard} from "../stores/dashboard";
import {ChartCanvas} from "../components/third-party/ChartCanvas";
import styles from "./dashboard.module.css";
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
    let store = useDashboard();
    onMount(function (): void {
        void store.refresh();
    });
    let activityData = createMemo(function (): ChartData {
        let points = store.activity();
        let labels: string[] = [];
        let values: number[] = [];
        let i: number;
        for (i = 0; i < points.length; i++) {
            labels.push(points[i].day);
            values.push(points[i].count);
        }
        return {
            "labels": labels,
            "datasets": [{
                "label": "Calculations",
                "data": values,
                "color": "#0d652d",
                "borderColor": "#0d652d",
                "backgroundColor": "rgba(13,101,45,0.6)"
            }]
        };
    });
    let activityOptions = createMemo(function (): ChartOptions {
        return {
            "title": "Weekly Activity",
            "xLabel": "Day",
            "yLabel": "Calculations",
            "showLegend": false
        };
    });
    function renderStatCards(): JSX.Element {
        let stats = store.stats();
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
        let recents: CalculationRecord[] = store.recent();
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
                <Show when={store.activity().length > 0} fallback={<p class={styles.empty}>Weekly activity chart unavailable.</p>}>
                    <ChartCanvas type="bar" data={activityData()} options={activityOptions()} canvasId="dashboard-activity-chart" />
                </Show>
            </div>
        );
    }
    function renderFavorites(): JSX.Element {
        let favs: CalculationRecord[] = store.favorites();
        return (
            <div class={styles.section}>
                <h3 class={styles.sectionTitle}>Favorites</h3>
                <Show when={favs.length > 0} fallback={<p class={styles.empty}>No favorite calculations yet. Star a calculation to pin it here.</p>}>
                    <ul class={styles.list}>
                        <For each={favs}>
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
                <Show when={store.loading()}>
                    <div class={styles.loading}>Loading dashboard...</div>
                </Show>
                <Show when={store.error() !== ""}>
                    <div class={styles.error} role="alert">{store.error()}</div>
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
