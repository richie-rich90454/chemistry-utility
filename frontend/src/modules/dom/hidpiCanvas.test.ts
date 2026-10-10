import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { dps, fitCanvas, beginPixelSpace, observeCanvasResize, canvasToBlob } from "./hidpiCanvas.js";

function setDevicePixelRatio(value: number | undefined): void {
    Object.defineProperty(window, "devicePixelRatio", {
        "value": value,
        "writable": true,
        "configurable": true
    });
}

function stubRect(canvas: HTMLCanvasElement, width: number, height: number): void {
    canvas.getBoundingClientRect = function (): DOMRect {
        return {
            "width": width,
            "height": height,
            "x": 0,
            "y": 0,
            "top": 0,
            "left": 0,
            "right": width,
            "bottom": height
        } as unknown as DOMRect;
    };
}

describe("dps", function (): void {
    beforeEach(function (): void {
        setDevicePixelRatio(1);
    });
    afterEach(function (): void {
        setDevicePixelRatio(1);
        vi.restoreAllMocks();
    });
    it("returns the device pixel ratio", function (): void {
        setDevicePixelRatio(2);
        expect(dps()).toBe(2);
    });
    it("caps the ratio at 3", function (): void {
        setDevicePixelRatio(4);
        expect(dps()).toBe(3);
    });
    it("keeps fractional ratios untouched", function (): void {
        setDevicePixelRatio(2.5);
        expect(dps()).toBe(2.5);
    });
    it("falls back to 1 when the ratio is missing or invalid", function (): void {
        setDevicePixelRatio(undefined);
        expect(dps()).toBe(1);
        setDevicePixelRatio(NaN);
        expect(dps()).toBe(1);
    });
});

describe("fitCanvas", function (): void {
    beforeEach(function (): void {
        setDevicePixelRatio(1);
    });
    afterEach(function (): void {
        setDevicePixelRatio(1);
        vi.restoreAllMocks();
    });
    it("multiplies the backing store by the device pixel ratio and pins the CSS box to logical size", function (): void {
        setDevicePixelRatio(2);
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        fitCanvas(canvas, 320, 200);
        expect(canvas.width).toBe(640);
        expect(canvas.height).toBe(400);
        expect(canvas.style.width).toBe("320px");
        expect(canvas.style.height).toBe("200px");
    });
});

describe("beginPixelSpace", function (): void {
    beforeEach(function (): void {
        setDevicePixelRatio(1);
    });
    afterEach(function (): void {
        setDevicePixelRatio(1);
        vi.restoreAllMocks();
    });
    it("scales the transform by the device pixel ratio", function (): void {
        setDevicePixelRatio(3);
        let setTransform = vi.fn();
        let ctx = { "setTransform": setTransform } as unknown as CanvasRenderingContext2D;
        beginPixelSpace(ctx);
        expect(setTransform).toHaveBeenCalledWith(3, 0, 0, 3, 0, 0);
    });
});

describe("observeCanvasResize", function (): void {
    beforeEach(function (): void {
        setDevicePixelRatio(1);
    });
    afterEach(function (): void {
        setDevicePixelRatio(1);
        vi.restoreAllMocks();
    });
    it("reports logical size on resize and removes both listeners on cleanup", function (): void {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        stubRect(canvas, 320, 200);
        let mediaAdd = vi.fn();
        let mediaRemove = vi.fn();
        let matchMediaMock = vi.fn().mockReturnValue({
            "addEventListener": mediaAdd,
            "removeEventListener": mediaRemove
        } as unknown as MediaQueryList);
        Object.defineProperty(window, "matchMedia", { "value": matchMediaMock, "writable": true, "configurable": true });
        let windowAdd = vi.spyOn(window, "addEventListener");
        let windowRemove = vi.spyOn(window, "removeEventListener");
        let onResize = vi.fn();
        let stop = observeCanvasResize(canvas, onResize);
        let resizeEntry: unknown[] = windowAdd.mock.calls.find(function (call: unknown[]): boolean {
            return call[0] === "resize";
        }) as unknown[];
        let resizeHandler: EventListener = resizeEntry[1] as EventListener;
        expect(matchMediaMock).toHaveBeenCalledWith("(resolution: 1dppx)");
        expect(mediaAdd).toHaveBeenCalledTimes(1);
        expect(onResize).toHaveBeenCalledWith(320, 200);
        stubRect(canvas, 640, 400);
        resizeHandler(new Event("resize"));
        expect(onResize).toHaveBeenLastCalledWith(640, 400);
        resizeHandler(new Event("resize"));
        expect(onResize).toHaveBeenCalledTimes(2);
        stop();
        expect(windowRemove).toHaveBeenCalledWith("resize", resizeHandler);
        expect(mediaRemove).toHaveBeenCalledTimes(1);
        resizeHandler(new Event("resize"));
        expect(onResize).toHaveBeenCalledTimes(2);
    });
});

describe("canvasToBlob", function (): void {
    let originalOffscreen: unknown;
    beforeEach(function (): void {
        setDevicePixelRatio(1);
        originalOffscreen = (globalThis as unknown as Record<string, unknown>).OffscreenCanvas;
        delete (globalThis as unknown as Record<string, unknown>).OffscreenCanvas;
    });
    afterEach(function (): void {
        setDevicePixelRatio(1);
        (globalThis as unknown as Record<string, unknown>).OffscreenCanvas = originalOffscreen;
        vi.restoreAllMocks();
    });
    it("encodes through the canvas encoder when OffscreenCanvas is unavailable", async function (): Promise<void> {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        let blob = new Blob(["png"], { "type": "image/png" });
        let toBlob = vi.fn(function (_encode: (blob: Blob | null) => void, type: string): void {
            expect(type).toBe("image/png");
            _encode(blob);
        });
        Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", { "value": toBlob, "writable": true, "configurable": true });
        let result: Blob = await canvasToBlob(canvas);
        expect(result).toBe(blob);
    });
    it("upscales through an OffscreenCanvas when available", async function (): Promise<void> {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 50;
        let drawImage = vi.fn();
        let convertToBlob = vi.fn().mockResolvedValue(new Blob(["hi"], { "type": "image/png" }));
        function FakeOffscreen(this: {width: number; height: number; getContext: () => unknown; convertToBlob: unknown}, width: number, height: number): void {
            this.width = width;
            this.height = height;
            this.getContext = function (): {drawImage: unknown} {
                return { "drawImage": drawImage };
            };
            this.convertToBlob = convertToBlob;
        }
        (globalThis as unknown as Record<string, unknown>).OffscreenCanvas = FakeOffscreen;
        let blob: Blob = await canvasToBlob(canvas, 2);
        expect(drawImage).toHaveBeenCalledWith(canvas, 0, 0, 200, 100);
        expect(convertToBlob).toHaveBeenCalledWith({ "type": "image/png" });
        expect(blob).toBeInstanceOf(Blob);
    });
    it("skips the offscreen copy when the scale factor is 1", async function (): Promise<void> {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        let blob = new Blob(["png"], { "type": "image/png" });
        let toBlob = vi.fn(function (encode: (blob: Blob | null) => void): void {
            encode(blob);
        });
        Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", { "value": toBlob, "writable": true, "configurable": true });
        let constructor = vi.fn();
        (globalThis as unknown as Record<string, unknown>).OffscreenCanvas = constructor;
        let result: Blob = await canvasToBlob(canvas, 1);
        expect(constructor).not.toHaveBeenCalled();
        expect(result).toBe(blob);
    });
});
