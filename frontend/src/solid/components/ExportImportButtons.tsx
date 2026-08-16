import type {JSX} from "solid-js";
import {Show} from "solid-js";
import {useDataPortability} from "../stores/dataPortability";
import styles from "./ExportImportButtons.module.css";
function ExportImportButtons(): JSX.Element {
    let store = useDataPortability();
    let fileInputRef: HTMLInputElement | undefined;
    function handleExport(): void {
        store.exportData();
    }
    function handleImportClick(): void {
        if (fileInputRef !== undefined) {
            fileInputRef.click();
        }
    }
    function handleFileChange(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        if (target.files === null) {
            return;
        }
        if (target.files.length === 0) {
            return;
        }
        let file = target.files[0];
        file.text().then(function (text: string): void {
            store.importData(text);
        }).catch(function (err: unknown): void {
            let message: string = err instanceof Error ? err.message : "Unknown error";
            window.console.error("Failed to read import file: " + message);
        });
        target.value = "";
    }
    return (
        <div class={styles.container}>
            <div class={styles.actions}>
                <button type="button" class={styles.button} onClick={handleExport}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Export Data</span>
                </button>
                <button type="button" class={styles.button} onClick={handleImportClick}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Import Data</span>
                </button>
                <input type="file" ref={fileInputRef} style={{display: "none"}} accept=".chemutil,.json,application/json" onChange={handleFileChange} />
            </div>
            <Show when={store.status() !== ""}>
                <p class={styles.status} role="status">{store.status()}</p>
            </Show>
            <Show when={store.error() !== ""}>
                <p class={styles.error} role="alert">{store.error()}</p>
            </Show>
        </div>
    );
}
export {ExportImportButtons};
