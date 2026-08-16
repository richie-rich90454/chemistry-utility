import { ChemicalElement } from "../types.js";

/**
 * Type of heatmap properties supported by {@link InteractivePTable}.
 * "none" disables the heatmap and shows category colors instead.
 */
export type HeatmapProperty =
    | "none"
    | "electronegativity"
    | "atomicRadius"
    | "ionizationEnergy"
    | "atomicMass";

/**
 * Mapping from the raw `type` string in ptable.json (e.g. "alkali metal",
 * "noble gas") to a normalized CSS category class. Public so tests can
 * verify the mapping without reaching into private state.
 */
export const CATEGORY_CLASS_MAP: Record<string, string> = {
    "alkali metal": "ptable-cat-alkali-metal",
    "alkaline earth metal": "ptable-cat-alkaline-earth",
    "transition metal": "ptable-cat-transition-metal",
    "post-transition metal": "ptable-cat-post-transition",
    "metalloid": "ptable-cat-metalloid",
    "non-metal": "ptable-cat-nonmetal",
    "halogen": "ptable-cat-halogen",
    "noble gas": "ptable-cat-noble-gas",
    "lanthanide": "ptable-cat-lanthanide",
    "actinide": "ptable-cat-actinide"
};

/** Aufbau fill order as [n, l] pairs. */
const AUFBAU_ORDER: number[][] = [
    [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2],
    [4, 1], [5, 0], [4, 2], [5, 1], [6, 0], [4, 3], [5, 2],
    [6, 1], [7, 0], [5, 3], [6, 2], [7, 1]
];

const SUBSHELL_NAMES: Record<number, string> = { 0: "s", 1: "p", 2: "d", 3: "f" };
const MAX_ELECTRONS: Record<number, number> = { 0: 2, 1: 6, 2: 10, 3: 14 };

/**
 * Interactive periodic table renderer. Renders a CSS Grid layout of all
 * 118 elements with category color coding, hover tooltips, a click-to-open
 * detail panel, and an optional heatmap mode that colors cells by a numeric
 * property using a blue → green → yellow → red gradient.
 *
 * Implemented as a singleton so it can be initialized once after the
 * ptable.json data loads and re-rendered later (e.g. when toggling the
 * heatmap property) without leaking DOM listeners.
 */
export class InteractivePTable {
    private static instance: InteractivePTable | null = null;

    private container: HTMLElement | null = null;
    private elements: ChemicalElement[] = [];
    private heatmapProperty: HeatmapProperty = "none";
    private heatmapRange: { min: number; max: number } = { "min": 0, "max": 0 };
    private detailPanel: HTMLElement | null = null;
    private legendBar: HTMLElement | null = null;
    private initialized: boolean = false;

    private constructor() {}

    /** Returns the singleton instance, creating it on first call. */
    public static getInstance(): InteractivePTable {
        if (InteractivePTable.instance === null) {
            InteractivePTable.instance = new InteractivePTable();
        }
        return InteractivePTable.instance;
    }

    /** Resets the singleton. Intended for unit tests only. */
    public static resetInstance(): void {
        if (InteractivePTable.instance !== null) {
            InteractivePTable.instance.destroy();
        }
        InteractivePTable.instance = null;
    }

    /**
     * Initializes the periodic table inside the container with the given id.
     * Stores the element data so subsequent {@link setHeatmapProperty} calls
     * can re-render without needing the data again.
     */
    public init(containerId: string, elements: ChemicalElement[]): void {
        let container = document.getElementById(containerId);
        if (container === null) {
            throw new Error("Container not found: " + containerId);
        }
        this.container = container;
        this.elements = elements;
        this.heatmapProperty = "none";
        this.initialized = true;
        this.render(elements);
    }

