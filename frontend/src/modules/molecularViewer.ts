import SmilesDrawer from "smiles-drawer";

/**
 * A single molecule preset entry used to populate the dropdown in the
 * Molecular Viewer card. `name` is the human-readable label shown to the
 * user and `smiles` is the canonical SMILES string passed to SmilesDrawer.
 */
export interface MoleculePreset {
    name: string;
    smiles: string;
}

/**
 * Per-canvas interaction state. Tracks the current zoom scale, pan offset,
 * drag state for the most recent mouse gesture, and the parsed molecule
 * graph (used for atom hit-testing on hover).
 */
export interface CanvasViewState {
    scale: number;
    translateX: number;
    translateY: number;
    isDragging: boolean;
    lastX: number;
    lastY: number;
    graph: GraphShape | null;
    smiles: string;
}

/**
 * SmilesDrawer options merged by the Drawer constructor. Mirrors the
 * subset of options we configure explicitly; the Drawer fills in defaults
 * for everything else.
 */
export interface DrawerOptions {
    width: number;
    height: number;
    atomVisualization: string;
    isometric: boolean;
    compactDrawing: boolean;
}

/**
 * Minimal structural shape of a SmilesDrawer {@link Graph} used for
 * atom hit-testing. We only read `vertices`, and for each vertex we read
 * its `position` (x, y) and `value.element`. Kept as an interface so the
 * module does not need to import the full Graph type (which would pull in
 * many transitive types).
 */
interface GraphShape {
    vertices: VertexShape[];
}

interface VertexShape {
    position: { x: number; y: number } | null;
    value: { element: string } | null;
}

/** Default SmilesDrawer configuration used by the viewer. */
const DEFAULT_OPTIONS: DrawerOptions = {
    "width": 400,
    "height": 300,
    "atomVisualization": "default",
    "isometric": false,
    "compactDrawing": true
};

/**
 * Singleton wrapper around SmilesDrawer that renders 2D molecular
 * structures from SMILES notation onto canvas elements. Provides:
 *
 *  - {@link render} for drawing into an existing canvas by id
 *  - {@link renderInElement} for creating a fresh canvas inside a container
 *  - {@link clear} for tearing down a single canvas
 *  - {@link getSmilesFromInput} for reading SMILES from a text field
 *  - zoom (+/-) and pan (drag) controls applied via CSS transforms
 *  - atom hover highlighting with a floating tooltip
 *
 * Implemented as a singleton so a single instance can manage interaction
 * state for the standalone Molecular Viewer card and (in Task 23) for
 * compound search results.
 */
class MolecularViewer {
    private static instance: MolecularViewer | null = null;

    private states: Map<string, CanvasViewState>;
    private initialized: boolean;
    private drawerOptions: DrawerOptions;
    private tooltip: HTMLElement | null;

    private constructor() {
        this.states = new Map();
        this.initialized = false;
        this.drawerOptions = MolecularViewer.cloneOptions(DEFAULT_OPTIONS);
        this.tooltip = null;
    }

    /** Returns the singleton instance, creating it on first call. */
    public static getInstance(): MolecularViewer {
        if (MolecularViewer.instance === null) {
            MolecularViewer.instance = new MolecularViewer();
        }
        return MolecularViewer.instance;
    }

    /** Resets the singleton. Intended for unit tests only. */
    public static resetInstance(): void {
        if (MolecularViewer.instance !== null) {
            MolecularViewer.instance.destroyAll();
        }
        MolecularViewer.instance = null;
    }

    /**
     * Returns the canonical list of preset molecules shown in the viewer
     * dropdown. Each entry pairs a display name with a SMILES string.
     */
    public static getPresets(): MoleculePreset[] {
        return [
            { "name": "Aspirin", "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O" },
            { "name": "Caffeine", "smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C" },
            { "name": "Glucose", "smiles": "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O" },
            { "name": "Ethanol", "smiles": "CCO" },
            { "name": "Benzene", "smiles": "c1ccccc1" },
            { "name": "Methane", "smiles": "C" }
        ];
    }

    private static cloneOptions(opts: DrawerOptions): DrawerOptions {
        return {
            "width": opts.width,
            "height": opts.height,
            "atomVisualization": opts.atomVisualization,
            "isometric": opts.isometric,
            "compactDrawing": opts.compactDrawing
        };
    }

    /** Instance accessor mirroring {@link MolecularViewer.getPresets}. */
    public getPresets(): MoleculePreset[] {
        return MolecularViewer.getPresets();
    }

