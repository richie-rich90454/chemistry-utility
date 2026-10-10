import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import {
    dilution,
    massPercent,
    solutionMixing,
    bufferSolution,
    pKaPKb,
    ksp,
    colligativeProperties,
    titrationCurve,
    debyeHuckel,
    commonIonEffect
} from "./calculators/solution.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";
import { renderTitrationCurve } from "./dom/chartBindings.js";

/** Solves the dilution equation M1*V1 = M2*V2 for any one of the four variables. */
export class DilutionCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "dilution";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return dilution(inputs);
    }
}

/** Mass-based concentration (percent, ppm, or ppb) from solute and solution masses. */
export class MassPercentCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "mass-percent";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return massPercent(inputs);
    }
}

/** Final concentration and total volume when mixing two solutions. */
export class MixingCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "mixing";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return solutionMixing(inputs);
    }
}

/** Henderson-Hasselbalch buffer pH, solved for pH, pKa, or the [A-]/[HA] ratio. */
export class BufferSolutionCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "buffer";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return bufferSolution(inputs);
    }
}

/** pKa/pKb relationship: pKa + pKb = 14 and Ka*Kb = Kw. */
export class PKaPKbCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "pka-pkb";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return pKaPKb(inputs);
    }
}

/** Ksp solubility product for AB, AB2, A2B, AB3, and A3B salt types. */
export class KspCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "ksp";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return ksp(inputs);
    }
}

/** Colligative properties: boiling/freezing shifts, osmotic pressure, vapor-pressure lowering. */
export class ColligativePropertiesCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "colligative";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return colligativeProperties(inputs);
    }
}

/** Titration curve: pH vs volume of base for a strong or weak acid. */
export class TitrationCurveCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "titration";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return titrationCurve(inputs);
    }
}

/** Extended Debye-Huckel activity coefficient from salt concentration and ion charges. */
export class DebyeHuckelCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "debye-huckel";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return debyeHuckel(inputs);
    }
}

/** Common ion effect: molar solubility with a common ion present. */
export class CommonIonEffectCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "common-ion";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return commonIonEffect(inputs);
    }
}

interface DilutionMetadata {
    formula: string;
    result: number;
    unit: string;
}

interface KspMetadata {
    Ksp: number;
    solubility: number;
    concA: number;
    concB: number;
    stoichA: number;
    stoichB: number;
    saltType: string;
}

interface CommonIonMetadata {
    solubilityWithCommonIon: number;
    solubilityWithoutCommonIon: number;
    concA: number;
    concB: number;
    solubilityRatio: number;
    stoichA: number;
    stoichB: number;
    approxValid: boolean;
}

const DILUTION_IDS = ["dilution-M1", "dilution-V1", "dilution-M2", "dilution-V2", "dilution-solve-for"];
const COLLIGATIVE_IDS = [
    "collig-solute-mass", "collig-molar-mass", "collig-solvent-mass", "collig-vanthoff",
    "collig-Kb", "collig-Kf", "collig-solvent-bp", "collig-solvent-fp", "collig-Psolvent",
    "collig-density", "collig-temp", "collig-solvent-molar-mass"
];
const TITRATION_IDS = [
    "titration-acid-conc", "titration-acid-vol", "titration-base-conc",
    "titration-max-vol", "titration-Ka", "titration-acid-type"
];

function readDomInputs(ids: string[]): Record<string, string> {
    const inputs: Record<string, string> = {};
    for (const id of ids) {
        const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
        inputs[id] = el ? el.value : "";
    }
    return inputs;
}

/**
 * Legacy DOM entry point shared by the free functions below. Reads the page
 * inputs into a record, runs the DOM-free calculator, and renders the worked
 * result. A failed run is reported through the same "Error: ..." banner the
 * old DOM calculators rendered; an optional post-render hook draws charts.
 */
function runLegacy(
    calculator: PureCalculator,
    resultElementId: string,
    inputIds: string[],
    render: (result: CalculatorResult, nf: NumberFormatter) => string,
    afterRender?: (result: CalculatorResult) => void
): void {
    const display: ResultDisplay = new ResultDisplay(resultElementId);
    const inputs: Record<string, string> = readDomInputs(inputIds);
    const result: CalculatorResult = calculator.calculatePure(inputs);
    const explanation: string = result.explanation ?? "";
    if (explanation.startsWith("Error")) {
        display.showError(explanation.slice("Error: ".length));
        return;
    }
    display.showResult(render(result, NumberFormatter.createFromCurrentLocale()));
    if (afterRender) {
        afterRender(result);
    }
}

function showExplanation(result: CalculatorResult, _nf: NumberFormatter): string {
    return result.explanation ?? result.value;
}

