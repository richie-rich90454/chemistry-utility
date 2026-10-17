import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import { arrhenius, rateLaw, integratedRateLaw, reactionOrder, collisionTheory } from "./calculators/kinetics.js";
import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";
import { renderConcentrationTimeChart } from "./dom/chartBindings.js";

/**
 * Rate constant from the Arrhenius equation k = A*e^(-Ea/(R*T)), solved for
 * k, Ea, T, or A.
 */
export class ArrheniusCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "arrhenius";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return arrhenius(inputs);
    }
}

/**
 * Rate law rate = k[A]^m[B]^n from two experiments with initial rates.
 */
export class RateLawCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "rate-law";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return rateLaw(inputs);
    }
}

/**
 * Concentration or time from the integrated rate laws for zero, first, and
 * second order reactions.
 */
export class IntegratedRateLawCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "integrated-rate-law";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return integratedRateLaw(inputs);
    }
}

/**
 * Reaction order from concentration-time data, by comparing linear fits of
 * [A], ln[A], and 1/[A] against time.
 */
export class ReactionOrderCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "reaction-order";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return reactionOrder(inputs);
    }
}

/**
 * Rate constant from collision theory k = Z*p*e^(-Ea/RT), solved for k, Z,
 * or the steric factor p.
 */
export class CollisionTheoryCalculator extends PureCalculator {
    protected getCalculatorId(): string {
        return "collision-theory";
    }

    protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
        return collisionTheory(inputs);
    }
}

interface FormulaMetadata {
    formula: string;
    result: number;
    unit: string;
}

interface RateLawMetadata {
    orderA: number;
    orderB: number;
    k: number;
    rateLaw: string;
    underdeterminedNote: string;
    fitError: number;
}

interface ReactionOrderMetadata {
    bestOrder: number;
    r2Zero: number;
    r2First: number;
    r2Second: number;
    k: number;
    kUnit: string;
}

interface CollisionTheoryMetadata {
    fractionEffective: number;
    formula: string;
    unit: string;
    result: number;
}

function metadataOf<T>(result: CalculatorResult): T {
    return result.metadata as unknown as T;
}

function readInputs(ids: string[]): Record<string, string> {
    let inputs: Record<string, string> = {};
    for (let i = 0; i < ids.length; i++) {
        inputs[ids[i]] = new InputElement(ids[i]).getStringValue();
    }
    return inputs;
}

function readIntegratedRateLawInputs(): Record<string, string> {
    if (!(document.getElementById("irl-order") instanceof HTMLSelectElement)) {
        throw new Error("Reaction order selector is missing");
    }
    return readInputs(["irl-solve-for", "irl-order", "irl-A0", "irl-k", "irl-t", "irl-A"]);
}

/**
 * Legacy DOM entry point shared by the free functions below. Reads the DOM
 * inputs, runs the DOM-free calculator, and renders the outcome on the
 * legacy result element. A failed run is reported through the same
 * "Error: …" banner the old DOM calculators rendered.
 */
function runLegacy(
    calculator: PureCalculator,
    resultElementId: string,
    read: () => Record<string, string>,
    render: (result: CalculatorResult, display: ResultDisplay) => void
): void {
    let display: ResultDisplay = new ResultDisplay(resultElementId);
    let inputs: Record<string, string>;
    try {
        inputs = read();
    } catch (error) {
        display.showError((error as Error).message);
        return;
    }
    let result: CalculatorResult = calculator.calculatePure(inputs);
    let explanation: string = result.explanation ?? "";
    if (explanation.startsWith("Error")) {
        display.showError(explanation.slice("Error: ".length));
        return;
    }
    render(result, display);
}

function showFormula(display: ResultDisplay, result: CalculatorResult): void {
    let meta: FormulaMetadata = metadataOf(result);
    display.showFormula(meta.formula, meta.result, meta.unit);
}

