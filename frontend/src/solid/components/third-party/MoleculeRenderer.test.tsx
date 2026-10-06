import {render, cleanup, waitFor} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
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
import {MoleculeRenderer} from "./MoleculeRenderer";
describe("MoleculeRenderer onMount", function (): void {
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
    it("renders a canvas element inside the container", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        let canvas: HTMLElement | null = result.container.querySelector("canvas");
        expect(canvas).not.toBeNull();
    });
    it("calls SmilesDrawer.parse on mount with the smiles string", function (): void {
        render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        expect(mocks.mockParse).toHaveBeenCalledTimes(1);
        expect(mocks.mockParse.mock.calls[0][0]).toBe("CCO");
    });
    it("constructs a SmilesDrawer.Drawer with width and height options", function (): void {
        render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" width={500} height={400} />; });
        expect(mocks.capturedDrawerOptions.length).toBe(1);
        let opts: {width: number; height: number} = mocks.capturedDrawerOptions[0] as {width: number; height: number};
        expect(opts.width).toBe(500);
        expect(opts.height).toBe(400);
    });
    it("invokes drawer.draw after a successful parse", function (): void {
        render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        expect(mocks.mockDraw).toHaveBeenCalledTimes(1);
    });
    it("sets the canvas width and height attributes on mount", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" width={500} height={400} />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.width).toBe(500);
        expect(canvas.height).toBe(400);
    });
});
describe("MoleculeRenderer cleanup", function (): void {
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
    it("clears the canvas context on unmount", function (): void {
        let clearRectSpy: ReturnType<typeof vi.fn> = vi.fn();
        let mockCtx: {clearRect: ReturnType<typeof vi.fn>} = {"clearRect": clearRectSpy};
        let getContextMock = HTMLCanvasElement.prototype.getContext as unknown as {mockImplementationOnce: (fn: () => CanvasRenderingContext2D | null) => void};
        getContextMock.mockImplementationOnce(function (): CanvasRenderingContext2D | null {
            return mockCtx as unknown as CanvasRenderingContext2D;
        });
        render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        cleanup();
        expect(clearRectSpy).toHaveBeenCalled();
    });
    it("resets the canvas transform on unmount", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" zoom={2} />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("scale(2)");
        cleanup();
        expect(canvas.style.transform).toBe("");
    });
});
describe("MoleculeRenderer reactivity", function (): void {
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
    it("re-renders when smiles prop changes", async function (): Promise<void> {
        let [smiles, setSmiles] = createSignal<string>("CCO");
        render(function (): JSX.Element { return <MoleculeRenderer smiles={smiles()} />; });
        expect(mocks.mockParse).toHaveBeenCalledTimes(1);
        expect(mocks.mockParse.mock.calls[0][0]).toBe("CCO");
        setSmiles("CCC");
        await waitFor(function (): void {
            expect(mocks.mockParse).toHaveBeenCalledTimes(2);
        });
        expect(mocks.mockParse.mock.calls[1][0]).toBe("CCC");
    });
    it("does not re-render when smiles prop is set to the same value", async function (): Promise<void> {
        let [smiles, setSmiles] = createSignal<string>("CCO");
        render(function (): JSX.Element { return <MoleculeRenderer smiles={smiles()} />; });
        expect(mocks.mockParse).toHaveBeenCalledTimes(1);
        setSmiles("CCO");
        await new Promise(function (resolve: (value: undefined) => void): void { setTimeout(resolve, 0); });
        expect(mocks.mockParse).toHaveBeenCalledTimes(1);
    });
});
describe("MoleculeRenderer zoom", function (): void {
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
    it("applies scale transform when zoom prop is set", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" zoom={2} />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("scale(2)");
    });
    it("does not apply transform when zoom is the default of 1", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("");
    });
    it("updates transform when zoom prop changes", async function (): Promise<void> {
        let [zoom, setZoom] = createSignal<number>(2);
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" zoom={zoom()} />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("scale(2)");
        setZoom(3);
        await waitFor(function (): void {
            expect(canvas.style.transform).toBe("scale(3)");
        });
    });
    it("clears transform when zoom changes back to 1", async function (): Promise<void> {
        let [zoom, setZoom] = createSignal<number>(2);
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" zoom={zoom()} />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.style.transform).toBe("scale(2)");
        setZoom(1);
        await waitFor(function (): void {
            expect(canvas.style.transform).toBe("");
        });
    });
});
describe("MoleculeRenderer defaults", function (): void {
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
    it("defaults canvas width and height to 400x300 when not provided", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.width).toBe(400);
        expect(canvas.height).toBe(300);
    });
    it("defaults drawer options to 400x300 when not provided", function (): void {
        render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        expect(mocks.capturedDrawerOptions.length).toBe(1);
        let opts: {width: number; height: number} = mocks.capturedDrawerOptions[0] as {width: number; height: number};
        expect(opts.width).toBe(400);
        expect(opts.height).toBe(300);
    });
    it("sets aria-label with the smiles string", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.getAttribute("aria-label")).toBe("Molecule: CCO");
    });
    it("sets role=img on the canvas for accessibility", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        let canvas: HTMLCanvasElement = result.container.querySelector("canvas") as HTMLCanvasElement;
        expect(canvas.getAttribute("role")).toBe("img");
    });
});
describe("MoleculeRenderer error handling", function (): void {
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
    it("does not call drawer.draw when parse reports an error", function (): void {
        mocks.mockParse.mockImplementation(function (_smiles: string, _success: (g: unknown) => void, error?: (e: Error) => void): void {
            if (error) { error(new Error("Invalid SMILES")); }
        });
        render(function (): JSX.Element { return <MoleculeRenderer smiles="BAD" />; });
        expect(mocks.mockDraw).not.toHaveBeenCalled();
    });
    it("does not re-throw when parse throws synchronously", function (): void {
        mocks.mockParse.mockImplementation(function (): void {
            throw new Error("Parse failed");
        });
        expect(function (): void {
            render(function (): JSX.Element { return <MoleculeRenderer smiles="BAD" />; });
        }).not.toThrow();
    });
    it("does not call parse when smiles is empty", function (): void {
        render(function (): JSX.Element { return <MoleculeRenderer smiles="" />; });
        expect(mocks.mockParse).not.toHaveBeenCalled();
    });
    it("does not call parse when smiles is only whitespace", function (): void {
        render(function (): JSX.Element { return <MoleculeRenderer smiles="   " />; });
        expect(mocks.mockParse).not.toHaveBeenCalled();
    });
    it("renders the canvas element even when smiles is empty", function (): void {
        let result = render(function (): JSX.Element { return <MoleculeRenderer smiles="" />; });
        let canvas: HTMLElement | null = result.container.querySelector("canvas");
        expect(canvas).not.toBeNull();
    });
    it("reports Unknown error when parse fails with a non-Error value", function (): void {
        mocks.mockParse.mockImplementation(function (_smiles: string, _success: (g: unknown) => void, error?: (e: Error) => void): void {
            if (error !== undefined) { error("boom" as unknown as Error); }
        });
        expect(function (): void {
            render(function (): JSX.Element { return <MoleculeRenderer smiles="BAD" />; });
        }).not.toThrow();
        expect(mocks.mockDraw).not.toHaveBeenCalled();
    });
    it("reports the error when drawer.draw throws", function (): void {
        mocks.mockDraw.mockImplementationOnce(function (): void {
            throw new Error("draw boom");
        });
        expect(function (): void {
            render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        }).not.toThrow();
    });
    it("does not throw when the canvas context is unavailable during error reporting", function (): void {
        let getContextMock = HTMLCanvasElement.prototype.getContext as unknown as {mockImplementationOnce: (fn: () => CanvasRenderingContext2D | null) => void};
        getContextMock.mockImplementationOnce(function (): CanvasRenderingContext2D | null {
            return null;
        });
        mocks.mockParse.mockImplementation(function (_smiles: string, _success: (g: unknown) => void, error?: (e: Error) => void): void {
            if (error !== undefined) { error(new Error("Invalid SMILES")); }
        });
        expect(function (): void {
            render(function (): JSX.Element { return <MoleculeRenderer smiles="BAD" />; });
        }).not.toThrow();
    });
    it("does not throw on unmount when the canvas context is unavailable", function (): void {
        let getContextMock = HTMLCanvasElement.prototype.getContext as unknown as {mockImplementationOnce: (fn: () => CanvasRenderingContext2D | null) => void};
        render(function (): JSX.Element { return <MoleculeRenderer smiles="CCO" />; });
        getContextMock.mockImplementationOnce(function (): CanvasRenderingContext2D | null {
            return null;
        });
        expect(function (): void {
            cleanup();
        }).not.toThrow();
    });
});
