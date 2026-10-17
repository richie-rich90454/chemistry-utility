import { NumberFormatter } from "../i18n/numberFormatter.js";
import type { CalculatorResult } from "./pureCalculator.js";

const GAS_CONSTANT = 8.314;
const SERIES_STEPS = 30;
const SERIES_DEFAULT_END_TIME = 10;
const ORDER_GRID = [0, 0.5, 1, 1.5, 2, 2.5, 3];

/**
 * A point on the concentration-vs-time series produced by the integrated
 * rate law. The chart layer consumes this shape; it is declared here so the
 * pure layer never has to import the Chart.js-backed renderer.
 */
export interface ConcentrationTimePoint {
    time: number;
    concentration: number;
}

interface DataPoint {
    t: number;
    c: number;
}

function formatter(): NumberFormatter {
    return NumberFormatter.createFromCurrentLocale();
}

function readNumber(inputs: Record<string, string>, key: string): number {
    return parseFloat(inputs[key] ?? "");
}

function readText(inputs: Record<string, string>, key: string): string {
    return inputs[key] ?? "";
}

/**
 * Rate constant from the Arrhenius equation k = A*e^(-Ea/(R*T)), solved for
 * k, Ea, T, or A. Ea is supplied in kJ/mol and converted to J/mol here.
 */
export function arrhenius(inputs: Record<string, string>): CalculatorResult {
    const solveFor = readText(inputs, "arrhenius-solve-for");
    const A = readNumber(inputs, "arrhenius-A");
    const Ea = readNumber(inputs, "arrhenius-Ea");
    const T = readNumber(inputs, "arrhenius-T");
    const k = readNumber(inputs, "arrhenius-k");
    const EaJ = Ea * 1000;
    let result: number;
    let unit: string;
    let formula: string;
    if (solveFor === "k") {
        if (isNaN(A) || isNaN(Ea) || isNaN(T)) {
            throw new Error("Missing or invalid inputs for arrhenius-A, arrhenius-Ea, arrhenius-T");
        }
        if (T <= 0) {
            throw new Error("Temperature must be positive");
        }
        if (A <= 0) {
            throw new Error("Frequency factor A must be positive");
        }
        result = A * Math.exp(-EaJ / (GAS_CONSTANT * T));
        unit = "s\u207B\u00B9";
        formula = "k = A\u00B7e^(-Ea/RT)";
    } else if (solveFor === "Ea") {
        if (isNaN(A) || isNaN(T) || isNaN(k)) {
            throw new Error("Missing or invalid inputs for arrhenius-A, arrhenius-T, arrhenius-k");
        }
        if (T <= 0) {
            throw new Error("Temperature must be positive");
        }
        if (A <= 0) {
            throw new Error("Frequency factor A must be positive");
        }
        if (k <= 0) {
            throw new Error("Rate constant k must be positive");
        }
        result = (-GAS_CONSTANT * T * Math.log(k / A)) / 1000;
        unit = "kJ/mol";
        formula = "Ea = -RT\u00B7ln(k/A)";
    } else if (solveFor === "T") {
        if (isNaN(A) || isNaN(Ea) || isNaN(k)) {
            throw new Error("Missing or invalid inputs for arrhenius-A, arrhenius-Ea, arrhenius-k");
        }
        if (A <= 0) {
            throw new Error("Frequency factor A must be positive");
        }
        if (k <= 0) {
            throw new Error("Rate constant k must be positive");
        }
        if (k >= A) {
            throw new Error("k must be less than A for a valid temperature");
        }
        result = -EaJ / (GAS_CONSTANT * Math.log(k / A));
        unit = "K";
        formula = "T = -Ea/(R\u00B7ln(k/A))";
    } else if (solveFor === "A") {
        if (isNaN(Ea) || isNaN(T) || isNaN(k)) {
            throw new Error("Missing or invalid inputs for arrhenius-Ea, arrhenius-T, arrhenius-k");
        }
        if (T <= 0) {
            throw new Error("Temperature must be positive");
        }
        if (k <= 0) {
            throw new Error("Rate constant k must be positive");
        }
        result = k / Math.exp(-EaJ / (GAS_CONSTANT * T));
        unit = "s\u207B\u00B9";
        formula = "A = k / e^(-Ea/RT)";
    } else {
        throw new Error("Invalid solveFor value");
    }
    const formatted = formatter().format(result, 4);
    return {
        value: formatted + " " + unit,
        explanation: formula + " = " + formatted + " " + unit,
        metadata: { formula: formula, result: result, unit: unit }
    };
}

