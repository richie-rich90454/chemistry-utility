import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
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
            "Drawer": function (this: {options: unknown; draw: unknown}, options: unknown) {
                this.options = options;
                this.draw = mocks.mockDraw;
                mocks.capturedDrawerOptions.push(options);
            },
            "parse": mocks.mockParse
        }
    };
});
import {MolecularViewerRoute} from "./molecular-viewer";
describe("MolecularViewerRoute", function (): void {
    beforeEach(function (): void {
        mocks.mockDraw.mockReset();
        mocks.mockParse.mockReset();
        mocks.capturedDrawerOptions.length = 0;
        mocks.mockDraw.mockImplementation(function (): void { return; });
        mocks.mockParse.mockImplementation(function (_smiles: string, success: (g: unknown) => void): void {
            success({"vertices": []});
        });
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders the card with SMILES input, preset select, and control buttons", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        expect(input).toBeTruthy();
        let preset = result.getByLabelText("Preset molecules") as HTMLSelectElement;
        expect(preset).toBeTruthy();
        let renderButton = result.getByText("Render Molecule");
        expect(renderButton).toBeTruthy();
        let clearButton = result.getByText("Clear");
        expect(clearButton).toBeTruthy();
        let zoomIn = result.getByLabelText("Zoom in");
        expect(zoomIn).toBeTruthy();
        let zoomOut = result.getByLabelText("Zoom out");
        expect(zoomOut).toBeTruthy();
        let reset = result.getByLabelText("Reset view");
        expect(reset).toBeTruthy();
    });
    it("shows empty-state placeholder before the first render", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let empty = result.getByText(/Enter a SMILES string or pick a preset/);
        expect(empty).toBeTruthy();
        let canvas: HTMLElement | null = result.container.querySelector("canvas");
        expect(canvas).toBeNull();
    });
    it("renders a canvas after clicking Render Molecule with a SMILES string", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        expect(mocks.mockParse).toHaveBeenCalledWith("CCO", expect.any(Function), expect.any(Function));
    });
    it("populates SMILES input and renders when a preset is selected", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let preset = result.getByLabelText("Preset molecules") as HTMLSelectElement;
        preset.value = "CCO";
        fireEvent.change(preset);
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        expect(input.value).toBe("CCO");
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        expect(mocks.mockParse).toHaveBeenCalledWith("CCO", expect.any(Function), expect.any(Function));
    });
    it("applies zoom in when the + button is clicked", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("");
        fireEvent.click(result.getByLabelText("Zoom in"));
        expect(canvas.style.transform).toBe("");
        expect(canvas.style.width).toBe("480px");
    });
    it("applies zoom out when the - button is clicked", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        fireEvent.click(result.getByLabelText("Zoom in"));
        expect(canvas.style.width).toBe("480px");
        fireEvent.click(result.getByLabelText("Zoom out"));
        expect(canvas.style.transform).toBe("");
        expect(canvas.style.width).toBe("400px");
    });
    it("resets zoom when the Reset button is clicked", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        fireEvent.click(result.getByLabelText("Zoom in"));
        fireEvent.click(result.getByLabelText("Zoom in"));
        expect(canvas.style.transform).toBe("");
        expect(canvas.style.width).toBe("576px");
        fireEvent.click(result.getByLabelText("Reset view"));
        expect(canvas.style.transform).toBe("");
        expect(canvas.style.width).toBe("400px");
    });
    it("clears the canvas and shows empty state when Clear is clicked", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        fireEvent.click(result.getByText("Clear"));
        expect(input.value).toBe("");
        expect(result.container.querySelector("canvas")).toBeNull();
        expect(result.getByText(/Enter a SMILES string or pick a preset/)).toBeTruthy();
    });
    it("does nothing when the preset placeholder is selected", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let preset = result.getByLabelText("Preset molecules") as HTMLSelectElement;
        preset.value = "";
        fireEvent.change(preset);
        expect(result.container.querySelector("canvas")).toBeNull();
        expect(result.getByText(/Enter a SMILES string or pick a preset/)).toBeTruthy();
    });
    it("clamps zoom in at 5x", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        let zoomIn = result.getByLabelText("Zoom in");
        for (let i = 0; i < 10; i = i + 1) {
            fireEvent.click(zoomIn);
        }
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("");
        expect(canvas.style.width).toBe("2000px");
    });
    it("clamps zoom out at 0.2x", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        input.value = "CCO";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Render Molecule"));
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        let zoomOut = result.getByLabelText("Zoom out");
        for (let i = 0; i < 10; i = i + 1) {
            fireEvent.click(zoomOut);
        }
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("");
        expect(canvas.style.width).toBe("80px");
    });
    it("changes the sketch element when the palette select changes", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let sketchElement = result.getByLabelText("Sketch element") as HTMLSelectElement;
        expect(sketchElement.value).toBe("C");
        sketchElement.value = "O";
        fireEvent.change(sketchElement);
        expect(sketchElement.value).toBe("O");
    });
    it("places an atom when the sketch pad is clicked", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let pad = result.getByLabelText("Structure sketch pad");
        fireEvent.click(pad, {clientX: 100, clientY: 100});
        expect(result.container.querySelectorAll("circle").length).toBe(1);
        expect(result.container.textContent).toMatch(/Sketch SMILES:/);
        expect(result.getByText(/Open in Molar-Mass Calculator/).getAttribute("href")).toMatch(/molar-mass/);
    });
    it("shows an error when connecting with fewer than two atoms", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        fireEvent.click(result.getByText("Connect last two"));
        expect(result.container.textContent).toMatch(/at least two atoms/);
    });
    it("connects the last two atoms and reports duplicate bonds", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let pad = result.getByLabelText("Structure sketch pad");
        fireEvent.click(pad, {clientX: 100, clientY: 100});
        fireEvent.click(pad, {clientX: 150, clientY: 100});
        expect(result.container.querySelectorAll("circle").length).toBe(2);
        fireEvent.click(result.getByText("Connect last two"));
        expect(result.container.querySelectorAll("line").length).toBe(1);
        expect(result.container.textContent).not.toMatch(/at least two atoms/);
        fireEvent.click(result.getByText("Connect last two"));
        expect(result.container.textContent).toMatch(/Bond already exists/);
    });
    it("shows an error when the sketch element is invalid", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let sketchElement = result.getByLabelText("Sketch element") as HTMLSelectElement;
        sketchElement.value = "";
        fireEvent.change(sketchElement);
        let pad = result.getByLabelText("Structure sketch pad");
        fireEvent.click(pad, {clientX: 100, clientY: 100});
        expect(result.container.textContent).toMatch(/Invalid element symbol/);
        expect(result.container.querySelectorAll("circle").length).toBe(0);
    });
    it("undoes the last atom and clears the sketch", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        let pad = result.getByLabelText("Structure sketch pad");
        fireEvent.click(pad, {clientX: 100, clientY: 100});
        fireEvent.click(pad, {clientX: 150, clientY: 100});
        expect(result.container.querySelectorAll("circle").length).toBe(2);
        fireEvent.click(result.getByText("Undo atom"));
        expect(result.container.querySelectorAll("circle").length).toBe(1);
        fireEvent.click(result.getByText("Clear sketch"));
        expect(result.container.querySelectorAll("circle").length).toBe(0);
        expect(result.container.textContent).not.toMatch(/Sketch SMILES:/);
    });
    it("shows an error when using an empty sketch as SMILES", function (): void {
        let result = render(function () { return <MolecularViewerRoute />; });
        fireEvent.click(result.getByText("Use sketch as SMILES"));
        expect(result.container.textContent).toMatch(/empty or produced invalid SMILES/);
    });
    it("uses a connected sketch as SMILES and renders it", async function (): Promise<void> {
        let result = render(function () { return <MolecularViewerRoute />; });
        let pad = result.getByLabelText("Structure sketch pad");
        fireEvent.click(pad, {clientX: 100, clientY: 100});
        fireEvent.click(pad, {clientX: 150, clientY: 100});
        fireEvent.click(result.getByText("Connect last two"));
        fireEvent.click(result.getByText("Use sketch as SMILES"));
        let input = result.getByLabelText("SMILES string") as HTMLInputElement;
        expect(input.value).toBe("C-C");
        await waitFor(function (): void {
            expect(result.container.querySelector("canvas")).not.toBeNull();
        });
        expect(mocks.mockParse).toHaveBeenCalledWith("C-C", expect.any(Function), expect.any(Function));
    });
});
