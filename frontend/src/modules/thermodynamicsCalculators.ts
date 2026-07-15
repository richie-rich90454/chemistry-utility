import { Calculator } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";

/**
 * Calculates Gibbs Free Energy: ΔG = ΔH - TΔS.
 * Inputs: deltaH (kJ/mol), deltaS (J/(mol·K)), temperature (K).
 * Internally converts deltaS from J to kJ.
 * Output: ΔG (kJ/mol) and spontaneity determination.
 */
export class GibbsFreeEnergyCalculator extends Calculator {
    constructor() {
        super("gibbs-result", ["gibbs-deltaH", "gibbs-deltaS", "gibbs-T"]);
    }

    protected performCalculation(): void {
        const deltaH = this.getInput("gibbs-deltaH").getValue();
        const deltaS = this.getInput("gibbs-deltaS").getValue();
        const T = this.getInput("gibbs-T").getValue();
        InputValidator.validateValues([deltaH, deltaS, T], ["gibbs-deltaH", "gibbs-deltaS", "gibbs-T"]);
        if (T < 0) {
            throw new Error("Temperature cannot be negative");
        }
        // Convert deltaS from J/(mol·K) to kJ/(mol·K)
        const deltaS_kJ = deltaS / 1000;
        const deltaG = deltaH - T * deltaS_kJ;
        let spontaneity: string;
        if (deltaG < 0) {
            spontaneity = "Spontaneous";
        } else if (deltaG > 0) {
            spontaneity = "Non-spontaneous";
        } else {
            spontaneity = "Equilibrium";
        }
        this.resultDisplay.showResult(
            "<p>\u0394G = " + this.numberFormatter.format(deltaG, 4) + " kJ/mol</p>" +
            "<p>Process: " + spontaneity + "</p>"
        );
    }
}

/**
 * Calculates the total enthalpy change using Hess's Law:
 * sum of ΔH values from multiple reaction steps.
 * Inputs: comma-separated ΔH values (2-10 steps).
 * Output: total ΔH (kJ/mol).
 */
export class HessLawCalculator extends Calculator {
    constructor() {
        super("hess-result", ["hess-steps"]);
    }

    protected performCalculation(): void {
        const stepsInput = this.getInput("hess-steps");
        const rawValue = stepsInput.getStringValue().trim();
        if (rawValue === "") {
            stepsInput.markError();
            throw new Error("Please enter at least 2 enthalpy values separated by commas");
        }
        const parts = rawValue.split(",");
        if (parts.length < 2) {
            stepsInput.markError();
            throw new Error("At least 2 enthalpy values are required");
        }
        if (parts.length > 10) {
            stepsInput.markError();
            throw new Error("Maximum of 10 enthalpy values allowed");
        }
        let totalH = 0;
        for (let i = 0; i < parts.length; i++) {
            const parsed = parseFloat(parts[i].trim());
            if (isNaN(parsed)) {
                stepsInput.markError();
                throw new Error("All values must be valid numbers");
            }
            totalH = totalH + parsed;
        }
        this.resultDisplay.showResult(
            "<p>Total \u0394H = " + this.numberFormatter.format(totalH, 4) + " kJ/mol</p>" +
            "<p>Steps: " + parts.length + "</p>"
        );
    }
}

/**
 * Calculates entropy change: ΔS° = ΣS°(products) - ΣS°(reactants).
 * Inputs: comma-separated product entropies, comma-separated reactant entropies.
 * Output: ΔS° (J/(mol·K)).
 */
export class EntropyCalculator extends Calculator {
    constructor() {
        super("entropy-result", ["entropy-products", "entropy-reactants"]);
    }

    protected performCalculation(): void {
        const productsInput = this.getInput("entropy-products");
        const reactantsInput = this.getInput("entropy-reactants");
        const productsRaw = productsInput.getStringValue().trim();
        const reactantsRaw = reactantsInput.getStringValue().trim();
        if (productsRaw === "" || reactantsRaw === "") {
            if (productsRaw === "") productsInput.markError();
            if (reactantsRaw === "") reactantsInput.markError();
            throw new Error("Please enter entropy values for both products and reactants");
        }
        const productParts = productsRaw.split(",");
        const reactantParts = reactantsRaw.split(",");
        let sumProducts = 0;
        for (let i = 0; i < productParts.length; i++) {
            const parsed = parseFloat(productParts[i].trim());
            if (isNaN(parsed)) {
                productsInput.markError();
                throw new Error("All product entropy values must be valid numbers");
            }
            sumProducts = sumProducts + parsed;
        }
        let sumReactants = 0;
        for (let i = 0; i < reactantParts.length; i++) {
            const parsed = parseFloat(reactantParts[i].trim());
            if (isNaN(parsed)) {
                reactantsInput.markError();
                throw new Error("All reactant entropy values must be valid numbers");
            }
            sumReactants = sumReactants + parsed;
        }
        const deltaS = sumProducts - sumReactants;
        this.resultDisplay.showResult(
            "<p>\u0394S\u00B0 = " + this.numberFormatter.format(deltaS, 4) + " J/(mol\u00B7K)</p>" +
            "<p>\u03A3S\u00B0(products) = " + this.numberFormatter.format(sumProducts, 4) + " J/(mol\u00B7K)</p>" +
            "<p>\u03A3S\u00B0(reactants) = " + this.numberFormatter.format(sumReactants, 4) + " J/(mol\u00B7K)</p>"
        );
    }
}

