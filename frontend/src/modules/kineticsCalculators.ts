import { Calculator } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";
import { ChartRenderer, ConcentrationTimePoint } from "./chartRenderer.js";

/**
 * Calculates the rate constant using the Arrhenius equation:
 * k = A * e^(-Ea/(R*T))
 * Can also solve for Ea, T, or A given the other values.
 * R = 8.314 J/(mol*K)
 */
export class ArrheniusCalculator extends SolveForCalculator {
    constructor() {
        super("arrhenius-result", [
            "arrhenius-A",
            "arrhenius-Ea",
            "arrhenius-T",
            "arrhenius-k"
        ], "arrhenius-solve-for");
    }

    protected performCalculation(): void {
        const solveFor = this.getSolveFor();
        const A = this.getInput("arrhenius-A").getValue();
        const Ea = this.getInput("arrhenius-Ea").getValue();
        const T = this.getInput("arrhenius-T").getValue();
        const k = this.getInput("arrhenius-k").getValue();
        const R = 8.314;
        // Ea input is in kJ/mol, convert to J/mol for calculation
        const EaJ = Ea * 1000;
        let result: number;
        let unit: string;
        let formula: string;
        if (solveFor === "k") {
            InputValidator.validateValues([A, Ea, T], ["arrhenius-A", "arrhenius-Ea", "arrhenius-T"]);
            if (T <= 0) {
                throw new Error("Temperature must be positive");
            }
            if (A <= 0) {
                throw new Error("Frequency factor A must be positive");
            }
            result = A * Math.exp(-EaJ / (R * T));
            unit = "s\u207B\u00B9";
            formula = "k = A\u00B7e^(-Ea/RT)";
        } else if (solveFor === "Ea") {
            InputValidator.validateValues([A, T, k], ["arrhenius-A", "arrhenius-T", "arrhenius-k"]);
            if (T <= 0) {
                throw new Error("Temperature must be positive");
            }
            if (A <= 0) {
                throw new Error("Frequency factor A must be positive");
            }
            if (k <= 0) {
                throw new Error("Rate constant k must be positive");
            }
            // Result in J/mol, convert to kJ/mol
            result = (-R * T * Math.log(k / A)) / 1000;
            unit = "kJ/mol";
            formula = "Ea = -RT\u00B7ln(k/A)";
        } else if (solveFor === "T") {
            InputValidator.validateValues([A, Ea, k], ["arrhenius-A", "arrhenius-Ea", "arrhenius-k"]);
            if (A <= 0) {
                throw new Error("Frequency factor A must be positive");
            }
            if (k <= 0) {
                throw new Error("Rate constant k must be positive");
            }
            if (k >= A) {
                throw new Error("k must be less than A for a valid temperature");
            }
            result = -EaJ / (R * Math.log(k / A));
            unit = "K";
            formula = "T = -Ea/(R\u00B7ln(k/A))";
        } else if (solveFor === "A") {
            InputValidator.validateValues([Ea, T, k], ["arrhenius-Ea", "arrhenius-T", "arrhenius-k"]);
            if (T <= 0) {
                throw new Error("Temperature must be positive");
            }
            if (k <= 0) {
                throw new Error("Rate constant k must be positive");
            }
            result = k / Math.exp(-EaJ / (R * T));
            unit = "s\u207B\u00B9";
            formula = "A = k / e^(-Ea/RT)";
        } else {
            throw new Error("Invalid solveFor value");
        }
        this.resultDisplay.showFormula(formula, result, unit);
    }
}

/**
 * Determines the rate law from two experiments with initial rates data.
 * rate = k[A]^m[B]^n
 * Inputs: two experiments with concentrations and rates
 * Output: orders m and n, rate constant k, rate law expression
 */
export class RateLawCalculator extends Calculator {
    constructor() {
        super("rate-law-result", [
            "ratelaw-A1",
            "ratelaw-B1",
            "ratelaw-rate1",
            "ratelaw-A2",
            "ratelaw-B2",
            "ratelaw-rate2"
        ]);
    }

