import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import type {Plugin, PluginManifest} from "../../modules/pluginManager.js";
interface PluginEntry {
    plugin: Plugin;
    enabled: boolean;
}
const mocks = vi.hoisted(function () {
    return {
        "mockPlugins": vi.fn(),
        "mockLoadPlugins": vi.fn(),
        "mockTogglePlugin": vi.fn(),
        "mockUninstallPlugin": vi.fn()
    };
});
vi.mock("../stores/pluginManager", function () {
    return {
        "usePluginManager": function (): {
            "plugins": () => PluginEntry[];
            "loadPlugins": () => void;
            "togglePlugin": (pluginId: string) => void;
            "uninstallPlugin": (pluginId: string) => void;
        } {
            return {
                "plugins": mocks.mockPlugins,
                "loadPlugins": mocks.mockLoadPlugins,
                "togglePlugin": mocks.mockTogglePlugin,
                "uninstallPlugin": mocks.mockUninstallPlugin
            };
        }
    };
});
import {PluginManagerPanel} from "./PluginManagerPanel";
function makeManifest(name: string, version: string, description: string): PluginManifest {
    return {
        name: name,
        version: version,
        author: "Test Author",
        description: description,
        permissions: ["calculator"],
        lifecycleHooks: ["beforeCalculation"]
    };
}
function makeEntry(name: string, enabled: boolean): PluginEntry {
    return {
        plugin: {
            manifest: makeManifest(name, "1.0.0", name + " description"),
            install: function (): void {},
            uninstall: function (): void {}
        },
        enabled: enabled
    };
}
function renderPanel(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return <PluginManagerPanel />;
    });
}
describe("PluginManagerPanel", function (): void {
    beforeEach(function (): void {
        mocks.mockPlugins.mockReset();
        mocks.mockLoadPlugins.mockReset();
        mocks.mockTogglePlugin.mockReset();
        mocks.mockUninstallPlugin.mockReset();
        mocks.mockPlugins.mockReturnValue([]);
        mocks.mockLoadPlugins.mockReturnValue(undefined);
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders the Plugins trigger button", function (): void {
        let result = renderPanel();
        expect(result.getByRole("button", {"name": "Plugins"})).toBeTruthy();
    });
    it("calls loadPlugins on mount", function (): void {
        renderPanel();
        expect(mocks.mockLoadPlugins).toHaveBeenCalled();
    });
    it("does not render the modal when trigger is not clicked", function (): void {
        let result = renderPanel();
        expect(result.queryByRole("dialog")).toBeNull();
    });
    it("opens the modal when Plugins button is clicked", function (): void {
        let result = renderPanel();
        let button = result.getByRole("button", {"name": "Plugins"});
        fireEvent.click(button);
        expect(result.getByRole("dialog")).toBeTruthy();
        expect(result.getByText("Plugin Manager")).toBeTruthy();
    });
    it("renders empty state when no plugins are registered", function (): void {
        mocks.mockPlugins.mockReturnValue([]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        expect(result.getByText("No plugins registered.")).toBeTruthy();
    });
    it("renders plugin entries with name, version, and description", function (): void {
        mocks.mockPlugins.mockReturnValue([
            makeEntry("alpha", true),
            makeEntry("beta", false)
        ]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        expect(result.getByText("alpha")).toBeTruthy();
        expect(result.getByText("beta")).toBeTruthy();
        expect(result.getAllByText("v1.0.0").length).toBe(2);
        expect(result.getByText("alpha description")).toBeTruthy();
        expect(result.getByText("beta description")).toBeTruthy();
    });
    it("renders permissions and hooks when present", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        expect(result.getByText(/Permissions:/)).toBeTruthy();
        expect(result.getByText(/Hooks:/)).toBeTruthy();
    });
    it("calls togglePlugin when the enable checkbox is toggled", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let toggle = result.container.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(toggle).toBeTruthy();
        fireEvent.change(toggle);
        expect(mocks.mockTogglePlugin).toHaveBeenCalledWith("alpha");
    });
    it("calls uninstallPlugin when the Uninstall button is clicked", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let uninstallButton = result.getByRole("button", {"name": "Uninstall"});
        fireEvent.click(uninstallButton);
        expect(mocks.mockUninstallPlugin).toHaveBeenCalledWith("alpha");
    });
    it("closes the modal when the close button is clicked", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let closeButton = result.getByRole("button", {"name": "Close plugin manager"});
        fireEvent.click(closeButton);
        expect(result.queryByRole("dialog")).toBeNull();
    });
    it("closes the modal when the backdrop is clicked", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let dialog = result.getByRole("dialog");
        fireEvent.click(dialog);
        expect(result.queryByRole("dialog")).toBeNull();
    });
    it("does not close the modal when content is clicked", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let heading = result.getByText("Plugin Manager");
        fireEvent.click(heading);
        expect(result.getByRole("dialog")).toBeTruthy();
    });
    it("reflects enabled state on the checkbox", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let toggle = result.container.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(toggle.checked).toBe(true);
    });
    it("reflects disabled state on the checkbox", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", false)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let toggle = result.container.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(toggle.checked).toBe(false);
    });
    it("closes the modal when Escape is pressed while open", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        expect(result.getByRole("dialog")).toBeTruthy();
        window.dispatchEvent(new KeyboardEvent("keydown", {"key": "Escape", "bubbles": true}));
        expect(result.queryByRole("dialog")).toBeNull();
    });
    it("does not close the modal when a non-Escape key is pressed", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        window.dispatchEvent(new KeyboardEvent("keydown", {"key": "Enter", "bubbles": true}));
        expect(result.getByRole("dialog")).toBeTruthy();
    });
    it("does not call togglePlugin when the checkbox has no plugin id", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let toggle = result.container.querySelector('input[type="checkbox"]') as HTMLInputElement;
        toggle.removeAttribute("data-plugin-id");
        fireEvent.change(toggle);
        expect(mocks.mockTogglePlugin).not.toHaveBeenCalled();
    });
    it("does not call uninstallPlugin when the button has no plugin id", function (): void {
        mocks.mockPlugins.mockReturnValue([makeEntry("alpha", true)]);
        let result = renderPanel();
        fireEvent.click(result.getByRole("button", {"name": "Plugins"}));
        let uninstallButton = result.getByRole("button", {"name": "Uninstall"});
        uninstallButton.removeAttribute("data-plugin-id");
        fireEvent.click(uninstallButton);
        expect(mocks.mockUninstallPlugin).not.toHaveBeenCalled();
    });
});