/**
 * Calculates heat capacity: q = mcΔT and C = q/ΔT.
 * Solve for: q, c, ΔT, or final temperature.
 * Inputs: mass (g), specific heat (J/(g·K)), initial temp, final temp, heat (J).
 */
export class HeatCapacityCalculator extends SolveForCalculator {
    constructor() {
        super("heat-capacity-result", [
            "heat-cap-mass", "heat-cap-specific-heat",
            "heat-cap-initial-temp", "heat-cap-final-temp",
            "heat-cap-heat"
        ], "heat-cap-solve-for");
    }

    protected performCalculation(): void {
        const solveFor = this.getSolveFor();
        const mass = this.getInput("heat-cap-mass").getValue();
        const c = this.getInput("heat-cap-specific-heat").getValue();
        const T_initial = this.getInput("heat-cap-initial-temp").getValue();
        const T_final = this.getInput("heat-cap-final-temp").getValue();
        const q = this.getInput("heat-cap-heat").getValue();

        if (solveFor === "q") {
            InputValidator.validateValues([mass, c, T_initial, T_final], [
                "heat-cap-mass", "heat-cap-specific-heat",
                "heat-cap-initial-temp", "heat-cap-final-temp"
            ]);
            if (mass <= 0) throw new Error("Mass must be positive");
            if (c <= 0) throw new Error("Specific heat must be positive");
            const deltaT = T_final - T_initial;
            const result = mass * c * deltaT;
            this.resultDisplay.showResult(
                "<p>q = mc\u0394T</p>" +
                "<p>Heat: " + this.numberFormatter.format(result, 4) + " J</p>"
            );
        } else if (solveFor === "c") {
            InputValidator.validateValues([mass, T_initial, T_final, q], [
                "heat-cap-mass", "heat-cap-initial-temp",
                "heat-cap-final-temp", "heat-cap-heat"
            ]);
            if (mass <= 0) throw new Error("Mass must be positive");
            const deltaT = T_final - T_initial;
            if (deltaT === 0) throw new Error("Temperature change cannot be zero");
            const result = q / (mass * deltaT);
            this.resultDisplay.showResult(
                "<p>c = q/(m\u0394T)</p>" +
                "<p>Specific Heat: " + this.numberFormatter.format(result, 4) + " J/(g\u00B7K)</p>"
            );
        } else if (solveFor === "deltaT") {
            InputValidator.validateValues([mass, c, q], [
                "heat-cap-mass", "heat-cap-specific-heat", "heat-cap-heat"
            ]);
            if (mass <= 0) throw new Error("Mass must be positive");
            if (c <= 0) throw new Error("Specific heat must be positive");
            const result = q / (mass * c);
            this.resultDisplay.showResult(
                "<p>\u0394T = q/(mc)</p>" +
                "<p>Temperature Change: " + this.numberFormatter.format(result, 4) + " K</p>"
            );
        } else if (solveFor === "Tfinal") {
            InputValidator.validateValues([mass, c, T_initial, q], [
                "heat-cap-mass", "heat-cap-specific-heat",
                "heat-cap-initial-temp", "heat-cap-heat"
            ]);
            if (mass <= 0) throw new Error("Mass must be positive");
            if (c <= 0) throw new Error("Specific heat must be positive");
            const deltaT = q / (mass * c);
            const result = T_initial + deltaT;
            this.resultDisplay.showResult(
                "<p>T<sub>final</sub> = T<sub>initial</sub> + q/(mc)</p>" +
                "<p>Final Temperature: " + this.numberFormatter.format(result, 4) + " K</p>"
            );
        } else {
            throw new Error("Invalid solve-for selection");
        }
    }
}

/**
 * Calculates reaction enthalpy from bond energies:
 * ΔH ≈ Σ(bonds broken) - Σ(bonds formed).
 * Common bond energies are provided as a lookup table.
 * Inputs: comma-separated bond types with counts for broken and formed bonds.
 * Output: estimated ΔH (kJ/mol).
 */
export class BondEnthalpyCalculator extends Calculator {
    private static bondEnergies: Record<string, number> = {
        "C-H": 413,
        "C-C": 348,
        "C=C": 614,
        "C\u2261C": 839,
        "O-H": 463,
        "O=O": 495,
        "N\u2261N": 941,
        "C-O": 358,
        "C=O": 799,
        "H-H": 436
    };

