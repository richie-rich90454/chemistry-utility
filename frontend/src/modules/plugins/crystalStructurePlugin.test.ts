import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CrystalStructureCalculator, CrystalStructurePlugin } from "./crystalStructurePlugin.js";
import { CalculatorRegistry } from "../calculatorRegistry.js";
import { PluginManager } from "../pluginManager.js";

const INPUT_IDS: string[] = [
    "crystal-a",
    "crystal-b",
    "crystal-c",
    "crystal-alpha",
    "crystal-beta",
    "crystal-gamma",
    "crystal-atomic-mass",
    "crystal-z",
];

function setupCalculatorDOM(system: string, values: Record<string, string>, lattice: string | null): void {
    document.body.innerHTML = "";
    let systemInput: HTMLInputElement = document.createElement("input");
    systemInput.id = "crystal-system";
    systemInput.value = system;
    document.body.appendChild(systemInput);
    if (lattice !== null) {
        let latticeSelect: HTMLSelectElement = document.createElement("select");
        latticeSelect.id = "crystal-lattice";
        for (let option of ["", "sc", "bcc", "fcc", "hcp"]) {
            let opt: HTMLOptionElement = document.createElement("option");
            opt.value = option;
            latticeSelect.appendChild(opt);
        }
        latticeSelect.value = lattice;
        document.body.appendChild(latticeSelect);
    }
    for (let id of INPUT_IDS) {
        let input: HTMLInputElement = document.createElement("input");
        input.id = id;
        input.value = values[id] ?? "";
        document.body.appendChild(input);
    }
    let result: HTMLDivElement = document.createElement("div");
    result.id = "crystal-structure-result";
    document.body.appendChild(result);
}

function cubicValues(overrides: Record<string, string> = {}): Record<string, string> {
    return {
        "crystal-a": "4",
        "crystal-b": "4",
        "crystal-c": "4",
        "crystal-alpha": "90",
        "crystal-beta": "90",
        "crystal-gamma": "90",
        "crystal-atomic-mass": "55.845",
        "crystal-z": "4",
        ...overrides,
    };
}

async function calculateHTML(): Promise<string> {
    let calc: CrystalStructureCalculator = new CrystalStructureCalculator();
    await calc.calculate();
    return document.getElementById("crystal-structure-result")!.innerHTML;
}

describe("CrystalStructureCalculator", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CalculatorRegistry.getInstance().clear();
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = "";
        CalculatorRegistry.getInstance().clear();
        vi.restoreAllMocks();
    });

    it("computes cubic sc volume, packing and density", async () => {
        setupCalculatorDOM("cubic", cubicValues(), "sc");
        let html: string = await calculateHTML();
        expect(html).toContain("Unit cell volume");
        expect(html).toContain("64.0000");
        expect(html).toContain("0.5236");
        expect(html).toContain("Density");
    });

    it("computes cubic bcc packing", async () => {
        setupCalculatorDOM("cubic", cubicValues(), "bcc");
        expect(await calculateHTML()).toContain("0.6802");
    });

    it("computes cubic fcc packing", async () => {
        setupCalculatorDOM("cubic", cubicValues(), "fcc");
        expect(await calculateHTML()).toContain("0.7405");
    });

    it("omits density without mass and Z", async () => {
        setupCalculatorDOM("cubic", cubicValues({ "crystal-atomic-mass": "", "crystal-z": "" }), "sc");
        let html: string = await calculateHTML();
        expect(html).toContain("Packing fraction: 0.5236");
        expect(html).not.toContain("Density");
    });

    it("omits density for non-positive mass or Z", async () => {
        setupCalculatorDOM("cubic", cubicValues({ "crystal-atomic-mass": "0", "crystal-z": "4" }), "sc");
        expect(await calculateHTML()).not.toContain("Density");
        setupCalculatorDOM("cubic", cubicValues({ "crystal-atomic-mass": "55.845", "crystal-z": "-1" }), "sc");
        expect(await calculateHTML()).not.toContain("Density");
    });

    it("computes tetragonal volume without packing", async () => {
        setupCalculatorDOM("tetragonal", { ...cubicValues(), "crystal-a": "3", "crystal-c": "5" }, "sc");
        let html: string = await calculateHTML();
        expect(html).toContain("45.0000");
        expect(html).toContain("requires a cubic system");
    });

    it("computes orthorhombic volume", async () => {
        setupCalculatorDOM(
            "orthorhombic",
            { ...cubicValues(), "crystal-a": "2", "crystal-b": "3", "crystal-c": "4" },
            "",
        );
        expect(await calculateHTML()).toContain("24.0000");
    });

    it("computes hexagonal volume", async () => {
        setupCalculatorDOM("hexagonal", { ...cubicValues(), "crystal-a": "3", "crystal-c": "5" }, "");
        let html: string = await calculateHTML();
        expect(html).toContain("Unit cell volume");
        expect(html).toContain("requires a cubic system");
    });

    it("supports unconstrained systems and clamps negative volumes", async () => {
        setupCalculatorDOM(
            "triclinic",
            {
                "crystal-a": "2",
                "crystal-b": "2",
                "crystal-c": "2",
                "crystal-alpha": "10",
                "crystal-beta": "10",
                "crystal-gamma": "150",
                "crystal-atomic-mass": "",
                "crystal-z": "",
            },
            "",
        );
        expect(await calculateHTML()).toContain("0.0000");
    });

    it("reports validation errors", async () => {
        setupCalculatorDOM("cubic", cubicValues({ "crystal-a": "" }), "sc");
        let html: string = await calculateHTML();
        expect(html).toContain("Error");
    });

    it("treats unknown lattice values as absent", async () => {
        setupCalculatorDOM("cubic", cubicValues(), "hcp");
        expect(await calculateHTML()).toContain("requires a cubic system");
    });

    it("treats a missing lattice element as absent", async () => {
        setupCalculatorDOM("cubic", cubicValues(), null);
        expect(await calculateHTML()).toContain("requires a cubic system");
    });

    it("reads lattice type from a text input case-insensitively", async () => {
        setupCalculatorDOM("cubic", cubicValues(), null);
        let input: HTMLInputElement = document.createElement("input");
        input.id = "crystal-lattice";
        input.value = "BCC";
        document.body.appendChild(input);
        expect(await calculateHTML()).toContain("0.6802");
    });
});

