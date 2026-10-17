interface TrackedElement {
    container: HTMLElement;
    calculationId: string;
}

const ANNOTATIONS_STORAGE_KEY: string = "chemutil_annotations";
const STARRED_STORAGE_KEY: string = "chemutil_starred";

/**
 * Manages annotation and star/favorite controls attached to result displays.
 * Persists annotations and star state to localStorage so the data remains
 * available to local users without any server-side account.
 */
export class ResultAnnotationManager {
    private static instance: ResultAnnotationManager | null = null;
    private trackedElements: TrackedElement[];
    private initialized: boolean;

    private constructor() {
        this.trackedElements = [];
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
    }

    public addAnnotationUI(resultElement: HTMLElement, calculationId: string): void {
        let existing: HTMLElement | null = resultElement.querySelector(".annotation-ui") as HTMLElement | null;
        if (existing) {
            return;
        }
        let container: HTMLElement = document.createElement("div");
        container.className = "annotation-ui";
        container.setAttribute("data-calculation-id", calculationId);

        let starred: boolean = this.isStarred(calculationId);
        let starButton: HTMLButtonElement = document.createElement("button");
        starButton.type = "button";
        starButton.className = "annotation-star-button";
        starButton.setAttribute("aria-label", "Toggle favorite");
        starButton.setAttribute("aria-pressed", starred ? "true" : "false");
        starButton.appendChild(this.createStarIcon(starred));

        let input: HTMLInputElement = document.createElement("input");
        input.type = "text";
        input.className = "annotation-input";
        input.placeholder = "Add a note...";
        input.setAttribute("aria-label", "Annotation note");
        input.value = this.loadAnnotation(calculationId);

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

    private handleStarClick(calculationId: string, starButton: HTMLButtonElement): void {
        let starred: boolean = this.toggleStar(calculationId);
        this.setStarState(starButton, starred);
    }

    public saveAnnotation(calculationId: string, annotation: string): Promise<void> {
        let annotations: Record<string, string> = this.readAnnotations();
        annotations[calculationId] = annotation;
        this.writeAnnotations(annotations);
        return Promise.resolve();
    }

    public loadAnnotation(calculationId: string): string {
        let annotations: Record<string, string> = this.readAnnotations();
        if (Object.prototype.hasOwnProperty.call(annotations, calculationId)) {
            return annotations[calculationId];
        }
        return "";
    }

    public toggleStar(calculationId: string): boolean {
        let starred: Record<string, boolean> = this.readStarred();
        let current: boolean = false;
        if (Object.prototype.hasOwnProperty.call(starred, calculationId)) {
            current = starred[calculationId];
        }
        let next: boolean = !current;
        starred[calculationId] = next;
        this.writeStarred(starred);
        return next;
    }

    public isStarred(calculationId: string): boolean {
        let starred: Record<string, boolean> = this.readStarred();
        if (Object.prototype.hasOwnProperty.call(starred, calculationId)) {
            return starred[calculationId];
        }
        return false;
    }

    private readAnnotations(): Record<string, string> {
        let raw: string | null = localStorage.getItem(ANNOTATIONS_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                return parsed as Record<string, string>;
            }
        } catch (_e) {
            // fall through to empty object
        }
        return {};
    }

    private writeAnnotations(annotations: Record<string, string>): void {
        try {
            localStorage.setItem(ANNOTATIONS_STORAGE_KEY, JSON.stringify(annotations));
        } catch (_e) {
            // localStorage may be unavailable (quota exceeded / private browsing)
        }
    }

    private readStarred(): Record<string, boolean> {
        let raw: string | null = localStorage.getItem(STARRED_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        try {
            let parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                return parsed as Record<string, boolean>;
            }
        } catch (_e) {
            // fall through to empty object
        }
        return {};
    }

    private writeStarred(starred: Record<string, boolean>): void {
        try {
            localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(starred));
        } catch (_e) {
            // localStorage may be unavailable (quota exceeded / private browsing)
        }
    }

    public getTrackedCount(): number {
        return this.trackedElements.length;
    }

    public destroy(): void {
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
