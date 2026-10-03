export interface ExperimentLog {
    "id": string;
    "title": string;
    "workspaceId": string;
    "createdAt": string;
}

export interface ExperimentStepData {
    "title": string;
    "data": string;
}

export interface ExperimentStep {
    "id": string;
    "logId": string;
    "title": string;
    "data": string;
    "annotation": string;
    "createdAt": string;
}

const LOGS_STORAGE_KEY: string = "chemutil_experiment_logs";
const STEPS_STORAGE_KEY_PREFIX: string = "chemutil_experiment_steps_";

/**
 * Manages experiment log entries and their step timelines. Logs and steps are
 * persisted to localStorage so local users can record experiments without any
 * server-side account. The current session also keeps an in-memory timeline so
 * the timeline view can be rendered without an extra storage read.
 */
export class ExperimentLogManager {
    private static instance: ExperimentLogManager | null = null;
    private container: HTMLElement | null;
    private initialized: boolean;
    private logs: ExperimentLog[];
    private stepsByLog: Record<string, ExperimentStep[]>;
    private stepById: Record<string, ExperimentStep>;
    private currentLogId: string | null;

    private constructor() {
        this.container = null;
        this.initialized = false;
        this.logs = [];
        this.stepsByLog = {};
        this.stepById = {};
        this.currentLogId = null;
    }

    public static getInstance(): ExperimentLogManager {
        if (!ExperimentLogManager.instance) {
            ExperimentLogManager.instance = new ExperimentLogManager();
        }
        return ExperimentLogManager.instance;
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.renderView();
        this.logs = this.readLogs();
        let i: number;
        let logIds: string[] = Object.keys(this.logs);
        for (i = 0; i < logIds.length; i++) {
            let logId: string = this.logs[i].id;
            this.stepsByLog[logId] = this.readSteps(logId);
            let j: number;
            let steps: ExperimentStep[] = this.stepsByLog[logId];
            for (j = 0; j < steps.length; j++) {
                this.stepById[steps[j].id] = steps[j];
            }
        }
    }
    public async loadLogs(): Promise<ExperimentLog[]> {
        this.logs = this.readLogs();
        let i: number;
        let logIds: string[] = Object.keys(this.logs);
        for (i = 0; i < logIds.length; i++) {
            let logId: string = this.logs[i].id;
            this.stepsByLog[logId] = this.readSteps(logId);
            let j: number;
            let steps: ExperimentStep[] = this.stepsByLog[logId];
            for (j = 0; j < steps.length; j++) {
                this.stepById[steps[j].id] = steps[j];
            }
        }
        return this.logs.slice();
    }

    private renderView(): HTMLElement {
        let existing: HTMLElement | null = document.getElementById("experiment-log-view");
        if (existing) {
            this.container = existing;
            this.ensureViewStructure(existing);
            return existing;
        }
        let section: HTMLElement = document.createElement("section");
        section.id = "experiment-log-view";
        section.className = "experiment-log-view";
        section.style.display = "none";
        section.setAttribute("aria-label", "Experiment log");
        this.ensureViewStructure(section);
        let main: HTMLElement | null = document.getElementById("main-content");
        if (main) {
            main.appendChild(section);
        }
        this.container = section;
        return section;
    }

    private ensureViewStructure(section: HTMLElement): void {
        let required: { "cls": string }[] = [
            { "cls": "experiment-log-header" },
            { "cls": "experiment-log-error" },
            { "cls": "experiment-log-timeline" }
        ];
        let i: number;
        for (i = 0; i < required.length; i++) {
            let cls: string = required[i].cls;
            let child: HTMLElement | null = section.querySelector("." + cls) as HTMLElement | null;
            if (!child) {
                child = document.createElement("div");
                child.className = cls;
                if (cls === "experiment-log-error") {
                    child.setAttribute("role", "alert");
                    child.style.display = "none";
                }
                section.appendChild(child);
            }
        }
    }

    public async createLog(title: string, workspaceId: string): Promise<ExperimentLog> {
        let log: ExperimentLog = {
            "id": this.generateId("log"),
            "title": title,
            "workspaceId": workspaceId,
            "createdAt": new Date().toISOString()
        };
        this.logs.push(log);
        this.stepsByLog[log.id] = [];
        this.writeLogs(this.logs);
        this.currentLogId = log.id;
        this.renderLog(log);
        this.showView();
        return log;
    }

    public async addStep(logId: string, stepData: ExperimentStepData): Promise<ExperimentStep> {
        let step: ExperimentStep = {
            "id": this.generateId("step"),
            "logId": logId,
            "title": stepData.title,
            "data": stepData.data,
            "annotation": "",
            "createdAt": new Date().toISOString()
        };
        if (!this.stepsByLog.hasOwnProperty(logId)) {
            this.stepsByLog[logId] = [];
        }
        this.stepsByLog[logId].push(step);
        this.stepById[step.id] = step;
        this.writeSteps(logId, this.stepsByLog[logId]);
        return step;
    }

