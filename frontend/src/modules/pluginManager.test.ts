import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PluginManager, Plugin, PluginManifest } from "./pluginManager.js";
import { CalculatorRegistry } from "./calculatorRegistry.js";
import { CrystalStructurePlugin } from "./plugins/crystalStructurePlugin.js";

const STORAGE_KEY: string = "chem-utility-plugin-states";

/**
 * Configurable test plugin that records every lifecycle call. Used across
 * the suite to assert hook dispatch, enable/disable transitions, and
 * storage-driven state changes.
 */
class MockPlugin implements Plugin {
    public manifest: PluginManifest;
    public installCalls: number;
    public uninstallCalls: number;
    public onEnableCalls: number;
    public onDisableCalls: number;
    public beforeCalcCalls: number;
    public afterCalcCalls: number;
    public onNavigateCalls: number;
    public lastBeforeInputs: Record<string, unknown> | null;
    public lastAfterResult: unknown;
    public lastNavigateView: string | null;
    public lastBeforeCalcId: string | null;
    public lastAfterCalcId: string | null;
    public beforeModifier: ((inputs: Record<string, unknown>) => Record<string, unknown>) | null;
    public afterModifier: ((result: unknown) => unknown) | null;

    constructor(name: string) {
        this.manifest = {
            name: name,
            version: "1.0.0",
            author: "Test Author",
            description: "A test plugin",
            permissions: [],
            lifecycleHooks: []
        };
        this.installCalls = 0;
        this.uninstallCalls = 0;
        this.onEnableCalls = 0;
        this.onDisableCalls = 0;
        this.beforeCalcCalls = 0;
        this.afterCalcCalls = 0;
        this.onNavigateCalls = 0;
        this.lastBeforeInputs = null;
        this.lastAfterResult = undefined;
        this.lastNavigateView = null;
        this.lastBeforeCalcId = null;
        this.lastAfterCalcId = null;
        this.beforeModifier = null;
        this.afterModifier = null;
    }

    public install(_pm: PluginManager): void {
        this.installCalls = this.installCalls + 1;
    }

    public uninstall(): void {
        this.uninstallCalls = this.uninstallCalls + 1;
    }

    public onEnable(): void {
        this.onEnableCalls = this.onEnableCalls + 1;
    }

    public onDisable(): void {
        this.onDisableCalls = this.onDisableCalls + 1;
    }

    public beforeCalculation(calculatorId: string, inputs: Record<string, unknown>): Record<string, unknown> {
        this.beforeCalcCalls = this.beforeCalcCalls + 1;
        this.lastBeforeCalcId = calculatorId;
        this.lastBeforeInputs = inputs;
        if (this.beforeModifier) {
            return this.beforeModifier(inputs);
        }
        return inputs;
    }

    public afterCalculation(calculatorId: string, result: unknown): unknown {
        this.afterCalcCalls = this.afterCalcCalls + 1;
        this.lastAfterCalcId = calculatorId;
        this.lastAfterResult = result;
        if (this.afterModifier) {
            return this.afterModifier(result);
        }
        return result;
    }

    public onNavigate(view: string): void {
        this.onNavigateCalls = this.onNavigateCalls + 1;
        this.lastNavigateView = view;
    }
}

/**
 * Plugin stub that only satisfies the required manifest/install/uninstall
 * fields. Used to test validation of optional lifecycle hook methods.
 */
class MinimalPlugin implements Plugin {
    public manifest: PluginManifest;

    constructor(name: string) {
        this.manifest = {
            name: name,
            version: "1.0.0",
            author: "Test Author",
            description: "minimal",
            permissions: [],
            lifecycleHooks: []
        };
    }

    public install(_pm: PluginManager): void {}

    public uninstall(): void {}
}

function buildSidebarNav(): void {
    let aside: HTMLElement = document.createElement("aside");
    aside.className = "sidebar";
    let nav: HTMLElement = document.createElement("nav");
    nav.className = "sidebar-nav";
    let ul: HTMLElement = document.createElement("ul");
    nav.appendChild(ul);
    aside.appendChild(nav);
    let footer: HTMLElement = document.createElement("div");
    footer.className = "sidebar-footer";
    aside.appendChild(footer);
    document.body.appendChild(aside);
}

beforeEach(function (): void {
    PluginManager.resetInstance();
    CalculatorRegistry.getInstance().clear();
    document.body.innerHTML = "";
    buildSidebarNav();
    try {
        localStorage.clear();
    } catch (e) {
        // ignore
    }
});