    /**
     * Builds the periodic table markup inside the container. Creates the
     * heatmap control bar, the 18-column CSS grid with all 118 elements,
     * the lanthanide/actinide rows, and the (initially hidden) detail panel.
     */
    public render(elements: ChemicalElement[]): void {
        if (this.container === null) {
            throw new Error("InteractivePTable is not initialized. Call init() first.");
        }
        this.elements = elements;
        this.container.innerHTML = "";

        let wrapper = document.createElement("div");
        wrapper.className = "ptable-wrapper";

        wrapper.appendChild(this.buildControls());
        wrapper.appendChild(this.buildGrid(elements));
        wrapper.appendChild(this.buildLegend());

        this.container.appendChild(wrapper);

        this.detailPanel = this.buildDetailPanel();
        this.container.appendChild(this.detailPanel);
    }

    /**
     * Switches the active heatmap property. Pass "none" to restore category
     * colors. Re-renders the element cells and updates the legend.
     */
    public setHeatmapProperty(property: HeatmapProperty): void {
        if (this.container === null) {
            return;
        }
        this.heatmapProperty = property;
        if (property === "none") {
            this.heatmapRange = { min: 0, max: 0 };
        } else {
            this.heatmapRange = this.computeRange(this.elements, property);
        }
        this.applyCellColors();
        this.updateLegend();
        let select = this.container.querySelector("#ptable-heatmap-select") as HTMLSelectElement | null;
        if (select !== null) {
            select.value = property;
        }
    }

    /** Opens the detail panel for a specific element. */
    public showElementDetail(element: ChemicalElement): void {
        if (this.detailPanel === null) {
            return;
        }
        let config = InteractivePTable.generateElectronConfiguration(element.atomicNumber);
        let oxidationStates = InteractivePTable.guessOxidationStates(element);
        let html = "<div class=\"ptable-detail-header\">";
        html += "<div class=\"ptable-detail-symbol " + this.getCategoryClass(element.type) + "\">" + this.escapeHtml(element.symbol) + "</div>";
        html += "<div class=\"ptable-detail-title\">";
        html += "<h3>" + this.escapeHtml(element.name) + "</h3>";
        html += "<p>#" + element.atomicNumber + " &middot; " + this.escapeHtml(this.formatCategoryLabel(element.type)) + "</p>";
        html += "</div>";
        html += "<button class=\"ptable-detail-close\" aria-label=\"Close detail panel\">&times;</button>";
        html += "</div>";

        html += "<dl class=\"ptable-detail-grid\">";
        html += this.detailRow("Atomic Number", String(element.atomicNumber));
        html += this.detailRow("Atomic Mass", this.formatNumber(element.atomicMass) + " u");
        html += this.detailRow("Category", this.formatCategoryLabel(element.type));
        let groupValue = element.group as number | null;
        html += this.detailRow("Group", groupValue === null ? "n/a" : String(groupValue));
        html += this.detailRow("Period", String(element.period));
        html += this.detailRow("Electron Configuration", this.escapeHtml(config));
        html += this.detailRow("Ionization Energy", this.formatOptionalNumber(element.ionizationEnergy, " kJ/mol"));
        html += this.detailRow("Electron Affinity", this.formatOptionalNumber(element.electronAffinity, " kJ/mol"));
        html += this.detailRow("Atomic Radius", this.formatOptionalNumber(element.atomicRadius, " pm"));
        html += this.detailRow("Electronegativity", this.formatOptionalNumber(element.electronegativity, ""));
        html += this.detailRow("Valence Electrons", String(element.valenceElectrons));
        html += this.detailRow("Total Electrons", String(element.totalElectrons));
        html += this.detailRow("Common Oxidation States", oxidationStates);
        html += "</dl>";

        html += "<div class=\"ptable-detail-links\">";
        html += "<a class=\"ptable-detail-link\" href=\"#mass-calc\" data-target=\"mass-calc\">Open in Molar Mass Calculator</a>";
        html += "<a class=\"ptable-detail-link\" href=\"#quantum-atomic\" data-target=\"quantum-atomic\">Open Electron Configuration Tool</a>";
        html += "</div>";

        this.detailPanel.innerHTML = html;
        this.detailPanel.classList.add("open");
        this.detailPanel.setAttribute("aria-hidden", "false");

        let closeBtn = this.detailPanel.querySelector(".ptable-detail-close") as HTMLElement | null;
        if (closeBtn !== null) {
            let panel = this.detailPanel;
            closeBtn.addEventListener("click", function (): void {
                panel.classList.remove("open");
                panel.setAttribute("aria-hidden", "true");
            });
        }

        let self = this;
        let links = this.detailPanel.querySelectorAll(".ptable-detail-link") as NodeListOf<HTMLAnchorElement>;
        for (let i = 0; i < links.length; i++) {
            let link = links[i];
            link.addEventListener("click", function (e: MouseEvent): void {
                e.preventDefault();
                let target = link.getAttribute("data-target");
                if (target === null) {
                    return;
                }
                self.hideDetail();
                let targetEl = document.getElementById(target);
                if (targetEl !== null) {
                    let event = new CustomEvent("ptable:navigate", { "detail": target });
                    document.dispatchEvent(event);
                }
            });
        }
    }

