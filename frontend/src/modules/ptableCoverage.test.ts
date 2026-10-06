import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InteractivePTable } from "./interactivePTable.js";
import { ChemicalElement } from "../types.js";

function makeEl(overrides: {
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
}): ChemicalElement {
    let base: Record<string, unknown> = {
        "symbol": overrides.symbol,
        "name": overrides.name,
        "atomicMass": overrides.atomicMass === undefined ? 1.0 : overrides.atomicMass,
        "atomicNumber": overrides.atomicNumber,
        "electronegativity": overrides.electronegativity === undefined ? null : overrides.electronegativity,
        "electronAffinity": null,
        "atomicRadius": overrides.atomicRadius === undefined ? null : overrides.atomicRadius,
        "ionizationEnergy": overrides.ionizationEnergy === undefined ? null : overrides.ionizationEnergy,
        "valenceElectrons": overrides.valenceElectrons === undefined ? 1 : overrides.valenceElectrons,
        "totalElectrons": overrides.atomicNumber,
        "group": overrides.group,
        "period": overrides.period,
        "type": overrides.type
    };
    return base as unknown as ChemicalElement;
}

type PTablePriv = {
    "applyCellColors"(): void;
    "updateLegend"(): void;
    "computeRange"(els: ChemicalElement[], prop: string): { "min": number; "max": number };
    "getHeatmapValue"(el: ChemicalElement, prop: string): number | null;
    "detailPanel": HTMLElement | null;
    "legendBar": HTMLElement | null;
};

function privOf(instance: InteractivePTable): PTablePriv {
    return instance as unknown as PTablePriv;
}

describe("ptableCoverage guards before init", function () {
    beforeEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
        document.body.innerHTML = "";
    });

    it("showElementDetail and hideDetail are no-ops without a panel", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let el: ChemicalElement = makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1 });
        expect(function (): void {
            instance.showElementDetail(el);
        }).not.toThrow();
        expect(function (): void {
            instance.hideDetail();
        }).not.toThrow();
    });

    it("applyCellColors and updateLegend are safe without DOM", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let p: PTablePriv = privOf(instance);
        expect(function (): void {
            p.applyCellColors();
        }).not.toThrow();
        expect(function (): void {
            p.updateLegend();
        }).not.toThrow();
    });

    it("getHeatmapValue returns null for none and unknown properties", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let p: PTablePriv = privOf(instance);
        let el: ChemicalElement = makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008 });
        expect(p.getHeatmapValue(el, "none")).toBeNull();
        expect(p.getHeatmapValue(el, "bogus-property")).toBeNull();
    });

    it("computeRange returns 0,0 when no values are present", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let p: PTablePriv = privOf(instance);
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "electronegativity": null }),
            makeEl({ "atomicNumber": 2, "symbol": "He", "name": "Helium", "type": "noble gas", "group": 18, "period": 1, "electronegativity": null })
        ];
        expect(p.computeRange(els, "electronegativity")).toEqual({ "min": 0, "max": 0 });
    });
});

describe("ptableCoverage oxidation fallbacks", function () {
    beforeEach(function () {
        InteractivePTable.resetInstance();
    });
    afterEach(function () {
        InteractivePTable.resetInstance();
    });

    it("covers generic non-metal fallback", function () {
        let el: ChemicalElement = makeEl({ "atomicNumber": 99, "symbol": "X", "name": "Test", "type": "non-metal", "group": 1, "period": 1, "valenceElectrons": 2 });
        expect(InteractivePTable.guessOxidationStates(el)).toBe("-6, +2");
    });

    it("covers metalloid branch", function () {
        let el: ChemicalElement = makeEl({ "atomicNumber": 14, "symbol": "Si", "name": "Silicon", "type": "metalloid", "group": 14, "period": 3, "valenceElectrons": 4 });
        expect(InteractivePTable.guessOxidationStates(el)).toBe("-4, +4");
    });
});