afterEach(function (): void {
    PluginManager.resetInstance();
    CalculatorRegistry.getInstance().clear();
    document.body.innerHTML = "";
    try {
        localStorage.clear();
    } catch (e) {
        // ignore
    }
});

describe("PluginManager singleton", function (): void {
    it("getInstance returns the same instance on repeated calls", function (): void {
        let a: PluginManager = PluginManager.getInstance();
        let b: PluginManager = PluginManager.getInstance();
        expect(a).toBe(b);
    });

    it("resetInstance clears the singleton so the next getInstance returns a fresh instance", function (): void {
        let first: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("singleton-plugin");
        first.registerPlugin(plugin);
        expect(first.getPlugins().length).toBe(1);

        PluginManager.resetInstance();
        let second: PluginManager = PluginManager.getInstance();
        expect(second).not.toBe(first);
        expect(second.getPlugins().length).toBe(0);
    });

    it("resetInstance calls uninstall on every registered plugin", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("teardown-plugin");
        pm.registerPlugin(plugin);
        expect(plugin.uninstallCalls).toBe(0);

        PluginManager.resetInstance();
        expect(plugin.uninstallCalls).toBe(1);
    });
});

describe("PluginManager.registerPlugin", function (): void {
    it("adds the plugin to the registry and calls install", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("alpha");
        pm.registerPlugin(plugin);

        expect(plugin.installCalls).toBe(1);
        expect(pm.getPlugins().length).toBe(1);
        expect(pm.getPlugins()[0].manifest.name).toBe("alpha");
    });

    it("throws when a plugin with the same name is already registered", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        pm.registerPlugin(new MockPlugin("dup"));
        expect(function (): void {
            pm.registerPlugin(new MockPlugin("dup"));
        }).toThrow();
    });

    it("passes the PluginManager instance to install", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let captured: PluginManager | null = null;
        let plugin: MockPlugin = new MockPlugin("capture");
        plugin.install = function (mgr: PluginManager): void {
            captured = mgr;
        };
        pm.registerPlugin(plugin);
        expect(captured).toBe(pm);
    });

    it("newly registered plugins are enabled by default", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("default-enabled");
        pm.registerPlugin(plugin);
        expect(pm.isPluginEnabled("default-enabled")).toBe(true);
        expect(pm.getEnabledPlugins().length).toBe(1);
    });
});

describe("PluginManager.unregisterPlugin", function (): void {
    it("removes the plugin and calls onDisable then uninstall", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("removable");
        pm.registerPlugin(plugin);

        pm.unregisterPlugin("removable");

        expect(plugin.onDisableCalls).toBe(1);
        expect(plugin.uninstallCalls).toBe(1);
        expect(pm.getPlugins().length).toBe(0);
        expect(pm.isPluginEnabled("removable")).toBe(false);
    });

    it("is a no-op for an unknown plugin id", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        expect(function (): void {
            pm.unregisterPlugin("does-not-exist");
        }).not.toThrow();
    });

    it("still removes the plugin even if uninstall throws", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("throwing");
        plugin.uninstall = function (): void {
            throw new Error("boom");
        };
        pm.registerPlugin(plugin);

        pm.unregisterPlugin("throwing");
        expect(pm.getPlugins().length).toBe(0);
    });
});

describe("PluginManager.enablePlugin / disablePlugin", function (): void {
    it("disablePlugin sets enabled=false and calls onDisable", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("toggle");
        pm.registerPlugin(plugin);

        pm.disablePlugin("toggle");

        expect(pm.isPluginEnabled("toggle")).toBe(false);
        expect(plugin.onDisableCalls).toBe(1);
        expect(pm.getEnabledPlugins().length).toBe(0);
    });

    it("enablePlugin sets enabled=true and calls onEnable", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("toggle");
        pm.registerPlugin(plugin);
        pm.disablePlugin("toggle");

        pm.enablePlugin("toggle");

        expect(pm.isPluginEnabled("toggle")).toBe(true);
        expect(plugin.onEnableCalls).toBe(1);
        expect(pm.getEnabledPlugins().length).toBe(1);
    });

    it("enablePlugin is a no-op when already enabled", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("already-on");
        pm.registerPlugin(plugin);

        pm.enablePlugin("already-on");

        expect(plugin.onEnableCalls).toBe(0);
    });

    it("disablePlugin is a no-op when already disabled", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("already-off");
        pm.registerPlugin(plugin);
        pm.disablePlugin("already-off");

        pm.disablePlugin("already-off");

        expect(plugin.onDisableCalls).toBe(1);
    });

    it("enablePlugin and disablePlugin are no-ops for unknown plugins", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        expect(function (): void {
            pm.enablePlugin("ghost");
            pm.disablePlugin("ghost");
        }).not.toThrow();
    });
});

