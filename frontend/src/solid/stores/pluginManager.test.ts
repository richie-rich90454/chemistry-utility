import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {PluginManager} from "../../modules/pluginManager.js";
import type {Plugin, PluginManifest} from "../../modules/pluginManager.js";
import {usePluginManager} from "./pluginManager";
function makePlugin(name: string, description: string): Plugin {
    let manifest: PluginManifest = {
        name: name,
        version: "1.0.0",
        author: "Test Author",
        description: description,
        permissions: ["calculator"],
        lifecycleHooks: ["beforeCalculation"]
    };
    return {
        manifest: manifest,
        install: function (): void {},
        uninstall: function (): void {}
    };
}
describe("usePluginManager", function (): void {
    beforeEach(function (): void {
        PluginManager.resetInstance();
        localStorage.clear();
    });
    afterEach(function (): void {
        PluginManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("loadPlugins populates the signal from the manager", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        manager.registerPlugin(makePlugin("beta", "Beta plugin"));
        let store = usePluginManager();
        store.loadPlugins();
        expect(store.plugins().length).toBe(2);
        expect(store.plugins()[0].plugin.manifest.name).toBe("alpha");
        expect(store.plugins()[1].plugin.manifest.name).toBe("beta");
    });
    it("loadPlugins reflects enabled state from the manager", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        manager.disablePlugin("alpha");
        let store = usePluginManager();
        store.loadPlugins();
        expect(store.plugins().length).toBe(1);
        expect(store.plugins()[0].enabled).toBe(false);
    });
    it("loadPlugins returns empty list when no plugins registered", function (): void {
        let store = usePluginManager();
        store.loadPlugins();
        expect(store.plugins().length).toBe(0);
    });
    it("togglePlugin disables an enabled plugin", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        let store = usePluginManager();
        store.loadPlugins();
        expect(store.plugins()[0].enabled).toBe(true);
        store.togglePlugin("alpha");
        expect(manager.isPluginEnabled("alpha")).toBe(false);
        expect(store.plugins()[0].enabled).toBe(false);
    });
    it("togglePlugin enables a disabled plugin", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        manager.disablePlugin("alpha");
        let store = usePluginManager();
        store.loadPlugins();
        expect(store.plugins()[0].enabled).toBe(false);
        store.togglePlugin("alpha");
        expect(manager.isPluginEnabled("alpha")).toBe(true);
        expect(store.plugins()[0].enabled).toBe(true);
    });
    it("togglePlugin is a no-op for an unknown plugin id", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        let store = usePluginManager();
        store.loadPlugins();
        store.togglePlugin("nonexistent");
        expect(store.plugins().length).toBe(1);
        expect(store.plugins()[0].enabled).toBe(true);
    });
    it("uninstallPlugin calls unregisterPlugin and reloads the list", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        manager.registerPlugin(makePlugin("beta", "Beta plugin"));
        let store = usePluginManager();
        store.loadPlugins();
        expect(store.plugins().length).toBe(2);
        store.uninstallPlugin("alpha");
        expect(manager.getPlugins().length).toBe(1);
        expect(store.plugins().length).toBe(1);
        expect(store.plugins()[0].plugin.manifest.name).toBe("beta");
    });
    it("shares state across multiple usePluginManager calls (singleton)", function (): void {
        let manager = PluginManager.getInstance();
        manager.registerPlugin(makePlugin("alpha", "Alpha plugin"));
        let storeA = usePluginManager();
        let storeB = usePluginManager();
        storeA.loadPlugins();
        expect(storeB.plugins().length).toBe(1);
    });
});
