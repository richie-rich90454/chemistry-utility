import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PluginManagerUI } from "./pluginManagerUI.js";
import { PluginManager, Plugin } from "./pluginManager.js";

function makePlugin(name: string): Plugin {
    return {
        manifest: {
            name,
            version: "2.1.0",
            author: "Tester",
            description: "A test plugin",
            permissions: ["calculator"],
            lifecycleHooks: ["beforeCalculation"],
        },
        install: (): void => {},
        uninstall: (): void => {},
    };
}

function addFooter(): HTMLElement {
    let footer: HTMLElement = document.createElement("div");
    footer.className = "sidebar-footer";
    document.body.appendChild(footer);
    return footer;
}

describe("PluginManagerUI", () => {
    beforeEach(() => {
        PluginManagerUI.resetInstance();
        PluginManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });

    afterEach(() => {
        PluginManagerUI.resetInstance();
        PluginManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });

    it("returns the same singleton instance", () => {
        expect(PluginManagerUI.getInstance()).toBe(PluginManagerUI.getInstance());
    });

    it("resetInstance clears the singleton", () => {
        let first: PluginManagerUI = PluginManagerUI.getInstance();
        PluginManagerUI.resetInstance();
        expect(PluginManagerUI.getInstance()).not.toBe(first);
    });

    it("isOpen is false before the modal exists", () => {
        expect(PluginManagerUI.getInstance().isOpen()).toBe(false);
    });

    it("close without a modal does not throw", () => {
        expect(() => PluginManagerUI.getInstance().close()).not.toThrow();
    });

    it("destroy without mount does not throw", () => {
        expect(() => PluginManagerUI.getInstance().destroy()).not.toThrow();
    });

    it("mount without a sidebar footer creates no trigger", () => {
        PluginManagerUI.getInstance().mount();
        expect(document.getElementById("plugin-manager-trigger")).toBeNull();
    });

    it("mount creates a trigger button in the footer", () => {
        addFooter();
        PluginManagerUI.getInstance().mount();
        let trigger: HTMLElement | null = document.getElementById("plugin-manager-trigger");
        expect(trigger).not.toBeNull();
        expect(trigger!.textContent).toBe("Plugins");
    });

    it("mount is idempotent", () => {
        addFooter();
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.mount();
        ui.mount();
        expect(document.querySelectorAll("#plugin-manager-trigger").length).toBe(1);
    });

    it("trigger click opens the modal", () => {
        addFooter();
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.mount();
        (document.getElementById("plugin-manager-trigger") as HTMLButtonElement).click();
        expect(ui.isOpen()).toBe(true);
    });

    it("open renders the empty message with no plugins", () => {
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.open();
        expect(ui.isOpen()).toBe(true);
        expect(document.querySelector(".plugin-manager-list")!.innerHTML).toContain("No plugins");
    });

    it("open twice reuses the modal", () => {
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.open();
        ui.open();
        expect(document.querySelectorAll("#plugin-manager-modal").length).toBe(1);
        expect(ui.isOpen()).toBe(true);
    });

    it("close button closes the modal", () => {
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.open();
        (document.querySelector(".plugin-manager-close") as HTMLButtonElement).click();
        expect(ui.isOpen()).toBe(false);
    });

    it("backdrop click closes but content click does not", () => {
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.open();
        let modal: HTMLElement = document.getElementById("plugin-manager-modal")!;
        (document.querySelector(".plugin-manager-modal-content") as HTMLElement).click();
        expect(ui.isOpen()).toBe(true);
        modal.click();
        expect(ui.isOpen()).toBe(false);
    });

    it("lists registered plugins with sanitized content", () => {
        PluginManager.getInstance().registerPlugin(makePlugin("<b>evil</b>"));
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.open();
        let html: string = document.querySelector(".plugin-manager-list")!.innerHTML;
        expect(html).not.toContain("<b>evil</b>");
        expect(html).toContain("Uninstall");
        expect(html).toContain("checked");
    });

    it("renders unchecked toggles for disabled plugins", () => {
        let pm: PluginManager = PluginManager.getInstance();
        pm.registerPlugin(makePlugin("plug-a"));
        pm.disablePlugin("plug-a");
        PluginManagerUI.getInstance().open();
        let toggle: HTMLInputElement = document.querySelector(".plugin-toggle") as HTMLInputElement;
        expect(toggle.checked).toBe(false);
    });

    it("toggle change enables and disables the plugin", () => {
        let pm: PluginManager = PluginManager.getInstance();
        pm.registerPlugin(makePlugin("plug-a"));
        pm.disablePlugin("plug-a");
        PluginManagerUI.getInstance().open();
        let toggle: HTMLInputElement = document.querySelector(".plugin-toggle") as HTMLInputElement;
        toggle.checked = true;
        toggle.dispatchEvent(new Event("change", { bubbles: true }));
        expect(pm.isPluginEnabled("plug-a")).toBe(true);
        toggle.checked = false;
        toggle.dispatchEvent(new Event("change", { bubbles: true }));
        expect(pm.isPluginEnabled("plug-a")).toBe(false);
    });

    it("uninstall button removes the plugin and re-renders", () => {
        PluginManager.getInstance().registerPlugin(makePlugin("plug-a"));
        PluginManagerUI.getInstance().open();
        (document.querySelector(".plugin-uninstall") as HTMLButtonElement).click();
        expect(PluginManager.getInstance().getPlugins().length).toBe(0);
        expect(document.querySelector(".plugin-manager-list")!.innerHTML).toContain("No plugins");
    });

    it("destroy removes the trigger and modal", () => {
        addFooter();
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.mount();
        ui.open();
        ui.destroy();
        expect(document.getElementById("plugin-manager-trigger")).toBeNull();
        expect(document.getElementById("plugin-manager-modal")).toBeNull();
        expect(ui.isOpen()).toBe(false);
    });

    it("destroy handles detached nodes", () => {
        addFooter();
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.mount();
        ui.open();
        document.getElementById("plugin-manager-trigger")!.remove();
        document.getElementById("plugin-manager-modal")!.remove();
        expect(() => ui.destroy()).not.toThrow();
    });

    it("resetInstance destroys the ui", () => {
        addFooter();
        let ui: PluginManagerUI = PluginManagerUI.getInstance();
        ui.mount();
        ui.open();
        PluginManagerUI.resetInstance();
        expect(document.getElementById("plugin-manager-modal")).toBeNull();
    });
});