    /** Hides the detail panel. */
    public hideDetail(): void {
        if (this.detailPanel === null) {
            return;
        }
        this.detailPanel.classList.remove("open");
        this.detailPanel.setAttribute("aria-hidden", "true");
    }

    /** Tears down DOM references and event listeners. */
    public destroy(): void {
        if (this.container !== null) {
            this.container.innerHTML = "";
        }
        this.container = null;
        this.elements = [];
        this.detailPanel = null;
        this.legendBar = null;
        this.heatmapProperty = "none";
        this.heatmapRange = { "min": 0, "max": 0 };
        this.initialized = false;
    }

    /** Returns true if init() has been called and the container is attached. */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /** Returns the currently active heatmap property. */
    public getHeatmapProperty(): HeatmapProperty {
        return this.heatmapProperty;
    }

    /** Returns a defensive copy of the loaded elements. */
    public getElements(): ChemicalElement[] {
        return this.elements.slice();
    }

    /** Returns the CSS category class for a raw element `type` string. */
    public getCategoryClass(type: string): string {
        let cls = CATEGORY_CLASS_MAP[type];
        if (cls === undefined) {
            return "ptable-cat-unknown";
        }
        return cls;
    }

    /**
     * Computes the heatmap color (as an `rgb(...)` string) for a value
     * between min and max using a blue → green → yellow → red scale.
     * Values at or below the min are blue; values at or above the max
     * are red. Public so tests can verify the gradient.
     */
    public getHeatmapColor(value: number, min: number, max: number): string {
        if (max <= min) {
            return "rgb(0, 0, 255)";
        }
        let t = (value - min) / (max - min);
        if (t < 0) {
            t = 0;
        } else if (t > 1) {
            t = 1;
        }
        let r: number;
        let g: number;
        let b: number;
        if (t < 0.33) {
            // blue → green
            let local = t / 0.33;
            r = 0;
            g = Math.round(255 * local);
            b = Math.round(255 * (1 - local));
        } else if (t < 0.66) {
            // green → yellow
            let local = (t - 0.33) / 0.33;
            r = Math.round(255 * local);
            g = 255;
            b = 0;
        } else {
            // yellow → red
            let local = (t - 0.66) / 0.34;
            r = 255;
            g = Math.round(255 * (1 - local));
            b = 0;
        }
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }

    /**
     * Generates a full electron configuration string (e.g. "1s2 2s2 2p6")
     * for the given atomic number using the Aufbau principle. Public so
     * the detail panel and tests can call it without instantiating.
     */
    public static generateElectronConfiguration(atomicNumber: number): string {
        if (atomicNumber < 1) {
            return "";
        }
        let parts: string[] = [];
        let remaining = atomicNumber;
        for (let i = 0; i < AUFBAU_ORDER.length; i++) {
            if (remaining <= 0) {
                break;
            }
            let n = AUFBAU_ORDER[i][0];
            let l = AUFBAU_ORDER[i][1];
            let max = MAX_ELECTRONS[l];
            let electrons = remaining;
            if (electrons > max) {
                electrons = max;
            }
            parts.push(String(n) + SUBSHELL_NAMES[l] + electrons);
            remaining -= electrons;
        }
        return parts.join(" ");
    }

