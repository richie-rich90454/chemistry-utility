import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InteractivePTable, CATEGORY_CLASS_MAP } from "./interactivePTable.js";
import { ChemicalElement } from "../types.js";

function makeElement(overrides: {
    "atomicNumber": number;
    "symbol": string;
    "name": string;
    "type": string;
    "group": number | null;
    "period": number;
    "atomicMass"?: number;
    "electronegativity"?: number | null;
    "atomicRadius"?: number | null;
    "ionizationEnergy"?: number | null;
    "valenceElectrons"?: number;
    "totalElectrons"?: number;
}): ChemicalElement {
    let base: Record<string, unknown> = {
        "symbol": overrides.symbol,
        "name": overrides.name,
        "atomicMass": overrides.atomicMass === undefined ? 1.00 : overrides.atomicMass,
        "atomicNumber": overrides.atomicNumber,
        "electronegativity": overrides.electronegativity === undefined ? null : overrides.electronegativity,
        "electronAffinity": null,
        "atomicRadius": overrides.atomicRadius === undefined ? null : overrides.atomicRadius,
        "ionizationEnergy": overrides.ionizationEnergy === undefined ? null : overrides.ionizationEnergy,
        "valenceElectrons": overrides.valenceElectrons === undefined ? 1 : overrides.valenceElectrons,
        "totalElectrons": overrides.totalElectrons === undefined ? overrides.atomicNumber : overrides.totalElectrons,
        "group": overrides.group,
        "period": overrides.period,
        "type": overrides.type
    };
    return base as unknown as ChemicalElement;
}

const SAMPLE_ELEMENTS: ChemicalElement[] = [
    makeElement({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008, "electronegativity": 2.20, "atomicRadius": 53, "ionizationEnergy": 1312, "valenceElectrons": 1, "totalElectrons": 1 }),
    makeElement({ "atomicNumber": 2, "symbol": "He", "name": "Helium", "type": "noble gas", "group": 18, "period": 1, "atomicMass": 4.003, "electronegativity": null, "atomicRadius": 31, "ionizationEnergy": 2372, "valenceElectrons": 2, "totalElectrons": 2 }),
    makeElement({ "atomicNumber": 3, "symbol": "Li", "name": "Lithium", "type": "alkali metal", "group": 1, "period": 2, "atomicMass": 6.94, "electronegativity": 0.98, "atomicRadius": 167, "ionizationEnergy": 520, "valenceElectrons": 1, "totalElectrons": 3 }),
    makeElement({ "atomicNumber": 4, "symbol": "Be", "name": "Beryllium", "type": "alkaline earth metal", "group": 2, "period": 2, "atomicMass": 9.012, "electronegativity": 1.57, "atomicRadius": 112, "ionizationEnergy": 899, "valenceElectrons": 2, "totalElectrons": 4 }),
    makeElement({ "atomicNumber": 26, "symbol": "Fe", "name": "Iron", "type": "transition metal", "group": 8, "period": 4, "atomicMass": 55.845, "electronegativity": 1.83, "atomicRadius": 126, "ionizationEnergy": 762, "valenceElectrons": 2, "totalElectrons": 26 }),
    makeElement({ "atomicNumber": 13, "symbol": "Al", "name": "Aluminum", "type": "post-transition metal", "group": 13, "period": 3, "atomicMass": 26.982, "electronegativity": 1.61, "atomicRadius": 143, "ionizationEnergy": 577, "valenceElectrons": 3, "totalElectrons": 13 }),
    makeElement({ "atomicNumber": 14, "symbol": "Si", "name": "Silicon", "type": "metalloid", "group": 14, "period": 3, "atomicMass": 28.085, "electronegativity": 1.90, "atomicRadius": 132, "ionizationEnergy": 786, "valenceElectrons": 4, "totalElectrons": 14 }),
    makeElement({ "atomicNumber": 17, "symbol": "Cl", "name": "Chlorine", "type": "halogen", "group": 17, "period": 3, "atomicMass": 35.45, "electronegativity": 3.16, "atomicRadius": 99, "ionizationEnergy": 1251, "valenceElectrons": 7, "totalElectrons": 17 }),
    makeElement({ "atomicNumber": 57, "symbol": "La", "name": "Lanthanum", "type": "lanthanide", "group": null, "period": 6, "atomicMass": 138.905, "electronegativity": 1.10, "atomicRadius": 187, "ionizationEnergy": 538, "valenceElectrons": 3, "totalElectrons": 57 }),
    makeElement({ "atomicNumber": 89, "symbol": "Ac", "name": "Actinium", "type": "actinide", "group": null, "period": 7, "atomicMass": 227.0, "electronegativity": 1.10, "atomicRadius": 195, "ionizationEnergy": 499, "valenceElectrons": 3, "totalElectrons": 89 })
];

