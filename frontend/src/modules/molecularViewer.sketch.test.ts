import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocks = vi.hoisted(function () {
    return {
        "mockDraw": vi.fn(),
        "mockParse": vi.fn()
    };
});

vi.mock("smiles-drawer", function () {
    return {
        "default": {
            "Drawer": function (this: { draw: unknown }, _options: unknown) {
                this.draw = mocks.mockDraw;
            },
            "parse": mocks.mockParse
        }
    };
});

import { MolecularViewer } from "./molecularViewer.js";
import { addSketchAtom, connectSketchAtoms, createSketch } from "./structureSketch.js";

function createCanvas(id: string): HTMLCanvasElement {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 400;
    canvas.height = 300;
    document.body.appendChild(canvas);
    return canvas;
}

describe("MolecularViewer sketch SMILES handoff", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        MolecularViewer.resetInstance();
        mocks.mockDraw.mockReset();
        mocks.mockParse.mockReset();
        mocks.mockDraw.mockImplementation(() => undefined);
        mocks.mockParse.mockImplementation((_smiles: string, success: (g: unknown) => void) => {
            success({ "vertices": [] });
        });
    });

    afterEach(() => {
        document.body.innerHTML = "";
        MolecularViewer.resetInstance();
        vi.restoreAllMocks();
    });

    it("renders a sketched chain and returns the emitted SMILES", () => {
        createCanvas("sketch-canvas");
        const sketch = createSketch();
        const c = addSketchAtom(sketch, "C", 10, 10);
        const o = addSketchAtom(sketch, "O", 60, 10);
        connectSketchAtoms(sketch, c.id, o.id, 1);
        const emitted = MolecularViewer.getInstance().renderSketch(sketch, "sketch-canvas");
        expect(emitted).toBe("C-O");
        expect(mocks.mockParse).toHaveBeenCalledTimes(1);
        expect(mocks.mockParse.mock.calls[0][0]).toBe("C-O");
        expect(mocks.mockDraw).toHaveBeenCalled();
        expect(MolecularViewer.getInstance().hasState("sketch-canvas")).toBe(true);
    });

    it("throws for an empty sketch without touching SmilesDrawer", () => {
        createCanvas("sketch-canvas");
        expect(() => MolecularViewer.getInstance().renderSketch(createSketch(), "sketch-canvas")).toThrow("Sketch is empty");
        expect(mocks.mockParse).not.toHaveBeenCalled();
    });

    it("throws for a missing canvas", () => {
        const sketch = createSketch();
        addSketchAtom(sketch, "C", 0, 0);
        expect(() => MolecularViewer.getInstance().renderSketch(sketch, "missing-canvas")).toThrow("Canvas element not found");
    });

    it("emits disconnected fragments for unbonded sketch atoms", () => {
        createCanvas("sketch-canvas");
        const sketch = createSketch();
        addSketchAtom(sketch, "C", 0, 0);
        addSketchAtom(sketch, "O", 60, 10);
        const emitted = MolecularViewer.getInstance().renderSketch(sketch, "sketch-canvas");
        expect(emitted).toBe("C.O");
        expect(mocks.mockParse.mock.calls[0][0]).toBe("C.O");
    });
});
