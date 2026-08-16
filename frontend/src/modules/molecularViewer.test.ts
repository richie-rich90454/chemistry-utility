import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocks = vi.hoisted(function () {
    return {
        "mockDraw": vi.fn(),
        "mockParse": vi.fn(),
        "capturedDrawerOptions": [] as unknown[]
    };
});

vi.mock("smiles-drawer", function () {
    return {
        "default": {
            "Drawer": function (this: { options: unknown; draw: unknown }, options: unknown) {
                this.options = options;
                this.draw = mocks.mockDraw;
                mocks.capturedDrawerOptions.push(options);
            },
            "parse": mocks.mockParse
        }
    };
});

import { MolecularViewer, MoleculePreset, DrawerOptions, validateSmiles } from "./molecularViewer.js";

function createCanvas(id: string): HTMLCanvasElement {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 400;
    canvas.height = 300;
    document.body.appendChild(canvas);
    return canvas;
}

function createInput(id: string, value: string): HTMLInputElement {
    let input: HTMLInputElement = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.value = value;
    document.body.appendChild(input);
    return input;
}

function findPreset(presets: MoleculePreset[], name: string): MoleculePreset | undefined {
    let i: number;
    for (i = 0; i < presets.length; i++) {
        if (presets[i].name === name) {
            return presets[i];
        }
    }
    return undefined;
}