describe("InteractivePTable singleton", function () {
    beforeEach(function () {
        InteractivePTable.resetInstance();
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
    });

    it("getInstance returns an InteractivePTable instance", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        expect(instance).toBeInstanceOf(InteractivePTable);
    });

    it("getInstance returns the same instance on subsequent calls", function () {
        let a: InteractivePTable = InteractivePTable.getInstance();
        let b: InteractivePTable = InteractivePTable.getInstance();
        expect(a).toBe(b);
    });

    it("resetInstance causes getInstance to return a new instance", function () {
        let first: InteractivePTable = InteractivePTable.getInstance();
        InteractivePTable.resetInstance();
        let second: InteractivePTable = InteractivePTable.getInstance();
        expect(first).not.toBe(second);
    });

    it("isInitialized returns false before init is called", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        expect(instance.isInitialized()).toBe(false);
    });
});

describe("CATEGORY_CLASS_MAP", function () {
    it("maps all ten known element categories to a ptable-cat class", function () {
        expect(CATEGORY_CLASS_MAP["alkali metal"]).toBe("ptable-cat-alkali-metal");
        expect(CATEGORY_CLASS_MAP["alkaline earth metal"]).toBe("ptable-cat-alkaline-earth");
        expect(CATEGORY_CLASS_MAP["transition metal"]).toBe("ptable-cat-transition-metal");
        expect(CATEGORY_CLASS_MAP["post-transition metal"]).toBe("ptable-cat-post-transition");
        expect(CATEGORY_CLASS_MAP["metalloid"]).toBe("ptable-cat-metalloid");
        expect(CATEGORY_CLASS_MAP["non-metal"]).toBe("ptable-cat-nonmetal");
        expect(CATEGORY_CLASS_MAP["halogen"]).toBe("ptable-cat-halogen");
        expect(CATEGORY_CLASS_MAP["noble gas"]).toBe("ptable-cat-noble-gas");
        expect(CATEGORY_CLASS_MAP["lanthanide"]).toBe("ptable-cat-lanthanide");
        expect(CATEGORY_CLASS_MAP["actinide"]).toBe("ptable-cat-actinide");
    });

    it("contains exactly ten category entries", function () {
        let keys: string[] = Object.keys(CATEGORY_CLASS_MAP);
        expect(keys.length).toBe(10);
    });
});

describe("getCategoryClass", function () {
    let instance: InteractivePTable;
    beforeEach(function () {
        InteractivePTable.resetInstance();
        instance = InteractivePTable.getInstance();
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
    });

    it("returns the matching class for each known category", function () {
        expect(instance.getCategoryClass("alkali metal")).toBe("ptable-cat-alkali-metal");
        expect(instance.getCategoryClass("alkaline earth metal")).toBe("ptable-cat-alkaline-earth");
        expect(instance.getCategoryClass("transition metal")).toBe("ptable-cat-transition-metal");
        expect(instance.getCategoryClass("post-transition metal")).toBe("ptable-cat-post-transition");
        expect(instance.getCategoryClass("metalloid")).toBe("ptable-cat-metalloid");
        expect(instance.getCategoryClass("non-metal")).toBe("ptable-cat-nonmetal");
        expect(instance.getCategoryClass("halogen")).toBe("ptable-cat-halogen");
        expect(instance.getCategoryClass("noble gas")).toBe("ptable-cat-noble-gas");
        expect(instance.getCategoryClass("lanthanide")).toBe("ptable-cat-lanthanide");
        expect(instance.getCategoryClass("actinide")).toBe("ptable-cat-actinide");
    });

    it("returns ptable-cat-unknown for an unrecognized type", function () {
        expect(instance.getCategoryClass("unknown type")).toBe("ptable-cat-unknown");
        expect(instance.getCategoryClass("")).toBe("ptable-cat-unknown");
    });
});