describe("ptableCoverage grid fallbacks and detail group", function () {
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

    it("falls back to col 1 for null and out-of-range groups", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": null, "period": 1 }),
            makeEl({ "atomicNumber": 3, "symbol": "Li", "name": "Lithium", "type": "alkali metal", "group": 0, "period": 2 }),
            makeEl({ "atomicNumber": 4, "symbol": "Be", "name": "Beryllium", "type": "alkaline earth metal", "group": 19, "period": 2 }),
            makeEl({ "atomicNumber": 5, "symbol": "B", "name": "Boron", "type": "metalloid", "group": 13, "period": 2 })
        ];
        instance.init("ptable-container", els);
        let h: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="1"]') as HTMLElement | null;
        expect(h).not.toBeNull();
        if (h !== null) {
            expect(h.style.gridColumn).toBe("1");
        }
        let li: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="3"]') as HTMLElement | null;
        if (li !== null) {
            expect(li.style.gridColumn).toBe("1");
        }
        let be: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="4"]') as HTMLElement | null;
        if (be !== null) {
            expect(be.style.gridColumn).toBe("1");
        }
        let b: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="5"]') as HTMLElement | null;
        if (b !== null) {
            expect(b.style.gridColumn).toBe("13");
        }
    });

    it("falls back to row 1 for null and out-of-range periods", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let base: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1 }),
            makeEl({ "atomicNumber": 2, "symbol": "He", "name": "Helium", "type": "noble gas", "group": 18, "period": 1 })
        ];
        let rec1: Record<string, unknown> = makeEl({ "atomicNumber": 6, "symbol": "C", "name": "Carbon", "type": "non-metal", "group": 14, "period": 2 }) as unknown as Record<string, unknown>;
        rec1["period"] = null;
        let rec2: Record<string, unknown> = makeEl({ "atomicNumber": 7, "symbol": "N", "name": "Nitrogen", "type": "non-metal", "group": 15, "period": 2 }) as unknown as Record<string, unknown>;
        rec2["period"] = 0;
        let rec3: Record<string, unknown> = makeEl({ "atomicNumber": 8, "symbol": "O", "name": "Oxygen", "type": "non-metal", "group": 16, "period": 2 }) as unknown as Record<string, unknown>;
        rec3["period"] = 99;
        let els: ChemicalElement[] = base.concat([
            rec1 as unknown as ChemicalElement,
            rec2 as unknown as ChemicalElement,
            rec3 as unknown as ChemicalElement
        ]);
        instance.init("ptable-container", els);
        for (const z of ["6", "7", "8"]) {
            let cell: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="' + z + '"]') as HTMLElement | null;
            expect(cell).not.toBeNull();
            if (cell !== null) {
                expect(cell.style.gridRow).toBe("1");
            }
        }
    });

    it("shows n/a for null group in the detail panel", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 57, "symbol": "La", "name": "Lanthanum", "type": "lanthanide", "group": null, "period": 6 })
        ];
        instance.init("ptable-container", els);
        instance.showElementDetail(els[0]);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.innerHTML).toContain("n/a");
        }
    });

    it("renders N/A tooltip and detail rows for undefined optional values", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let rec: Record<string, unknown> = {
            "symbol": "U",
            "name": "Unobtainium",
            "atomicMass": 100,
            "atomicNumber": 5,
            "valenceElectrons": 3,
            "totalElectrons": 5,
            "group": 13,
            "period": 2,
            "type": "metalloid"
        };
        let el: ChemicalElement = rec as unknown as ChemicalElement;
        instance.init("ptable-container", [el]);
        let cell: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="5"]') as HTMLElement | null;
        expect(cell).not.toBeNull();
        if (cell !== null) {
            let tip: HTMLElement | null = cell.querySelector(".ptable-tooltip") as HTMLElement | null;
            expect(tip).not.toBeNull();
            if (tip !== null) {
                expect(tip.innerHTML).toContain("N/A");
            }
        }
        instance.showElementDetail(el);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel !== null) {
            expect(panel.innerHTML).toContain("N/A");
        }
    });
});

