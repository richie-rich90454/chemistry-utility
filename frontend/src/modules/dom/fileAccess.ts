/**
 * Platform file access bridge.
 *
 * The desktop build reads and writes files through the native OS dialogs
 * (the Go FileService bound into Wails). The web build uses an
 * `<input type="file">` for reading and a Blob download for writing. Both
 * return the same shape, so callers never branch on the platform — the
 * same pattern {@link ./engine.ts} uses for the calculation engine.
 */
import { getBindings } from "./wailsBindings.js";
import { RuntimeDetector } from "../runtimeDetector.js";

export interface FileAccess {
    /** "native" on the desktop build, "web" in the browser. */
    readonly kind: "native" | "web";
    openFile(accept: string): Promise<File | null>;
    saveFile(name: string, contents: string): Promise<string | null>;
}

let accessSingleton: FileAccess | null = null;

/** Returns the file adapter for the current platform. */
export function getFileAccess(): FileAccess {
    if (accessSingleton !== null) {
        return accessSingleton;
    }
    let bindings = getBindings();
    if (bindings !== null && RuntimeDetector.getInstance().isWails) {
        accessSingleton = createNativeAccess(bindings);
    } else {
        accessSingleton = createWebAccess();
    }
    return accessSingleton;
}

/** Resets the cached adapter. Test-only hook. */
export function resetFileAccess(): void {
    accessSingleton = null;
}

function createNativeAccess(bindings: NonNullable<ReturnType<typeof getBindings>>): FileAccess {
    return {
        "kind": "native",
        "openFile": async function (accept: string): Promise<File | null> {
            try {
                // The dialog hands back text, so wrap it in a File to keep
                // one shape for every consumer on both platforms.
                return new File([await bindings.go.main.FileService.OpenFile("Open file", accept)], defaultName(accept), { "type": "text/plain" });
            } catch {
                // The Go service reports a dismissed dialog as an error, the
                // same way a browser picker reports an empty selection.
                return null;
            }
        },
        "saveFile": async function (name: string, contents: string): Promise<string | null> {
            try {
                return await bindings.go.main.FileService.SaveFile(name, contents);
            } catch {
                return null;
            }
        }
    };
}

/** Derives a placeholder file name from an accept list (".csv" -> "file.csv"). */
function defaultName(accept: string): string {
    let first = accept.split(",")[0].trim();
    return "file" + (first.startsWith(".") ? first : "");
}

function createWebAccess(): FileAccess {
    return {
        "kind": "web",
        "openFile": async function (accept: string): Promise<File | null> {
            return await pickFile(accept);
        },
        "saveFile": async function (name: string, contents: string): Promise<string | null> {
            downloadBlob(new Blob([contents], { "type": "application/octet-stream" }), name);
            return name;
        }
    };
}

/**
 * Opens the browser file picker and resolves with the chosen file, or null
 * when the user dismisses it. `change` is the only reliable signal, so the
 * window focus that follows a dismissed dialog resolves null instead of
 * leaving the promise pending forever.
 */
function pickFile(accept: string): Promise<File | null> {
    return new Promise<File | null>(function (resolve: (file: File | null) => void): void {
        let input: HTMLInputElement = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.style.display = "none";
        let settled = false;
        function finish(file: File | null): void {
            if (settled) {
                return;
            }
            settled = true;
            window.removeEventListener("focus", onWindowFocus);
            input.remove();
            resolve(file);
        }
        function onWindowFocus(): void {
            if (input.files === null || input.files.length === 0) {
                finish(null);
            }
        }
        input.addEventListener("change", function (): void {
            let hasFile = input.files !== null && input.files.length > 0;
            finish(hasFile ? (input.files as FileList)[0] : null);
        });
        window.addEventListener("focus", onWindowFocus);
        document.body.appendChild(input);
        input.click();
    });
}

function downloadBlob(blob: Blob, name: string): void {
    let url: string = URL.createObjectURL(blob);
    let link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