/**
 * Rate law rate = k[A]^m[B]^n from two initial-rate experiments. Orders are
 * read off the experiment pair that varies only one concentration; when both
 * vary, a half-integer grid search picks the best-fitting pair and reports
 * the fit error so a poor fit stays visible.
 */
export function rateLaw(inputs: Record<string, string>): CalculatorResult {
    const A1 = readNumber(inputs, "ratelaw-A1");
    const B1 = readNumber(inputs, "ratelaw-B1");
    const rate1 = readNumber(inputs, "ratelaw-rate1");
    const A2 = readNumber(inputs, "ratelaw-A2");
    const B2 = readNumber(inputs, "ratelaw-B2");
    const rate2 = readNumber(inputs, "ratelaw-rate2");
    if (isNaN(A1) || isNaN(B1) || isNaN(rate1) || isNaN(A2) || isNaN(B2) || isNaN(rate2)) {
        throw new Error("Missing or invalid inputs for ratelaw-A1, ratelaw-B1, ratelaw-rate1, ratelaw-A2, ratelaw-B2, ratelaw-rate2");
    }
    if (A1 <= 0 || A2 <= 0) {
        throw new Error("Concentrations of A must be positive");
    }
    if (B1 <= 0 || B2 <= 0) {
        throw new Error("Concentrations of B must be positive");
    }
    if (rate1 <= 0 || rate2 <= 0) {
        throw new Error("Rates must be positive");
    }
    let m: number;
    let n: number;
    let orderNote = "";
    let fitError = NaN;
    if (Math.abs(B1 - B2) < 1e-10) {
        if (Math.abs(A1 - A2) < 1e-10) {
            throw new Error("Experiments must differ in at least one concentration");
        }
        m = Math.log(rate2 / rate1) / Math.log(A2 / A1);
        m = Math.round(m * 100) / 100;
        n = 0;
        orderNote = "Order n is underdetermined: B does not vary, so n is reported as 0 (not measurable from these experiments).";
    } else if (Math.abs(A1 - A2) < 1e-10) {
        n = Math.log(rate2 / rate1) / Math.log(B2 / B1);
        n = Math.round(n * 100) / 100;
        m = 0;
        orderNote = "Order m is underdetermined: A does not vary, so m is reported as 0 (not measurable from these experiments).";
    } else {
        let bestM = 0;
        let bestN = 0;
        let bestError = Infinity;
        let rateRatio = rate2 / rate1;
        let aRatio = A2 / A1;
        let bRatio = B2 / B1;
        for (let gi = 0; gi < ORDER_GRID.length; gi++) {
            for (let gj = 0; gj < ORDER_GRID.length; gj++) {
                let mi = ORDER_GRID[gi];
                let ni = ORDER_GRID[gj];
                let predicted = Math.pow(aRatio, mi) * Math.pow(bRatio, ni);
                let err = Math.abs(predicted - rateRatio);
                if (err < bestError) {
                    bestError = err;
                    bestM = mi;
                    bestN = ni;
                }
            }
        }
        m = bestM;
        n = bestN;
        fitError = bestError;
    }
    let k = rate1 / (Math.pow(A1, m) * Math.pow(B1, n));
    let expression = "rate = " + formatter().format(k, 4);
    if (m !== 0) {
        if (m === 1) {
            expression += "[A]";
        } else {
            expression += "[A]^" + m;
        }
    }
    if (n !== 0) {
        if (n === 1) {
            expression += "[B]";
        } else {
            expression += "[B]^" + n;
        }
    }
    let nf = formatter();
    const kFormatted = nf.format(k, 4);
    const explanation = "Order with respect to A: " + m + "; Order with respect to B: " + n + "; Rate constant k = " + kFormatted + "; Rate law: " + expression + (orderNote !== "" ? "; " + orderNote : "") + (isNaN(fitError) ? "" : "; grid-search fit error = " + nf.format(fitError, 6));
    return {
        value: expression,
        explanation: explanation,
        metadata: { orderA: m, orderB: n, k: k, rateLaw: expression, underdeterminedNote: orderNote, fitError: fitError }
    };
}

