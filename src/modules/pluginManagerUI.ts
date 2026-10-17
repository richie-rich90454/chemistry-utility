import { Plugin, PluginManager } from "./pluginManager.js";
import { HtmlSanitizer } from "./htmlSanitizer.js";

const MODAL_ID: string = "plugin-manager-modal";
const MODAL_LIST_CLASS: string = "plugin-manager-list";
const TRIGGER_ID: string = "plugin-manager-trigger";

/**
 * Singleton UI controller that renders the Plugin Manager panel. Mounts a
 * trigger button in the sidebar footer and shows a modal listing every
 * registered plugin with enable/disable toggles, permissions, lifecycle
 * hooks, and uninstall buttons. The list is re-rendered each time the
 * modal opens so it always reflects the current PluginManager state.
 */
export class PluginManagerUI {
    private static instance: PluginManagerUI | null;
    private modal: HTMLElement | null;

    private constructor() {
        this.modal = null;
    }

    /** Returns the singleton UI instance, creating it on first access. */
    public static getInstance(): PluginManagerUI {
        if (!PluginManagerUI.instance) {
            PluginManagerUI.instance = new PluginManagerUI();
        }
        return PluginManagerUI.instance;
    }

    /** Tears down the singleton, removing the trigger and modal from the DOM. */
    public static resetInstance(): void {
        if (PluginManagerUI.instance) {
            PluginManagerUI.instance.destroy();
        }
        PluginManagerUI.instance = null;
    }

    /**
     * Installs the "Plugins" trigger button into the sidebar footer. Safe to
     * call multiple times; subsequent calls are no-ops once the trigger exists.
     */
    public mount(): void {
        this.ensureTrigger();
    }

    /** Opens the plugin manager modal, refreshing the plugin list. */
    public open(): void {
        this.modal = this.ensureModal();
        this.renderPluginList();
        this.modal.classList.add("open");
    }

    /** Closes the plugin manager modal. */
    public close(): void {
        if (this.modal) {
            this.modal.classList.remove("open");
        }
    }

    /** Returns true when the modal is currently open. */
    public isOpen(): boolean {
        if (!this.modal) {
            return false;
        }
        return this.modal.classList.contains("open");
    }

    /** Removes the trigger button and modal from the DOM. */
    public destroy(): void {
        let trigger: HTMLElement | null = document.getElementById(TRIGGER_ID);
        if (trigger && trigger.parentNode) {
            trigger.parentNode.removeChild(trigger);
        }
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
    }

    private ensureTrigger(): void {
        if (document.getElementById(TRIGGER_ID)) {
            return;
        }
        let footer: HTMLElement | null = document.querySelector(".sidebar-footer") as HTMLElement | null;
        if (!footer) {
            return;
        }
        let button: HTMLButtonElement = document.createElement("button");
        button.id = TRIGGER_ID;
        button.className = "plugin-manager-trigger";
        button.type = "button";
        button.textContent = "Plugins";
        let self: PluginManagerUI = this;
        button.addEventListener("click", function (): void {
            self.open();
        });
        footer.appendChild(button);
    }

    /**
     * Returns the modal element, creating it on first use. Both paths are
     * exercised (first open creates, later opens reuse).
     */
    private ensureModal(): HTMLElement {
        if (this.modal) {
            return this.modal;
        }
        let modal: HTMLDivElement = document.createElement("div");
        modal.id = MODAL_ID;
        modal.className = "plugin-manager-modal";
        modal.innerHTML =
            '<div class="plugin-manager-modal-content">' +
            '<div class="plugin-manager-modal-header">' +
            '<h2>Plugin Manager</h2>' +
            '<button class="plugin-manager-close" type="button">Close</button>' +
            "</div>" +
            '<div class="' + MODAL_LIST_CLASS + '"></div>' +
            "</div>";
        document.body.appendChild(modal);
        this.modal = modal;
        let self: PluginManagerUI = this;
        // The template above always includes the close button.
        let closeBtn: HTMLElement = modal.querySelector(".plugin-manager-close") as HTMLElement;
        closeBtn.addEventListener("click", function (): void {
            self.close();
        });
        modal.addEventListener("click", function (e: MouseEvent): void {
            if (e.target === modal) {
                self.close();
            }
        });
        return modal;
    }

    private renderPluginList(): void {
        // Callers (open, uninstall handler) only run with a live modal, and
        // the template always includes the list container.
        let modal: HTMLElement = this.modal as HTMLElement;
        let list: HTMLElement = modal.querySelector("." + MODAL_LIST_CLASS) as HTMLElement;
        list.innerHTML = "";
        let pm: PluginManager = PluginManager.getInstance();
        let plugins: Plugin[] = pm.getPlugins();
        if (plugins.length === 0) {
            list.innerHTML = "<p>No plugins registered.</p>";
            return;
        }
        let self: PluginManagerUI = this;
        let i: number;
        for (i = 0; i < plugins.length; i++) {
            let plugin: Plugin = plugins[i];
            let enabled: boolean = pm.isPluginEnabled(plugin.manifest.name);
            let card: HTMLDivElement = document.createElement("div");
            card.className = "plugin-card";
            card.innerHTML =
                '<div class="plugin-card-header">' +
                '<div><strong>' + HtmlSanitizer.escape(plugin.manifest.name) + '</strong> <span class="plugin-version">v' + HtmlSanitizer.escape(plugin.manifest.version) + '</span></div>' +
                '<div class="plugin-card-author">by ' + HtmlSanitizer.escape(plugin.manifest.author) + '</div>' +
                "</div>" +
                '<p class="plugin-card-desc">' + HtmlSanitizer.escape(plugin.manifest.description) + '</p>' +
                '<div class="plugin-card-permissions">Permissions: ' + HtmlSanitizer.escape(plugin.manifest.permissions.join(", ")) + '</div>' +
                '<div class="plugin-card-hooks">Hooks: ' + HtmlSanitizer.escape(plugin.manifest.lifecycleHooks.join(", ")) + '</div>' +
                '<div class="plugin-card-actions">' +
                '<label class="plugin-toggle-label"><input type="checkbox" class="plugin-toggle"' + (enabled ? " checked" : "") + '> Enabled</label>' +
                '<button class="plugin-uninstall" type="button">Uninstall</button>' +
                "</div>";
            list.appendChild(card);
            // The card template always renders the toggle and button below.
            let toggle: HTMLInputElement = card.querySelector(".plugin-toggle") as HTMLInputElement;
            let pluginToggleId: string = plugin.manifest.name;
            toggle.addEventListener("change", function (): void {
                if (toggle.checked) {
                    pm.enablePlugin(pluginToggleId);
                } else {
                    pm.disablePlugin(pluginToggleId);
                }
            });
            let uninstallBtn: HTMLButtonElement = card.querySelector(".plugin-uninstall") as HTMLButtonElement;
            let pluginUninstallId: string = plugin.manifest.name;
            uninstallBtn.addEventListener("click", function (): void {
                pm.unregisterPlugin(pluginUninstallId);
                self.renderPluginList();
            });
        }
    }
}