describe("PluginManager.executeHook — beforeCalculation", function (): void {
    it("calls beforeCalculation on enabled plugins and returns the payload", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("before");
        pm.registerPlugin(plugin);

        let inputs: Record<string, unknown> = { a: 1 };
        let payload: { calculatorId: string; inputs: Record<string, unknown> } = { calculatorId: "calc", inputs: inputs };
        let result: unknown = pm.executeHook("beforeCalculation", payload);

        expect(plugin.beforeCalcCalls).toBe(1);
        expect(plugin.lastBeforeCalcId).toBe("calc");
        let returned: { calculatorId: string; inputs: Record<string, unknown> } = result as { calculatorId: string; inputs: Record<string, unknown> };
        expect(returned.calculatorId).toBe("calc");
        expect(returned.inputs).toBe(inputs);
    });

    it("passes modified inputs through when a plugin transforms them", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("modifier");
        plugin.beforeModifier = function (inputs: Record<string, unknown>): Record<string, unknown> {
            inputs["extra"] = true;
            return inputs;
        };
        pm.registerPlugin(plugin);

        let payload: { calculatorId: string; inputs: Record<string, unknown> } = { calculatorId: "c", inputs: { a: 1 } };
        let result: unknown = pm.executeHook("beforeCalculation", payload);
        let returned: { calculatorId: string; inputs: Record<string, unknown> } = result as { calculatorId: string; inputs: Record<string, unknown> };
        expect(returned.inputs["extra"]).toBe(true);
    });

    it("chains transformations across multiple enabled plugins", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let first: MockPlugin = new MockPlugin("first");
        first.beforeModifier = function (inputs: Record<string, unknown>): Record<string, unknown> {
            inputs["order"] = "first";
            return inputs;
        };
        let second: MockPlugin = new MockPlugin("second");
        second.beforeModifier = function (inputs: Record<string, unknown>): Record<string, unknown> {
            inputs["order"] = inputs["order"] + "-second";
            return inputs;
        };
        pm.registerPlugin(first);
        pm.registerPlugin(second);

        let payload: { calculatorId: string; inputs: Record<string, unknown> } = { calculatorId: "c", inputs: {} };
        let result: unknown = pm.executeHook("beforeCalculation", payload);
        let returned: { calculatorId: string; inputs: Record<string, unknown> } = result as { calculatorId: string; inputs: Record<string, unknown> };
        expect(returned.inputs["order"]).toBe("first-second");
    });

    it("does not invoke beforeCalculation on disabled plugins", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("disabled");
        pm.registerPlugin(plugin);
        pm.disablePlugin("disabled");

        pm.executeHook("beforeCalculation", { calculatorId: "c", inputs: {} });

        expect(plugin.beforeCalcCalls).toBe(0);
    });

    it("does not invoke beforeCalculation when the plugin does not implement it", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MinimalPlugin = new MinimalPlugin("no-hooks");
        pm.registerPlugin(plugin);

        let payload: { calculatorId: string; inputs: Record<string, unknown> } = { calculatorId: "c", inputs: { a: 1 } };
        let result: unknown = pm.executeHook("beforeCalculation", payload);
        let returned: { calculatorId: string; inputs: Record<string, unknown> } = result as { calculatorId: string; inputs: Record<string, unknown> };
        expect(returned.inputs["a"]).toBe(1);
    });
});