/**
 * Concentration or time from the integrated rate laws for zero, first, and
 * second order reactions. Returns the concentration-vs-time series for the
 * solved interval as `chartData` so the chart layer can plot it.
 */
export function integratedRateLaw(inputs: Record<string, string>): CalculatorResult {
    const solveFor = readText(inputs, "irl-solve-for");
    const order = parseInt(readText(inputs, "irl-order"), 10);
    const A0 = readNumber(inputs, "irl-A0");
    const k = readNumber(inputs, "irl-k");
    const t = readNumber(inputs, "irl-t");
    const A = readNumber(inputs, "irl-A");
    let result: number;
    let unit: string;
    let formula: string;
    if (solveFor === "concentration") {
        if (isNaN(A0) || isNaN(k) || isNaN(t)) {
            throw new Error("Missing or invalid inputs for irl-A0, irl-k, irl-t");
        }
        if (A0 <= 0) {
            throw new Error("Initial concentration must be positive");
        }
        if (k < 0) {
            throw new Error("Rate constant cannot be negative");
        }
        if (t < 0) {
            throw new Error("Time cannot be negative");
        }
        if (order === 0) {
            result = Math.max(0, A0 - k * t);
            formula = "[A] = [A]\u2080 - kt";
        } else if (order === 1) {
            result = A0 * Math.exp(-k * t);
            formula = "[A] = [A]\u2080\u00B7e^(-kt)";
        } else if (order === 2) {
            result = A0 / (1 + k * A0 * t);
            formula = "[A] = [A]\u2080 / (1 + k[A]\u2080t)";
        } else {
            throw new Error("Order must be 0, 1, or 2");
        }
        unit = "M";
    } else if (solveFor === "time") {
        if (isNaN(A0) || isNaN(k) || isNaN(A)) {
            throw new Error("Missing or invalid inputs for irl-A0, irl-k, irl-A");
        }
        if (A0 <= 0) {
            throw new Error("Initial concentration must be positive");
        }
        if (k <= 0) {
            throw new Error("Rate constant must be positive for solving time");
        }
        if (A <= 0) {
            throw new Error("Concentration must be positive");
        }
        if (order === 0) {
            if (A >= A0) {
                throw new Error("Concentration must be less than initial concentration for zero order");
            }
            result = (A0 - A) / k;
            formula = "t = ([A]\u2080 - [A]) / k";
        } else if (order === 1) {
            if (A >= A0) {
                throw new Error("Concentration must be less than initial concentration for first order");
            }
            result = Math.log(A0 / A) / k;
            formula = "t = ln([A]\u2080/[A]) / k";
        } else if (order === 2) {
            if (A >= A0) {
                throw new Error("Concentration must be less than initial concentration for second order");
            }
            result = (1 / A - 1 / A0) / k;
            formula = "t = (1/[A] - 1/[A]\u2080) / k";
        } else {
            throw new Error("Order must be 0, 1, or 2");
        }
        unit = "s";
    } else {
        throw new Error("Invalid solveFor value");
    }
    const formatted = formatter().format(result, 4);
    const endTime = solveFor === "concentration" ? t : result;
    return {
        value: formatted + " " + unit,
        explanation: formula + " = " + formatted + " " + unit,
        chartData: buildConcentrationTimeSeries(order, A0, k, endTime),
        metadata: { formula: formula, result: result, unit: unit }
    };
}

/**
 * Samples the concentration-vs-time curve for an integrated rate law from
 * t=0 to `endTime` in {@link SERIES_STEPS} intervals. A non-positive or
 * non-finite end time falls back to a default window so the chart always
 * has a span.
 */
export function buildConcentrationTimeSeries(order: number, A0: number, k: number, endTime: number): ConcentrationTimePoint[] {
    let points: ConcentrationTimePoint[] = [];
    if (endTime <= 0 || !isFinite(endTime)) {
        endTime = SERIES_DEFAULT_END_TIME;
    }
    let stepSize = endTime / SERIES_STEPS;
    let i: number;
    for (i = 0; i <= SERIES_STEPS; i++) {
        let time = i * stepSize;
        let conc: number;
        if (order === 0) {
            conc = A0 - k * time;
        } else if (order === 1) {
            conc = A0 * Math.exp(-k * time);
        } else {
            conc = A0 / (1 + k * A0 * time);
        }
        if (conc < 0) {
            conc = 0;
        }
        points.push({ "time": time, "concentration": conc });
    }
    return points;
}

