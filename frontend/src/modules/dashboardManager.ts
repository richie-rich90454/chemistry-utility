import { ChartRenderer, ActivityPoint } from "./chartRenderer.js";

export interface CalculationRecord {
    ID: string;
    UserID: string;
    CalculatorType: string;
    Inputs: string;
    Result: string;
    Annotation: string;
    Starred: boolean;
    WorkspaceID: string;
    CreatedAt: string;
}

export interface DashboardStats {
    totalCalculations: number;
    favoriteCount: number;
    thisWeekCount: number;
    calculatorsUsed: number;
}

const CALCULATIONS_STORAGE_KEY: string = "chemutil_calculations";

/**
 * Renders the local dashboard: usage stats, recent calculations, weekly
 * activity chart, and favorites. All data is sourced from localStorage so
 * the dashboard works for local users without any server-side account.
 */
export class DashboardManager {
    private static instance: DashboardManager | null = null;
    private container: HTMLElement | null;
    private initialized: boolean;
    private loading: boolean;
    private lastCalculations: CalculationRecord[];

    private constructor() {
        this.container = null;
        this.initialized = false;
        this.loading = false;
        this.lastCalculations = [];
    }

    public static getInstance(): DashboardManager {
        if (!DashboardManager.instance) {
            DashboardManager.instance = new DashboardManager();
        }
        return DashboardManager.instance;
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.render();
        this.attachNavInterception();
    }

    private attachNavInterception(): void {
        let dashboardLink: HTMLElement | null = document.querySelector('.sidebar-nav a[href="#dashboard-view"]');
        if (dashboardLink) {
            let self: DashboardManager = this;
            dashboardLink.addEventListener("click", function (): void {
                self.show();
            });
        }
        let links: NodeListOf<HTMLElement> = document.querySelectorAll(".sidebar-nav a");
        let self: DashboardManager = this;
        let i: number;
        for (i = 0; i < links.length; i++) {
            let link: HTMLElement = links[i];
            let href: string | null = link.getAttribute("href");
            if (!href || href === "#dashboard-view") {
                continue;
            }
            link.addEventListener("click", function (): void {
                self.hide();
            });
        }
    }

    public show(): void {
        if (!this.container) {
            return;
        }
        let sections: NodeListOf<HTMLElement> = document.querySelectorAll(".app-view .main-groups.card");
        let i: number;
        for (i = 0; i < sections.length; i++) {
            let section: HTMLElement = sections[i];
            section.classList.remove("view-active");
            section.classList.add("view-hidden");
        }
        let welcomeScreen: HTMLElement | null = document.querySelector(".app-view .welcome-screen");
        if (welcomeScreen) {
            welcomeScreen.style.display = "none";
        }
        let viewHeader: HTMLElement | null = document.querySelector(".view-header");
        if (viewHeader) {
            viewHeader.style.display = "none";
        }
        this.container.style.display = "block";
        void this.loadDashboardData();
    }

    public hide(): void {
        if (!this.container) {
            return;
        }
        this.container.style.display = "none";
    }

    public isVisible(): boolean {
        if (!this.container) {
            return false;
        }
        return this.container.style.display !== "none";
    }

    public render(): HTMLElement {
        let existing: HTMLElement | null = document.getElementById("dashboard-view");
        if (existing) {
            this.container = existing;
            this.ensureStructure(existing);
            return existing;
        }
        let section: HTMLElement = document.createElement("section");
        section.id = "dashboard-view";
        section.className = "dashboard-view";
        section.style.display = "none";
        section.setAttribute("aria-label", "User dashboard");
        this.ensureStructure(section);
        let main: HTMLElement | null = document.getElementById("main-content");
        if (main) {
            main.appendChild(section);
        }
        this.container = section;
        return section;
    }

