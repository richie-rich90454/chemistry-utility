import {createSignal} from "solid-js";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";
interface DataPortabilityStore {
    status: () => string;
    error: () => string;
    exportData: () => void;
    importData: (jsonString: string) => void;
}
let [status, setStatus] = createSignal("");
let [error, setError] = createSignal("");
function exportData(): void {
    let manager = DataPortabilityManager.getInstance();
    try {
        manager.exportToFile();
        setStatus("Data exported successfully");
        setError("");
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Export failed: " + message);
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
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Import failed: Invalid JSON: " + message);
        setStatus("");
        return;
    }
    try {
        manager.import(parsed);
        setStatus("Data imported successfully");
        setError("");
    }
    catch (e: unknown) {
        let message: string = e instanceof Error ? e.message : "Unknown error";
        setError("Import failed: " + message);
        setStatus("");
    }
}
function useDataPortability(): DataPortabilityStore {
    return {
        status: status,
        error: error,
        exportData: exportData,
        importData: importData
    };
}
export {useDataPortability};