describe("ptableCoverage detail interactions", function () {
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

    function sample(): ChemicalElement[] {
        return [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008 })
        ];
    }

    it("close button hides the panel", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", sample());
        instance.showElementDetail(sample()[0]);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel === null) {
            return;
        }
        let closeBtn: HTMLElement | null = panel.querySelector(".ptable-detail-close") as HTMLElement | null;
        expect(closeBtn).not.toBeNull();
        if (closeBtn !== null) {
            closeBtn.click();
            expect(panel.classList.contains("open")).toBe(false);
            expect(panel.getAttribute("aria-hidden")).toBe("true");
        }
    });

    it("tolerates a missing close button", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", sample());
        let p: PTablePriv = privOf(instance);
        let panel: HTMLElement | null = p.detailPanel;
        expect(panel).not.toBeNull();
        if (panel === null) {
            return;
        }
        let original: unknown = (panel as unknown as Record<string, unknown>)["querySelector"];
        let bound: (sel: string) => Element | null = (panel.querySelector as (sel: string) => Element | null).bind(panel);
        let patched = function (selectors: string): Element | null {
            if (selectors === ".ptable-detail-close") {
                return null;
            }
            return bound(selectors);
        };
        (panel as unknown as Record<string, unknown>)["querySelector"] = patched;
        try {
            instance.showElementDetail(sample()[0]);
            let current: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
            expect(current).not.toBeNull();
            if (current !== null) {
                expect(current.classList.contains("open")).toBe(true);
            }
        } finally {
            (panel as unknown as Record<string, unknown>)["querySelector"] = original;
        }
    });

    it("detail link with existing target dispatches ptable:navigate and hides detail", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", sample());
        let target: HTMLElement = document.createElement("div");
        target.id = "mass-calc";
        document.body.appendChild(target);
        let received: Event[] = [];
        let listener = function (e: Event): void {
            received.push(e);
        };
        document.addEventListener("ptable:navigate", listener);
        try {
            instance.showElementDetail(sample()[0]);
            let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
            expect(panel).not.toBeNull();
            if (panel === null) {
                return;
            }
            let link: HTMLAnchorElement | null = panel.querySelector('a[data-target="mass-calc"]') as HTMLAnchorElement | null;
            expect(link).not.toBeNull();
            if (link !== null) {
                link.click();
                expect(panel.classList.contains("open")).toBe(false);
                expect(received.length).toBe(1);
                expect((received[0] as CustomEvent).detail).toBe("mass-calc");
            }
        } finally {
            document.removeEventListener("ptable:navigate", listener);
        }
    });

    it("detail link without an existing target hides detail without dispatch", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", sample());
        let received = 0;
        let listener = function (): void {
            received += 1;
        };
        document.addEventListener("ptable:navigate", listener);
        try {
            instance.showElementDetail(sample()[0]);
            let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
            expect(panel).not.toBeNull();
            if (panel === null) {
                return;
            }
            let link: HTMLAnchorElement | null = panel.querySelector(".ptable-detail-link") as HTMLAnchorElement | null;
            expect(link).not.toBeNull();
            if (link !== null) {
                expect(document.getElementById("mass-calc")).toBeNull();
                link.click();
                expect(panel.classList.contains("open")).toBe(false);
                expect(received).toBe(0);
            }
        } finally {
            document.removeEventListener("ptable:navigate", listener);
        }
    });

    it("detail link without data-target returns early and stays open", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        instance.init("ptable-container", sample());
        instance.showElementDetail(sample()[0]);
        let panel: HTMLElement | null = container.querySelector(".ptable-detail-panel") as HTMLElement | null;
        expect(panel).not.toBeNull();
        if (panel === null) {
            return;
        }
        let link: HTMLAnchorElement | null = panel.querySelector(".ptable-detail-link") as HTMLAnchorElement | null;
        expect(link).not.toBeNull();
        if (link !== null) {
            link.removeAttribute("data-target");
            link.click();
            expect(panel.classList.contains("open")).toBe(true);
        }
    });

    it("heatmap select change updates the property", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008, "electronegativity": 2.2 }),
            makeEl({ "atomicNumber": 2, "symbol": "He", "name": "Helium", "type": "noble gas", "group": 18, "period": 1, "atomicMass": 4.003, "electronegativity": null })
        ];
        instance.init("ptable-container", els);
        let select: HTMLSelectElement | null = container.querySelector("#ptable-heatmap-select") as HTMLSelectElement | null;
        expect(select).not.toBeNull();
        if (select !== null) {
            select.value = "electronegativity";
            select.dispatchEvent(new Event("change", { "bubbles": true }));
            expect(instance.getHeatmapProperty()).toBe("electronegativity");
        }
    });

    it("setHeatmapProperty tolerates a missing select element", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008 })
        ];
        instance.init("ptable-container", els);
        let select: HTMLElement | null = container.querySelector("#ptable-heatmap-select") as HTMLElement | null;
        expect(select).not.toBeNull();
        if (select !== null) {
            select.remove();
        }
        expect(function (): void {
            instance.setHeatmapProperty("atomicMass");
        }).not.toThrow();
        expect(instance.getHeatmapProperty()).toBe("atomicMass");
    });

    it("heatmap with all-null values and missing labels does not throw", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "electronegativity": null }),
            makeEl({ "atomicNumber": 2, "symbol": "He", "name": "Helium", "type": "noble gas", "group": 18, "period": 1, "electronegativity": null })
        ];
        instance.init("ptable-container", els);
        let bar: HTMLElement | null = container.querySelector(".ptable-heatmap-legend") as HTMLElement | null;
        expect(bar).not.toBeNull();
        if (bar !== null) {
            let minEl: Element | null = bar.querySelector(".ptable-heatmap-min");
            if (minEl !== null && minEl.parentNode !== null) {
                minEl.parentNode.removeChild(minEl);
            }
            let maxEl: Element | null = bar.querySelector(".ptable-heatmap-max");
            if (maxEl !== null && maxEl.parentNode !== null) {
                maxEl.parentNode.removeChild(maxEl);
            }
        }
        expect(function (): void {
            instance.setHeatmapProperty("electronegativity");
        }).not.toThrow();
        expect(instance.getHeatmapProperty()).toBe("electronegativity");
    });

    it("applyCellColors skips cells with missing or unknown atomic numbers", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008, "electronegativity": 2.2 })
        ];
        instance.init("ptable-container", els);
        let grid: HTMLElement | null = container.querySelector(".ptable-grid") as HTMLElement | null;
        expect(grid).not.toBeNull();
        if (grid !== null) {
            let noAttr: HTMLElement = document.createElement("div");
            noAttr.className = "ptable-cell";
            grid.appendChild(noAttr);
            let unknown: HTMLElement = document.createElement("div");
            unknown.className = "ptable-cell";
            unknown.setAttribute("data-atomic-number", "9999");
            grid.appendChild(unknown);
        }
        expect(function (): void {
            instance.setHeatmapProperty("electronegativity");
        }).not.toThrow();
        expect(function (): void {
            instance.setHeatmapProperty("none");
        }).not.toThrow();
    });

    it("heatmap null values use the fallback surface color", function () {
        let instance: InteractivePTable = InteractivePTable.getInstance();
        let els: ChemicalElement[] = [
            makeEl({ "atomicNumber": 1, "symbol": "H", "name": "Hydrogen", "type": "non-metal", "group": 1, "period": 1, "atomicMass": 1.008, "electronegativity": 2.2 }),
            makeEl({ "atomicNumber": 2, "symbol": "He", "name": "Helium", "type": "noble gas", "group": 18, "period": 1, "atomicMass": 4.003, "electronegativity": null })
        ];
        instance.init("ptable-container", els);
        instance.setHeatmapProperty("electronegativity");
        let he: HTMLElement | null = container.querySelector('.ptable-cell[data-atomic-number="2"]') as HTMLElement | null;
        expect(he).not.toBeNull();
        if (he !== null) {
            expect(he.style.backgroundColor).not.toBe("");
        }
    });
});
