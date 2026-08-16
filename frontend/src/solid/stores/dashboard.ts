import {createSignal} from "solid-js";
import {DashboardManager} from "../../modules/dashboardManager.js";
import type {CalculationRecord, DashboardStats} from "../../modules/dashboardManager.js";
import type {ActivityPoint} from "../../modules/chartRenderer.js";
interface DashboardStore {
    stats: () => DashboardStats;
    recent: () => CalculationRecord[];
    activity: () => ActivityPoint[];
    favorites: () => CalculationRecord[];
    loading: () => boolean;
    error: () => string;
    refresh: () => Promise<void>;
}
let initialStats: DashboardStats = {
    "totalCalculations": 0,
    "favoriteCount": 0,
    "thisWeekCount": 0,
    "calculatorsUsed": 0
};
let [stats, setStats] = createSignal<DashboardStats>(initialStats);
let [recent, setRecent] = createSignal<CalculationRecord[]>([]);
let [activity, setActivity] = createSignal<ActivityPoint[]>([]);
let [favorites, setFavorites] = createSignal<CalculationRecord[]>([]);
let [loading, setLoading] = createSignal(false);
let [error, setError] = createSignal("");
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
function buildActivityPoints(calculations: CalculationRecord[]): ActivityPoint[] {
    let labels: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let counts: number[] = [0, 0, 0, 0, 0, 0, 0];
    let startOfToday: Date = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let startOfTodayMs: number = startOfToday.getTime();
    let i: number;
    for (i = 0; i < calculations.length; i++) {
        let calc: CalculationRecord = calculations[i];
        let created: number = new Date(calc.CreatedAt).getTime();
        if (isNaN(created)) {
            continue;
        }
        let dayDiff: number = Math.floor((startOfTodayMs - created) / (24 * 60 * 60 * 1000));
        if (dayDiff >= 0 && dayDiff < 7) {
            counts[6 - dayDiff] = counts[6 - dayDiff] + 1;
        }
    }
    let points: ActivityPoint[] = [];
    for (i = 0; i < labels.length; i++) {
        points.push({"day": labels[i], "count": counts[i]});
    }
    return points;
}
function filterFavorites(calculations: CalculationRecord[]): CalculationRecord[] {
    let result: CalculationRecord[] = [];
    let i: number;
    for (i = 0; i < calculations.length; i++) {
        if (calculations[i].Starred) {
            result.push(calculations[i]);
        }
    }
    return result;
}
async function refresh(): Promise<void> {
    if (loading()) {
        return;
    }
    setLoading(true);
    setError("");
    try {
        let manager = DashboardManager.getInstance();
        await manager.loadDashboardData();
        let calculations: CalculationRecord[] = manager.getLastCalculations();
        setStats(computeStats(calculations));
        setRecent(calculations);
        setActivity(buildActivityPoints(calculations));
        setFavorites(filterFavorites(calculations));
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Failed to load dashboard: " + message);
    }
    finally {
        setLoading(false);
    }
}
function useDashboard(): DashboardStore {
    return {
        stats: stats,
        recent: recent,
        activity: activity,
        favorites: favorites,
        loading: loading,
        error: error,
        refresh: refresh
    };
}
export {useDashboard};