/**
 * Reaction order from concentration-time data. Zero order fits [A] vs t,
 * first order ln[A] vs t, and second order 1/[A] vs t; the order with the
 * highest R\u00B2 wins and its fitted slope is the rate constant.
 */
export function reactionOrder(inputs: Record<string, string>): CalculatorResult {
    let points = parseTimeConcentrationData(readText(inputs, "reaction-order-data"));
    let r2Zero = calculateRSquared(points, function (p: DataPoint): number { return p.c; });
    let r2First = calculateRSquared(points, function (p: DataPoint): number { return Math.log(p.c); });
    let r2Second = calculateRSquared(points, function (p: DataPoint): number { return 1 / p.c; });
    let bestOrder = 0;
    let bestR2 = r2Zero;
    if (r2First > bestR2) {
        bestOrder = 1;
        bestR2 = r2First;
    }
    if (r2Second > bestR2) {
        bestOrder = 2;
        bestR2 = r2Second;
    }
    let k = calculateSlope(points, bestOrder);
    let kUnit: string;
    if (bestOrder === 0) {
        kUnit = "M/s";
    } else if (bestOrder === 1) {
        kUnit = "s\u207B\u00B9";
    } else {
        kUnit = "M\u207B\u00B9s\u207B\u00B9";
    }
    let nf = formatter();
    let kAbs = Math.abs(k);
    let value = "Best-fit reaction order: " + bestOrder;
    let explanation = "Best-fit reaction order: " + bestOrder + "; ";
    explanation += "R\u00B2 zero order: " + nf.format(r2Zero, 6) + "; ";
    explanation += "R\u00B2 first order: " + nf.format(r2First, 6) + "; ";
    explanation += "R\u00B2 second order: " + nf.format(r2Second, 6) + "; ";
    explanation += "Rate constant k \u2248 " + nf.format(kAbs, 6) + " " + kUnit;
    return {
        value: value,
        explanation: explanation,
        metadata: {
            bestOrder: bestOrder,
            r2Zero: r2Zero,
            r2First: r2First,
            r2Second: r2Second,
            k: kAbs,
            kUnit: kUnit
        }
    };
}

/**
 * Parses "t1,c1;t2,c2;..." (or one "t,c" pair per line) into data points.
 * Concentrations must be positive and at least three points are required
 * for an order determination.
 */
export function parseTimeConcentrationData(dataInput: string): DataPoint[] {
    if (!dataInput || dataInput.trim() === "") {
        throw new Error("Please enter time-concentration data");
    }
    let points: DataPoint[] = [];
    let entries = dataInput.split(/[;\n]+/);
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i].trim();
        if (entry === "") continue;
        let parts = entry.split(",");
        if (parts.length !== 2) {
            throw new Error("Invalid data format. Use t1,c1;t2,c2;... or one pair per line");
        }
        let t = parseFloat(parts[0].trim());
        let c = parseFloat(parts[1].trim());
        if (isNaN(t) || isNaN(c)) {
            throw new Error("Invalid number in data: " + entry);
        }
        if (c <= 0) {
            throw new Error("Concentrations must be positive for order determination");
        }
        points.push({ t: t, c: c });
    }
    if (points.length < 3) {
        throw new Error("At least 3 data points are required");
    }
    return points;
}

/** Squared Pearson correlation between t and `transform(c)` over the points. */
export function calculateRSquared(points: DataPoint[], transform: (p: DataPoint) => number): number {
    let n = points.length;
    if (n < 2) return 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    for (let i = 0; i < n; i++) {
        let x = points[i].t;
        let y = transform(points[i]);
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
    }
    let denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denom === 0) return 0;
    let r = (n * sumXY - sumX * sumY) / denom;
    return r * r;
}

