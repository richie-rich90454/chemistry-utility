import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocks = vi.hoisted(function () {
    return {
        "mockDraw": vi.fn(),
        "mockParse": vi.fn(),
    };
});

vi.mock("smiles-drawer", function () {
    return {
        "default": {
            "Drawer": function (this: { options: unknown; draw: unknown }, options: unknown) {
                this.options = options;
                this.draw = mocks.mockDraw;
            },
            "parse": mocks.mockParse,
        },
    };
});

import { MolecularViewer } from "./molecularViewer.js";
import type { SketchState } from "./structureSketch.js";

function createCanvas(id: string): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 400;
    canvas.height = 300;
    document.body.appendChild(canvas);
    return canvas;
}

function dispatchMouse(target: Element, type: string, x: number, y: number): void {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
}

function successWith(data: unknown): void {
    mocks.mockParse.mockImplementation(function (_smiles: string, success: (g: unknown) => void): void {
        success(data);
    });
}

describe("MolecularViewer interaction", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        MolecularViewer.resetInstance();
        mocks.mockDraw.mockReset();
        mocks.mockParse.mockReset();
        mocks.mockDraw.mockImplementation(function (): void { return; });
        successWith({ "vertices": [] });
        vi.spyOn(console, "error").mockImplementation(function (): void { return; });
    });

    afterEach(function () {
        document.body.innerHTML = "";
        MolecularViewer.resetInstance();
        vi.restoreAllMocks();
    });

    it("reports synchronous draw failures instead of throwing", function () {
        createCanvas("c1");
        mocks.mockDraw.mockImplementationOnce(function (): void {
            throw new Error("draw fail");
        });
        expect(function (): void {
            MolecularViewer.getInstance().render("CCO", "c1");
        }).not.toThrow();
        expect(MolecularViewer.getInstance().hasState("c1")).toBe(false);
    });

    it("reports non-Error draw failures as unknown errors", function () {
        createCanvas("c1");
        mocks.mockDraw.mockImplementationOnce(function (): void {
            throw "boom-string";
        });
        MolecularViewer.getInstance().render("CCO", "c1");
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unknown error"));
    });

    it("reports synchronous parse failures instead of throwing", function () {
        createCanvas("c1");
        mocks.mockParse.mockImplementationOnce(function (): void {
            throw new Error("parse fail");
        });
        expect(function (): void {
            MolecularViewer.getInstance().render("CCO", "c1");
        }).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("parse fail"));
    });

    it("reports parse error callbacks", function () {
        createCanvas("c1");
        mocks.mockParse.mockImplementationOnce(function (_smiles: string, _success: (g: unknown) => void, error: (e: Error) => void): void {
            error(new Error("bad smiles"));
        });
        MolecularViewer.getInstance().render("CCO", "c1");
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("bad smiles"));
    });

    it("rejects sketches that produce invalid SMILES", function () {
        createCanvas("c1");
        let sketch: SketchState = {
            atoms: [{ id: 1, element: "[C", x: 0, y: 0 }],
            bonds: [],
            nextId: 2,
        };
        expect(function (): void {
            MolecularViewer.getInstance().renderSketch(sketch, "c1");
        }).toThrow("invalid SMILES");
    });

    it("renders into a fresh canvas inside a container", function () {
        let container: HTMLDivElement = document.createElement("div");
        container.id = "box";
        document.body.appendChild(container);
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.renderInElement("CCO", "box");
        expect(document.getElementById("box-canvas")).not.toBeNull();
        viewer.renderInElement("CCO", "box");
        expect(document.querySelectorAll("#box-canvas").length).toBe(1);
    });

    it("throws for a missing container", function () {
        expect(function (): void {
            MolecularViewer.getInstance().renderInElement("CCO", "no-such-box");
        }).toThrow("Container element not found");
    });

    it("attaches no interaction after the canvas was removed", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        let captured: ((g: unknown) => void) | null = null;
        mocks.mockParse.mockImplementationOnce(function (_smiles: string, success: (g: unknown) => void): void {
            captured = success;
        });
        MolecularViewer.getInstance().render("CCO", "c1");
        canvas.remove();
        (captured as unknown as (g: unknown) => void)({ "vertices": [] });
        expect(MolecularViewer.getInstance().hasState("c1")).toBe(true);
        expect(canvas.dataset["viewerInteractive"]).toBeUndefined();
    });

    it("reports draw failure for a removed canvas", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        let captured: ((g: unknown) => void) | null = null;
        mocks.mockParse.mockImplementationOnce(function (_smiles: string, success: (g: unknown) => void): void {
            captured = success;
        });
        mocks.mockDraw.mockImplementationOnce(function (): void {
            throw new Error("late draw fail");
        });
        MolecularViewer.getInstance().render("CCO", "c1");
        canvas.remove();
        (captured as unknown as (g: unknown) => void)({ "vertices": [] });
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("late draw fail"));
    });

    it("does not stack interaction listeners across re-renders", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        viewer.render("CCO", "c1");
        expect(canvas.dataset["viewerInteractive"]).toBe("true");
        dispatchMouse(canvas, "mousedown", 10, 10);
        dispatchMouse(canvas, "mousemove", 15, 20);
        expect(viewer.getState("c1")!.translateX).toBe(5);
    });

    it("ignores mouse events after state was cleared", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        viewer.clear("c1");
        dispatchMouse(canvas, "mousedown", 10, 10);
        dispatchMouse(canvas, "mousemove", 15, 20);
        canvas.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        canvas.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        expect(viewer.hasState("c1")).toBe(false);
    });

    it("drags to pan and releases on mouseup", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousedown", 10, 10);
        dispatchMouse(canvas, "mousemove", 15, 20);
        expect(viewer.getState("c1")!.translateX).toBe(5);
        expect(viewer.getState("c1")!.translateY).toBe(10);
        expect(canvas.style.transform).toContain("translate");
        canvas.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        expect(viewer.getState("c1")!.isDragging).toBe(false);
    });

    it("hides the tooltip on mouseleave", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith({ vertices: [{ position: { x: 50, y: 60 }, value: { element: "C" } }] });
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        let tooltip: HTMLElement | null = document.querySelector(".molecular-viewer-tooltip");
        expect(tooltip).not.toBeNull();
        expect(tooltip!.style.display).toBe("block");
        canvas.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        expect(tooltip!.style.display).toBe("none");
    });

    it("shows no tooltip for an empty graph", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
    });

    it("shows no tooltip when the graph is null", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith(null);
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
    });

    it("shows no tooltip when the graph is undefined", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith(undefined);
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
    });

    it("shows no tooltip when vertices are missing", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith({});
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
    });

    it("shows no tooltip when the canvas is gone on hover", function () {
        createCanvas("c1");
        successWith({ vertices: [{ position: { x: 50, y: 60 }, value: { element: "C" } }] });
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        document.getElementById("c1")!.remove();
        let other: HTMLCanvasElement = createCanvas("c2");
        successWith({ vertices: [{ position: { x: 50, y: 60 }, value: { element: "C" } }] });
        viewer.render("CCO", "c2");
        document.getElementById("c2")!.remove();
        dispatchMouse(other, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
    });

    it("labels nearby atoms with and without element data", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith({
            vertices: [
                { position: null, value: { element: "X" } },
                { position: { x: 500, y: 500 }, value: { element: "O" } },
                { position: { x: 50, y: 60 }, value: null },
            ],
        });
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")!.textContent).toBe("Atom");
        void viewer;
    });

    it("labels nearby atoms with their element symbol", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith({
            vertices: [
                { position: { x: 50, y: 60 }, value: {} },
                { position: { x: 51, y: 61 }, value: { element: "N" } },
            ],
        });
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")!.textContent).toBe("Atom: N");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")!.textContent).toBe("Atom: N");
        void viewer;
    });

    it("clears gracefully when the canvas is missing", function () {
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        expect(function (): void {
            viewer.clear("no-such-canvas");
        }).not.toThrow();
    });

    it("clears gracefully when the 2d context is missing", function () {
        createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        expect(viewer.hasState("c1")).toBe(true);
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValueOnce(null);
        viewer.clear("c1");
        expect(viewer.hasState("c1")).toBe(false);
        expect(document.getElementById("c1")!.style.transform).toBe("");
    });

    it("reports errors without a canvas or context", function () {
        createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        document.getElementById("c1")!.remove();
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
        mocks.mockDraw.mockImplementationOnce(function (): void {
            throw new Error("ctx fail");
        });
        let canvas2: HTMLCanvasElement = createCanvas("c2");
        viewer.render("CCO", "c2");
        expect(console.error).toHaveBeenCalled();
        void canvas2;
    });

    it("zooms an unknown canvas without throwing", function () {
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        expect(function (): void {
            viewer.zoomIn("missing");
            viewer.zoomOut("missing");
            viewer.resetView("missing");
        }).not.toThrow();
    });

    it("keeps applying transforms after the canvas was removed", function () {
        createCanvas("c1");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        document.getElementById("c1")!.remove();
        viewer.zoomIn("c1");
        expect(viewer.getState("c1")!.scale).toBeGreaterThan(1);
    });

    it("wires the viewer card controls", function () {
        document.body.innerHTML = [
            '<input id="molecular-viewer-smiles" type="text" value="">',
            '<select id="molecular-viewer-preset"><option value="">--</option><option value="CCO">Ethanol</option></select>',
            '<button id="molecular-viewer-render" type="button">Render</button>',
            '<button id="molecular-viewer-zoom-in" type="button">+</button>',
            '<button id="molecular-viewer-zoom-out" type="button">-</button>',
            '<button id="molecular-viewer-reset" type="button">Reset</button>',
            '<canvas id="molecular-viewer-canvas" width="400" height="300"></canvas>',
        ].join("");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.init();
        viewer.init();
        (document.getElementById("molecular-viewer-render") as HTMLButtonElement).click();
        (document.getElementById("molecular-viewer-smiles") as HTMLInputElement).value = "CCO";
        (document.getElementById("molecular-viewer-render") as HTMLButtonElement).click();
        expect(viewer.hasState("molecular-viewer-canvas")).toBe(true);
        let preset: HTMLSelectElement = document.getElementById("molecular-viewer-preset") as HTMLSelectElement;
        preset.value = "";
        preset.dispatchEvent(new Event("change", { bubbles: true }));
        preset.value = "CCO";
        preset.dispatchEvent(new Event("change", { bubbles: true }));
        expect((document.getElementById("molecular-viewer-smiles") as HTMLInputElement).value).toBe("CCO");
        (document.getElementById("molecular-viewer-zoom-in") as HTMLButtonElement).click();
        (document.getElementById("molecular-viewer-zoom-out") as HTMLButtonElement).click();
        (document.getElementById("molecular-viewer-reset") as HTMLButtonElement).click();
        expect(viewer.getState("molecular-viewer-canvas")!.scale).toBe(1);
    });

    it("handles a preset change without a smiles input", function () {
        document.body.innerHTML = [
            '<select id="molecular-viewer-preset"><option value="CCO">Ethanol</option></select>',
            '<canvas id="molecular-viewer-canvas" width="400" height="300"></canvas>',
        ].join("");
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.init();
        let preset: HTMLSelectElement = document.getElementById("molecular-viewer-preset") as HTMLSelectElement;
        preset.value = "CCO";
        preset.dispatchEvent(new Event("change", { bubbles: true }));
        expect(viewer.hasState("molecular-viewer-canvas")).toBe(true);
    });

    it("initializes without any controls present", function () {
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        expect(function (): void {
            viewer.init();
        }).not.toThrow();
    });

    it("tears down attached and detached tooltips", function () {
        let canvas: HTMLCanvasElement = createCanvas("c1");
        successWith({ vertices: [{ position: { x: 50, y: 60 }, value: { element: "C" } }] });
        let viewer: MolecularViewer = MolecularViewer.getInstance();
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        expect(document.querySelector(".molecular-viewer-tooltip")).not.toBeNull();
        viewer.destroyAll();
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
        expect(viewer.hasState("c1")).toBe(false);
        viewer.render("CCO", "c1");
        dispatchMouse(canvas, "mousemove", 52, 62);
        let tooltip: HTMLElement | null = document.querySelector(".molecular-viewer-tooltip");
        expect(tooltip).not.toBeNull();
        tooltip!.remove();
        viewer.destroyAll();
        expect(document.querySelector(".molecular-viewer-tooltip")).toBeNull();
        viewer.destroyAll();
    });
});