function renderDilution(result: CalculatorResult, nf: NumberFormatter): string {
    const meta = result.metadata as unknown as DilutionMetadata;
    return "<p>" + meta.formula + "</p><p>Result: " + nf.format(meta.result, 4) + " " + meta.unit + "</p>";
}

function renderKsp(result: CalculatorResult, nf: NumberFormatter): string {
    const meta = result.metadata as unknown as KspMetadata;
    let html = "<p>K<sub>sp</sub> = " + nf.format(meta.Ksp, 6) + "</p>";
    html += "<p>Molar Solubility (s) = " + nf.format(meta.solubility, 6) + " M</p>";
    html += "<p>[A<sup>" + meta.stoichB + "+</sup>] = " + nf.format(meta.concA, 6) + " M</p>";
    html += "<p>[B<sup>" + meta.stoichA + "-</sup>] = " + nf.format(meta.concB, 6) + " M</p>";
    html += "<p>Charges shown are the minimal integer charges satisfying neutrality for salt type " + meta.saltType + "</p>";
    return html;
}

function renderCommonIon(result: CalculatorResult, nf: NumberFormatter): string {
    const meta = result.metadata as unknown as CommonIonMetadata;
    let html = "<p>Molar Solubility (with common ion) = " + nf.format(meta.solubilityWithCommonIon, 6) + " M</p>";
    html += "<p>Molar Solubility (without common ion) = " + nf.format(meta.solubilityWithoutCommonIon, 6) + " M</p>";
    html += "<p>[A] = " + nf.format(meta.concA, 6) + " M</p>";
    html += "<p>[B] = " + nf.format(meta.concB, 6) + " M</p>";
    html += "<p>Solubility Ratio = " + nf.format(meta.solubilityRatio, 6) + "</p>";
    if (!meta.approxValid) {
        html += "<p>Warning: dissolved B (" + nf.format(meta.stoichB * meta.solubilityWithCommonIon, 6) + " M) exceeds 5% of the common ion concentration, so the s &lt;&lt; C approximation may be inaccurate; solve the exact polynomial for a rigorous result.</p>";
    }
    return html;
}

function renderTitrationChart(result: CalculatorResult): void {
    const chartData: unknown = result.chartData;
    if (Array.isArray(chartData)) {
        renderTitrationCurve("titration-chart", chartData);
    }
}

// Backwards-compatible free functions. The calculator classes are DOM-free;
// these entry points exist only for the pre-migration index.html wiring and
// the tests that still drive the legacy element ids.
export function calculateDilution(): void {
    runLegacy(new DilutionCalculator(), "dilution-result", DILUTION_IDS, renderDilution);
}

export function calculateMassPercent(): void {
    runLegacy(new MassPercentCalculator(), "mass-percent-result",
        ["mass-solute", "mass-solution", "concentration-unit"], showExplanation);
}

export function calculateMixing(): void {
    runLegacy(new MixingCalculator(), "mixing-result", ["mix-C1", "mix-V1", "mix-C2", "mix-V2"], showExplanation);
}

export function calculateBufferSolution(): void {
    runLegacy(new BufferSolutionCalculator(), "buffer-result",
        ["buffer-pKa", "buffer-HA", "buffer-Aminus", "buffer-pH", "buffer-ratio", "buffer-solve-for"], showExplanation);
}

export function calculatePKaPKb(): void {
    runLegacy(new PKaPKbCalculator(), "pka-pkb-result",
        ["pka-pkb-input-value", "pka-pkb-input-type"], showExplanation);
}

export function calculateKsp(): void {
    runLegacy(new KspCalculator(), "ksp-result",
        ["ksp-value", "ksp-molar-solubility", "ksp-salt-type", "ksp-solve-for"], renderKsp);
}

export function calculateColligativeProperties(): void {
    runLegacy(new ColligativePropertiesCalculator(), "colligative-result", COLLIGATIVE_IDS, showExplanation);
}

export function calculateTitrationCurve(): void {
    runLegacy(new TitrationCurveCalculator(), "titration-result", TITRATION_IDS, showExplanation, renderTitrationChart);
}

export function calculateDebyeHuckel(): void {
    runLegacy(new DebyeHuckelCalculator(), "debye-huckel-result",
        ["dh-zplus", "dh-zminus", "dh-concentration", "dh-ion-size"], showExplanation);
}

export function calculateCommonIonEffect(): void {
    runLegacy(new CommonIonEffectCalculator(), "common-ion-result",
        ["common-ion-Ksp", "common-ion-concentration", "common-ion-salt-type"], renderCommonIon);
}