describe("getHeatmapColor", function () {
    let instance: InteractivePTable;
    beforeEach(function () {
        InteractivePTable.resetInstance();
        instance = InteractivePTable.getInstance();
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
    });

    it("returns pure blue when value is at the min", function () {
        expect(instance.getHeatmapColor(0, 0, 100)).toBe("rgb(0, 0, 255)");
    });

    it("returns pure red when value is at the max", function () {
        expect(instance.getHeatmapColor(100, 0, 100)).toBe("rgb(255, 0, 0)");
    });

    it("returns pure green at the midpoint of the blue-green segment", function () {
        // t = 0.33 lands at the boundary between blue->green and green->yellow.
        // At t = 0.165 (halfway through 0..0.33), g = 255 * 0.5 = 128 (rounded), b = 255 * 0.5 = 128.
        let color: string = instance.getHeatmapColor(16.5, 0, 100);
        expect(color).toBe("rgb(0, 128, 128)");
    });

    it("returns pure green at the green-yellow boundary (t = 0.33)", function () {
        let color: string = instance.getHeatmapColor(33, 0, 100);
        expect(color).toBe("rgb(0, 255, 0)");
    });

    it("returns pure yellow at the yellow-red boundary (t = 0.66)", function () {
        let color: string = instance.getHeatmapColor(66, 0, 100);
        expect(color).toBe("rgb(255, 255, 0)");
    });

    it("clamps values below min to blue", function () {
        expect(instance.getHeatmapColor(-50, 0, 100)).toBe("rgb(0, 0, 255)");
    });

    it("clamps values above max to red", function () {
        expect(instance.getHeatmapColor(200, 0, 100)).toBe("rgb(255, 0, 0)");
    });

    it("returns blue when max <= min (degenerate range)", function () {
        expect(instance.getHeatmapColor(5, 10, 10)).toBe("rgb(0, 0, 255)");
        expect(instance.getHeatmapColor(5, 10, 5)).toBe("rgb(0, 0, 255)");
    });

    it("produces a monotonically non-decreasing red component across the gradient", function () {
        let prevR: number = -1;
        for (let i: number = 0; i <= 100; i = i + 5) {
            let color: string = instance.getHeatmapColor(i, 0, 100);
            let match: RegExpMatchArray | null = color.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
            expect(match).not.toBeNull();
            if (match !== null) {
                let r: number = parseInt(match[1], 10);
                expect(r).toBeGreaterThanOrEqual(prevR);
                prevR = r;
            }
        }
    });
});

