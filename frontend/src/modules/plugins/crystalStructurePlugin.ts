import { Calculator } from "../calculator.js";
import { CalculatorRegistry } from "../calculatorRegistry.js";
import { InputValidator } from "../validation.js";
import { Plugin, PluginManager, PluginManifest } from "../pluginManager.js";

const AVOGADRO: number = 6.02214076e23;
const ANG3_TO_CM3: number = 1e-24;
const PLUGIN_ID: string = "crystal-structure";
const CALCULATOR_ID: string = "crystal-structure";
const RESULT_ELEMENT_ID: string = "crystal-structure-result";
const SIDEBAR_ITEM_ID: string = "crystal-structure-nav-item";
const CRYSTAL_SYSTEMS: string[] = ["cubic", "tetragonal", "orthorhombic", "hexagonal"];

interface LatticeParameters {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
}

/**
 * Calculates crystal structure properties from lattice parameters.
 * Outputs unit cell volume (Å³), packing fraction (where defined for the
 * crystal system), and density (g/cm³) when atomic mass and Z are supplied.
 */
export class CrystalStructureCalculator extends Calculator {
    constructor() {
        super(RESULT_ELEMENT_ID, [
            "crystal-system",
            "crystal-a",
            "crystal-b",
            "crystal-c",
            "crystal-alpha",
            "crystal-beta",
            "crystal-gamma",
            "crystal-atomic-mass",
            "crystal-z"
        ]);
    }

    protected performCalculation(): void {
        let system: string = this.getInput("crystal-system").getStringValue();
        let lattice: string = this.getLatticeType();
        let a: number = this.getInput("crystal-a").getValue();
        let b: number = this.getInput("crystal-b").getValue();
        let c: number = this.getInput("crystal-c").getValue();
        let alpha: number = this.getInput("crystal-alpha").getValue();
        let beta: number = this.getInput("crystal-beta").getValue();
        let gamma: number = this.getInput("crystal-gamma").getValue();
        let atomicMass: number = this.getInput("crystal-atomic-mass").getValue();
        let z: number = this.getInput("crystal-z").getValue();

        this.validateForSystem(system, a, b, c, alpha, beta, gamma);

        let params: LatticeParameters = this.applySystemConstraints(system, a, b, c, alpha, beta, gamma);
        let volume: number = this.computeVolume(params.a, params.b, params.c, params.alpha, params.beta, params.gamma);
        let packingFraction: number | null = this.computePackingFraction(system, lattice);
        let density: number | null = null;
        if (!isNaN(atomicMass) && atomicMass > 0 && !isNaN(z) && z > 0) {
            let volumeCm3: number = volume * ANG3_TO_CM3;
            density = (z * atomicMass) / (volumeCm3 * AVOGADRO);
        }

        let html: string = "<p>Unit cell volume: " + this.numberFormatter.format(volume, 4) + " Å³</p>";
        if (packingFraction !== null) {
            html += "<p>Packing fraction: " + this.numberFormatter.format(packingFraction, 4) + "</p>";
        } else {
            html += "<p>Packing fraction: requires a cubic system with lattice type (sc, bcc, or fcc)</p>";
        }
        if (density !== null) {
            html += "<p>Density: " + this.numberFormatter.format(density, 4) + " g/cm³</p>";
        }
        this.resultDisplay.showResult(html);
    }

    private validateForSystem(system: string, a: number, b: number, c: number, alpha: number, beta: number, gamma: number): void {
        if (system === "cubic") {
            InputValidator.validateValues([a], ["crystal-a"]);
        } else if (system === "tetragonal") {
            InputValidator.validateValues([a, c], ["crystal-a", "crystal-c"]);
        } else if (system === "orthorhombic") {
            InputValidator.validateValues([a, b, c], ["crystal-a", "crystal-b", "crystal-c"]);
        } else if (system === "hexagonal") {
            InputValidator.validateValues([a, c], ["crystal-a", "crystal-c"]);
        } else {
            InputValidator.validateValues([a, b, c, alpha, beta, gamma], ["crystal-a", "crystal-b", "crystal-c", "crystal-alpha", "crystal-beta", "crystal-gamma"]);
        }
    }