describe("CrystalStructurePlugin", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        CalculatorRegistry.getInstance().clear();
        PluginManager.resetInstance();
        let main: HTMLElement = document.createElement("div");
        main.id = "main-content";
        document.body.appendChild(main);
        let nav: HTMLElement = document.createElement("nav");
        nav.className = "sidebar-nav";
        nav.innerHTML = "<ul></ul>";
        document.body.appendChild(nav);
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = "";
        CalculatorRegistry.getInstance().clear();
        PluginManager.resetInstance();
        vi.restoreAllMocks();
    });

    it("exposes its manifest", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        expect(plugin.manifest.name).toBe("crystal-structure");
        expect(plugin.manifest.permissions).toContain("calculator");
    });

    it("install creates the view, registers the calculator and adds navigation", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        plugin.install(PluginManager.getInstance());
        expect(document.getElementById("crystal-structure")).not.toBeNull();
        expect(CalculatorRegistry.getInstance().get("crystal-structure")).not.toBeUndefined();
        expect(document.getElementById("crystal-structure-nav-item")).not.toBeNull();
    });

    it("install is idempotent for existing view and nav item", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        plugin.install(PluginManager.getInstance());
        plugin.install(PluginManager.getInstance());
        expect(document.querySelectorAll("#crystal-structure").length).toBe(1);
    });

    it("install falls back to body without main content or nav", () => {
        document.body.innerHTML = "";
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        plugin.install(PluginManager.getInstance());
        expect(document.getElementById("crystal-structure")).not.toBeNull();
        plugin.uninstall();
        expect(document.getElementById("crystal-structure")).toBeNull();
    });

    it("uninstall removes contributions and clears the calculator", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        plugin.install(PluginManager.getInstance());
        plugin.uninstall();
        expect(CalculatorRegistry.getInstance().get("crystal-structure")).toBeUndefined();
        expect(document.getElementById("crystal-structure-nav-item")).toBeNull();
        expect(document.getElementById("crystal-structure")).toBeNull();
        expect(() => plugin.uninstall()).not.toThrow();
    });

    it("toggles the sidebar item visibility", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        plugin.onEnable();
        plugin.onDisable();
        plugin.install(PluginManager.getInstance());
        plugin.onDisable();
        expect(document.getElementById("crystal-structure-nav-item")!.style.display).toBe("none");
        plugin.onEnable();
        expect(document.getElementById("crystal-structure-nav-item")!.style.display).toBe("");
    });

    it("passes through beforeCalculation with logging for its calculator", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        let inputs: Record<string, unknown> = { a: "1" };
        expect(plugin.beforeCalculation("crystal-structure", inputs)).toBe(inputs);
        expect(plugin.beforeCalculation("other", inputs)).toBe(inputs);
    });

    it("appends metadata in afterCalculation for string results", () => {
        let plugin: CrystalStructurePlugin = new CrystalStructurePlugin();
        expect(plugin.afterCalculation("other", "x")).toBeUndefined();
        expect(plugin.afterCalculation("crystal-structure", 42)).toBeUndefined();
        expect(plugin.afterCalculation("crystal-structure", "done")).toContain("CrystalStructurePlugin");
    });
});