describe("PluginManager.executeHook — afterCalculation", function (): void {
    it("calls afterCalculation on enabled plugins and returns the payload", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("after");
        pm.registerPlugin(plugin);

        let payload: { calculatorId: string; result: unknown } = { calculatorId: "calc", result: "done" };
        let result: unknown = pm.executeHook("afterCalculation", payload);

        expect(plugin.afterCalcCalls).toBe(1);
        expect(plugin.lastAfterCalcId).toBe("calc");
        expect(plugin.lastAfterResult).toBe("done");
        let returned: { calculatorId: string; result: unknown } = result as { calculatorId: string; result: unknown };
        expect(returned.result).toBe("done");
    });

    it("replaces the result when a plugin returns a new value", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("replacer");
        plugin.afterModifier = function (_result: unknown): unknown {
            return "replaced";
        };
        pm.registerPlugin(plugin);

        let payload: { calculatorId: string; result: unknown } = { calculatorId: "c", result: "original" };
        let result: unknown = pm.executeHook("afterCalculation", payload);
        let returned: { calculatorId: string; result: unknown } = result as { calculatorId: string; result: unknown };
        expect(returned.result).toBe("replaced");
    });

    it("leaves the result unchanged when the plugin returns undefined", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("noop");
        plugin.afterModifier = function (_result: unknown): unknown {
            return undefined;
        };
        pm.registerPlugin(plugin);

        let payload: { calculatorId: string; result: unknown } = { calculatorId: "c", result: "keep" };
        let result: unknown = pm.executeHook("afterCalculation", payload);
        let returned: { calculatorId: string; result: unknown } = result as { calculatorId: string; result: unknown };
        expect(returned.result).toBe("keep");
    });

    it("does not invoke afterCalculation on disabled plugins", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("off");
        pm.registerPlugin(plugin);
        pm.disablePlugin("off");

        pm.executeHook("afterCalculation", { calculatorId: "c", result: "x" });

        expect(plugin.afterCalcCalls).toBe(0);
    });
});

describe("PluginManager.executeHook — onNavigate", function (): void {
    it("calls onNavigate on enabled plugins with the view id", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("nav");
        pm.registerPlugin(plugin);

        let payload: { view: string } = { view: "gas-laws" };
        pm.executeHook("onNavigate", payload);

        expect(plugin.onNavigateCalls).toBe(1);
        expect(plugin.lastNavigateView).toBe("gas-laws");
    });

    it("does not invoke onNavigate on disabled plugins", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("nav-off");
        pm.registerPlugin(plugin);
        pm.disablePlugin("nav-off");

        pm.executeHook("onNavigate", { view: "x" });

        expect(plugin.onNavigateCalls).toBe(0);
    });

    it("returns the payload unchanged", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let payload: { view: string } = { view: "target" };
        let result: unknown = pm.executeHook("onNavigate", payload);
        expect(result).toBe(payload);
    });
});

describe("PluginManager.executeHook — unknown hooks", function (): void {
    it("returns the data unchanged for an unrecognized hook name", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let data: { foo: string } = { foo: "bar" };
        let result: unknown = pm.executeHook("unknownHook", data);
        expect(result).toBe(data);
    });
});

describe("PluginManager storage persistence", function (): void {
    it("saveToStorage writes the enabled state of every registered plugin", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        pm.registerPlugin(new MockPlugin("a"));
        pm.registerPlugin(new MockPlugin("b"));
        pm.disablePlugin("b");

        pm.saveToStorage();

        let raw: string | null = localStorage.getItem(STORAGE_KEY);
        expect(raw).not.toBeNull();
        let parsed: Record<string, boolean> = JSON.parse(raw as string) as Record<string, boolean>;
        expect(parsed["a"]).toBe(true);
        expect(parsed["b"]).toBe(false);
    });

    it("loadFromStorage applies saved state and fires onEnable/onDisable", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("persisted");
        pm.registerPlugin(plugin);

        let saved: Record<string, boolean> = { persisted: false };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

        pm.loadFromStorage();

        expect(pm.isPluginEnabled("persisted")).toBe(false);
        expect(plugin.onDisableCalls).toBe(1);
    });

    it("loadFromStorage re-enables a disabled plugin when storage says enabled", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("revive");
        pm.registerPlugin(plugin);
        pm.disablePlugin("revive");
        expect(plugin.onEnableCalls).toBe(0);

        let saved: Record<string, boolean> = { revive: true };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

        pm.loadFromStorage();

        expect(pm.isPluginEnabled("revive")).toBe(true);
        expect(plugin.onEnableCalls).toBe(1);
    });

    it("loadFromStorage is a no-op when storage is empty", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("unchanged");
        pm.registerPlugin(plugin);

        pm.loadFromStorage();

        expect(pm.isPluginEnabled("unchanged")).toBe(true);
        expect(plugin.onEnableCalls).toBe(0);
        expect(plugin.onDisableCalls).toBe(0);
    });

    it("loadFromStorage silently ignores corrupt JSON", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        pm.registerPlugin(new MockPlugin("corrupt"));
        localStorage.setItem(STORAGE_KEY, "{not json");

        expect(function (): void {
            pm.loadFromStorage();
        }).not.toThrow();
    });

    it("init is idempotent — calling twice does not reload from storage", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("init-test");
        pm.registerPlugin(plugin);

        let saved: Record<string, boolean> = { "init-test": false };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

        pm.init();
        expect(plugin.onDisableCalls).toBe(1);

        pm.init();
        expect(plugin.onDisableCalls).toBe(1);
    });
});

