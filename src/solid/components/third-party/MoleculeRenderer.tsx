import type {JSX} from "solid-js";
import {onMount, onCleanup, createEffect} from "solid-js";
import SmilesDrawer from "smiles-drawer";
import {fitCanvas, beginPixelSpace, dps} from "../../../modules/dom/hidpiCanvas.js";
import styles from "./MoleculeRenderer.module.css";
export interface MoleculeRendererProps {
    smiles: string;
    zoom?: number;
    width?: number;
    height?: number;
}
interface SmilesDrawerInstance {
    draw: (graph: unknown, canvas: HTMLCanvasElement, theme: string, debug: boolean, scores: unknown[]) => void;
}
function MoleculeRenderer(props: MoleculeRendererProps): JSX.Element {
    let canvasRef: HTMLCanvasElement | undefined;
    let firstRun: boolean = true;
    function getWidth(): number {
        return props.width !== undefined ? props.width : 400;
    }
    function getHeight(): number {
        return props.height !== undefined ? props.height : 300;
    }
    function getZoom(): number {
        return props.zoom !== undefined ? props.zoom : 1;
    }
    /**
     * SmilesDrawer multiplies these by its own devicePixelRatio, so the raster
     * lands at logical * zoom * dpr * window.devicePixelRatio device pixels.
     * That is a deliberate supersample: every zoom level keeps full device
     * resolution instead of stretching a small bitmap.
     */
    function getDrawerOptions(zoom: number): Record<string, unknown> {
        let dpr: number = dps();
        return {
            "width": getWidth() * dpr * zoom,
            "height": getHeight() * dpr * zoom,
            "atomVisualization": "default",
            "isometric": false,
            "compactDrawing": true
        };
    }
    /**
     * Magnifies by enlarging the CSS box while the backing store keeps the
     * high-resolution raster, so zooming never resamples.
     */
    function pinDisplayBox(zoom: number): void {
        /* v8 ignore next -- pinDisplayBox only runs after a draw where Solid has assigned the ref */
        if (canvasRef === undefined) {
            return;
        }
        canvasRef.style.width = String(getWidth() * zoom) + "px";
        canvasRef.style.height = String(getHeight() * zoom) + "px";
    }
    function reportError(err: unknown): void {
        /* v8 ignore next -- reportError only runs post-mount (parse/draw callbacks) where Solid has assigned the ref; verified by mount tests */
        if (canvasRef === undefined) {
            return;
        }
        let message: string;
        if (err instanceof Error) {
            message = err.message;
        } else {
            message = "Unknown error";
        }
        let ctx: CanvasRenderingContext2D | null = canvasRef.getContext("2d");
        if (ctx !== null) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
            beginPixelSpace(ctx);
            ctx.fillStyle = "#d93025";
            ctx.font = "14px sans-serif";
            ctx.fillText("Error: " + message, 10, 30);
        }
    }
    function renderSmiles(smiles: string, zoom: number): void {
        /* v8 ignore next -- renderSmiles only runs from onMount/reactive effects where Solid has assigned the ref */
        if (canvasRef === undefined) {
            return;
        }
        let trimmed: string = (smiles || "").trim();
        if (trimmed.length === 0) {
            return;
        }
        fitCanvas(canvasRef, getWidth(), getHeight());
        let drawer: SmilesDrawerInstance = new SmilesDrawer.Drawer(getDrawerOptions(zoom)) as SmilesDrawerInstance;
        let canvas: HTMLCanvasElement = canvasRef;
        let success: (g: unknown) => void = function (data: unknown): void {
            try {
                drawer.draw(data, canvas, "light", false, []);
                pinDisplayBox(zoom);
            } catch (drawErr: unknown) {
                reportError(drawErr);
            }
        };
        let error: (e: Error) => void = function (err: Error): void {
            reportError(err);
        };
        try {
            SmilesDrawer.parse(trimmed, success, error);
        } catch (parseErr: unknown) {
            reportError(parseErr);
        }
    }
    onMount(function (): void {
        /* v8 ignore next -- Solid assigns the ref before onMount so canvasRef is always set here */
        if (canvasRef !== undefined) {
            fitCanvas(canvasRef, getWidth(), getHeight());
        }
        renderSmiles(props.smiles, getZoom());
    });
    createEffect(function (): void {
        let smiles: string = props.smiles;
        let zoom: number = getZoom();
        if (firstRun) {
            firstRun = false;
            return;
        }
        // Zoom re-renders the molecule at the new scale instead of scaling a
        // CSS transform, so the enlarged bonds and labels stay sharp.
        renderSmiles(smiles, zoom);
    });
    onCleanup(function (): void {
        /* v8 ignore next -- the ref stays assigned for the component lifetime so canvasRef is always set at cleanup */
        if (canvasRef !== undefined) {
            let ctx: CanvasRenderingContext2D | null = canvasRef.getContext("2d");
            if (ctx !== null) {
                ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
            }
        }
    });
    return (
        <div class={styles.container}>
            <canvas ref={function (el: HTMLCanvasElement): void { canvasRef = el; }} class={styles.canvas} role="img" aria-label={"Molecule: " + props.smiles} />
        </div>
    );
}
export {MoleculeRenderer};