    private applySystemConstraints(system: string, a: number, b: number, c: number, alpha: number, beta: number, gamma: number): LatticeParameters {
        if (system === "cubic") {
            return { a: a, b: a, c: a, alpha: 90, beta: 90, gamma: 90 };
        }
        if (system === "tetragonal") {
            return { a: a, b: a, c: c, alpha: 90, beta: 90, gamma: 90 };
        }
        if (system === "orthorhombic") {
            return { a: a, b: b, c: c, alpha: 90, beta: 90, gamma: 90 };
        }
        if (system === "hexagonal") {
            return { a: a, b: a, c: c, alpha: 90, beta: 90, gamma: 120 };
        }
        return { a: a, b: b, c: c, alpha: alpha, beta: beta, gamma: gamma };
    }

    private computeVolume(a: number, b: number, c: number, alphaDeg: number, betaDeg: number, gammaDeg: number): number {
        let alpha: number = alphaDeg * Math.PI / 180;
        let beta: number = betaDeg * Math.PI / 180;
        let gamma: number = gammaDeg * Math.PI / 180;
        let cosA: number = Math.cos(alpha);
        let cosB: number = Math.cos(beta);
        let cosG: number = Math.cos(gamma);
        let sinSq: number = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
        if (sinSq < 0) {
            sinSq = 0;
        }
        return a * b * c * Math.sqrt(sinSq);
    }

    /**
     * Packing fraction is only a constant for the cubic lattice types
     * (sc = pi/6, bcc = sqrt(3)pi/8, fcc = pi/(3*sqrt2)). For every other
     * system it depends on atomic radius / c-a ratio, which are not inputs,
     * so no value is reported rather than returning a misleading constant.
     */
    private computePackingFraction(system: string, lattice: string): number | null {
        if (system !== "cubic") {
            return null;
        }
        if (lattice === "sc") {
            return Math.PI / 6;
        }
        if (lattice === "bcc") {
            return (Math.sqrt(3) * Math.PI) / 8;
        }
        if (lattice === "fcc") {
            return Math.PI / (3 * Math.sqrt(2));
        }
        return null;
    }

    private getLatticeType(): string {
        let el: HTMLElement | null = document.getElementById("crystal-lattice");
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
            let v: string = (el as HTMLSelectElement).value.trim().toLowerCase();
            if (v === "sc" || v === "bcc" || v === "fcc") {
                return v;
            }
        }
        return "";
    }
}

/**
 * Example plugin that contributes the Crystal Structure calculator to the
 * Chemistry Utility. Demonstrates the install/uninstall lifecycle, sidebar
 * contribution, and beforeCalculation/afterCalculation hooks. The
 * afterCalculation hook appends a metadata suffix to the crystal structure
 * calculator's result to prove plugins can transform calculator output.
 */
export class CrystalStructurePlugin implements Plugin {
    public manifest: PluginManifest;
    private calculator: CrystalStructureCalculator | null;

    constructor() {
        this.manifest = {
            name: PLUGIN_ID,
            version: "1.0.0",
            author: "Chemistry Utility Team",
            description: "Adds a Crystal Structure calculator (unit cell volume, packing fraction, density).",
            permissions: ["calculator", "sidebar"],
            lifecycleHooks: ["beforeCalculation", "afterCalculation"]
        };
        this.calculator = null;
    }

    public install(_pluginManager: PluginManager): void {
        this.ensureCalculatorView();
        this.calculator = new CrystalStructureCalculator();
        CalculatorRegistry.getInstance().register(CALCULATOR_ID, this.calculator);
        this.addSidebarItem();
    }