    /**
     * Heuristic guess at common oxidation states for an element based on
     * its valence electrons and category. This is not exhaustive — it's
     * intended as a helpful summary in the detail panel.
     */
    public static guessOxidationStates(element: ChemicalElement): string {
        let type = element.type;
        let valence = element.valenceElectrons;
        if (type === "noble gas") {
            return "0";
        }
        if (type === "alkali metal") {
            return "+1";
        }
        if (type === "alkaline earth metal") {
            return "+2";
        }
        if (type === "halogen") {
            return "-1, +1, +3, +5, +7";
        }
        if (type === "non-metal") {
            if (valence === 1) {
                return "-1, +1";
            }
            if (valence === 4) {
                return "-4, +4";
            }
            if (valence === 5) {
                return "-3, +3, +5";
            }
            if (valence === 6) {
                return "-2, +4, +6";
            }
            return "-" + (8 - valence) + ", +" + valence;
        }
        if (type === "metalloid") {
            return "-" + Math.max(0, 8 - valence) + ", +" + valence;
        }
        if (type === "transition metal") {
            return "+1, +2, +3 (variable)";
        }
        if (type === "post-transition metal") {
            return "+1, +2, +3";
        }
        if (type === "lanthanide" || type === "actinide") {
            return "+3 (common)";
        }
        return "Variable";
    }

    // ────────────────── Private render helpers ──────────────────

    private buildControls(): HTMLElement {
        let bar = document.createElement("div");
        bar.className = "ptable-controls";

        let label = document.createElement("label");
        label.setAttribute("for", "ptable-heatmap-select");
        label.textContent = "Heatmap:";
        bar.appendChild(label);

        let select = document.createElement("select");
        select.id = "ptable-heatmap-select";
        select.setAttribute("aria-label", "Select heatmap property");
        let options: { "value": HeatmapProperty; "text": string }[] = [
            { "value": "none", "text": "Category colors" },
            { "value": "electronegativity", "text": "Electronegativity" },
            { "value": "atomicRadius", "text": "Atomic radius" },
            { "value": "ionizationEnergy", "text": "Ionization energy" },
            { "value": "atomicMass", "text": "Atomic mass" }
        ];
        for (let i = 0; i < options.length; i++) {
            let opt = document.createElement("option");
            opt.value = options[i].value;
            opt.textContent = options[i].text;
            select.appendChild(opt);
        }

        let self = this;
        select.addEventListener("change", function (): void {
            let value = select.value as HeatmapProperty;
            self.setHeatmapProperty(value);
        });
        bar.appendChild(select);

        return bar;
    }

