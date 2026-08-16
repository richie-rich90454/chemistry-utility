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
        mocks.mockParse.mockImplementation(function (smiles: string, success: (g: unknown) => void): void {
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
        expect(canvas.style.transform).toBe("scale(1.2)");
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
        expect(canvas.style.transform).toBe("scale(1.2)");
        fireEvent.click(result.getByLabelText("Zoom out"));
        expect(canvas.style.transform).toBe("");
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
        expect(canvas.style.transform).toBe("scale(1.44)");
        fireEvent.click(result.getByLabelText("Reset view"));
        expect(canvas.style.transform).toBe("");
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
});
