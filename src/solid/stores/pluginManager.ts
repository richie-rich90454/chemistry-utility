import {createSignal} from "solid-js";
import {PluginManager} from "../../modules/pluginManager.js";
import type {Plugin} from "../../modules/pluginManager.js";
interface PluginEntry {
    plugin: Plugin;
    enabled: boolean;
}
interface PluginManagerStore {
    plugins: () => PluginEntry[];
    loadPlugins: () => void;
    togglePlugin: (pluginId: string) => void;
    uninstallPlugin: (pluginId: string) => void;
}
let [plugins, setPlugins] = createSignal<PluginEntry[]>([]);
function loadPlugins(): void {
    let manager = PluginManager.getInstance();
    manager.init();
    let list: Plugin[] = manager.getPlugins();
    let entries: PluginEntry[] = [];
    let i: number;
    for (i = 0; i < list.length; i++) {
        let p = list[i];
        entries.push({plugin: p, enabled: manager.isPluginEnabled(p.manifest.name)});
    }
    setPlugins(entries);
}
function togglePlugin(pluginId: string): void {
    let manager = PluginManager.getInstance();
    let current: PluginEntry[] = plugins();
    let i: number;
    let found: PluginEntry | null = null;
    for (i = 0; i < current.length; i++) {
        if (current[i].plugin.manifest.name === pluginId) {
            found = current[i];
            break;
        }
    }
    if (found === null) {
        return;
    }
    if (found.enabled) {
        manager.disablePlugin(pluginId);
    }
    else {
        manager.enablePlugin(pluginId);
    }
    loadPlugins();
}
function uninstallPlugin(pluginId: string): void {
    let manager = PluginManager.getInstance();
    manager.unregisterPlugin(pluginId);
    loadPlugins();
}
function usePluginManager(): PluginManagerStore {
    return {
        plugins: plugins,
        loadPlugins: loadPlugins,
        togglePlugin: togglePlugin,
        uninstallPlugin: uninstallPlugin
    };
}
export {usePluginManager};
