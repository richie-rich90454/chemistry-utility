import { ApiClient, ApiError } from "./apiClient.js";
import { AuthManager, AuthState } from "./authManager.js";

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

export interface CalculationsResponse {
    calculations: CalculationRecord[];
    page: number;
    limit: number;
}

export interface DashboardStats {
    totalCalculations: number;
    favoriteCount: number;
    thisWeekCount: number;
    calculatorsUsed: number;
}

export interface AdminOverview {
    users: number;
    calculations: number;
    workspaces: number;
    compounds: number;
}

export interface AdminOverviewResponse {
    overview: AdminOverview;
}

export interface AdminUsageResponse {
    dau: number;
}

export class DashboardManager {
    private static instance: DashboardManager | null = null;
    private container: HTMLElement | null;
    private unsubscribe: Function | null;
    private initialized: boolean;
    private loading: boolean;
    private lastCalculations: CalculationRecord[];

    private constructor() {
        this.container = null;
        this.unsubscribe = null;
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
        let auth: AuthManager = AuthManager.getInstance();
        let self: DashboardManager = this;
        this.unsubscribe = auth.subscribe(function (state: AuthState): void {
            self.handleAuthStateChange(state);
        });
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

    public handleAuthStateChange(state: AuthState): void {
        if (!state.isAuthenticated) {
            if (this.container && this.container.style.display !== "none") {
                this.renderSignInPrompt();
            }
            return;
        }
        if (this.container && this.container.style.display !== "none") {
            this.loadDashboardData();
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
        let auth: AuthManager = AuthManager.getInstance();
        let state: AuthState = auth.getState();
        if (state.isAuthenticated) {
            this.loadDashboardData();
        } else {
            this.renderSignInPrompt();
        }
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
            { "cls": "dashboard-signin-prompt", "html": "" },
            { "cls": "dashboard-stats", "html": "" },
            { "cls": "dashboard-recent", "html": "" },
            { "cls": "dashboard-activity", "html": "" },
            { "cls": "dashboard-favorites", "html": "" },
            { "cls": "dashboard-admin", "html": "" }
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
                if (entry.cls === "dashboard-loading" || entry.cls === "dashboard-signin-prompt" || entry.cls === "dashboard-admin") {
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
        let client: ApiClient = ApiClient.getInstance();
        let auth: AuthManager = AuthManager.getInstance();
        let state: AuthState = auth.getState();
        try {
            let calcResponse: CalculationsResponse = await client.get<CalculationsResponse>("/api/v1/calculations?limit=10");
            let calculations: CalculationRecord[] = calcResponse.calculations || [];
            this.lastCalculations = calculations;
            let stats: DashboardStats;
            try {
                let dashStats: DashboardStats = await client.get<DashboardStats>("/api/v1/analytics/dashboard");
                stats = dashStats;
            } catch (e) {
                stats = this.computeStats(calculations);
            }
            this.renderUsageStats(stats);
            this.renderRecentCalculations(calculations);
            this.renderWeeklyActivity(calculations);
            this.renderFavorites(calculations);
            if (state.user && state.user.role === "admin") {
                await this.loadAdminData();
            } else {
                this.hideAdminSection();
            }
        } catch (e) {
            if (e instanceof ApiError) {
                if (e.status === 401) {
                    this.renderSignInPrompt();
                } else {
                    this.showError("Failed to load dashboard: " + e.detail);
                }
            } else {
                let msg: string = e instanceof Error ? e.message : "Unknown error";
                this.showError("Failed to load dashboard: " + msg);
            }
        } finally {
            this.loading = false;
            this.showLoading(false);
        }
    }

    private async loadAdminData(): Promise<void> {
        let adminContainer: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-admin") as HTMLElement | null)
            : null;
        if (!adminContainer) {
            return;
        }
        adminContainer.style.display = "block";
        adminContainer.innerHTML = "<h3>Admin Overview</h3>";
        let client: ApiClient = ApiClient.getInstance();
        let overview: AdminOverview | null = null;
        let dau: number | null = null;
        try {
            let response: AdminOverviewResponse = await client.get<AdminOverviewResponse>("/api/v1/analytics/overview");
            overview = response.overview;
        } catch (e) {
            // ignore - will display N/A
        }
        try {
            let response: AdminUsageResponse = await client.get<AdminUsageResponse>("/api/v1/analytics/usage");
            dau = response.dau;
        } catch (e) {
            // ignore - will display N/A
        }
        let cards: HTMLElement = document.createElement("div");
        cards.className = "dashboard-admin-cards";
        let totalUsers: number = overview ? overview.users : 0;
        let totalCalcs: number = overview ? overview.calculations : 0;
        cards.appendChild(this.buildStatCard("Total Users", String(totalUsers)));
        cards.appendChild(this.buildStatCard("Daily Active Users", dau !== null ? String(dau) : "N/A"));
        cards.appendChild(this.buildStatCard("Total Calculations", String(totalCalcs)));
        cards.appendChild(this.buildStatCard("Error Rate", "N/A"));
        adminContainer.appendChild(cards);
        let chartContainer: HTMLElement = document.createElement("div");
        chartContainer.className = "dashboard-admin-chart";
        chartContainer.innerHTML = "<h4>Daily Active Users</h4>";
        let chart: HTMLElement = document.createElement("div");
        chart.className = "dashboard-bar-chart";
        let bar: HTMLElement = document.createElement("div");
        bar.className = "dashboard-bar";
        bar.style.height = "60%";
        bar.setAttribute("title", "Today: " + (dau !== null ? String(dau) : "0"));
        chart.appendChild(bar);
        let label: HTMLElement = document.createElement("div");
        label.className = "dashboard-bar-label";
        label.textContent = "Today";
        chart.appendChild(label);
        chartContainer.appendChild(chart);
        adminContainer.appendChild(chartContainer);
        let popular: HTMLElement = document.createElement("div");
        popular.className = "dashboard-admin-popular";
        popular.innerHTML = "<h4>Popular Calculators</h4><p class=\"dashboard-empty\">Data unavailable.</p>";
        adminContainer.appendChild(popular);
    }

    private hideAdminSection(): void {
        let adminContainer: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-admin") as HTMLElement | null)
            : null;
        if (adminContainer) {
            adminContainer.style.display = "none";
            adminContainer.innerHTML = "";
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
        let counts: number[] = [0, 0, 0, 0, 0, 0, 0];
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
        let maxCount: number = 1;
        for (i = 0; i < counts.length; i++) {
            if (counts[i] > maxCount) {
                maxCount = counts[i];
            }
        }
        let chart: HTMLElement = document.createElement("div");
        chart.className = "dashboard-bar-chart";
        for (i = 0; i < counts.length; i++) {
            let barWrap: HTMLElement = document.createElement("div");
            barWrap.className = "dashboard-bar-wrap";
            let bar: HTMLElement = document.createElement("div");
            bar.className = "dashboard-bar";
            let heightPct: number = Math.round((counts[i] / maxCount) * 100);
            bar.style.height = String(heightPct) + "%";
            bar.setAttribute("title", labels[i] + ": " + String(counts[i]));
            barWrap.appendChild(bar);
            let label: HTMLElement = document.createElement("div");
            label.className = "dashboard-bar-label";
            label.textContent = labels[i];
            barWrap.appendChild(label);
            chart.appendChild(barWrap);
        }
        container.appendChild(chart);
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

    public renderSignInPrompt(): void {
        let promptEl: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-signin-prompt") as HTMLElement | null)
            : null;
        if (!promptEl) {
            return;
        }
        promptEl.innerHTML = "<h3>Please Sign In</h3>" +
            "<p>Sign in to view your personalized dashboard with recent calculations, usage stats, and favorites.</p>";
        promptEl.style.display = "block";
        let stats: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-stats") as HTMLElement | null)
            : null;
        if (stats) {
            stats.innerHTML = "";
        }
        let recent: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-recent") as HTMLElement | null)
            : null;
        if (recent) {
            recent.innerHTML = "";
        }
        let activity: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-activity") as HTMLElement | null)
            : null;
        if (activity) {
            activity.innerHTML = "";
        }
        let favorites: HTMLElement | null = this.container
            ? (this.container.querySelector(".dashboard-favorites") as HTMLElement | null)
            : null;
        if (favorites) {
            favorites.innerHTML = "";
        }
        this.hideAdminSection();
    }

    public getLastCalculations(): CalculationRecord[] {
        return this.lastCalculations;
    }

    public destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
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
