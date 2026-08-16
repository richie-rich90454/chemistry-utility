import type {JSX} from "solid-js";
import {createSignal, onMount, onCleanup, Show, For} from "solid-js";
import {usePluginManager} from "../stores/pluginManager";
import styles from "./PluginManagerPanel.module.css";
function PluginManagerPanel(): JSX.Element {
    let store = usePluginManager();
    let [isOpen, setIsOpen] = createSignal(false);
    onMount(function (): void {
        store.loadPlugins();
        function handleKey(e: KeyboardEvent): void {
            if (isOpen() && e.key === "Escape") {
                setIsOpen(false);
            }
        }
        window.addEventListener("keydown", handleKey);
        onCleanup(function (): void {
            window.removeEventListener("keydown", handleKey);
        });
    });
    function handleOpen(): void {
        store.loadPlugins();
        setIsOpen(true);
    }
    function handleClose(): void {
        setIsOpen(false);
    }
    function handleBackdropClick(e: MouseEvent): void {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }
    function handleToggleChange(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        let pluginId: string | null = target.getAttribute("data-plugin-id");
        if (pluginId !== null) {
            store.togglePlugin(pluginId);
        }
    }
    function handleUninstallClick(e: MouseEvent): void {
        let target = e.currentTarget as HTMLButtonElement;
        let pluginId: string | null = target.getAttribute("data-plugin-id");
        if (pluginId !== null) {
            store.uninstallPlugin(pluginId);
        }
    }
    return (
        <div class={styles.container}>
            <button type="button" class={styles.trigger} onClick={handleOpen}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Plugins</span>
            </button>
            <Show when={isOpen()}>
                <div class={styles.modal} role="dialog" aria-modal="true" aria-label="Plugin Manager" onClick={handleBackdropClick}>
                    <div class={styles.modalContent}>
                        <button type="button" class={styles.close} aria-label="Close plugin manager" onClick={handleClose}>&times;</button>
                        <h2 class={styles.title}>Plugin Manager</h2>
                        <Show when={store.plugins().length === 0}>
                            <p class={styles.empty}>No plugins registered.</p>
                        </Show>
                        <div class={styles.list}>
                            <For each={store.plugins()}>
                                {(entry) => (
                                    <div class={styles.card}>
                                        <div class={styles.cardHeader}>
                                            <div>
                                                <strong>{entry.plugin.manifest.name}</strong>
                                                <span class={styles.version}>v{entry.plugin.manifest.version}</span>
                                            </div>
                                            <div class={styles.author}>by {entry.plugin.manifest.author}</div>
                                        </div>
                                        <p class={styles.desc}>{entry.plugin.manifest.description}</p>
                                        <Show when={entry.plugin.manifest.permissions.length > 0}>
                                            <div class={styles.permissions}>Permissions: {entry.plugin.manifest.permissions.join(", ")}</div>
                                        </Show>
                                        <Show when={entry.plugin.manifest.lifecycleHooks.length > 0}>
                                            <div class={styles.hooks}>Hooks: {entry.plugin.manifest.lifecycleHooks.join(", ")}</div>
                                        </Show>
                                        <div class={styles.actions}>
                                            <label class={styles.toggleLabel}>
                                                <input
                                                    type="checkbox"
                                                    class={styles.toggle}
                                                    checked={entry.enabled}
                                                    data-plugin-id={entry.plugin.manifest.name}
                                                    onChange={handleToggleChange}
                                                />
                                                <span>Enabled</span>
                                            </label>
                                            <button
                                                type="button"
                                                class={styles.uninstall}
                                                data-plugin-id={entry.plugin.manifest.name}
                                                onClick={handleUninstallClick}
                                            >Uninstall</button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
export {PluginManagerPanel};