    public async annotateStep(stepId: string, annotation: string): Promise<void> {
        let step: ExperimentStep | undefined = this.stepById[stepId];
        if (!step) {
            return;
        }
        step.annotation = annotation;
        this.writeSteps(step.logId, this.stepsByLog[step.logId] || []);
    }

    public viewTimeline(logId: string): ExperimentStep[] {
        let steps: ExperimentStep[] = this.stepsByLog[logId] || [];
        let copy: ExperimentStep[] = steps.slice();
        copy.sort(function (a: ExperimentStep, b: ExperimentStep): number {
            if (a.createdAt < b.createdAt) {
                return -1;
            }
            if (a.createdAt > b.createdAt) {
                return 1;
            }
            return 0;
        });
        this.currentLogId = logId;
        let log: ExperimentLog | undefined;
        let i: number;
        for (i = 0; i < this.logs.length; i++) {
            if (this.logs[i].id === logId) {
                log = this.logs[i];
                break;
            }
        }
        if (log) {
            this.renderLog(log);
        }
        this.renderTimeline(copy);
        this.showView();
        return copy;
    }

    public renderLog(log: ExperimentLog): void {
        if (!this.container) {
            return;
        }
        this.currentLogId = log.id;
        let header: HTMLElement | null = this.container.querySelector(".experiment-log-header") as HTMLElement | null;
        if (!header) {
            return;
        }
        header.innerHTML = "";
        let title: HTMLHeadingElement = document.createElement("h2");
        title.className = "experiment-log-title";
        title.textContent = log.title;
        let meta: HTMLElement = document.createElement("p");
        meta.className = "experiment-log-meta";
        meta.textContent = "Created: " + this.formatDate(log.createdAt);
        header.appendChild(title);
        header.appendChild(meta);
        let self: ExperimentLogManager = this;
        let addStepBtn: HTMLButtonElement = document.createElement("button");
        addStepBtn.type = "button";
        addStepBtn.className = "experiment-log-add-step-btn";
        addStepBtn.textContent = "Add Step";
        addStepBtn.addEventListener("click", function (): void {
            void self.promptAddStep(log.id);
        });
        header.appendChild(addStepBtn);
        let exportBtn: HTMLButtonElement = document.createElement("button");
        exportBtn.type = "button";
        exportBtn.className = "experiment-log-export-pdf-btn";
        exportBtn.textContent = "Export PDF";
        exportBtn.addEventListener("click", function (): void {
            self.exportToPDF();
        });
        header.appendChild(exportBtn);
    }

    public renderTimeline(steps: ExperimentStep[]): void {
        if (!this.container) {
            return;
        }
        let timeline: HTMLElement | null = this.container.querySelector(".experiment-log-timeline") as HTMLElement | null;
        if (!timeline) {
            return;
        }
        timeline.innerHTML = "<h3>Timeline</h3>";
        if (steps.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "experiment-log-empty";
            empty.textContent = "No steps recorded yet.";
            timeline.appendChild(empty);
            return;
        }
        let list: HTMLElement = document.createElement("ol");
        list.className = "experiment-log-steps";
        let self: ExperimentLogManager = this;
        let i: number;
        for (i = 0; i < steps.length; i++) {
            let step: ExperimentStep = steps[i];
            let item: HTMLElement = document.createElement("li");
            item.className = "experiment-log-step";
            let stepTitle: HTMLElement = document.createElement("div");
            stepTitle.className = "experiment-log-step-title";
            stepTitle.textContent = step.title;
            let stepData: HTMLElement = document.createElement("div");
            stepData.className = "experiment-log-step-data";
            stepData.textContent = step.data;
            let stepAnnotation: HTMLElement = document.createElement("div");
            stepAnnotation.className = "experiment-log-step-annotation";
            stepAnnotation.textContent = step.annotation;
            let annotateInput: HTMLInputElement = document.createElement("input");
            annotateInput.type = "text";
            annotateInput.className = "experiment-log-step-annotate-input";
            annotateInput.value = step.annotation;
            annotateInput.setAttribute("aria-label", "Annotate step");
            annotateInput.placeholder = "Add annotation...";
            let stepId: string = step.id;
            annotateInput.addEventListener("blur", function (): void {
                void self.annotateStep(stepId, annotateInput.value).then(function (): void {
                    stepAnnotation.textContent = annotateInput.value;
                });
            });
            item.appendChild(stepTitle);
            item.appendChild(stepData);
            item.appendChild(stepAnnotation);
            item.appendChild(annotateInput);
            list.appendChild(item);
        }
        timeline.appendChild(list);
    }