    private ensureStructure(section: HTMLElement): void {
        let container: HTMLElement | null = section.querySelector(".dashboard-container") as HTMLElement | null;
        if (!container) {
            container = document.createElement("div");
            container.className = "dashboard-container";
            section.appendChild(container);
        }
        let header: HTMLElement | null = container.querySelector("h2") as HTMLElement | null;
        if (!header) {
            header = document.createElement("h2");
            header.textContent = "Dashboard";
            container.appendChild(header);
        }
        let required: { cls: string; html: string }[] = [
            { "cls": "dashboard-loading", "html": "Loading dashboard..." },
            { "cls": "dashboard-error", "html": "" },
            { "cls": "dashboard-stats", "html": "" },
            { "cls": "dashboard-recent", "html": "" },
            { "cls": "dashboard-activity", "html": "" },
            { "cls": "dashboard-favorites", "html": "" }
        ];
        let i: number;
        for (i = 0; i < required.length; i++) {
            let entry: { cls: string; html: string } = required[i];
            let existingChild: HTMLElement | null = container.querySelector("." + entry.cls) as HTMLElement | null;
            if (!existingChild) {
                let child: HTMLElement = document.createElement("div");
                child.className = entry.cls;
                if (entry.html) {
                    child.textContent = entry.html;
                }
                if (entry.cls === "dashboard-loading") {
                    child.style.display = "none";
                }
                if (entry.cls === "dashboard-error") {
                    child.setAttribute("role", "alert");
                    child.style.display = "none";
                }
                container.appendChild(child);
            }
        }
    }

    public async loadDashboardData(): Promise<void> {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.showLoading(true);
        this.showError("");
        try {
            let calculations: CalculationRecord[] = this.readCalculations();
            this.lastCalculations = calculations;
            let stats: DashboardStats = this.computeStats(calculations);
            this.renderUsageStats(stats);
            this.renderRecentCalculations(calculations);
            this.renderWeeklyActivity(calculations);
            this.renderFavorites(calculations);
        } catch (e) {
            let msg: string = e instanceof Error ? e.message : "Unknown error";
            this.showError("Failed to load dashboard: " + msg);
        } finally {
            this.loading = false;
            this.showLoading(false);
        }
    }

    private computeStats(calculations: CalculationRecord[]): DashboardStats {
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
        let calculatorsUsed: number = 0;
        let keys: string[] = Object.keys(calculatorTypes);
        for (i = 0; i < keys.length; i++) {
            if (calculatorTypes.hasOwnProperty(keys[i])) {
                calculatorsUsed++;
            }
        }
        return {
            "totalCalculations": totalCalculations,
            "favoriteCount": favoriteCount,
            "thisWeekCount": thisWeekCount,
            "calculatorsUsed": calculatorsUsed
        };
    }

    public renderUsageStats(stats: DashboardStats): void {
        let statsContainer: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-stats") as HTMLElement | null)
            : null;
        if (!statsContainer) {
            return;
        }
        statsContainer.innerHTML = "";
        let cards: HTMLElement[] = [
            this.buildStatCard("Total Calculations", String(stats.totalCalculations)),
            this.buildStatCard("Favorites", String(stats.favoriteCount)),
            this.buildStatCard("This Week", String(stats.thisWeekCount)),
            this.buildStatCard("Calculators Used", String(stats.calculatorsUsed))
        ];
        let i: number;
        for (i = 0; i < cards.length; i++) {
            statsContainer.appendChild(cards[i]);
        }
    }

    private buildStatCard(label: string, value: string): HTMLElement {
        let card: HTMLElement = document.createElement("div");
        card.className = "dashboard-stat-card";
        let labelEl: HTMLElement = document.createElement("div");
        labelEl.className = "dashboard-stat-label";
        labelEl.textContent = label;
        let valueEl: HTMLElement = document.createElement("div");
        valueEl.className = "dashboard-stat-value";
        valueEl.textContent = value;
        card.appendChild(labelEl);
        card.appendChild(valueEl);
        return card;
    }

    public renderRecentCalculations(calculations: CalculationRecord[]): void {
        let container: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-recent") as HTMLElement | null)
            : null;
        if (!container) {
            return;
        }
        container.innerHTML = "<h3>Recent Calculations</h3>";
        if (calculations.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "dashboard-empty";
            empty.textContent = "No calculations yet. Try a calculator to get started.";
            container.appendChild(empty);
            return;
        }
        let list: HTMLElement = document.createElement("ul");
        list.className = "dashboard-list";
        let i: number;
        for (i = 0; i < calculations.length; i++) {
            let calc: CalculationRecord = calculations[i];
            list.appendChild(this.buildCalcListItem(calc));
        }
        container.appendChild(list);
    }

