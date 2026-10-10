/**
 * Minimal browser globals for running pure calculator modules under Node.
 *
 * The pure logic modules still transitively import the chart renderer, which
 * pulls in Chart.js and its hammerjs dependency. Phase 1 of the restructure
 * removes that import; until then this stub lets the conformance generator
 * execute in a plain Node process.
 */

function installGlobals(): void {
    if (typeof globalThis.window === "undefined") {
        globalThis.window = globalThis as unknown as Window & typeof globalThis;
    }
    if (typeof globalThis.document === "undefined") {
        globalThis.document = {
            "getElementById": () => null,
            "createElement": () => ({ "style": {}, "appendChild": () => undefined, "remove": () => undefined }),
            "querySelector": () => null,
            "querySelectorAll": () => [],
            "addEventListener": () => undefined,
            "body": { "appendChild": () => undefined, "removeChild": () => undefined }
        } as unknown as Document;
    }
    if (typeof globalThis.localStorage === "undefined") {
        let store = new Map<string, string>();
        globalThis.localStorage = {
            "getItem": (k: string) => (store.has(k) ? (store.get(k) as string) : null),
            "setItem": (k: string, v: string) => { store.set(k, v); },
            "removeItem": (k: string) => { store.delete(k); },
            "clear": () => { store.clear(); },
            "key": () => null,
            "length": 0
        } as unknown as Storage;
    }
}

installGlobals();
