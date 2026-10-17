import { canvasToBlob } from "./hidpiCanvas.js";

/**
 * Downloads a canvas as a PNG at twice its current backing resolution. Used
 * by the Chart.js export path, which previously captured the on-screen
 * (logical resolution) bitmap and produced blurry images on HiDPI screens.
 */
export async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    let blob: Blob = await canvasToBlob(canvas, 2);
    let url: string = URL.createObjectURL(blob);
    let link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