    constructor() {
        super("bond-enthalpy-result", ["bond-enthalpy-broken", "bond-enthalpy-formed"]);
    }

    protected performCalculation(): void {
        const brokenInput = this.getInput("bond-enthalpy-broken");
        const formedInput = this.getInput("bond-enthalpy-formed");
        const brokenRaw = brokenInput.getStringValue().trim();
        const formedRaw = formedInput.getStringValue().trim();
        if (brokenRaw === "" || formedRaw === "") {
            if (brokenRaw === "") brokenInput.markError();
            if (formedRaw === "") formedInput.markError();
            throw new Error("Please enter bond information for both broken and formed bonds");
        }
        const brokenEnergy = this.parseBondList(brokenRaw, "broken");
        const formedEnergy = this.parseBondList(formedRaw, "formed");
        const deltaH = brokenEnergy - formedEnergy;
        let processType: string;
        if (deltaH < 0) {
            processType = "Exothermic";
        } else if (deltaH > 0) {
            processType = "Endothermic";
        } else {
            processType = "Thermoneutral";
        }
        this.resultDisplay.showResult(
            "<p>\u0394H \u2248 \u03A3(bonds broken) - \u03A3(bonds formed)</p>" +
            "<p>Bonds broken energy: " + this.numberFormatter.format(brokenEnergy, 4) + " kJ/mol</p>" +
            "<p>Bonds formed energy: " + this.numberFormatter.format(formedEnergy, 4) + " kJ/mol</p>" +
            "<p>Estimated \u0394H = " + this.numberFormatter.format(deltaH, 4) + " kJ/mol</p>" +
            "<p>Process: " + processType + "</p>"
        );
    }

    private parseBondList(raw: string, label: string): number {
        const entries = raw.split(",");
        let total = 0;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i].trim();
            if (entry === "") continue;
            // Format: "bondType:count" or just "bondType" (count defaults to 1)
            const colonIndex = entry.indexOf(":");
            let bondType: string;
            let count: number;
            if (colonIndex >= 0) {
                bondType = entry.substring(0, colonIndex).trim();
                const countStr = entry.substring(colonIndex + 1).trim();
                count = parseFloat(countStr);
                if (isNaN(count)) {
                    throw new Error("Invalid count for bond " + bondType + " in " + label + " bonds");
                }
            } else {
                bondType = entry;
                count = 1;
            }
            const energy = BondEnthalpyCalculator.bondEnergies[bondType];
            if (energy === undefined) {
                throw new Error("Unknown bond type: " + bondType + ". Supported: C-H, C-C, C=C, C\u2261C, O-H, O=O, N\u2261N, C-O, C=O, H-H");
            }
            total = total + energy * count;
        }
        return total;
    }
}

/**
 * Calculates lattice energy using the Born-Haber cycle:
 * ΔHf = ΔHsub + IE + ΔHdiss/2 + EA + U
 * Solves for lattice energy U.
 * Inputs: ΔHf, ΔHsub, IE, ΔHdiss, EA.
 * Output: lattice energy U (kJ/mol).
 */
export class BornHaberCycleCalculator extends Calculator {
    constructor() {
        super("born-haber-result", [
            "born-haber-dHf", "born-haber-dHsub",
            "born-haber-IE", "born-haber-dHdiss",
            "born-haber-EA"
        ]);
    }

    protected performCalculation(): void {
        const dHf = this.getInput("born-haber-dHf").getValue();
        const dHsub = this.getInput("born-haber-dHsub").getValue();
        const IE = this.getInput("born-haber-IE").getValue();
        const dHdiss = this.getInput("born-haber-dHdiss").getValue();
        const EA = this.getInput("born-haber-EA").getValue();
        InputValidator.validateValues([dHf, dHsub, IE, dHdiss, EA], [
            "born-haber-dHf", "born-haber-dHsub",
            "born-haber-IE", "born-haber-dHdiss",
            "born-haber-EA"
        ]);
        // U = ΔHf - ΔHsub - IE - ΔHdiss/2 - EA
        const U = dHf - dHsub - IE - (dHdiss / 2) - EA;
        this.resultDisplay.showResult(
            "<p>U = \u0394H<sub>f</sub> - \u0394H<sub>sub</sub> - IE - \u0394H<sub>diss</sub>/2 - EA</p>" +
            "<p>Lattice Energy U = " + this.numberFormatter.format(U, 4) + " kJ/mol</p>"
        );
    }
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateGibbsFreeEnergy(): void {
    new GibbsFreeEnergyCalculator().calculate();
}

export function calculateHessLaw(): void {
    new HessLawCalculator().calculate();
}

export function calculateEntropy(): void {
    new EntropyCalculator().calculate();
}

export function calculateHeatCapacity(): void {
    new HeatCapacityCalculator().calculate();
}

export function calculateBondEnthalpy(): void {
    new BondEnthalpyCalculator().calculate();
}

export function calculateBornHaberCycle(): void {
    new BornHaberCycleCalculator().calculate();
}