describe("PluginManager validation", function (): void {
    it("throws when manifest.name is empty", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("");
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });

    it("throws when manifest.version is empty", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("v");
        plugin.manifest.version = "";
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });

    it("throws when manifest.author is empty", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("a");
        plugin.manifest.author = "";
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });

    it("throws when permissions contains an invalid value", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("p");
        plugin.manifest.permissions = ["calculator", "superuser"];
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });

    it("throws when lifecycleHooks contains an invalid value", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("h");
        plugin.manifest.lifecycleHooks = ["beforeCalculation", "onRender"];
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });

    it("accepts all valid permissions", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let valid: string[] = PluginManager.getValidPermissions();
        let plugin: MockPlugin = new MockPlugin("all-perms");
        plugin.manifest.permissions = valid;
        pm.registerPlugin(plugin);
        expect(pm.getPlugins().length).toBe(1);
    });

    it("accepts all valid lifecycle hooks", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let valid: string[] = PluginManager.getValidLifecycleHooks();
        let plugin: MockPlugin = new MockPlugin("all-hooks");
        plugin.manifest.lifecycleHooks = valid;
        pm.registerPlugin(plugin);
        expect(pm.getPlugins().length).toBe(1);
    });

    it("throws when install is not a function", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("no-install");
        plugin.install = "not-a-function" as unknown as (pm: PluginManager) => void;
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });

    it("throws when uninstall is not a function", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: MockPlugin = new MockPlugin("no-uninstall");
        plugin.uninstall = 123 as unknown as () => void;
        expect(function (): void {
            pm.registerPlugin(plugin);
        }).toThrow();
    });
});

describe("CrystalStructurePlugin integration", function (): void {
    it("can be registered with the PluginManager", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        expect(pm.getPlugins().length).toBe(1);
        expect(pm.isPluginEnabled("crystal-structure")).toBe(true);
    });

    it("registers its calculator with the CalculatorRegistry on install", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let registered: boolean = CalculatorRegistry.getInstance().getAll().has("crystal-structure");
        expect(registered).toBe(true);
    });

    it("creates a sidebar nav item on install", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let item: HTMLElement | null = document.getElementById("crystal-structure-nav-item");
        expect(item).not.toBeNull();
        let link: HTMLAnchorElement | null = item ? item.querySelector("a") : null;
        expect(link).not.toBeNull();
        if (link) {
            expect(link.getAttribute("href")).toBe("#crystal-structure");
            expect(link.textContent).toBe("Crystal Structure");
        }
    });

    it("creates the calculator view with all input elements on install", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let expectedIds: string[] = [
            "crystal-system",
            "crystal-a",
            "crystal-b",
            "crystal-c",
            "crystal-alpha",
            "crystal-beta",
            "crystal-gamma",
            "crystal-atomic-mass",
            "crystal-z",
            "crystal-structure-result"
        ];
        let i: number;
        for (i = 0; i < expectedIds.length; i++) {
            let el: HTMLElement | null = document.getElementById(expectedIds[i]);
            expect(el).not.toBeNull();
        }
    });

    it("afterCalculation appends metadata only for the crystal-structure calculator", function (): void {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        let own: unknown = plugin.afterCalculation("crystal-structure", "volume: 100");
        expect(own).toBe("volume: 100 — processed by CrystalStructurePlugin");

        let other: unknown = plugin.afterCalculation("gas-laws", "P=1 atm");
        expect(other).toBeUndefined();
    });

    it("afterCalculation returns undefined for non-string results", function (): void {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        let r: unknown = plugin.afterCalculation("crystal-structure", 42);
        expect(r).toBeUndefined();
    });

    it("beforeCalculation returns inputs unchanged", function (): void {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        let inputs: Record<string, unknown> = { "crystal-a": "5" };
        let spy: ReturnType<typeof vi.spyOn> = vi.spyOn(console, "log").mockImplementation(function (): void {});
        let result: Record<string, unknown> = plugin.beforeCalculation("crystal-structure", inputs);
        expect(result).toBe(inputs);
        spy.mockRestore();
    });

    it("uninstall removes the calculator from the registry and cleans up the DOM", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        pm.unregisterPlugin("crystal-structure");

        expect(CalculatorRegistry.getInstance().getAll().has("crystal-structure")).toBe(false);
        expect(document.getElementById("crystal-structure")).toBeNull();
        expect(document.getElementById("crystal-structure-nav-item")).toBeNull();
    });

    it("disabling hides the sidebar item and enabling shows it", function (): void {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let item: HTMLElement = document.getElementById("crystal-structure-nav-item") as HTMLElement;

        pm.disablePlugin("crystal-structure");
        expect(item.style.display).toBe("none");

        pm.enablePlugin("crystal-structure");
        expect(item.style.display).toBe("");
    });
});

