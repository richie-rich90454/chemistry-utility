/**
 * Canvas HiDPI compositor helpers. Every canvas in the app sizes its backing
 * store in device pixels and its CSS box in logical pixels, so drawing code
 * works in layout units while the browser rasterises at full resolution.
 */

const MAX_DEVICE_PIXEL_RATIO: number = 3;

interface LogicalSize {
    width: number;
    height: number;
}

function rawDevicePixelRatio(): number {
    if (typeof window === "undefined" || typeof window.devicePixelRatio !== "number") {
        return 1;
    }
    let ratio: number = window.devicePixelRatio;
    if (!isFinite(ratio) || ratio <= 0) {
        return 1;
    }
    return ratio;
}

/**
 * Device pixel ratio in use, capped at 3. Beyond that the memory and fill-rate
 * cost of the backing store outruns any visible gain.
 */
export function dps(): number {
    return Math.min(rawDevicePixelRatio(), MAX_DEVICE_PIXEL_RATIO);
}

/**
 * Sizes the backing store of `canvas` to `logicalWidth` x `logicalHeight`
 * device pixels and pins the CSS box to the logical size so the element keeps
 * its layout footprint. The context transform is intentionally left alone so
 * the caller decides whether to draw in device or logical space.
 */
export function fitCanvas(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number): void {
    let dpr: number = dps();
    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);
    canvas.style.width = logicalWidth + "px";
    canvas.style.height = logicalHeight + "px";
}

/**
 * Applies the device pixel ratio as the current transform, so subsequent draw
 * calls can use logical pixels and still land on device pixels.
 */
export function beginPixelSpace(ctx: CanvasRenderingContext2D): void {
    let dpr: number = dps();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function measure(canvas: HTMLCanvasElement): LogicalSize {
    let rect: DOMRect = canvas.getBoundingClientRect();
    let dpr: number = dps();
    let width: number = rect.width > 0 ? rect.width : canvas.width / dpr;
    let height: number = rect.height > 0 ? rect.height : canvas.height / dpr;
    return { "width": Math.round(width), "height": Math.round(height) };
}

/**
 * Watches the on-screen size of `canvas` and reports the logical box whenever
 * it changes, including when the device pixel ratio changes (moving the window
 * between displays, zooming the page). Returns a function that detaches every
 * listener it registered.
 */
export function observeCanvasResize(
    canvas: HTMLCanvasElement,
    onResize: (logicalWidth: number, logicalHeight: number) => void
): () => void {
    let lastWidth: number = 0;
    let lastHeight: number = 0;
    let stopped: boolean = false;
    function emit(): void {
        if (stopped) {
            return;
        }
        let size: LogicalSize = measure(canvas);
        if (size.width <= 0 || size.height <= 0) {
            return;
        }
        if (size.width === lastWidth && size.height === lastHeight) {
            return;
        }
        lastWidth = size.width;
        lastHeight = size.height;
        onResize(size.width, size.height);
    }
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(emit);
        observer.observe(canvas);
    }
    let media: MediaQueryList | null = null;
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
        media = window.matchMedia("(resolution: " + String(dps()) + "dppx)");
        media.addEventListener("change", emit);
    }
    if (typeof window !== "undefined") {
        window.addEventListener("resize", emit);
    }
    emit();
    return function (): void {
        stopped = true;
        if (observer !== null) {
            observer.disconnect();
            observer = null;
        }
        if (media !== null) {
            media.removeEventListener("change", emit);
            media = null;
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("resize", emit);
        }
    };
}

function upscale(canvas: HTMLCanvasElement, scaleFactor: number): OffscreenCanvas | null {
    if (scaleFactor === 1 || canvas.width <= 0 || canvas.height <= 0 || typeof OffscreenCanvas === "undefined") {
        return null;
    }
    let target: OffscreenCanvas = new OffscreenCanvas(canvas.width * scaleFactor, canvas.height * scaleFactor);
    let ctx: OffscreenCanvasRenderingContext2D | null = target.getContext("2d");
    if (ctx === null) {
        return null;
    }
    ctx.drawImage(canvas, 0, 0, target.width, target.height);
    return target;
}

/**
 * Encodes the canvas as a PNG at `scaleFactor` times its current resolution.
 * The upscale goes through an OffscreenCanvas when available so the exported
 * image stays crisp; environments without OffscreenCanvas fall back to the
 * canvas' own encoder at native resolution.
 */
export function canvasToBlob(canvas: HTMLCanvasElement, scaleFactor: number = 2): Promise<Blob> {
    let scaled: OffscreenCanvas | null = upscale(canvas, scaleFactor);
    if (scaled !== null) {
        return scaled.convertToBlob({ "type": "image/png" });
    }
    return new Promise(function (resolve: (blob: Blob) => void, reject: (reason: Error) => void): void {
        canvas.toBlob(function (blob: Blob | null): void {
            if (blob === null) {
                reject(new Error("Could not encode canvas as PNG"));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}
