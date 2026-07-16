import { ApiClient } from "./apiClient.js";
import { AuthManager, AuthState } from "./authManager.js";
import { DashboardManager } from "./dashboardManager.js";

interface TrackedElement {
    container: HTMLElement;
    calculationId: string;
}

/**
 * Manages annotation and star/favorite controls attached to result displays.
 * Persists annotations and star state through the backend calculation API and
 * reacts to authentication state so the controls are hidden for anonymous users.
 */
export class ResultAnnotationManager {
    private static instance: ResultAnnotationManager | null = null;
    private trackedElements: TrackedElement[];
    private unsubscribe: Function | null;
    private initialized: boolean;

    private constructor() {
        this.trackedElements = [];
        this.unsubscribe = null;
        this.initialized = false;
    }

    public static getInstance(): ResultAnnotationManager {
        if (!ResultAnnotationManager.instance) {
            ResultAnnotationManager.instance = new ResultAnnotationManager();
        }
        return ResultAnnotationManager.instance;
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        let results: NodeListOf<HTMLElement> = document.querySelectorAll(".result[data-calculation-id]");
        let i: number;
        for (i = 0; i < results.length; i++) {
            let id: string | null = results[i].getAttribute("data-calculation-id");
            if (id) {
                this.addAnnotationUI(results[i], id);
            }
        }
        let auth: AuthManager = AuthManager.getInstance();
        let self: ResultAnnotationManager = this;
        this.unsubscribe = auth.subscribe(function (state: AuthState): void {
            self.handleAuthStateChange(state);
        });
        let state: AuthState = auth.getState();
        this.applyAuthState(state.isAuthenticated);
    }

    public addAnnotationUI(resultElement: HTMLElement, calculationId: string): void {
        let existing: HTMLElement | null = resultElement.querySelector(".annotation-ui") as HTMLElement | null;
        if (existing) {
            return;
        }
        let container: HTMLElement = document.createElement("div");
        container.className = "annotation-ui";
        container.setAttribute("data-calculation-id", calculationId);

        let starButton: HTMLButtonElement = document.createElement("button");
        starButton.type = "button";
        starButton.className = "annotation-star-button";
        starButton.setAttribute("aria-label", "Toggle favorite");
        starButton.setAttribute("aria-pressed", "false");
        starButton.appendChild(this.createStarIcon(false));

        let input: HTMLInputElement = document.createElement("input");
        input.type = "text";
        input.className = "annotation-input";
        input.placeholder = "Add a note...";
        input.setAttribute("aria-label", "Annotation note");

        container.appendChild(starButton);
        container.appendChild(input);
        resultElement.appendChild(container);

        this.trackedElements.push({ "container": container, "calculationId": calculationId });

        let self: ResultAnnotationManager = this;
        starButton.addEventListener("click", function (): void {
            self.handleStarClick(calculationId, starButton);
        });
        input.addEventListener("blur", function (): void {
            void self.saveAnnotation(calculationId, input.value);
        });

        let auth: AuthManager = AuthManager.getInstance();
        let state: AuthState = auth.getState();
        this.applyAuthStateForContainer(container, state.isAuthenticated);
    }

    private createStarIcon(filled: boolean): SVGElement {
        let svgNamespace: string = "http://www.w3.org/2000/svg";
        let svg: SVGElement = document.createElementNS(svgNamespace, "svg") as SVGElement;
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("aria-hidden", "true");
        let path: SVGElement = document.createElementNS(svgNamespace, "path") as SVGElement;
        path.setAttribute("d", "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        if (filled) {
            path.setAttribute("fill", "var(--md-warning)");
            path.setAttribute("stroke", "var(--md-warning)");
        } else {
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "currentColor");
        }
        svg.appendChild(path);
        return svg;
    }

    private setStarState(starButton: HTMLButtonElement, starred: boolean): void {
        starButton.setAttribute("aria-pressed", starred ? "true" : "false");
        let existing: SVGElement | null = starButton.querySelector("svg") as SVGElement | null;
        if (existing) {
            starButton.removeChild(existing);
        }
        starButton.appendChild(this.createStarIcon(starred));
    }

    private async handleStarClick(calculationId: string, starButton: HTMLButtonElement): Promise<void> {
        try {
            let starred: boolean = await this.toggleStar(calculationId);
            this.setStarState(starButton, starred);
        } catch (e) {
            // star toggle failed; keep current visual state
        }
    }

    public async saveAnnotation(calculationId: string, annotation: string): Promise<void> {
        let client: ApiClient = ApiClient.getInstance();
        await client.patch("/api/v1/calculations/" + calculationId, { "annotation": annotation });
    }

    public async toggleStar(calculationId: string): Promise<boolean> {
        let client: ApiClient = ApiClient.getInstance();
        let response: { starred: boolean } = await client.post<{ starred: boolean }>(
            "/api/v1/calculations/" + calculationId + "/star",
            {}
        );
        let starred: boolean = response.starred;
        try {
            let dashboard: DashboardManager = DashboardManager.getInstance();
            await dashboard.loadDashboardData();
        } catch (e) {
            // dashboard refresh is best-effort
        }
        return starred;
    }

    public handleAuthStateChange(state: AuthState): void {
        this.applyAuthState(state.isAuthenticated);
    }

    private applyAuthState(isAuthenticated: boolean): void {
        let i: number;
        for (i = 0; i < this.trackedElements.length; i++) {
            this.applyAuthStateForContainer(this.trackedElements[i].container, isAuthenticated);
        }
    }

    private applyAuthStateForContainer(container: HTMLElement, isAuthenticated: boolean): void {
        if (isAuthenticated) {
            container.style.display = "";
        } else {
            container.style.display = "none";
        }
    }

    public getTrackedCount(): number {
        return this.trackedElements.length;
    }

    public destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.trackedElements = [];
        this.initialized = false;
    }

    public static resetInstance(): void {
        if (ResultAnnotationManager.instance) {
            ResultAnnotationManager.instance.destroy();
        }
        ResultAnnotationManager.instance = null;
    }
}