describe("generateElectronConfiguration", function () {
    it("returns empty string for atomic numbers below 1", function () {
        expect(InteractivePTable.generateElectronConfiguration(0)).toBe("");
        expect(InteractivePTable.generateElectronConfiguration(-5)).toBe("");
    });

    it("configures hydrogen (Z=1) as 1s1", function () {
        expect(InteractivePTable.generateElectronConfiguration(1)).toBe("1s1");
    });

    it("configures helium (Z=2) as 1s2", function () {
        expect(InteractivePTable.generateElectronConfiguration(2)).toBe("1s2");
    });

    it("configures lithium (Z=3) as 1s2 2s1", function () {
        expect(InteractivePTable.generateElectronConfiguration(3)).toBe("1s2 2s1");
    });

    it("configures neon (Z=10) as 1s2 2s2 2p6", function () {
        expect(InteractivePTable.generateElectronConfiguration(10)).toBe("1s2 2s2 2p6");
    });

    it("configures argon (Z=18) as 1s2 2s2 2p6 3s2 3p6", function () {
        expect(InteractivePTable.generateElectronConfiguration(18)).toBe("1s2 2s2 2p6 3s2 3p6");
    });

    it("configures iron (Z=26) following the Aufbau order", function () {
        let config: string = InteractivePTable.generateElectronConfiguration(26);
        expect(config).toBe("1s2 2s2 2p6 3s2 3p6 4s2 3d6");
    });

    it("configures the heaviest element (Z=118) without throwing", function () {
        let config: string = InteractivePTable.generateElectronConfiguration(118);
        expect(config.length).toBeGreaterThan(0);
        // Og should end with 7p6
        expect(config.endsWith("7p6")).toBe(true);
    });
});

describe("guessOxidationStates", function () {
    function elementOfType(type: string, valence: number): ChemicalElement {
        return makeElement({
            "atomicNumber": 1,
            "symbol": "X",
            "name": "Test",
            "type": type,
            "group": 1,
            "period": 1,
            "valenceElectrons": valence,
            "totalElectrons": 1
        });
    }

    it("returns 0 for noble gases", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("noble gas", 8))).toBe("0");
    });

    it("returns +1 for alkali metals", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("alkali metal", 1))).toBe("+1");
    });

    it("returns +2 for alkaline earth metals", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("alkaline earth metal", 2))).toBe("+2");
    });

    it("returns the halogen series for halogens", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("halogen", 7))).toBe("-1, +1, +3, +5, +7");
    });

    it("returns -4, +4 for group-14 nonmetals (valence 4)", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("non-metal", 4))).toBe("-4, +4");
    });

    it("returns -3, +3, +5 for valence-5 nonmetals", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("non-metal", 5))).toBe("-3, +3, +5");
    });

    it("returns -2, +4, +6 for valence-6 nonmetals", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("non-metal", 6))).toBe("-2, +4, +6");
    });

    it("returns +1, +2, +3 (variable) for transition metals", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("transition metal", 2))).toBe("+1, +2, +3 (variable)");
    });

    it("returns +1, +2, +3 for post-transition metals", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("post-transition metal", 3))).toBe("+1, +2, +3");
    });

    it("returns +3 (common) for lanthanides and actinides", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("lanthanide", 3))).toBe("+3 (common)");
        expect(InteractivePTable.guessOxidationStates(elementOfType("actinide", 3))).toBe("+3 (common)");
    });

    it("returns Variable for unrecognized types", function () {
        expect(InteractivePTable.guessOxidationStates(elementOfType("unknown", 1))).toBe("Variable");
    });
});

