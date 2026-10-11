import {createSignal} from "solid-js";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";
import {getFileAccess} from "../../modules/dom/fileAccess.js";
const ARCHIVE_FILENAME: string = "chemistry-utility-backup.chemutil";
// The web picker needs MIME hints the native dialog ignores; both accept
// lists describe the same file, so the browsed file is identical either way.
const ARCHIVE_ACCEPT: string = ".chemutil,.json,application/json";
interface DataPortabilityStore {
    status: () => string;
    error: () => string;
    exportData: () => Promise<void>;
    importData: (jsonString: string) => void;
    importArchive: () => Promise<void>;
}
let [status, setStatus] = createSignal("");
let [error, setError] = createSignal("");
function toMessage(e: unknown): string {
    return e instanceof Error ? e.message : "Unknown error";
}
async function exportData(): Promise<void> {
    let manager = DataPortabilityManager.getInstance();
    try {
        let json = JSON.stringify(manager.export(), null, 2);
        // A null path means the user dismissed the native dialog; the web
        // adapter always resolves with the file name it just downloaded.
        if (await getFileAccess().saveFile(ARCHIVE_FILENAME, json) === null) {
            return;
        }
        setStatus("Data exported successfully");
        setError("");
    }
    catch (e: unknown) {
        setError("Export failed: " + toMessage(e));
        setStatus("");
    }
}
function importData(jsonString: string): void {
    let manager = DataPortabilityManager.getInstance();
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonString);
    }
    catch (e: unknown) {
        setError("Import failed: Invalid JSON: " + toMessage(e));
        setStatus("");
        return;
    }
    try {
        manager.import(parsed);
        setStatus("Data imported successfully");
        setError("");
    }
    catch (e: unknown) {
        setError("Import failed: " + toMessage(e));
        setStatus("");
    }
}
function importArchive(): Promise<void> {
    return getFileAccess().openFile(ARCHIVE_ACCEPT).then(function (picked: File | null): Promise<void> {
        if (picked === null) {
            // The dialog was dismissed; keep the previous status untouched.
            return Promise.resolve();
        }
        return picked.text().then(function (text: string): void {
            importData(text);
        });
    }).catch(function (e: unknown): void {
        setError("Import failed: " + toMessage(e));
        setStatus("");
    });
}
function useDataPortability(): DataPortabilityStore {
    return {
        status: status,
        error: error,
        exportData: exportData,
        importData: importData,
        importArchive: importArchive
    };
}
/** Clears the shared status/error signals. Test-only hook. */
function resetDataPortability(): void {
    setStatus("");
    setError("");
}
export {useDataPortability, resetDataPortability};