    /** Returns a defensive copy of the configured drawer options. */
    public getDrawerOptions(): DrawerOptions {
        return MolecularViewer.cloneOptions(this.drawerOptions);
    }

    /**
     * Wires up the standalone Molecular Viewer card controls (render
     * button, preset dropdown, zoom in/out, reset). Safe to call once;
     * subsequent calls are no-ops.
     */
    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.attachControls();
    }

    /**
     * Renders a 2D molecular structure from `smiles` onto the canvas
     * identified by `canvasId`. Throws if the canvas is missing or the
     * SMILES is empty. Render-time errors (invalid SMILES, drawing
     * failures) are reported on the canvas itself rather than thrown so
     * the UI keeps working.
     */
    public render(smiles: string, canvasId: string): void {
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (canvas === null) {
            throw new Error("Canvas element not found: " + canvasId);
        }
        let trimmedSmiles: string = (smiles || "").trim();
        if (trimmedSmiles.length === 0) {
            throw new Error("SMILES string is required");
        }
        let self: MolecularViewer = this;
        let drawer: any = new SmilesDrawer.Drawer(self.getDrawerOptions());
        let success: (g: GraphShape) => void = function (data: GraphShape): void {
            try {
                drawer.draw(data, canvas as HTMLCanvasElement, "light", false, []);
                self.saveState(canvasId, trimmedSmiles, data);
                self.attachInteraction(canvasId);
            } catch (drawErr: unknown) {
                self.reportError(canvasId, drawErr);
            }
        };
        let error: (e: Error) => void = function (err: Error): void {
            self.reportError(canvasId, err);
        };
        try {
            SmilesDrawer.parse(trimmedSmiles, success, error);
        } catch (parseErr: unknown) {
            self.reportError(canvasId, parseErr);
        }
    }

    /**
     * Creates a fresh canvas inside `containerId` and renders `smiles`
     * onto it. Useful when a container does not already own a canvas
     * (e.g. compound search result rows). The created canvas is given the
     * id `<containerId>-canvas`.
     */
    public renderInElement(smiles: string, containerId: string): void {
        let container: HTMLElement | null = document.getElementById(containerId);
        if (container === null) {
            throw new Error("Container element not found: " + containerId);
        }
        let canvasId: string = containerId + "-canvas";
        let existing: HTMLElement | null = document.getElementById(canvasId);
        if (existing !== null && existing.parentNode !== null) {
            existing.parentNode.removeChild(existing);
        }
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.id = canvasId;
        canvas.width = this.drawerOptions.width;
        canvas.height = this.drawerOptions.height;
        container.appendChild(canvas);
        this.render(smiles, canvasId);
    }

    /**
     * Clears the canvas content and removes any tracked interaction
     * state for `canvasId`. Safe to call when nothing has been rendered.
     */
    public clear(canvasId: string): void {
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (canvas !== null) {
            let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
            if (ctx !== null) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            canvas.style.transform = "";
        }
        this.states.delete(canvasId);
    }

    /**
     * Reads and trims the SMILES string from the text input identified by
     * `inputId`. Returns an empty string when the input is missing so
     * callers can treat it as "no input".
     */
    public getSmilesFromInput(inputId: string): string {
        let input: HTMLInputElement | null = document.getElementById(inputId) as HTMLInputElement | null;
        if (input === null) {
            return "";
        }
        return input.value.trim();
    }

    /** Increases the zoom scale for `canvasId` by 20%. */
    public zoomIn(canvasId: string): void {
        this.applyZoom(canvasId, 1.2);
    }

    /** Decreases the zoom scale for `canvasId` by ~17%. */
    public zoomOut(canvasId: string): void {
        this.applyZoom(canvasId, 1 / 1.2);
    }

    /** Resets zoom and pan to defaults for `canvasId`. */
    public resetView(canvasId: string): void {
        let state: CanvasViewState | undefined = this.states.get(canvasId);
        if (state === undefined) {
            return;
        }
        state.scale = 1;
        state.translateX = 0;
        state.translateY = 0;
        this.applyTransform(canvasId);
    }

    /** Returns true when interaction state exists for `canvasId`. */
    public hasState(canvasId: string): boolean {
        return this.states.has(canvasId);
    }

    /** Returns the interaction state for `canvasId` (or undefined). */
    public getState(canvasId: string): CanvasViewState | undefined {
        return this.states.get(canvasId);
    }

    private applyZoom(canvasId: string, factor: number): void {
        let state: CanvasViewState | undefined = this.states.get(canvasId);
        if (state === undefined) {
            return;
        }
        state.scale = state.scale * factor;
        if (state.scale < 0.2) {
            state.scale = 0.2;
        }
        if (state.scale > 5) {
            state.scale = 5;
        }
        this.applyTransform(canvasId);
    }

    private applyTransform(canvasId: string): void {
        let state: CanvasViewState | undefined = this.states.get(canvasId);
        if (state === undefined) {
            return;
        }
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (canvas === null) {
            return;
        }
        let transform: string = "translate(" + String(state.translateX) + "px, " + String(state.translateY) + "px) scale(" + String(state.scale) + ")";
        canvas.style.transform = transform;
        canvas.style.transformOrigin = "center center";
    }

    private saveState(canvasId: string, smiles: string, graph: GraphShape): void {
        this.states.set(canvasId, {
            "scale": 1,
            "translateX": 0,
            "translateY": 0,
            "isDragging": false,
            "lastX": 0,
            "lastY": 0,
            "graph": graph,
            "smiles": smiles
        });
    }

    private attachInteraction(canvasId: string): void {
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (canvas === null) {
            return;
        }
        let self: MolecularViewer = this;
        canvas.addEventListener("mousedown", function (e: MouseEvent): void {
            let state: CanvasViewState | undefined = self.states.get(canvasId);
            if (state === undefined) {
                return;
            }
            state.isDragging = true;
            state.lastX = e.clientX;
            state.lastY = e.clientY;
        });
        canvas.addEventListener("mousemove", function (e: MouseEvent): void {
            let state: CanvasViewState | undefined = self.states.get(canvasId);
            if (state === undefined) {
                return;
            }
            if (state.isDragging) {
                let dx: number = e.clientX - state.lastX;
                let dy: number = e.clientY - state.lastY;
                state.translateX = state.translateX + dx;
                state.translateY = state.translateY + dy;
                state.lastX = e.clientX;
                state.lastY = e.clientY;
                self.applyTransform(canvasId);
            } else {
                self.handleHover(canvasId, e);
            }
        });
        canvas.addEventListener("mouseup", function (): void {
            let state: CanvasViewState | undefined = self.states.get(canvasId);
            if (state === undefined) {
                return;
            }
            state.isDragging = false;
        });
        canvas.addEventListener("mouseleave", function (): void {
            let state: CanvasViewState | undefined = self.states.get(canvasId);
            if (state === undefined) {
                return;
            }
            state.isDragging = false;
            self.hideTooltip();
        });
    }

    private handleHover(canvasId: string, e: MouseEvent): void {
        let state: CanvasViewState | undefined = this.states.get(canvasId);
        if (state === undefined || state.graph === null) {
            return;
        }
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (canvas === null) {
            return;
        }
        let rect: DOMRect = canvas.getBoundingClientRect();
        let x: number = e.clientX - rect.left;
        let y: number = e.clientY - rect.top;
        let nearestAtom: string = this.findNearestAtom(state.graph, x, y);
        if (nearestAtom.length > 0) {
            this.showTooltip(e.clientX, e.clientY, nearestAtom);
        } else {
            this.hideTooltip();
        }
    }

    private findNearestAtom(graph: GraphShape, x: number, y: number): string {
        if (!graph || !graph.vertices) {
            return "";
        }
        let vertices: VertexShape[] = graph.vertices;
        let bestDistance: number = 20;
        let bestLabel: string = "";
        let i: number;
        for (i = 0; i < vertices.length; i++) {
            let v: VertexShape = vertices[i];
            if (v.position === null) {
                continue;
            }
            let dx: number = v.position.x - x;
            let dy: number = v.position.y - y;
            let dist: number = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestLabel = this.describeVertex(v);
            }
        }
        return bestLabel;
    }

    private describeVertex(v: VertexShape): string {
        if (v.value !== null && v.value.element) {
            return "Atom: " + v.value.element;
        }
        return "Atom";
    }

    private showTooltip(x: number, y: number, text: string): void {
        if (this.tooltip === null) {
            this.tooltip = document.createElement("div");
            this.tooltip.className = "molecular-viewer-tooltip";
            this.tooltip.style.position = "fixed";
            this.tooltip.style.zIndex = "9999";
            this.tooltip.style.padding = "4px 8px";
            this.tooltip.style.background = "rgba(0,0,0,0.8)";
            this.tooltip.style.color = "#ffffff";
            this.tooltip.style.borderRadius = "4px";
            this.tooltip.style.pointerEvents = "none";
            this.tooltip.style.fontSize = "12px";
            this.tooltip.style.display = "none";
            document.body.appendChild(this.tooltip);
        }
        this.tooltip.textContent = text;
        this.tooltip.style.left = String(x + 10) + "px";
        this.tooltip.style.top = String(y + 10) + "px";
        this.tooltip.style.display = "block";
    }

    private hideTooltip(): void {
        if (this.tooltip !== null) {
            this.tooltip.style.display = "none";
        }
    }

    private reportError(canvasId: string, err: unknown): void {
        let message: string;
        if (err instanceof Error) {
            message = err.message;
        } else {
            message = "Unknown error";
        }
        let canvas: HTMLCanvasElement | null = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (canvas !== null) {
            let ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
            if (ctx !== null) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#d93025";
                ctx.font = "14px sans-serif";
                ctx.fillText("Error: " + message, 10, 30);
            }
        }
        console.error("MolecularViewer error for " + canvasId + ": " + message);
    }

    private attachControls(): void {
        let self: MolecularViewer = this;
        let renderBtn: HTMLElement | null = document.getElementById("molecular-viewer-render");
        if (renderBtn !== null) {
            renderBtn.addEventListener("click", function (): void {
                let smiles: string = self.getSmilesFromInput("molecular-viewer-smiles");
                if (smiles.length === 0) {
                    return;
                }
                self.render(smiles, "molecular-viewer-canvas");
            });
        }
        let presetSelect: HTMLElement | null = document.getElementById("molecular-viewer-preset");
        if (presetSelect !== null) {
            presetSelect.addEventListener("change", function (): void {
                let select: HTMLSelectElement = presetSelect as HTMLSelectElement;
                let value: string = select.value;
                if (value.length === 0) {
                    return;
                }
                let input: HTMLInputElement | null = document.getElementById("molecular-viewer-smiles") as HTMLInputElement | null;
                if (input !== null) {
                    input.value = value;
                }
                self.render(value, "molecular-viewer-canvas");
            });
        }
        let zoomInBtn: HTMLElement | null = document.getElementById("molecular-viewer-zoom-in");
        if (zoomInBtn !== null) {
            zoomInBtn.addEventListener("click", function (): void {
                self.zoomIn("molecular-viewer-canvas");
            });
        }
        let zoomOutBtn: HTMLElement | null = document.getElementById("molecular-viewer-zoom-out");
        if (zoomOutBtn !== null) {
            zoomOutBtn.addEventListener("click", function (): void {
                self.zoomOut("molecular-viewer-canvas");
            });
        }
        let resetBtn: HTMLElement | null = document.getElementById("molecular-viewer-reset");
        if (resetBtn !== null) {
            resetBtn.addEventListener("click", function (): void {
                self.resetView("molecular-viewer-canvas");
            });
        }
    }

    /** Tears down all tracked state and removes the tooltip node. */
    public destroyAll(): void {
        let keys: string[] = Array.from(this.states.keys());
        let i: number;
        for (i = 0; i < keys.length; i++) {
            this.clear(keys[i]);
        }
        if (this.tooltip !== null && this.tooltip.parentNode !== null) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        this.tooltip = null;
        this.initialized = false;
    }
}