    private buildGrid(elements: ChemicalElement[]): HTMLElement {
        let grid = document.createElement("div");
        grid.className = "ptable-grid";

        // Place elements into a 19-row (7 main + 1 spacer + 2 f-block rows
        // with a small gap) by 18-column CSS grid.
        let self = this;
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            let cell = self.buildCell(element);
            grid.appendChild(cell);
        }
        return grid;
    }

    private buildCell(element: ChemicalElement): HTMLElement {
        let cell = document.createElement("button");
        cell.type = "button";
        cell.className = "ptable-cell " + this.getCategoryClass(element.type);
        cell.setAttribute("data-atomic-number", String(element.atomicNumber));
        cell.setAttribute("data-symbol", element.symbol);
        cell.setAttribute("aria-label", element.name + ", atomic number " + element.atomicNumber);

        let position = this.computeCellPosition(element);
        cell.style.gridColumn = String(position.col);
        cell.style.gridRow = String(position.row);

        let numberSpan = document.createElement("span");
        numberSpan.className = "ptable-cell-number";
        numberSpan.textContent = String(element.atomicNumber);
        cell.appendChild(numberSpan);

        let symbolSpan = document.createElement("span");
        symbolSpan.className = "ptable-cell-symbol";
        symbolSpan.textContent = element.symbol;
        cell.appendChild(symbolSpan);

        let massSpan = document.createElement("span");
        massSpan.className = "ptable-cell-mass";
        massSpan.textContent = this.formatNumber(element.atomicMass);
        cell.appendChild(massSpan);

        let tooltip = this.buildTooltip(element);
        cell.appendChild(tooltip);

        let self = this;
        cell.addEventListener("click", function (): void {
            self.showElementDetail(element);
        });

        return cell;
    }

    private buildTooltip(element: ChemicalElement): HTMLElement {
        let tooltip = document.createElement("div");
        tooltip.className = "ptable-tooltip";
        let config = InteractivePTable.generateElectronConfiguration(element.atomicNumber);
        let en = element.electronegativity === null || element.electronegativity === undefined
            ? "N/A"
            : this.formatNumber(element.electronegativity);
        let html = "<strong>" + this.escapeHtml(element.symbol) + " — " + this.escapeHtml(element.name) + "</strong>";
        html += "<div>Atomic number: " + element.atomicNumber + "</div>";
        html += "<div>Atomic mass: " + this.formatNumber(element.atomicMass) + " u</div>";
        html += "<div>Electronegativity: " + en + "</div>";
        html += "<div>Configuration: " + this.escapeHtml(config) + "</div>";
        tooltip.innerHTML = html;
        return tooltip;
    }

    private buildLegend(): HTMLElement {
        let legend = document.createElement("div");
        legend.className = "ptable-legend";

        let categories = [
            { "label": "Alkali metal", "cls": "ptable-cat-alkali-metal" },
            { "label": "Alkaline earth", "cls": "ptable-cat-alkaline-earth" },
            { "label": "Transition metal", "cls": "ptable-cat-transition-metal" },
            { "label": "Post-transition", "cls": "ptable-cat-post-transition" },
            { "label": "Metalloid", "cls": "ptable-cat-metalloid" },
            { "label": "Nonmetal", "cls": "ptable-cat-nonmetal" },
            { "label": "Halogen", "cls": "ptable-cat-halogen" },
            { "label": "Noble gas", "cls": "ptable-cat-noble-gas" },
            { "label": "Lanthanide", "cls": "ptable-cat-lanthanide" },
            { "label": "Actinide", "cls": "ptable-cat-actinide" }
        ];
        for (let i = 0; i < categories.length; i++) {
            let item = document.createElement("div");
            item.className = "ptable-legend-item";
            let swatch = document.createElement("span");
            swatch.className = "ptable-legend-swatch " + categories[i].cls;
            item.appendChild(swatch);
            let label = document.createElement("span");
            label.textContent = categories[i].label;
            item.appendChild(label);
            legend.appendChild(item);
        }

        // Heatmap gradient bar (hidden until a heatmap property is selected).
        let gradientBar = document.createElement("div");
        gradientBar.className = "ptable-heatmap-legend";
        gradientBar.style.display = "none";

        let gradient = document.createElement("div");
        gradient.className = "ptable-heatmap-gradient";
        gradientBar.appendChild(gradient);

        let minLabel = document.createElement("span");
        minLabel.className = "ptable-heatmap-min";
        minLabel.textContent = "";
        gradientBar.appendChild(minLabel);

        let maxLabel = document.createElement("span");
        maxLabel.className = "ptable-heatmap-max";
        maxLabel.textContent = "";
        gradientBar.appendChild(maxLabel);

        legend.appendChild(gradientBar);

        this.legendBar = gradientBar;
        return legend;
    }

    private buildDetailPanel(): HTMLElement {
        let panel = document.createElement("div");
        panel.className = "ptable-detail-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "false");
        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("aria-label", "Element details");
        return panel;
    }

    /**
     * Maps an element to its grid position. The main table occupies rows
     * 1-7 and columns 1-18. Lanthanides (Z 57-71) go to row 9, actinides
     * (Z 89-103) go to row 10. Row 8 is left as a small visual gap.
     *
     * Note: ptable.json contains `null` for the `group` field on many
     * lanthanides/actinides even though the declared type is `number`.
     * We treat those as missing and fall back to a safe column.
     */
    private computeCellPosition(element: ChemicalElement): { "row": number; "col": number } {
        let z = element.atomicNumber;
        if (z >= 57 && z <= 71) {
            return { "row": 9, "col": (z - 57) + 3 };
        }
        if (z >= 89 && z <= 103) {
            return { "row": 10, "col": (z - 89) + 3 };
        }
        let group = element.group as number | null;
        let period = element.period as number | null;
        let col: number;
        let row: number;
        if (group === null || group < 1 || group > 18) {
            col = 1;
        } else {
            col = group;
        }
        if (period === null || period < 1 || period > 7) {
            row = 1;
        } else {
            row = period;
        }
        return { "row": row, "col": col };
    }

    /**
     * Walks the current cell elements and applies either category colors
     * (when heatmapProperty === "none") or the heatmap gradient color.
     */
    private applyCellColors(): void {
        if (this.container === null) {
            return;
        }
        let cells = this.container.querySelectorAll(".ptable-cell") as NodeListOf<HTMLElement>;
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let atomicNumber = parseInt(cell.getAttribute("data-atomic-number") || "0", 10);
            let element = this.findElementByAtomicNumber(atomicNumber);
            if (element === null) {
                continue;
            }
            if (this.heatmapProperty === "none") {
                cell.style.backgroundColor = "";
                cell.classList.remove("ptable-heatmap-cell");
            } else {
                let value = this.getHeatmapValue(element, this.heatmapProperty);
                if (value === null) {
                    cell.style.backgroundColor = "var(--md-surface-container)";
                } else {
                    let color = this.getHeatmapColor(value, this.heatmapRange.min, this.heatmapRange.max);
                    cell.style.backgroundColor = color;
                }
                cell.classList.add("ptable-heatmap-cell");
            }
        }
    }

    private findElementByAtomicNumber(z: number): ChemicalElement | null {
        for (let i = 0; i < this.elements.length; i++) {
            if (this.elements[i].atomicNumber === z) {
                return this.elements[i];
            }
        }
        return null;
    }

    /** Returns the numeric value of the active heatmap property, or null. */
    private getHeatmapValue(element: ChemicalElement, property: HeatmapProperty): number | null {
        if (property === "none") {
            return null;
        }
        let value: number | null | undefined;
        if (property === "electronegativity") {
            value = element.electronegativity;
        } else if (property === "atomicRadius") {
            value = element.atomicRadius;
        } else if (property === "ionizationEnergy") {
            value = element.ionizationEnergy;
        } else if (property === "atomicMass") {
            value = element.atomicMass;
        }
        if (value === null || value === undefined) {
            return null;
        }
        return value;
    }

    /** Computes the min/max of the property across all elements. */
    private computeRange(elements: ChemicalElement[], property: HeatmapProperty): { min: number; max: number } {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (let i = 0; i < elements.length; i++) {
            let value = this.getHeatmapValue(elements[i], property);
            if (value === null) {
                continue;
            }
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
        if (min === Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
            return { "min": 0, "max": 0 };
        }
        return { "min": min, "max": max };
    }

    private updateLegend(): void {
        if (this.legendBar === null) {
            return;
        }
        if (this.heatmapProperty === "none") {
            this.legendBar.style.display = "none";
            return;
        }
        this.legendBar.style.display = "flex";
        let minLabel = this.legendBar.querySelector(".ptable-heatmap-min") as HTMLElement | null;
        let maxLabel = this.legendBar.querySelector(".ptable-heatmap-max") as HTMLElement | null;
        if (minLabel !== null) {
            minLabel.textContent = this.formatNumber(this.heatmapRange.min);
        }
        if (maxLabel !== null) {
            maxLabel.textContent = this.formatNumber(this.heatmapRange.max);
        }
    }

    private detailRow(label: string, value: string): string {
        return "<dt>" + this.escapeHtml(label) + "</dt><dd>" + value + "</dd>";
    }

    private formatNumber(value: number): string {
        if (Number.isInteger(value)) {
            return String(value);
        }
        return value.toFixed(2);
    }

    private formatOptionalNumber(value: number | null | undefined, unit: string): string {
        if (value === null || value === undefined) {
            return "N/A";
        }
        return this.formatNumber(value) + unit;
    }

    private formatCategoryLabel(type: string): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    private escapeHtml(value: unknown): string {
        let str = String(value);
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
}
