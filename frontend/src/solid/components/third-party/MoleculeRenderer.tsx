import type {JSX} from "solid-js";
import {onMount, onCleanup, createEffect} from "solid-js";
import SmilesDrawer from "smiles-drawer";
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
    let firstEffectRun: boolean = true;
    function getWidth(): number {
        return props.width !== undefined ? props.width : 400;
    }
    function getHeight(): number {
        return props.height !== undefined ? props.height : 300;
    }
    function getDrawerOptions(): Record<string, unknown> {
        return {
            "width": getWidth(),
            "height": getHeight(),
            "atomVisualization": "default",
            "isometric": false,
            "compactDrawing": true
        };
    }
    function reportError(err: unknown): void {
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
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
            ctx.fillStyle = "#d93025";
            ctx.font = "14px sans-serif";
            ctx.fillText("Error: " + message, 10, 30);
        }
    }
    function renderSmiles(smiles: string): void {
        if (canvasRef === undefined) {
            return;
        }
        let trimmed: string = (smiles || "").trim();
        if (trimmed.length === 0) {
            return;
        }
        let drawer: SmilesDrawerInstance = new SmilesDrawer.Drawer(getDrawerOptions()) as SmilesDrawerInstance;
        let canvas: HTMLCanvasElement = canvasRef;
        let success: (g: unknown) => void = function (data: unknown): void {
            try {
                drawer.draw(data, canvas, "light", false, []);
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
    function applyZoom(): void {
        if (canvasRef === undefined) {
            return;
        }
        let zoom: number = props.zoom !== undefined ? props.zoom : 1;
        if (zoom === 1) {
            canvasRef.style.transform = "";
        } else {
            canvasRef.style.transform = "scale(" + String(zoom) + ")";
            canvasRef.style.transformOrigin = "center center";
        }
    }
    onMount(function (): void {
        if (canvasRef !== undefined) {
            canvasRef.width = getWidth();
            canvasRef.height = getHeight();
        }
        renderSmiles(props.smiles);
        applyZoom();
    });
    createEffect(function (): void {
        let smiles: string = props.smiles;
        if (firstEffectRun) {
            firstEffectRun = false;
            return;
        }
        renderSmiles(smiles);
    });
    createEffect(function (): void {
        let zoom: number = props.zoom !== undefined ? props.zoom : 1;
        if (canvasRef !== undefined) {
            canvasRef.style.transform = zoom === 1 ? "" : "scale(" + String(zoom) + ")";
            canvasRef.style.transformOrigin = "center center";
        }
    });
    onCleanup(function (): void {
        if (canvasRef !== undefined) {
            let ctx: CanvasRenderingContext2D | null = canvasRef.getContext("2d");
            if (ctx !== null) {
                ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
            }
            canvasRef.style.transform = "";
        }
    });
    return (
        <div class={styles.container}>
            <canvas ref={canvasRef} class={styles.canvas} role="img" aria-label={"Molecule: " + props.smiles} />
        </div>
    );
}
export {MoleculeRenderer};