describe("MolecularViewer", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        MolecularViewer.resetInstance();
        mocks.mockDraw.mockReset();
        mocks.mockParse.mockReset();
        mocks.capturedDrawerOptions.length = 0;
        mocks.mockDraw.mockImplementation(function (): void { return; });
        mocks.mockParse.mockImplementation(function (smiles: string, success: (g: unknown) => void, error?: (e: Error) => void): void {
            if (smiles === "INVALID_SMILES") {
                if (error) {
                    error(new Error("Invalid SMILES: " + smiles));
                }
                return;
            }
            success({ "vertices": [] });
        });
    });

    afterEach(function () {
        document.body.innerHTML = "";
        MolecularViewer.resetInstance();
        vi.restoreAllMocks();
    });

    describe("getInstance", function () {
        it("should return same instance on subsequent calls", function () {
            let v1: MolecularViewer = MolecularViewer.getInstance();
            let v2: MolecularViewer = MolecularViewer.getInstance();
            expect(v1).toBe(v2);
        });

        it("should return a new instance after resetInstance", function () {
            let v1: MolecularViewer = MolecularViewer.getInstance();
            MolecularViewer.resetInstance();
            let v2: MolecularViewer = MolecularViewer.getInstance();
            expect(v1).not.toBe(v2);
        });

        it("should return a MolecularViewer instance", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(viewer).toBeInstanceOf(MolecularViewer);
        });
    });

    describe("getPresets", function () {
        it("should return the six expected preset molecules", function () {
            let presets: MoleculePreset[] = MolecularViewer.getPresets();
            expect(presets.length).toBe(6);
        });

        it("should include aspirin with the canonical SMILES", function () {
            let presets: MoleculePreset[] = MolecularViewer.getPresets();
            let aspirin: MoleculePreset | undefined = findPreset(presets, "Aspirin");
            expect(aspirin).toBeDefined();
            expect(aspirin ? aspirin.smiles : "").toBe("CC(=O)OC1=CC=CC=C1C(=O)O");
        });

        it("should include caffeine, glucose, ethanol, benzene, and methane", function () {
            let presets: MoleculePreset[] = MolecularViewer.getPresets();
            expect(findPreset(presets, "Caffeine")).toBeDefined();
            expect(findPreset(presets, "Glucose")).toBeDefined();
            expect(findPreset(presets, "Ethanol")).toBeDefined();
            expect(findPreset(presets, "Benzene")).toBeDefined();
            expect(findPreset(presets, "Methane")).toBeDefined();
        });

        it("should return the same list via the instance accessor", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            let staticPresets: MoleculePreset[] = MolecularViewer.getPresets();
            let instancePresets: MoleculePreset[] = viewer.getPresets();
            expect(instancePresets.length).toBe(staticPresets.length);
            let i: number;
            for (i = 0; i < staticPresets.length; i++) {
                expect(instancePresets[i].name).toBe(staticPresets[i].name);
                expect(instancePresets[i].smiles).toBe(staticPresets[i].smiles);
            }
        });

        it("should give each preset a non-empty SMILES string", function () {
            let presets: MoleculePreset[] = MolecularViewer.getPresets();
            let i: number;
            for (i = 0; i < presets.length; i++) {
                expect(presets[i].smiles.length).toBeGreaterThan(0);
                expect(presets[i].name.length).toBeGreaterThan(0);
            }
        });
    });

    describe("getDrawerOptions", function () {
        it("should configure width 400 and height 300", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            let opts: DrawerOptions = viewer.getDrawerOptions();
            expect(opts.width).toBe(400);
            expect(opts.height).toBe(300);
        });

        it("should configure atomVisualization as default", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            let opts: DrawerOptions = viewer.getDrawerOptions();
            expect(opts.atomVisualization).toBe("default");
        });

        it("should disable isometric and enable compactDrawing", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            let opts: DrawerOptions = viewer.getDrawerOptions();
            expect(opts.isometric).toBe(false);
            expect(opts.compactDrawing).toBe(true);
        });

        it("should return a defensive copy (mutating it does not affect the viewer)", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            let opts: DrawerOptions = viewer.getDrawerOptions();
            opts.width = 9999;
            let opts2: DrawerOptions = viewer.getDrawerOptions();
            expect(opts2.width).toBe(400);
        });
    });

    describe("getSmilesFromInput", function () {
        it("should read the SMILES value from a text input", function () {
            createInput("smi-input", "CCO");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(viewer.getSmilesFromInput("smi-input")).toBe("CCO");
        });

        it("should trim leading and trailing whitespace", function () {
            createInput("smi-input", "   CCO   ");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(viewer.getSmilesFromInput("smi-input")).toBe("CCO");
        });

        it("should return an empty string when the input does not exist", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(viewer.getSmilesFromInput("nonexistent-input")).toBe("");
        });

        it("should return an empty string for an empty input value", function () {
            createInput("smi-input", "");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(viewer.getSmilesFromInput("smi-input")).toBe("");
        });
    });

    describe("render", function () {
        it("should throw when the canvas is not found", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            try {
                viewer.render("CCO", "missing-canvas");
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message.indexOf("Canvas element not found")).toBeGreaterThanOrEqual(0);
            }
        });

        it("should throw when the SMILES string is empty", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            try {
                viewer.render("", "test-canvas");
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe("SMILES string is required");
            }
        });

        it("should throw when the SMILES string is only whitespace", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            try {
                viewer.render("   ", "test-canvas");
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message).toBe("SMILES string is required");
            }
        });

        it("should call SmilesDrawer.parse with the trimmed SMILES string", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("  CCO  ", "test-canvas");
            expect(mocks.mockParse).toHaveBeenCalled();
            let firstCall: unknown[] = mocks.mockParse.mock.calls[0] as unknown[];
            expect(firstCall[0]).toBe("CCO");
        });

        it("should construct the SmilesDrawer Drawer with the configured options", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            expect(mocks.capturedDrawerOptions.length).toBe(1);
            let opts: DrawerOptions = mocks.capturedDrawerOptions[0] as DrawerOptions;
            expect(opts.width).toBe(400);
            expect(opts.height).toBe(300);
            expect(opts.atomVisualization).toBe("default");
            expect(opts.isometric).toBe(false);
            expect(opts.compactDrawing).toBe(true);
        });

        it("should invoke drawer.draw after a successful parse", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            expect(mocks.mockDraw).toHaveBeenCalled();
        });

        it("should track interaction state after a successful render", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            expect(viewer.hasState("test-canvas")).toBe(true);
            let state = viewer.getState("test-canvas");
            expect(state).toBeDefined();
            expect(state ? state.smiles : "").toBe("CCO");
            expect(state ? state.scale : 0).toBe(1);
        });

        it("should not track state when the SMILES is invalid", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("INVALID_SMILES", "test-canvas");
            expect(viewer.hasState("test-canvas")).toBe(false);
        });

        it("should not re-throw when parse reports an error", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(function (): void {
                viewer.render("INVALID_SMILES", "test-canvas");
            }).not.toThrow();
        });
    });

    describe("renderInElement", function () {
        it("should create a canvas inside the container and render into it", function () {
            let container: HTMLDivElement = document.createElement("div");
            container.id = "mv-container";
            document.body.appendChild(container);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.renderInElement("CCO", "mv-container");
            let canvas: HTMLElement | null = document.getElementById("mv-container-canvas");
            expect(canvas).not.toBeNull();
            expect(canvas instanceof HTMLCanvasElement).toBe(true);
            expect(mocks.mockParse).toHaveBeenCalled();
        });

        it("should throw when the container is missing", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            try {
                viewer.renderInElement("CCO", "missing-container");
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
                expect((e as Error).message.indexOf("Container element not found")).toBeGreaterThanOrEqual(0);
            }
        });

        it("should replace any existing canvas when re-rendering", function () {
            let container: HTMLDivElement = document.createElement("div");
            container.id = "mv-container";
            document.body.appendChild(container);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.renderInElement("CCO", "mv-container");
            viewer.renderInElement("CCO", "mv-container");
            let canvases: NodeListOf<HTMLCanvasElement> = container.querySelectorAll("canvas");
            expect(canvases.length).toBe(1);
        });

        it("should size the created canvas to the configured drawer dimensions", function () {
            let container: HTMLDivElement = document.createElement("div");
            container.id = "mv-container";
            document.body.appendChild(container);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.renderInElement("CCO", "mv-container");
            let canvas: HTMLCanvasElement = document.getElementById("mv-container-canvas") as HTMLCanvasElement;
            expect(canvas.width).toBe(400);
            expect(canvas.height).toBe(300);
        });
    });

    describe("clear", function () {
        it("should remove interaction state after clear", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            expect(viewer.hasState("test-canvas")).toBe(true);
            viewer.clear("test-canvas");
            expect(viewer.hasState("test-canvas")).toBe(false);
        });

        it("should be safe to call when no render has happened", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(function (): void {
                viewer.clear("never-rendered");
            }).not.toThrow();
            expect(viewer.hasState("never-rendered")).toBe(false);
        });

        it("should reset the CSS transform on the canvas", function () {
            let canvas: HTMLCanvasElement = createCanvas("test-canvas");
            canvas.style.transform = "scale(2)";
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.clear("test-canvas");
            expect(canvas.style.transform).toBe("");
        });

        it("should allow re-rendering after clear", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            viewer.clear("test-canvas");
            viewer.render("CCO", "test-canvas");
            expect(viewer.hasState("test-canvas")).toBe(true);
        });
    });

    describe("zoom controls", function () {
        it("zoomIn should increase the scale", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            let stateBefore = viewer.getState("test-canvas");
            let before: number = stateBefore ? stateBefore.scale : 0;
            viewer.zoomIn("test-canvas");
            let stateAfter = viewer.getState("test-canvas");
            let after: number = stateAfter ? stateAfter.scale : 0;
            expect(after).toBeGreaterThan(before);
        });

        it("zoomOut should decrease the scale", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            viewer.zoomIn("test-canvas");
            let stateBefore = viewer.getState("test-canvas");
            let before: number = stateBefore ? stateBefore.scale : 0;
            viewer.zoomOut("test-canvas");
            let stateAfter = viewer.getState("test-canvas");
            let after: number = stateAfter ? stateAfter.scale : 0;
            expect(after).toBeLessThan(before);
        });

        it("should not zoom out below the 0.2 floor", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            let i: number;
            for (i = 0; i < 100; i++) {
                viewer.zoomOut("test-canvas");
            }
            let state = viewer.getState("test-canvas");
            expect(state ? state.scale : 0).toBeGreaterThanOrEqual(0.2);
        });

        it("should not zoom in above the 5 ceiling", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            let i: number;
            for (i = 0; i < 100; i++) {
                viewer.zoomIn("test-canvas");
            }
            let state = viewer.getState("test-canvas");
            expect(state ? state.scale : 0).toBeLessThanOrEqual(5);
        });

        it("resetView should restore scale and translation to defaults", function () {
            createCanvas("test-canvas");
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.render("CCO", "test-canvas");
            viewer.zoomIn("test-canvas");
            viewer.zoomIn("test-canvas");
            viewer.resetView("test-canvas");
            let state = viewer.getState("test-canvas");
            expect(state ? state.scale : 0).toBe(1);
            expect(state ? state.translateX : 0).toBe(0);
            expect(state ? state.translateY : 0).toBe(0);
        });

        it("zoom controls should be a no-op when no state exists", function () {
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            expect(function (): void {
                viewer.zoomIn("never-rendered");
                viewer.zoomOut("never-rendered");
                viewer.resetView("never-rendered");
            }).not.toThrow();
        });
    });

    describe("init", function () {
        it("should wire the render button to call render with the input SMILES", function () {
            createInput("molecular-viewer-smiles", "CCO");
            createCanvas("molecular-viewer-canvas");
            let btn: HTMLButtonElement = document.createElement("button");
            btn.id = "molecular-viewer-render";
            document.body.appendChild(btn);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.init();
            btn.click();
            expect(mocks.mockParse).toHaveBeenCalled();
            let firstCall: unknown[] = mocks.mockParse.mock.calls[0] as unknown[];
            expect(firstCall[0]).toBe("CCO");
        });

        it("should be idempotent (calling init twice does not double-bind)", function () {
            createInput("molecular-viewer-smiles", "CCO");
            createCanvas("molecular-viewer-canvas");
            let btn: HTMLButtonElement = document.createElement("button");
            btn.id = "molecular-viewer-render";
            document.body.appendChild(btn);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.init();
            viewer.init();
            btn.click();
            expect(mocks.mockParse).toHaveBeenCalledTimes(1);
        });

        it("should not render when the SMILES input is empty", function () {
            createInput("molecular-viewer-smiles", "");
            createCanvas("molecular-viewer-canvas");
            let btn: HTMLButtonElement = document.createElement("button");
            btn.id = "molecular-viewer-render";
            document.body.appendChild(btn);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.init();
            btn.click();
            expect(mocks.mockParse).not.toHaveBeenCalled();
        });

        it("should wire the preset dropdown to populate the input and render", function () {
            createInput("molecular-viewer-smiles", "");
            createCanvas("molecular-viewer-canvas");
            let select: HTMLSelectElement = document.createElement("select");
            select.id = "molecular-viewer-preset";
            let opt: HTMLOptionElement = document.createElement("option");
            opt.value = "CCO";
            opt.textContent = "Ethanol";
            select.appendChild(opt);
            document.body.appendChild(select);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.init();
            select.value = "CCO";
            select.dispatchEvent(new Event("change"));
            let input: HTMLInputElement = document.getElementById("molecular-viewer-smiles") as HTMLInputElement;
            expect(input.value).toBe("CCO");
            expect(mocks.mockParse).toHaveBeenCalled();
        });

        it("should wire the zoom-in button to zoom the canvas", function () {
            createCanvas("molecular-viewer-canvas");
            let zoomInBtn: HTMLButtonElement = document.createElement("button");
            zoomInBtn.id = "molecular-viewer-zoom-in";
            document.body.appendChild(zoomInBtn);
            let viewer: MolecularViewer = MolecularViewer.getInstance();
            viewer.init();
            // Manually plant state so zoom has something to operate on
            viewer.render("CCO", "molecular-viewer-canvas");
            let stateBefore = viewer.getState("molecular-viewer-canvas");
            let before: number = stateBefore ? stateBefore.scale : 0;
            zoomInBtn.click();
            let stateAfter = viewer.getState("molecular-viewer-canvas");
            let after: number = stateAfter ? stateAfter.scale : 0;
            expect(after).toBeGreaterThan(before);
        });
    });
});