describe("InteractivePTable init and render", function () {
    let container: HTMLElement;
    beforeEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
        container = document.createElement("div");
        container.id = "ptable-container";
        document.body.appendChild(container);
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
    });

    it("throws when the container id is not found", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        expect(function (): void {
            instance.init("does-not-exist", SAMPLE_ELEMENTS);
        }).toThrow("Container not found: does-not-exist");
    });

    it("sets initialized flag and renders cells inside the container", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        expect(instance.isInitialized()).toBe(true);
        let cells: NodeListOf<HTMLElement> = container.querySelectorAll(".ptable-cell");
        expect(cells.length).toBe(SAMPLE_ELEMENTS.length);
    });

    it("renders the wrapper, controls, grid, and legend", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        expect(container.querySelector(".ptable-wrapper")).not.toBeNull();
        expect(container.querySelector(".ptable-controls")).not.toBeNull();
        expect(container.querySelector(".ptable-grid")).not.toBeNull();
        expect(container.querySelector(".ptable-legend")).not.toBeNull();
    });

    it("renders the heatmap select with all five options", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let select: HTMLSelectElement | null = container.querySelector("#ptable-heatmap-select") as HTMLSelectElement | null;
        expect(select).not.toBeNull();
        if (select !== null) {
            let values: string[] = [];
            for (let i: number = 0; i < select.options.length; i++) {
                values.push(select.options[i].value);
            }
            expect(values).toEqual(["none", "electronegativity", "atomicRadius", "ionizationEnergy", "atomicMass"]);
        }
    });

    it("renders each cell with the correct category class", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let hydrogen: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="1"]') as HTMLElement | null;
        expect(hydrogen).not.toBeNull();
        if (hydrogen !== null) {
            expect(hydrogen.classList.contains("ptable-cat-nonmetal")).toBe(true);
        }
        let helium: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="2"]') as HTMLElement | null;
        if (helium !== null) {
            expect(helium.classList.contains("ptable-cat-noble-gas")).toBe(true);
        }
    });

    it("positions lanthanides in row 9 and actinides in row 10", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let lanthanum: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="57"]') as HTMLElement | null;
        expect(lanthanum).not.toBeNull();
        if (lanthanum !== null) {
            expect(lanthanum.style.gridRow).toBe("9");
            expect(lanthanum.style.gridColumn).toBe("3");
        }
        let actinium: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="89"]') as HTMLElement | null;
        expect(actinium).not.toBeNull();
        if (actinium !== null) {
            expect(actinium.style.gridRow).toBe("10");
            expect(actinium.style.gridColumn).toBe("3");
        }
    });

    it("positions main-table elements by their group and period", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let iron: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="26"]') as HTMLElement | null;
        expect(iron).not.toBeNull();
        if (iron !== null) {
            expect(iron.style.gridRow).toBe("4");
            expect(iron.style.gridColumn).toBe("8");
        }
    });

    it("renders a tooltip inside each cell", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let cell: HTMLElement | null = container.querySelector(".ptable-cell") as HTMLElement | null;
        expect(cell).not.toBeNull();
        if (cell !== null) {
            let tooltip: HTMLElement | null = cell.querySelector(".ptable-tooltip") as HTMLElement | null;
            expect(tooltip).not.toBeNull();
        }
    });

    it("renders the legend with all ten category swatches", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let swatches: NodeListOf<HTMLElement> = container.querySelectorAll(".ptable-legend-swatch");
        expect(swatches.length).toBe(10);
    });

    it("renders the heatmap gradient bar (hidden by default)", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let bar: HTMLElement | null = container.querySelector(".ptable-heatmap-legend") as HTMLElement | null;
        expect(bar).not.toBeNull();
        if (bar !== null) {
            expect(bar.style.display).toBe("none");
        }
    });

    it("renders the detail panel (hidden by default)", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.classList.contains("open")).toBe(false);
            expect(panel.getAttribute("aria-hidden")).toBe("true");
        }
    });

    it("getElements returns a defensive copy of the loaded elements", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let copy: ChemicalElement[] = instance.getElements();
        expect(copy.length).toBe(SAMPLE_ELEMENTS.length);
        expect(copy).not.toBe(SAMPLE_ELEMENTS);
    });
});