/** Least-squares slope of the linear plot for the given order. */
export function calculateSlope(points: DataPoint[], order: number): number {
    let n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
        let x = points[i].t;
        let y: number;
        if (order === 0) {
            y = points[i].c;
        } else if (order === 1) {
            y = Math.log(points[i].c);
        } else {
            y = 1 / points[i].c;
        }
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }
    let denom = n * sumX2 - sumX * sumX;
    if (denom === 0) {
        throw new Error("Cannot determine slope: all time values are identical");
    }
    return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Rate constant from collision theory k = Z*p*e^(-Ea/RT), solved for k, Z,
 * or the steric factor p. Ea is supplied in kJ/mol and converted to J/mol
 * here.
 */
export function collisionTheory(inputs: Record<string, string>): CalculatorResult {
    const solveFor = readText(inputs, "collision-solve-for");
    const Ea = readNumber(inputs, "collision-Ea");
    const T = readNumber(inputs, "collision-T");
    const Z = readNumber(inputs, "collision-Z");
    const p = readNumber(inputs, "collision-p");
    const k = readNumber(inputs, "collision-k");
    const EaJ = Ea * 1000;
    let result: number;
    let unit: string;
    let formula: string;
    if (solveFor === "k") {
        if (isNaN(Ea) || isNaN(T) || isNaN(Z) || isNaN(p)) {
            throw new Error("Missing or invalid inputs for collision-Ea, collision-T, collision-Z, collision-p");
        }
        if (T <= 0) {
            throw new Error("Temperature must be positive");
        }
        if (Z <= 0) {
            throw new Error("Collision frequency must be positive");
        }
        if (p < 0 || p > 1) {
            throw new Error("Steric factor must be between 0 and 1");
        }
        result = Z * p * Math.exp(-EaJ / (GAS_CONSTANT * T));
        unit = "s\u207B\u00B9";
        formula = "k = Z\u00B7p\u00B7e^(-Ea/RT)";
    } else if (solveFor === "Z") {
        if (isNaN(Ea) || isNaN(T) || isNaN(p) || isNaN(k)) {
            throw new Error("Missing or invalid inputs for collision-Ea, collision-T, collision-p, collision-k");
        }
        if (T <= 0) {
            throw new Error("Temperature must be positive");
        }
        if (p <= 0) {
            throw new Error("Steric factor must be positive");
        }
        if (k <= 0) {
            throw new Error("Rate constant k must be positive");
        }
        let denominator = p * Math.exp(-EaJ / (GAS_CONSTANT * T));
        if (denominator === 0) {
            throw new Error("Cannot compute collision frequency: denominator is zero");
        }
        result = k / denominator;
        unit = "s\u207B\u00B9";
        formula = "Z = k / (p\u00B7e^(-Ea/RT))";
    } else if (solveFor === "p") {
        if (isNaN(Ea) || isNaN(T) || isNaN(Z) || isNaN(k)) {
            throw new Error("Missing or invalid inputs for collision-Ea, collision-T, collision-Z, collision-k");
        }
        if (T <= 0) {
            throw new Error("Temperature must be positive");
        }
        if (Z <= 0) {
            throw new Error("Collision frequency must be positive");
        }
        if (k <= 0) {
            throw new Error("Rate constant k must be positive");
        }
        let denominator = Z * Math.exp(-EaJ / (GAS_CONSTANT * T));
        if (denominator === 0) {
            throw new Error("Cannot compute steric factor: denominator is zero");
        }
        result = k / denominator;
        unit = "";
        formula = "p = k / (Z\u00B7e^(-Ea/RT))";
        if (result < 0 || result > 1) {
            formula += " (warning: steric factor should lie in [0, 1]; check inputs)";
        }
    } else {
        throw new Error("Invalid solveFor value");
    }
    let fractionEffective = Math.exp(-EaJ / (GAS_CONSTANT * T));
    let formatted = formatter().format(result, 6);
    let value = unit ? formatted + " " + unit : formatted;
    let explanation = formula + " = " + formatted + (unit ? " " + unit : "");
    explanation += "; Fraction of effective collisions (e^(-Ea/RT)): " + formatter().format(fractionEffective, 6);
    return {
        value: value,
        explanation: explanation,
        metadata: {
            fractionEffective: fractionEffective,
            formula: formula,
            unit: unit,
            result: result
        }
    };
}
