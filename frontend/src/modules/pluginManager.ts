/**
 * Plugin manifest schema describing a plugin's metadata, required
 * permissions, and the lifecycle hooks it participates in.
 */
export interface PluginManifest {
    name: string;
    version: string;
    author: string;
    description: string;
    permissions: string[];
    lifecycleHooks: string[];
}

/**
 * A Plugin extends the Chemistry Utility with new capabilities. On install
 * a plugin receives a reference to the {@link PluginManager} so it can
 * register calculators, sidebar entries, or other contributions. Plugins
 * may optionally implement lifecycle hooks to observe or transform data.
 */
export interface Plugin {
    manifest: PluginManifest;
    install(pluginManager: PluginManager): void;
    uninstall(): void;
    onEnable?(): void;
    onDisable?(): void;
    beforeCalculation?(calculatorId: string, inputs: Record<string, unknown>): Record<string, unknown>;
    afterCalculation?(calculatorId: string, result: unknown): unknown;
    onNavigate?(view: string): void;
}

interface PluginEntry {
    plugin: Plugin;
    enabled: boolean;
}

const STORAGE_KEY: string = "chem-utility-plugin-states";
const VALID_PERMISSIONS: string[] = ["calculator", "sidebar", "api", "storage"];
const VALID_LIFECYCLE_HOOKS: string[] = ["beforeCalculation", "afterCalculation", "onNavigate"];

/**
 * Singleton PluginManager. Validates, registers, and dispatches lifecycle
 * hooks to enabled plugins. Persists per-plugin enabled state to
 * localStorage so users can toggle plugins across sessions.
 */
export class PluginManager {
    private static instance: PluginManager | null;
    private plugins: Map<string, PluginEntry>;
    private initialized: boolean;

    private constructor() {
        this.plugins = new Map<string, PluginEntry>();
        this.initialized = false;
    }

    /** Returns the singleton PluginManager instance, creating it on first access. */
    public static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    /**
     * Tears down the active singleton, uninstalling every registered plugin,
     * then clears the instance so the next {@link getInstance} call creates a
     * fresh manager. Intended for test teardown.
     */
    public static resetInstance(): void {
        if (PluginManager.instance) {
            let entries: PluginEntry[] = [];
            PluginManager.instance.plugins.forEach(function (entry: PluginEntry): void {
                entries.push(entry);
            });
            let i: number;
            for (i = 0; i < entries.length; i++) {
                try {
                    entries[i].plugin.uninstall();
                } catch (e) {
                    // Swallow uninstall errors during teardown.
                }
            }
            PluginManager.instance.plugins.clear();
            PluginManager.instance.initialized = false;
        }
        PluginManager.instance = null;
    }

