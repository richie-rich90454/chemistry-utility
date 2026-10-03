import {createSignal, onCleanup, onMount} from "solid-js";
import {ChemicalElement} from "../../types.js";
import {lookupElement} from "../../modules/elementLookup.js";
import {DataCache} from "../../modules/dataCache.js";
function useElementLookup(): {
    query: () => string;
    setQuery: (next: string) => void;
    result: () => ChemicalElement | null;
    error: () => string;
    elements: () => ChemicalElement[];
    loading: () => boolean;
    loadError: () => string;
    search: () => void;
    clear: () => void;
} {
    let [query, setQuery] = createSignal("");
    let [result, setResult] = createSignal<ChemicalElement | null>(null);
    let [error, setError] = createSignal("");
    let [elements, setElements] = createSignal<ChemicalElement[]>([]);
    let [loading, setLoading] = createSignal(true);
    let [loadError, setLoadError] = createSignal("");
    let aborter: AbortController | null = null;
    let disposed: boolean = false;
    onMount(function (): void {
        loadElements();
    });
    onCleanup(function (): void {
        disposed = true;
        if (aborter !== null) {
            aborter.abort();
        }
    });
    function loadElements(): void {
        let cache = DataCache.getInstance();
        cache.get("ptable").then(function (cached: string | null): void {
            if (disposed) {
                return;
            }
            if (cached !== null) {
                try {
                    let parsed: ChemicalElement[] = JSON.parse(cached) as ChemicalElement[];
                    setElements(parsed);
                    setLoading(false);
                    return;
                }
                catch {
                    // Corrupt cache — fall through to fetch
                }
            }
            aborter = new AbortController();
            // Relative URL keeps subpath deployments working.
            fetch("ptable.json", {signal: aborter.signal}).then(function (response: Response): Promise<unknown> {
                if (!response.ok) {
                    throw new Error("HTTP error! status: " + response.status);
                }
                return response.json();
            }).then(function (data: unknown): void {
                if (disposed) {
                    return;
                }
                let elementData = data as ChemicalElement[];
                setElements(elementData);
                cache.set("ptable", JSON.stringify(elementData));
                setLoading(false);
            }).catch(function (err: unknown): void {
                if (disposed) {
                    return;
                }
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                let message = err instanceof Error ? err.message : String(err);
                setLoadError(message);
                setLoading(false);
            });
        });
    }
    function search(): void {
        if (loading() || loadError() !== "") {
            return;
        }
        setError("");
        let trimmed = query().trim();
        if (trimmed === "") {
            setResult(null);
            setError("Please enter an element symbol, name, or atomic number");
            return;
        }
        let found = lookupElement(trimmed, elements());
        if (found === null) {
            setResult(null);
            setError("Element not found");
            return;
        }
        setResult(found);
    }
    function clear(): void {
        setQuery("");
        setResult(null);
        setError("");
    }
    return {
        query: query,
        setQuery: setQuery,
        result: result,
        error: error,
        elements: elements,
        loading: loading,
        loadError: loadError,
        search: search,
        clear: clear
    };
}
export {useElementLookup};