describe("validateSmiles", function () {
    it("should return false for an empty string", function () {
        expect(validateSmiles("")).toBe(false);
    });
    it("should return false for a whitespace-only string", function () {
        expect(validateSmiles("   ")).toBe(false);
    });
    it("should return true for ethanol (CCO)", function () {
        expect(validateSmiles("CCO")).toBe(true);
    });
    it("should return true for benzene (c1ccccc1)", function () {
        expect(validateSmiles("c1ccccc1")).toBe(true);
    });
    it("should return true for aspirin", function () {
        expect(validateSmiles("CC(=O)OC1=CC=CC=C1C(=O)O")).toBe(true);
    });
    it("should return true for glucose with chirality", function () {
        expect(validateSmiles("OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O")).toBe(true);
    });
    it("should return true for caffeine", function () {
        expect(validateSmiles("CN1C=NC2=C1C(=O)N(C(=O)N2C)C")).toBe(true);
    });
    it("should return true for a charged atom specification", function () {
        expect(validateSmiles("[NH4+]")).toBe(true);
    });
    it("should return true for a directional bond", function () {
        expect(validateSmiles("C/C=C/C")).toBe(true);
    });
    it("should return false for unbalanced opening parenthesis", function () {
        expect(validateSmiles("CC(O")).toBe(false);
    });
    it("should return false for unbalanced closing parenthesis", function () {
        expect(validateSmiles("CC)O")).toBe(false);
    });
    it("should return false for unbalanced opening bracket", function () {
        expect(validateSmiles("[NH4")).toBe(false);
    });
    it("should return false for unbalanced closing bracket", function () {
        expect(validateSmiles("NH4]")).toBe(false);
    });
    it("should return false for invalid characters", function () {
        expect(validateSmiles("CC?O")).toBe(false);
    });
    it("should return false for spaces inside the string", function () {
        expect(validateSmiles("CC O")).toBe(false);
    });
    it("should trim leading and trailing whitespace before validating", function () {
        expect(validateSmiles("   CCO   ")).toBe(true);
    });
    it("should return true for a single atom (methane)", function () {
        expect(validateSmiles("C")).toBe(true);
    });
    it("should return true for a ring closure with percent notation", function () {
        expect(validateSmiles("C%12CC%12")).toBe(true);
    });
    it("should return true for a disconnected structure", function () {
        expect(validateSmiles("CCO.O")).toBe(true);
    });
    it("should return true for an aromatic atom specification", function () {
        expect(validateSmiles("[nH]")).toBe(true);
    });
    it("should return true for a complex molecule with multiple branches", function () {
        expect(validateSmiles("CC(=O)OC1=CC=CC=C1C(=O)O")).toBe(true);
    });
    it("should return false for a string with only invalid characters", function () {
        expect(validateSmiles("???")).toBe(false);
    });
    it("should return false for a tab character inside the string", function () {
        expect(validateSmiles("CC\tO")).toBe(false);
    });
    it("should return true for a SMILES with a triple bond", function () {
        expect(validateSmiles("C#N")).toBe(true);
    });
    it("should return true for a SMILES with a backslash bond", function () {
        expect(validateSmiles("C\\C=C\\C")).toBe(true);
    });
});