    /**
     * Initializes the manager by loading the saved enabled/disabled state
     * for every registered plugin from localStorage. Safe to call multiple
     * times; subsequent calls are no-ops.
     */
    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.loadFromStorage();
    }

    /**
     * Validates the supplied plugin's manifest and, if it passes, registers
     * the plugin, calls its {@link Plugin.install} hook, and persists the
     * initial enabled state. Throws if the manifest is invalid or a plugin
     * with the same name is already registered.
     */
    public registerPlugin(plugin: Plugin): void {
        this.validatePlugin(plugin);
        let manifest: PluginManifest = plugin.manifest;
        if (this.plugins.has(manifest.name)) {
            throw new Error("Plugin already registered: " + manifest.name);
        }
        let entry: PluginEntry = { plugin: plugin, enabled: true };
        this.plugins.set(manifest.name, entry);
        plugin.install(this);
        this.saveToStorage();
    }

    /**
     * Unregisters the plugin identified by {@link pluginId}, calling its
     * {@link Plugin.onDisable} and {@link Plugin.uninstall} hooks before
     * removing it. No-op if the plugin is not registered.
     */
    public unregisterPlugin(pluginId: string): void {
        let entry: PluginEntry | undefined = this.plugins.get(pluginId);
        if (!entry) {
            return;
        }
        try {
            if (entry.plugin.onDisable) {
                entry.plugin.onDisable();
            }
        } catch (e) {
            // Swallow disable errors so unregister always completes.
        }
        try {
            entry.plugin.uninstall();
        } catch (e) {
            // Swallow uninstall errors so the entry is still removed.
        }
        this.plugins.delete(pluginId);
        this.saveToStorage();
    }

    /**
     * Enables the plugin identified by {@link pluginId} and invokes its
     * {@link Plugin.onEnable} hook. Persists the new state. No-op if the
     * plugin is unknown or already enabled.
     */
    public enablePlugin(pluginId: string): void {
        let entry: PluginEntry | undefined = this.plugins.get(pluginId);
        if (!entry) {
            return;
        }
        if (entry.enabled) {
            return;
        }
        entry.enabled = true;
        if (entry.plugin.onEnable) {
            entry.plugin.onEnable();
        }
        this.saveToStorage();
    }

    /**
     * Disables the plugin identified by {@link pluginId} and invokes its
     * {@link Plugin.onDisable} hook. Persists the new state. No-op if the
     * plugin is unknown or already disabled.
     */
    public disablePlugin(pluginId: string): void {
        let entry: PluginEntry | undefined = this.plugins.get(pluginId);
        if (!entry) {
            return;
        }
        if (!entry.enabled) {
            return;
        }
        entry.enabled = false;
        if (entry.plugin.onDisable) {
            entry.plugin.onDisable();
        }
        this.saveToStorage();
    }

    /** Returns a list of all registered plugins (enabled or disabled). */
    public getPlugins(): Plugin[] {
        let result: Plugin[] = [];
        this.plugins.forEach(function (entry: PluginEntry): void {
            result.push(entry.plugin);
        });
        return result;
    }

    /** Returns a list containing only the currently enabled plugins. */
    public getEnabledPlugins(): Plugin[] {
        let result: Plugin[] = [];
        this.plugins.forEach(function (entry: PluginEntry): void {
            if (entry.enabled) {
                result.push(entry.plugin);
            }
        });
        return result;
    }

    /** Returns the plugin identified by {@link pluginId}, or undefined. */
    public getPlugin(pluginId: string): Plugin | undefined {
        let entry: PluginEntry | undefined = this.plugins.get(pluginId);
        if (!entry) {
            return undefined;
        }
        return entry.plugin;
    }

    /** Returns true when the named plugin exists and is enabled. */
    public isPluginEnabled(pluginId: string): boolean {
        let entry: PluginEntry | undefined = this.plugins.get(pluginId);
        if (!entry) {
            return false;
        }
        return entry.enabled;
    }

    /**
     * Dispatches a lifecycle hook to every enabled plugin. For
     * "beforeCalculation" and "afterCalculation" the payload is passed
     * through each plugin in registration order so plugins can transform
     * inputs or results. For "onNavigate" the view is simply observed.
     * Returns the (possibly transformed) payload.
     */
    public executeHook(hookName: string, data: unknown): unknown {
        if (hookName === "beforeCalculation") {
            let payload: { calculatorId: string; inputs: Record<string, unknown> } = data as { calculatorId: string; inputs: Record<string, unknown> };
            this.plugins.forEach(function (entry: PluginEntry): void {
                if (!entry.enabled) {
                    return;
                }
                let plugin: Plugin = entry.plugin;
                if (plugin.beforeCalculation) {
                    let modified: Record<string, unknown> = plugin.beforeCalculation(payload.calculatorId, payload.inputs);
                    if (modified) {
                        payload.inputs = modified;
                    }
                }
            });
            return payload;
        }
        if (hookName === "afterCalculation") {
            let payload: { calculatorId: string; result: unknown } = data as { calculatorId: string; result: unknown };
            this.plugins.forEach(function (entry: PluginEntry): void {
                if (!entry.enabled) {
                    return;
                }
                let plugin: Plugin = entry.plugin;
                if (plugin.afterCalculation) {
                    let modified: unknown = plugin.afterCalculation(payload.calculatorId, payload.result);
                    if (modified !== undefined) {
                        payload.result = modified;
                    }
                }
            });
            return payload;
        }
        if (hookName === "onNavigate") {
            let payload: { view: string } = data as { view: string };
            this.plugins.forEach(function (entry: PluginEntry): void {
                if (!entry.enabled) {
                    return;
                }
                let plugin: Plugin = entry.plugin;
                if (plugin.onNavigate) {
                    plugin.onNavigate(payload.view);
                }
            });
            return payload;
        }
        return data;
    }

    /**
     * Reads the saved enabled/disabled state from localStorage and applies
     * it to registered plugins, invoking onEnable/onDisable hooks as the
     * state changes. Silently ignores storage or parse errors.
     */
    public loadFromStorage(): void {
        let stored: string | null;
        try {
            stored = localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return;
        }
        if (!stored) {
            return;
        }
        let parsed: Record<string, boolean>;
        try {
            parsed = JSON.parse(stored) as Record<string, boolean>;
        } catch (e) {
            return;
        }
        let self: PluginManager = this;
        let keys: string[] = Object.keys(parsed);
        let i: number;
        for (i = 0; i < keys.length; i++) {
            let id: string = keys[i];
            let entry: PluginEntry | undefined = self.plugins.get(id);
            if (!entry) {
                continue;
            }
            let storedEnabled: boolean = parsed[id];
            if (entry.enabled === storedEnabled) {
                continue;
            }
            entry.enabled = storedEnabled;
            if (storedEnabled && entry.plugin.onEnable) {
                entry.plugin.onEnable();
            } else if (!storedEnabled && entry.plugin.onDisable) {
                entry.plugin.onDisable();
            }
        }
    }

    /**
     * Persists the current enabled/disabled state of every registered
     * plugin to localStorage. Silently ignores storage errors.
     */
    public saveToStorage(): void {
        let state: Record<string, boolean> = {};
        this.plugins.forEach(function (entry: PluginEntry, id: string): void {
            state[id] = entry.enabled;
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Swallow storage errors — non-critical.
        }
    }

    /**
     * Validates the plugin's manifest and required methods. Throws an Error
     * describing the first validation failure.
     */
    private validatePlugin(plugin: Plugin): void {
        if (!plugin) {
            throw new Error("Plugin cannot be null or undefined");
        }
        let manifest: PluginManifest = plugin.manifest;
        if (!manifest) {
            throw new Error("Plugin manifest is required");
        }
        if (typeof manifest.name !== "string" || manifest.name === "") {
            throw new Error("Plugin manifest.name is required and must be a non-empty string");
        }
        if (typeof manifest.version !== "string" || manifest.version === "") {
            throw new Error("Plugin manifest.version is required and must be a non-empty string");
        }
        if (typeof manifest.author !== "string" || manifest.author === "") {
            throw new Error("Plugin manifest.author is required and must be a non-empty string");
        }
        if (typeof manifest.description !== "string") {
            throw new Error("Plugin manifest.description must be a string");
        }
        if (!Array.isArray(manifest.permissions)) {
            throw new Error("Plugin manifest.permissions must be an array");
        }
        if (!Array.isArray(manifest.lifecycleHooks)) {
            throw new Error("Plugin manifest.lifecycleHooks must be an array");
        }
        let i: number;
        for (i = 0; i < manifest.permissions.length; i++) {
            if (VALID_PERMISSIONS.indexOf(manifest.permissions[i]) === -1) {
                throw new Error("Invalid permission: " + manifest.permissions[i]);
            }
        }
        for (i = 0; i < manifest.lifecycleHooks.length; i++) {
            if (VALID_LIFECYCLE_HOOKS.indexOf(manifest.lifecycleHooks[i]) === -1) {
                throw new Error("Invalid lifecycle hook: " + manifest.lifecycleHooks[i]);
            }
        }
        if (typeof plugin.install !== "function") {
            throw new Error("Plugin.install must be a function");
        }
        if (typeof plugin.uninstall !== "function") {
            throw new Error("Plugin.uninstall must be a function");
        }
    }

    /** Exposes the valid permission strings — used by the UI and tests. */
    public static getValidPermissions(): string[] {
        return VALID_PERMISSIONS.slice();
    }

    /** Exposes the valid lifecycle hook names — used by the UI and tests. */
    public static getValidLifecycleHooks(): string[] {
        return VALID_LIFECYCLE_HOOKS.slice();
    }
}