    public async promptAddStep(logId: string): Promise<ExperimentStep | null> {
        let title: string | null = window.prompt("Step title");
        if (!title) {
            return null;
        }
        let data: string = window.prompt("Step details") || "";
        try {
            let step: ExperimentStep = await this.addStep(logId, { "title": title, "data": data });
            this.viewTimeline(logId);
            return step;
        } catch (e) {
            this.showError(this.extractMessage(e, "Failed to add step"));
            return null;
        }
    }

    public getLogs(): ExperimentLog[] {
        return this.logs.slice();
    }

    public getSteps(logId: string): ExperimentStep[] {
        let steps: ExperimentStep[] = this.stepsByLog[logId] || [];
        return steps.slice();
    }

    public getCurrentLogId(): string | null {
        return this.currentLogId;
    }

    public showView(): void {
        if (!this.container) {
            return;
        }
        let sections: NodeListOf<HTMLElement> = document.querySelectorAll(".app-view .main-groups.card");
        let i: number;
        for (i = 0; i < sections.length; i++) {
            sections[i].classList.remove("view-active");
            sections[i].classList.add("view-hidden");
        }
        let dashboard: HTMLElement | null = document.getElementById("dashboard-view");
        if (dashboard) {
            dashboard.style.display = "none";
        }
        let workspace: HTMLElement | null = document.getElementById("workspace-view");
        if (workspace) {
            workspace.style.display = "none";
        }
        let welcome: HTMLElement | null = document.querySelector(".app-view .welcome-screen");
        if (welcome) {
            welcome.style.display = "none";
        }
        let viewHeader: HTMLElement | null = document.querySelector(".view-header");
        if (viewHeader) {
            viewHeader.style.display = "none";
        }
        this.container.style.display = "block";
    }

    public hideView(): void {
        if (!this.container) {
            return;
        }
        this.container.style.display = "none";
    }

    public isViewVisible(): boolean {
        if (!this.container) {
            return false;
        }
        return this.container.style.display !== "none";
    }

    public exportToPDF(): void {
        window.print();
    }

    public async loadTimeline(logId: string): Promise<ExperimentStep[]> {
        let steps: ExperimentStep[] = this.readSteps(logId);
        this.stepsByLog[logId] = steps;
        let i: number;
        for (i = 0; i < steps.length; i++) {
            this.stepById[steps[i].id] = steps[i];
        }
        this.renderTimeline(steps);
        return steps;
    }

    public deleteLog(logId: string): void {
        let i: number;
        for (i = 0; i < this.logs.length; i++) {
            if (this.logs[i].id === logId) {
                this.logs.splice(i, 1);
                break;
            }
        }
        let steps: ExperimentStep[] = this.stepsByLog[logId] || [];
        for (i = 0; i < steps.length; i++) {
            delete this.stepById[steps[i].id];
        }
        delete this.stepsByLog[logId];
        if (this.currentLogId === logId) {
            this.currentLogId = null;
        }
        this.writeLogs(this.logs);
        localStorage.removeItem(STEPS_STORAGE_KEY_PREFIX + logId);
    }

    private readLogs(): ExperimentLog[] {
        let raw: string | null = localStorage.getItem(LOGS_STORAGE_KEY);
        if (!raw) {
            return [];
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as ExperimentLog[];
            }
        } catch {
            // fall through to empty array
        }
        return [];
    }

    private writeLogs(logs: ExperimentLog[]): void {
        try {
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
        } catch (_e) {
            // localStorage may be unavailable (quota exceeded / private browsing)
        }
    }

    private readSteps(logId: string): ExperimentStep[] {
        let raw: string | null = localStorage.getItem(STEPS_STORAGE_KEY_PREFIX + logId);
        if (!raw) {
            return [];
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed as ExperimentStep[];
            }
        } catch {
            // fall through to empty array
        }
        return [];
    }

    private writeSteps(logId: string, steps: ExperimentStep[]): void {
        try {
            localStorage.setItem(STEPS_STORAGE_KEY_PREFIX + logId, JSON.stringify(steps));
        } catch (_e) {
            // localStorage may be unavailable (quota exceeded / private browsing)
        }
    }

    private generateId(prefix: string): string {
        return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8);
    }

    private showError(message: string): void {
        if (!this.container) {
            return;
        }
        let errorEl: HTMLElement | null = this.container.querySelector(".experiment-log-error") as HTMLElement | null;
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

    private extractMessage(e: unknown, fallback: string): string {
        if (e instanceof Error) {
            return fallback + ": " + e.message;
        }
        return fallback;
    }

    public destroy(): void {
        this.container = null;
        this.initialized = false;
        this.logs = [];
        this.stepsByLog = {};
        this.stepById = {};
        this.currentLogId = null;
    }

    public static resetInstance(): void {
        if (ExperimentLogManager.instance) {
            ExperimentLogManager.instance.destroy();
        }
        ExperimentLogManager.instance = null;
    }
}