function rateLawHtml(meta: RateLawMetadata, nf: NumberFormatter): string {
    let html = "<p>Order with respect to A: <strong>" + meta.orderA + "</strong></p>";
    html += "<p>Order with respect to B: <strong>" + meta.orderB + "</strong></p>";
    html += "<p>Rate constant k = " + nf.format(meta.k, 4) + "</p>";
    html += "<p>Rate law: <strong>" + meta.rateLaw + "</strong></p>";
    if (meta.underdeterminedNote !== "") {
        html += "<p>" + meta.underdeterminedNote + "</p>";
    }
    if (!isNaN(meta.fitError)) {
        html += "<p>Grid-search fit error |predicted - observed rate ratio| = " + nf.format(meta.fitError, 6) + " (half-integer grid 0..3; a large error means the true orders lie outside the grid or more experiments are needed).</p>";
    }
    return html;
}

function reactionOrderHtml(meta: ReactionOrderMetadata, nf: NumberFormatter): string {
    let html = "<p>Best-fit reaction order: <strong>" + meta.bestOrder + "</strong></p>";
    html += "<p>R\u00B2 values:</p>";
    html += "<ul>";
    html += "<li>Zero order ([A] vs t): " + nf.format(meta.r2Zero, 6) + "</li>";
    html += "<li>First order (ln[A] vs t): " + nf.format(meta.r2First, 6) + "</li>";
    html += "<li>Second order (1/[A] vs t): " + nf.format(meta.r2Second, 6) + "</li>";
    html += "</ul>";
    html += "<p>Rate constant k \u2248 " + nf.format(meta.k, 6) + " " + meta.kUnit + "</p>";
    return html;
}

function collisionTheoryHtml(meta: CollisionTheoryMetadata, nf: NumberFormatter): string {
    let html = "<p>" + meta.formula + "</p>";
    html += "<p>Result: " + nf.format(meta.result, 6) + " " + meta.unit + "</p>";
    html += "<p>Fraction of effective collisions (e^(-Ea/RT)): " + nf.format(meta.fractionEffective, 6) + "</p>";
    return html;
}

// Backwards-compatible free functions. The calculator classes are DOM-free;
// these entry points exist only for the pre-migration index.html wiring and
// the tests that still drive the legacy element ids.
export function calculateArrhenius(): void {
    runLegacy(new ArrheniusCalculator(), "arrhenius-result", function (): Record<string, string> {
        return readInputs(["arrhenius-A", "arrhenius-Ea", "arrhenius-T", "arrhenius-k", "arrhenius-solve-for"]);
    }, function (result: CalculatorResult, display: ResultDisplay): void {
        showFormula(display, result);
    });
}

export function calculateRateLaw(): void {
    runLegacy(new RateLawCalculator(), "rate-law-result", function (): Record<string, string> {
        return readInputs(["ratelaw-A1", "ratelaw-B1", "ratelaw-rate1", "ratelaw-A2", "ratelaw-B2", "ratelaw-rate2"]);
    }, function (result: CalculatorResult, display: ResultDisplay): void {
        display.showResult(rateLawHtml(metadataOf<RateLawMetadata>(result), NumberFormatter.createFromCurrentLocale()));
    });
}

export function calculateIntegratedRateLaw(): void {
    runLegacy(new IntegratedRateLawCalculator(), "integrated-rate-law-result", readIntegratedRateLawInputs, function (result: CalculatorResult, display: ResultDisplay): void {
        showFormula(display, result);
        let chartData: unknown = result.chartData;
        if (Array.isArray(chartData)) {
            renderConcentrationTimeChart("integrated-rate-law-chart", chartData);
        }
    });
}

export function calculateReactionOrder(): void {
    runLegacy(new ReactionOrderCalculator(), "reaction-order-result", function (): Record<string, string> {
        return readInputs(["reaction-order-data"]);
    }, function (result: CalculatorResult, display: ResultDisplay): void {
        display.showResult(reactionOrderHtml(metadataOf<ReactionOrderMetadata>(result), NumberFormatter.createFromCurrentLocale()));
    });
}

export function calculateCollisionTheory(): void {
    runLegacy(new CollisionTheoryCalculator(), "collision-theory-result", function (): Record<string, string> {
        return readInputs(["collision-Ea", "collision-T", "collision-Z", "collision-p", "collision-k", "collision-solve-for"]);
    }, function (result: CalculatorResult, display: ResultDisplay): void {
        display.showResult(collisionTheoryHtml(metadataOf<CollisionTheoryMetadata>(result), NumberFormatter.createFromCurrentLocale()));
    });
}