/**
 * Pure syntactic SMILES validator. Returns true when `smiles` is non-empty
 * after trimming, contains only characters that are valid in SMILES
 * notation, and has balanced parentheses and square brackets. Does NOT
 * consult SmilesDrawer — callers use this to decide whether a render
 * should be attempted before constructing a Drawer.
 */
function validateSmiles(smiles: string): boolean {
    let trimmed: string = (smiles || "").trim();
    if (trimmed.length === 0) {
        return false;
    }
    let parenDepth: number = 0;
    let bracketDepth: number = 0;
    let i: number;
    for (i = 0; i < trimmed.length; i++) {
        let ch: string = trimmed.charAt(i);
        if (ch === "(") {
            parenDepth = parenDepth + 1;
        } else if (ch === ")") {
            parenDepth = parenDepth - 1;
            if (parenDepth < 0) {
                return false;
            }
        } else if (ch === "[") {
            bracketDepth = bracketDepth + 1;
        } else if (ch === "]") {
            bracketDepth = bracketDepth - 1;
            if (bracketDepth < 0) {
                return false;
            }
        }
    }
    if (parenDepth !== 0 || bracketDepth !== 0) {
        return false;
    }
    let validPattern: RegExp = /^[A-Za-z0-9()[\].\-=#$\/\\:+@%*]+$/;
    if (validPattern.test(trimmed) === false) {
        return false;
    }
    return true;
}

export { MolecularViewer, validateSmiles };
