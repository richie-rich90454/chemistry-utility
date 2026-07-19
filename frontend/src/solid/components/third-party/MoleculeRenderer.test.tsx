import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
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
        mocks.mockParse.mockImplementation(function (smiles: string, success: (g: unknown) => void): void {
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