    protected performCalculation(): void {
        const A1 = this.getInput("ratelaw-A1").getValue();
        const B1 = this.getInput("ratelaw-B1").getValue();
        const rate1 = this.getInput("ratelaw-rate1").getValue();
        const A2 = this.getInput("ratelaw-A2").getValue();
        const B2 = this.getInput("ratelaw-B2").getValue();
        const rate2 = this.getInput("ratelaw-rate2").getValue();
        InputValidator.validateValues(
            [A1, B1, rate1, A2, B2, rate2],
            ["ratelaw-A1", "ratelaw-B1", "ratelaw-rate1", "ratelaw-A2", "ratelaw-B2", "ratelaw-rate2"]
        );
        if (A1 <= 0 || A2 <= 0) {
            throw new Error("Concentrations of A must be positive");
        }
        if (B1 <= 0 || B2 <= 0) {
            throw new Error("Concentrations of B must be positive");
        }
        if (rate1 <= 0 || rate2 <= 0) {
            throw new Error("Rates must be positive");
        }
        // Determine order with respect to A: hold B constant (need B1 == B2)
        // Determine order with respect to B: hold A constant (need A1 == A2)
        // If neither pair is equal, we can only solve if one variable changes
        let m: number;
        let n: number;
        if (Math.abs(B1 - B2) < 1e-10) {
            // B is constant, find order m from A
            if (Math.abs(A1 - A2) < 1e-10) {
                throw new Error("Experiments must differ in at least one concentration");
            }
            m = Math.log(rate2 / rate1) / Math.log(A2 / A1);
            m = Math.round(m * 100) / 100;
            // Now find order n - need another experiment or assume n=0 if only A varies
            // With two experiments where B is constant, we can only determine m
            // Assume n=0 if B doesn't change (or require user input)
            n = 0;
        } else if (Math.abs(A1 - A2) < 1e-10) {
            // A is constant, find order n from B
            n = Math.log(rate2 / rate1) / Math.log(B2 / B1);
            n = Math.round(n * 100) / 100;
            m = 0;
        } else {
            // Both A and B change - try to determine both orders
            // This requires solving a system; we'll try rounding to nearest integer
            // Method: solve for m and n from the ratio equation
            // rate2/rate1 = (A2/A1)^m * (B2/B1)^n
            // This is one equation with two unknowns, so we need additional assumption
            // We try integer orders 0, 1, 2 for m and n and find the best fit
            let bestM = 0;
            let bestN = 0;
            let bestError = Infinity;
            let rateRatio = rate2 / rate1;
            let aRatio = A2 / A1;
            let bRatio = B2 / B1;
            for (let mi = 0; mi <= 3; mi++) {
                for (let ni = 0; ni <= 3; ni++) {
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
        }
        // Calculate rate constant k from experiment 1
        let k = rate1 / (Math.pow(A1, m) * Math.pow(B1, n));
        // Build rate law expression
        let expression = "rate = " + this.numberFormatter.format(k, 4);
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
        let html = "<p>Order with respect to A: <strong>" + m + "</strong></p>";
        html += "<p>Order with respect to B: <strong>" + n + "</strong></p>";
        html += "<p>Rate constant k = " + this.numberFormatter.format(k, 4) + "</p>";
        html += "<p>Rate law: <strong>" + expression + "</strong></p>";
        this.resultDisplay.showResult(html);
    }
}

/**
 * Calculates concentration or time using integrated rate laws for
 * zero, first, and second order reactions.
 * Zero order: [A] = [A]0 - kt
 * First order: ln[A] = ln[A]0 - kt  =>  [A] = [A]0 * e^(-kt)
 * Second order: 1/[A] = 1/[A]0 + kt  =>  [A] = [A]0/(1 + k*[A]0*t)
 */
export class IntegratedRateLawCalculator extends SolveForCalculator {
    constructor() {
        super("integrated-rate-law-result", [
            "irl-order",
            "irl-A0",
            "irl-k",
            "irl-t",
            "irl-A"
        ], "irl-solve-for");
    }

    protected performCalculation(): void {
        const solveFor = this.getSolveFor();
        const orderSelect = document.getElementById("irl-order") as HTMLSelectElement;
        const order = parseInt(orderSelect.value, 10);
        const A0 = this.getInput("irl-A0").getValue();
        const k = this.getInput("irl-k").getValue();
        const t = this.getInput("irl-t").getValue();
        const A = this.getInput("irl-A").getValue();
        let result: number;
        let unit: string;
        let formula: string;
        if (solveFor === "concentration") {
            InputValidator.validateValues([A0, k, t], ["irl-A0", "irl-k", "irl-t"]);
            if (A0 <= 0) {
                throw new Error("Initial concentration must be positive");
            }
            if (k < 0) {
                throw new Error("Rate constant cannot be negative");
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
            InputValidator.validateValues([A0, k, A], ["irl-A0", "irl-k", "irl-A"]);
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
                result = Math.log(A0 / A) / k;
                formula = "t = ln([A]\u2080/[A]) / k";
            } else if (order === 2) {
                result = (1 / A - 1 / A0) / k;
                formula = "t = (1/[A] - 1/[A]\u2080) / k";
            } else {
                throw new Error("Order must be 0, 1, or 2");
            }
            unit = "s";
        } else {
            throw new Error("Invalid solveFor value");
        }
        this.resultDisplay.showFormula(formula, result, unit);
        let chartCanvas = document.getElementById("integrated-rate-law-chart");
        if (chartCanvas) {
            let endTime: number;
            if (solveFor === "concentration") {
                endTime = t;
            } else {
                endTime = result;
            }
            let points = this.buildConcentrationTimeSeries(order, A0, k, endTime);
            ChartRenderer.getInstance().renderConcentrationTimeChart("integrated-rate-law-chart", points);
        }
    }

    private buildConcentrationTimeSeries(order: number, A0: number, k: number, endTime: number): ConcentrationTimePoint[] {
        let points: ConcentrationTimePoint[] = [];
        if (endTime <= 0 || !isFinite(endTime)) {
            endTime = 10;
        }
        let steps = 30;
        let stepSize = endTime / steps;
        let i: number;
        for (i = 0; i <= steps; i++) {
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
}

/**
 * Determines reaction order from concentration-time data by testing
 * linear fits for zero, first, and second order.
 * Zero order: [A] vs t (linear)
 * First order: ln[A] vs t (linear)
 * Second order: 1/[A] vs t (linear)
 * Requires at least 4 data points.
 */
export class ReactionOrderCalculator extends Calculator {
    constructor() {
        super("reaction-order-result", ["reaction-order-data"]);
    }

    protected performCalculation(): void {
        const dataInput = this.getInput("reaction-order-data").getStringValue();
        if (!dataInput || dataInput.trim() === "") {
            throw new Error("Please enter time-concentration data");
        }
        // Parse data: format is "t1,c1;t2,c2;t3,c3;..." or "t1,c1\nt2,c2\n..."
        let points: Array<{ t: number; c: number }> = [];
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
        // Calculate R^2 for each order
        let r2Zero = this.calculateRSquared(points, function(p: { t: number; c: number }): number { return p.c; });
        let r2First = this.calculateRSquared(points, function(p: { t: number; c: number }): number { return Math.log(p.c); });
        let r2Second = this.calculateRSquared(points, function(p: { t: number; c: number }): number { return 1 / p.c; });
        // Determine best order
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
        // Calculate rate constant for best-fit order
        let k = this.calculateSlope(points, bestOrder);
        let html = "<p>Best-fit reaction order: <strong>" + bestOrder + "</strong></p>";
        html += "<p>R\u00B2 values:</p>";
        html += "<ul>";
        html += "<li>Zero order ([A] vs t): " + this.numberFormatter.format(r2Zero, 6) + "</li>";
        html += "<li>First order (ln[A] vs t): " + this.numberFormatter.format(r2First, 6) + "</li>";
        html += "<li>Second order (1/[A] vs t): " + this.numberFormatter.format(r2Second, 6) + "</li>";
        html += "</ul>";
        html += "<p>Rate constant k \u2248 " + this.numberFormatter.format(Math.abs(k), 6);
        if (bestOrder === 0) {
            html += " M/s";
        } else if (bestOrder === 1) {
            html += " s\u207B\u00B9";
        } else {
            html += " M\u207B\u00B9s\u207B\u00B9";
        }
        html += "</p>";
        this.resultDisplay.showResult(html);
    }

    private calculateRSquared(points: Array<{ t: number; c: number }>, transform: (p: { t: number; c: number }) => number): number {
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

    private calculateSlope(points: Array<{ t: number; c: number }>, order: number): number {
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
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }
}

/**
 * Calculates the rate constant using collision theory:
 * k = Z * e^(-Ea/RT) * p (steric factor)
 * Z = collision frequency
 * Inputs: activation energy Ea (kJ/mol), temperature T (K), steric factor p
 * Also can solve for collision frequency Z or steric factor p
 */
export class CollisionTheoryCalculator extends SolveForCalculator {
    constructor() {
        super("collision-theory-result", [
            "collision-Ea",
            "collision-T",
            "collision-Z",
            "collision-p",
            "collision-k"
        ], "collision-solve-for");
    }

    protected performCalculation(): void {
        const solveFor = this.getSolveFor();
        const Ea = this.getInput("collision-Ea").getValue();
        const T = this.getInput("collision-T").getValue();
        const Z = this.getInput("collision-Z").getValue();
        const p = this.getInput("collision-p").getValue();
        const k = this.getInput("collision-k").getValue();
        const R = 8.314;
        // Ea in kJ/mol, convert to J/mol
        const EaJ = Ea * 1000;
        let result: number;
        let unit: string;
        let formula: string;
        if (solveFor === "k") {
            InputValidator.validateValues([Ea, T, Z, p], ["collision-Ea", "collision-T", "collision-Z", "collision-p"]);
            if (T <= 0) {
                throw new Error("Temperature must be positive");
            }
            if (Z <= 0) {
                throw new Error("Collision frequency must be positive");
            }
            if (p < 0 || p > 1) {
                throw new Error("Steric factor must be between 0 and 1");
            }
            result = Z * p * Math.exp(-EaJ / (R * T));
            unit = "s\u207B\u00B9";
            formula = "k = Z\u00B7p\u00B7e^(-Ea/RT)";
        } else if (solveFor === "Z") {
            InputValidator.validateValues([Ea, T, p, k], ["collision-Ea", "collision-T", "collision-p", "collision-k"]);
            if (T <= 0) {
                throw new Error("Temperature must be positive");
            }
            if (p <= 0) {
                throw new Error("Steric factor must be positive");
            }
            if (k <= 0) {
                throw new Error("Rate constant k must be positive");
            }
            let denominator = p * Math.exp(-EaJ / (R * T));
            if (denominator === 0) {
                throw new Error("Cannot compute collision frequency: denominator is zero");
            }
            result = k / denominator;
            unit = "s\u207B\u00B9";
            formula = "Z = k / (p\u00B7e^(-Ea/RT))";
        } else if (solveFor === "p") {
            InputValidator.validateValues([Ea, T, Z, k], ["collision-Ea", "collision-T", "collision-Z", "collision-k"]);
            if (T <= 0) {
                throw new Error("Temperature must be positive");
            }
            if (Z <= 0) {
                throw new Error("Collision frequency must be positive");
            }
            if (k <= 0) {
                throw new Error("Rate constant k must be positive");
            }
            let denominator = Z * Math.exp(-EaJ / (R * T));
            if (denominator === 0) {
                throw new Error("Cannot compute steric factor: denominator is zero");
            }
            result = k / denominator;
            unit = "";
            formula = "p = k / (Z\u00B7e^(-Ea/RT))";
        } else {
            throw new Error("Invalid solveFor value");
        }
        // Calculate fraction of effective collisions
        let fractionEffective = Math.exp(-EaJ / (R * T));
        let html = "<p>" + formula + "</p>";
        html += "<p>Result: " + this.numberFormatter.format(result, 6) + " " + unit + "</p>";
        html += "<p>Fraction of effective collisions (e^(-Ea/RT)): " + this.numberFormatter.format(fractionEffective, 6) + "</p>";
        this.resultDisplay.showResult(html);
    }
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateArrhenius(): void {
    new ArrheniusCalculator().calculate();
}

export function calculateRateLaw(): void {
    new RateLawCalculator().calculate();
}

export function calculateIntegratedRateLaw(): void {
    new IntegratedRateLawCalculator().calculate();
}

export function calculateReactionOrder(): void {
    new ReactionOrderCalculator().calculate();
}

export function calculateCollisionTheory(): void {
    new CollisionTheoryCalculator().calculate();
}