    public uninstall(): void {
        CalculatorRegistry.getInstance().unregister(CALCULATOR_ID);
        this.removeSidebarItem();
        this.removeCalculatorView();
        this.calculator = null;
    }

    public onEnable(): void {
        let item: HTMLElement | null = document.getElementById(SIDEBAR_ITEM_ID);
        if (item) {
            item.style.display = "";
        }
    }

    public onDisable(): void {
        let item: HTMLElement | null = document.getElementById(SIDEBAR_ITEM_ID);
        if (item) {
            item.style.display = "none";
        }
    }

    public beforeCalculation(calculatorId: string, inputs: Record<string, unknown>): Record<string, unknown> {
        if (calculatorId === CALCULATOR_ID) {
            console.log("[CrystalStructurePlugin] beforeCalculation for", calculatorId);
        }
        return inputs;
    }

    public afterCalculation(calculatorId: string, result: unknown): unknown {
        if (calculatorId !== CALCULATOR_ID) {
            return undefined;
        }
        if (typeof result !== "string") {
            return undefined;
        }
        return result + " — processed by CrystalStructurePlugin";
    }

    private ensureCalculatorView(): void {
        if (document.getElementById(CALCULATOR_ID)) {
            return;
        }
        let host: HTMLElement = document.getElementById("main-content") || document.body;
        let section: HTMLElement = document.createElement("section");
        section.id = CALCULATOR_ID;
        section.className = "main-groups card view-hidden";
        let systemOptions: string = CRYSTAL_SYSTEMS.map(function (s: string): string {
            return '<option value="' + s + '">' + s + "</option>";
        }).join("");
        section.innerHTML =
            '<h2>Crystal Structure</h2>' +
            '<label>Crystal system<select id="crystal-system">' + systemOptions + '</select></label>' +
            '<label>Cubic lattice type<select id="crystal-lattice"><option value="">(not cubic / unknown)</option><option value="sc">simple cubic</option><option value="bcc">body-centered</option><option value="fcc">face-centered</option></select></label>' +
            '<label>a (Å)<input id="crystal-a" type="number" step="any"></label>' +
            '<label>b (Å)<input id="crystal-b" type="number" step="any"></label>' +
            '<label>c (Å)<input id="crystal-c" type="number" step="any"></label>' +
            '<label>α (deg)<input id="crystal-alpha" type="number" step="any"></label>' +
            '<label>β (deg)<input id="crystal-beta" type="number" step="any"></label>' +
            '<label>γ (deg)<input id="crystal-gamma" type="number" step="any"></label>' +
            '<label>Atomic mass (g/mol)<input id="crystal-atomic-mass" type="number" step="any"></label>' +
            '<label>Z (atoms/cell)<input id="crystal-z" type="number" step="any"></label>' +
            '<div id="' + RESULT_ELEMENT_ID + '"></div>';
        host.appendChild(section);
    }

    private removeCalculatorView(): void {
        let section: HTMLElement | null = document.getElementById(CALCULATOR_ID);
        if (section && section.parentNode) {
            section.parentNode.removeChild(section);
        }
    }

    private addSidebarItem(): void {
        if (document.getElementById(SIDEBAR_ITEM_ID)) {
            return;
        }
        let nav: HTMLElement | null = document.querySelector(".sidebar-nav ul") as HTMLElement | null;
        if (!nav) {
            return;
        }
        let li: HTMLLIElement = document.createElement("li");
        li.id = SIDEBAR_ITEM_ID;
        let a: HTMLAnchorElement = document.createElement("a");
        a.href = "#" + CALCULATOR_ID;
        a.textContent = "Crystal Structure";
        li.appendChild(a);
        nav.appendChild(li);
    }

    private removeSidebarItem(): void {
        let item: HTMLElement | null = document.getElementById(SIDEBAR_ITEM_ID);
        if (item && item.parentNode) {
            item.parentNode.removeChild(item);
        }
    }
}
