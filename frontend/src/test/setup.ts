import { vi } from "vitest";

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
});

// Mock ResizeObserver (required by Chart.js for responsive canvases)
class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
});
Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(""),
    },
    writable: true,
});

// Mock scrollY
Object.defineProperty(window, "scrollY", { value: 0, writable: true });

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock history.pushState
window.history.pushState = vi.fn();

// Mock HTMLCanvasElement.getContext - jsdom does not implement canvas rendering.
// Returns a Proxy that yields a canvas-like 2D context for any property access,
// allowing Chart.js to construct charts in the test environment.
function createNoopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    let handler: ProxyHandler<Record<string, unknown>> = {
        "get": function (_target: Record<string, unknown>, prop: string | symbol): unknown {
            if (typeof prop !== "string") {
                return undefined;
            }
            if (prop === "canvas") {
                return canvas;
            }
            if (prop === "measureText") {
                return function (): { width: number } {
                    return { "width": 0 };
                };
            }
            if (prop === "getImageData") {
                return function (): ImageData {
                    return { "data": new Uint8ClampedArray(4), "width": 1, "height": 1 } as unknown as ImageData;
                };
            }
            if (prop === "createLinearGradient" || prop === "createRadialGradient" || prop === "createConicGradient") {
                return function (): CanvasGradient {
                    return { "addColorStop": function (): void { return; } } as unknown as CanvasGradient;
                };
            }
            if (prop === "getContextAttributes") {
                return function (): { alpha: boolean } {
                    return { "alpha": true };
                };
            }
            if (prop === "save" || prop === "restore" || prop === "beginPath" || prop === "closePath" || prop === "fill" || prop === "stroke" || prop === "clip") {
                return function (): void { return; };
            }
            return function (): void { return; };
        },
        "set": function (): boolean {
            return true;
        }
    };
    return new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
}

HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement): CanvasRenderingContext2D | null {
    return createNoopContext(this);
}) as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(function (): string {
    return "data:image/png;base64,FAKEDATA";
}) as typeof HTMLCanvasElement.prototype.toDataURL;

// Mock gsap (required by appNavigationStrategy transitively imported via navigationManager)
vi.mock("gsap", () => ({
    default: { to: vi.fn(), from: vi.fn(), fromTo: vi.fn(), set: vi.fn() },
}));