    private buildCalcListItem(calc: CalculationRecord): HTMLElement {
        let item: HTMLElement = document.createElement("li");
        item.className = "dashboard-list-item";
        let type: HTMLElement = document.createElement("span");
        type.className = "dashboard-list-type";
        type.textContent = calc.CalculatorType;
        let preview: HTMLElement = document.createElement("span");
        preview.className = "dashboard-list-preview";
        preview.textContent = calc.Inputs;
        let date: HTMLElement = document.createElement("span");
        date.className = "dashboard-list-date";
        date.textContent = this.formatDate(calc.CreatedAt);
        item.appendChild(type);
        item.appendChild(preview);
        item.appendChild(date);
        return item;
    }

    public renderWeeklyActivity(calculations: CalculationRecord[]): void {
        let container: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-activity") as HTMLElement | null)
            : null;
        if (!container) {
            return;
        }
        container.innerHTML = "<h3>Weekly Activity</h3>";
        let counts: number[] = [0,0,0,0,0,0,0];
        let labels: string[] = this.getDayLabels();
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
        let chartCanvas: HTMLCanvasElement | null = container.querySelector("canvas#dashboard-activity-chart") as HTMLCanvasElement | null;
        if (!chartCanvas) {
            let chartWrap: HTMLElement = document.createElement("div");
            chartWrap.className = "chart-container";
            chartCanvas = document.createElement("canvas");
            chartCanvas.id = "dashboard-activity-chart";
            chartWrap.appendChild(chartCanvas);
            container.appendChild(chartWrap);
        }
        let dataPoints: ActivityPoint[] = [];
        for (i = 0; i < labels.length; i++) {
            dataPoints.push({ "day": labels[i], "count": counts[i] });
        }
        try {
            ChartRenderer.getInstance().renderActivityChart("dashboard-activity-chart", dataPoints);
        } catch (e) {
            let fallback: HTMLElement = document.createElement("p");
            fallback.className = "dashboard-empty";
            fallback.textContent = "Weekly activity chart unavailable.";
            container.appendChild(fallback);
        }
    }

    private getDayLabels(): string[] {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }

    public renderFavorites(calculations: CalculationRecord[]): void {
        let container: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-favorites") as HTMLElement | null)
            : null;
        if (!container) {
            return;
        }
        container.innerHTML = "<h3>Favorites</h3>";
        let favorites: CalculationRecord[] = [];
        let i: number;
        for (i = 0; i < calculations.length; i++) {
            if (calculations[i].Starred) {
                favorites.push(calculations[i]);
            }
        }
        if (favorites.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "dashboard-empty";
            empty.textContent = "No favorite calculations yet. Star a calculation to pin it here.";
            container.appendChild(empty);
            return;
        }
        let list: HTMLElement = document.createElement("ul");
        list.className = "dashboard-list";
        for (i = 0; i < favorites.length; i++) {
            list.appendChild(this.buildCalcListItem(favorites[i]));
        }
        container.appendChild(list);
    }

    private formatDate(iso: string): string {
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

    private showLoading(show: boolean): void {
        let loadingEl: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-loading") as HTMLElement | null)
            : null;
        if (loadingEl) {
            loadingEl.style.display = show ? "block" : "none";
        }
    }

    private showError(message: string): void {
        let errorEl: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-error") as HTMLElement | null)
            : null;
        if (!errorEl) {
            return;
        }
        if (message) {
            errorEl.textContent = message;
            errorEl.style.display = "block";
        } else {
            errorEl.textContent = "";
            errorEl.style.display = "none";
        }
    }

    public getLastCalculations(): CalculationRecord[] {
        return this.lastCalculations;
    }

    private readCalculations(): CalculationRecord[] {
        let raw: string | null = localStorage.getItem(CALCULATIONS_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as CalculationRecord[];
            }
        } catch (e) {
            // fall through to empty array
        }
        return [];
    }

    public destroy(): void {
        this.initialized = false;
        this.loading = false;
        this.lastCalculations = [];
    }

    public static resetInstance(): void {
        if (DashboardManager.instance) {
            DashboardManager.instance.destroy();
        }
        DashboardManager.instance = null;
    }
}