describe("CrystalStructureCalculator calculations", function (): void {
    it("computes cubic unit cell volume (a=5 -> V=125)", async function (): Promise<void> {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let systemSelect: HTMLSelectElement = document.getElementById("crystal-system") as HTMLSelectElement;
        systemSelect.value = "cubic";
        let aInput: HTMLInputElement = document.getElementById("crystal-a") as HTMLInputElement;
        aInput.value = "5";

        let calc: { calculate: () => void } = CalculatorRegistry.getInstance().get("crystal-structure") as unknown as { calculate: () => void };
        await calc.calculate();

        let resultEl: HTMLElement = document.getElementById("crystal-structure-result") as HTMLElement;
        let text: string = (resultEl.textContent || "").trim();
        expect(text).toContain("125");
        expect(text).toContain("Å³");
        expect(text).toContain("Packing fraction");
        expect(text).toContain("processed by CrystalStructurePlugin");
    });

    it("computes density when atomic mass and Z are provided", async function (): Promise<void> {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let systemSelect: HTMLSelectElement = document.getElementById("crystal-system") as HTMLSelectElement;
        systemSelect.value = "cubic";
        let aInput: HTMLInputElement = document.getElementById("crystal-a") as HTMLInputElement;
        aInput.value = "4.05";
        let massInput: HTMLInputElement = document.getElementById("crystal-atomic-mass") as HTMLInputElement;
        massInput.value = "26.98";
        let zInput: HTMLInputElement = document.getElementById("crystal-z") as HTMLInputElement;
        zInput.value = "4";

        let calc: { calculate: () => void } = CalculatorRegistry.getInstance().get("crystal-structure") as unknown as { calculate: () => void };
        await calc.calculate();

        let resultEl: HTMLElement = document.getElementById("crystal-structure-result") as HTMLElement;
        let text: string = (resultEl.textContent || "").trim();
        expect(text).toContain("Density");
        expect(text).toContain("g/cm³");
    });

    it("shows an error when required lattice parameter is missing", async function (): Promise<void> {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);

        let systemSelect: HTMLSelectElement = document.getElementById("crystal-system") as HTMLSelectElement;
        systemSelect.value = "cubic";
        let aInput: HTMLInputElement = document.getElementById("crystal-a") as HTMLInputElement;
        aInput.value = "";

        let calc: { calculate: () => void } = CalculatorRegistry.getInstance().get("crystal-structure") as unknown as { calculate: () => void };
        await calc.calculate();

        let resultEl: HTMLElement = document.getElementById("crystal-structure-result") as HTMLElement;
        let text: string = (resultEl.textContent || "").trim();
        expect(text).toContain("Error");
    });

    it("does not append plugin metadata when the plugin is disabled", async function (): Promise<void> {
        let pm: PluginManager = PluginManager.getInstance();
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        pm.registerPlugin(plugin);
        pm.disablePlugin("crystal-structure");

        let systemSelect: HTMLSelectElement = document.getElementById("crystal-system") as HTMLSelectElement;
        systemSelect.value = "cubic";
        let aInput: HTMLInputElement = document.getElementById("crystal-a") as HTMLInputElement;
        aInput.value = "5";

        let calc: { calculate: () => void } = CalculatorRegistry.getInstance().get("crystal-structure") as unknown as { calculate: () => void };
        await calc.calculate();

        let resultEl: HTMLElement = document.getElementById("crystal-structure-result") as HTMLElement;
        let text: string = (resultEl.textContent || "").trim();
        expect(text).not.toContain("processed by CrystalStructurePlugin");
    });
});