describe("setHeatmapProperty", function () {
    let container: HTMLElement;
    beforeEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
        container = document.createElement("div");
        container.id = "ptable-container";
        document.body.appendChild(container);
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
    });

    it("defaults to 'none' after init", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        expect(instance.getHeatmapProperty()).toBe("none");
    });

    it("updates the active heatmap property", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.setHeatmapProperty("electronegativity");
        expect(instance.getHeatmapProperty()).toBe("electronegativity");
    });

    it("applies inline background colors to cells when a heatmap is active", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.setHeatmapProperty("electronegativity");
        let cell: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="1"]') as HTMLElement | null;
        expect(cell).not.toBeNull();
        if (cell !== null) {
            expect(cell.style.backgroundColor).not.toBe("");
            expect(cell.classList.contains("ptable-heatmap-cell")).toBe(true);
        }
    });

    it("clears inline colors and heatmap class when switching back to none", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.setHeatmapProperty("atomicMass");
        instance.setHeatmapProperty("none");
        let cell: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="1"]') as HTMLElement | null;
        expect(cell).not.toBeNull();
        if (cell !== null) {
            expect(cell.style.backgroundColor).toBe("");
            expect(cell.classList.contains("ptable-heatmap-cell")).toBe(false);
        }
    });

    it("shows the gradient legend when a heatmap is active and hides it for none", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.setHeatmapProperty("ionizationEnergy");
        let bar: HTMLElement | null = container.querySelector(".ptable-heatmap-legend") as HTMLElement | null;
        expect(bar).not.toBeNull();
        if (bar !== null) {
            expect(bar.style.display).toBe("flex");
        }
        instance.setHeatmapProperty("none");
        if (bar !== null) {
            expect(bar.style.display).toBe("none");
        }
    });

    it("updates the heatmap select value to match the active property", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.setHeatmapProperty("atomicRadius");
        let select: HTMLSelectElement | null = container.querySelector("#ptable-heatmap-select") as HTMLSelectElement | null;
        expect(select).not.toBeNull();
        if (select !== null) {
            expect(select.value).toBe("atomicRadius");
        }
    });

    it("does not throw when called before init (no container)", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        expect(function (): void {
            instance.setHeatmapProperty("electronegativity");
        }).not.toThrow();
    });
});

describe("showElementDetail and hideDetail", function () {
    let container: HTMLElement;
    beforeEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
        container = document.createElement("div");
        container.id = "ptable-container";
        document.body.appendChild(container);
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
    });

    it("opens the detail panel with element name and symbol", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let iron: ChemicalElement = SAMPLE_ELEMENTS[4];
        instance.showElementDetail(iron);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.classList.contains("open")).toBe(true);
            expect(panel.getAttribute("aria-hidden")).toBe("false");
            expect(panel.innerHTML).toContain("Iron");
            expect(panel.innerHTML).toContain("Fe");
        }
    });

    it("includes the electron configuration in the detail panel", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.showElementDetail(SAMPLE_ELEMENTS[0]);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.innerHTML).toContain("1s1");
        }
    });

    it("includes links to relevant calculators", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.showElementDetail(SAMPLE_ELEMENTS[0]);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.innerHTML).toContain("mass-calc");
            expect(panel.innerHTML).toContain("quantum-atomic");
        }
    });

    it("hideDetail removes the open class and sets aria-hidden", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.showElementDetail(SAMPLE_ELEMENTS[0]);
        instance.hideDetail();
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.classList.contains("open")).toBe(false);
            expect(panel.getAttribute("aria-hidden")).toBe("true");
        }
    });

    it("clicking a cell opens the detail panel for that element", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        let cell: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="1"]') as HTMLElement | null;
        expect(cell).not.toBeNull();
        if (cell !== null) {
            cell.click();
            let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
            expect(panel).not.toBeNull();
            if (panel !== null) {
                expect(panel.classList.contains("open")).toBe(true);
                expect(panel.innerHTML).toContain("Hydrogen");
            }
        }
    });
});

describe("destroy", function () {
    let container: HTMLElement;
    beforeEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
        container = document.createElement("div");
        container.id = "ptable-container";
        document.body.appendChild(container);
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
    });

    it("clears the container contents", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        expect(container.children.length).toBeGreaterThan(0);
        instance.destroy();
        expect(container.children.length).toBe(0);
    });

    it("sets isInitialized to false", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.destroy();
        expect(instance.isInitialized()).toBe(false);
    });

    it("clears the loaded elements", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        expect(instance.getElements().length).toBe(SAMPLE_ELEMENTS.length);
        instance.destroy();
        expect(instance.getElements().length).toBe(0);
    });

    it("resets the heatmap property to none", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.setHeatmapProperty("atomicMass");
        instance.destroy();
        expect(instance.getHeatmapProperty()).toBe("none");
    });

    it("render throws after destroy until init is called again", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", SAMPLE_ELEMENTS);
        instance.destroy();
        expect(function (): void {
            instance.render(SAMPLE_ELEMENTS);
        }).toThrow();
    });
});
