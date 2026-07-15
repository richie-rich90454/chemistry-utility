import { Calculator } from "./calculator.js";
import { SolveForCalculator } from "./solveForCalculator.js";
import { InputValidator } from "./validation.js";

/**
 * Solves the dilution equation M1*V1 = M2*V2 for any one of the four
 * variables, determined by the "dilution-solve-for" select element.
 */
export class DilutionCalculator extends SolveForCalculator {
	constructor() {
		super("dilution-result", ["dilution-M1", "dilution-V1", "dilution-M2", "dilution-V2"], "dilution-solve-for");
	}

	protected performCalculation(): void {
		const solveFor = this.getSolveFor();
		const M1 = this.getInput("dilution-M1").getValue();
		const V1 = this.getInput("dilution-V1").getValue();
		const M2 = this.getInput("dilution-M2").getValue();
		const V2 = this.getInput("dilution-V2").getValue();
		let result: number, formula: string;
		// Validate positive values for non-solved-for fields
		if (solveFor !== "M1" && M1 <= 0) throw new Error("Initial molarity must be positive");
		if (solveFor !== "M2" && M2 <= 0) throw new Error("Final molarity must be positive");
		if (solveFor !== "V1" && V1 <= 0) throw new Error("Initial volume must be positive");
		if (solveFor !== "V2" && V2 <= 0) throw new Error("Final volume must be positive");
		if (solveFor === "M1") {
			InputValidator.validateValues([V1, M2, V2], ["dilution-V1", "dilution-M2", "dilution-V2"]);
			result = (M2 * V2) / V1;
			formula = "M<sub>1</sub>=(M<sub>2</sub> x V<sub>2</sub>)/V<sub>1</sub>";
		} else if (solveFor === "V1") {
			InputValidator.validateValues([M1, M2, V2], ["dilution-M1", "dilution-M2", "dilution-V2"]);
			result = (M2 * V2) / M1;
			formula = "V<sub>1</sub>=(M<sub>2</sub> x V<sub>2</sub>)/M<sub>1</sub>";
		} else if (solveFor === "M2") {
			InputValidator.validateValues([M1, V1, V2], ["dilution-M1", "dilution-V1", "dilution-V2"]);
			result = (M1 * V1) / V2;
			formula = "M<sub>2</sub>=(M<sub>1</sub> x V<sub>1</sub>)/V<sub>2</sub>";
		} else if (solveFor === "V2") {
			InputValidator.validateValues([M1, V1, M2], ["dilution-M1", "dilution-V1", "dilution-M2"]);
			result = (M1 * V1) / M2;
			formula = "V<sub>2</sub>=(M<sub>1</sub> x V<sub>1</sub>)/M<sub>2</sub>";
		} else {
			throw new Error("Invalid calculation type");
		}
		const unit = solveFor.startsWith("M") ? "M" : "L";
		this.resultDisplay.showFormula(formula, result, unit);
	}
}

/**
 * Calculates mass-based concentration (percent, ppm, or ppb) from solute
 * and solution masses.
 */
export class MassPercentCalculator extends Calculator {
	constructor() {
		super("mass-percent-result", ["mass-solute", "mass-solution"]);
	}

	protected performCalculation(): void {
		const solute = this.getInput("mass-solute").getValue();
		const solution = this.getInput("mass-solution").getValue();
		const unitSelect = document.getElementById("concentration-unit") as HTMLSelectElement;
		const unit = unitSelect.value;
		InputValidator.validateValues([solute, solution], ["mass-solute", "mass-solution"]);
		if (solution === 0) {
			throw new Error("Solution mass cannot be zero");
		}
		if (solute < 0) throw new Error("Solute mass cannot be negative");
		const ratio = solute / solution;
		let result: number, unitText: string;
		if (unit === "percent") {
			result = ratio * 100;
			unitText = "%";
		} else if (unit === "ppm") {
			result = ratio * 1000000;
			unitText = "ppm";
		} else if (unit === "ppb") {
			result = ratio * 1000000000;
			unitText = "ppb";
		} else {
			throw new Error("Invalid unit");
		}
		this.resultDisplay.showResult("<p>Concentration: " + this.numberFormatter.format(result, 4) + " " + unitText + "</p>");
	}
}

/**
 * Calculates the final concentration and total volume when mixing two
 * solutions of known concentration and volume.
 */
export class MixingCalculator extends Calculator {
	constructor() {
		super("mixing-result", ["mix-C1", "mix-V1", "mix-C2", "mix-V2"]);
	}

	protected performCalculation(): void {
		const C1 = this.getInput("mix-C1").getValue();
		const V1 = this.getInput("mix-V1").getValue();
		const C2 = this.getInput("mix-C2").getValue();
		const V2 = this.getInput("mix-V2").getValue();
		InputValidator.validateValues([C1, V1, C2, V2], ["mix-C1", "mix-V1", "mix-C2", "mix-V2"]);
		if (C1 <= 0) throw new Error("First solution concentration must be positive");
		if (C2 <= 0) throw new Error("Second solution concentration must be positive");
		if (V1 <= 0) throw new Error("First solution volume must be positive");
		if (V2 <= 0) throw new Error("Second solution volume must be positive");
		if (V1 + V2 === 0) {
			throw new Error("Total volume cannot be zero");
		}
		const totalMoles = (C1 * V1) + (C2 * V2);
		const totalVolume = V1 + V2;
		const finalConcentration = totalMoles / totalVolume;
		this.resultDisplay.showResult("<p>Final Concentration: " + this.numberFormatter.format(finalConcentration, 4) + " M</p><p>Total Volume: " + this.numberFormatter.format(totalVolume, 4) + " L</p>");
	}
}

/**
 * Henderson-Hasselbalch equation: pH = pKa + log([A-]/[HA])
 * Can also solve for pKa or ratio given pH.
 */
export class BufferSolutionCalculator extends Calculator {
    constructor() {
        super("buffer-result", ["buffer-pKa", "buffer-HA", "buffer-Aminus", "buffer-pH", "buffer-ratio"]);
    }

    protected performCalculation(): void {
        const pKa = this.getInput("buffer-pKa").getValue();
        const HA = this.getInput("buffer-HA").getValue();
        const Aminus = this.getInput("buffer-Aminus").getValue();
        const pH = this.getInput("buffer-pH").getValue();
        const solveFor = (document.getElementById("buffer-solve-for") as HTMLSelectElement).value;
        let resultpH: number, resultpKa: number, resultRatio: number;
        if (solveFor === "pH") {
            if (isNaN(pKa)) throw new Error("pKa is required");
            if (isNaN(HA) || isNaN(Aminus)) throw new Error("[HA] and [A-] are required");
            if (HA <= 0) throw new Error("[HA] must be positive");
            if (Aminus <= 0) throw new Error("[A-] must be positive");
            resultRatio = Aminus / HA;
            resultpH = pKa + Math.log10(resultRatio);
            resultpKa = pKa;
        } else if (solveFor === "pKa") {
            if (isNaN(pH)) throw new Error("pH is required");
            if (isNaN(HA) || isNaN(Aminus)) throw new Error("[HA] and [A-] are required");
            if (HA <= 0) throw new Error("[HA] must be positive");
            if (Aminus <= 0) throw new Error("[A-] must be positive");
            resultRatio = Aminus / HA;
            resultpKa = pH - Math.log10(resultRatio);
            resultpH = pH;
        } else if (solveFor === "ratio") {
            if (isNaN(pKa)) throw new Error("pKa is required");
            if (isNaN(pH)) throw new Error("pH is required");
            resultpH = pH;
            resultpKa = pKa;
            resultRatio = Math.pow(10, pH - pKa);
        } else {
            throw new Error("Invalid solve-for selection");
        }
        let bufferCapacity: string;
        let logRatio = Math.abs(Math.log10(resultRatio));
        if (logRatio <= 1) {
            bufferCapacity = "Good (ratio within 10:1)";
        } else {
            bufferCapacity = "Poor (ratio outside 10:1)";
        }
        this.resultDisplay.showResult(
            "<p>pH = " + this.numberFormatter.format(resultpH, 4) + "</p>" +
            "<p>pKa = " + this.numberFormatter.format(resultpKa, 4) + "</p>" +
            "<p>[A<sup>-</sup>]/[HA] = " + this.numberFormatter.format(resultRatio, 4) + "</p>" +
            "<p>Buffer Capacity: " + bufferCapacity + "</p>"
        );
    }
}

/**
 * pKa/pKb relationship: pKa = -log(Ka), pKb = -log(Kb), pKa + pKb = 14
 */
export class PKaPKbCalculator extends Calculator {
    constructor() {
        super("pka-pkb-result", ["pka-pkb-input-value"]);
    }

    protected performCalculation(): void {
        const inputValue = this.getInput("pka-pkb-input-value").getValue();
        const inputType = (document.getElementById("pka-pkb-input-type") as HTMLSelectElement).value;
        if (isNaN(inputValue) || inputValue <= 0) throw new Error("Input value must be a positive number");
        let Ka: number, pKa: number, Kb: number, pKb: number;
        if (inputType === "Ka") {
            Ka = inputValue;
            pKa = -Math.log10(Ka);
            pKb = 14 - pKa;
            Kb = Math.pow(10, -pKb);
        } else if (inputType === "pKa") {
            pKa = inputValue;
            Ka = Math.pow(10, -pKa);
            pKb = 14 - pKa;
            Kb = Math.pow(10, -pKb);
        } else if (inputType === "Kb") {
            Kb = inputValue;
            pKb = -Math.log10(Kb);
            pKa = 14 - pKb;
            Ka = Math.pow(10, -pKa);
        } else if (inputType === "pKb") {
            pKb = inputValue;
            Kb = Math.pow(10, -pKb);
            pKa = 14 - pKb;
            Ka = Math.pow(10, -pKa);
        } else {
            throw new Error("Invalid input type");
        }
        const Kw = Ka * Kb;
        this.resultDisplay.showResult(
            "<p>K<sub>a</sub> = " + this.numberFormatter.format(Ka, 6) + "</p>" +
            "<p>pK<sub>a</sub> = " + this.numberFormatter.format(pKa, 4) + "</p>" +
            "<p>K<sub>b</sub> = " + this.numberFormatter.format(Kb, 6) + "</p>" +
            "<p>pK<sub>b</sub> = " + this.numberFormatter.format(pKb, 4) + "</p>" +
            "<p>K<sub>a</sub> &times; K<sub>b</sub> = K<sub>w</sub> = " + this.numberFormatter.format(Kw, 4) + " &times; 10<sup>-14</sup></p>"
        );
    }
}

/**
 * Ksp solubility product: Ksp = [A]^a * [B]^b
 * Supports AB, AB2, A2B, AB3, A3B salt types.
 */
export class KspCalculator extends Calculator {
    constructor() {
        super("ksp-result", ["ksp-value", "ksp-molar-solubility"]);
    }

    protected performCalculation(): void {
        const kspVal = this.getInput("ksp-value").getValue();
        const solubility = this.getInput("ksp-molar-solubility").getValue();
        const saltType = (document.getElementById("ksp-salt-type") as HTMLSelectElement).value;
        const solveFor = (document.getElementById("ksp-solve-for") as HTMLSelectElement).value;
        let resultKsp: number, resultS: number;
        let concA: number, concB: number;
        let stoichA: number, stoichB: number;
        if (saltType === "AB") {
            stoichA = 1;
            stoichB = 1;
        } else if (saltType === "AB2") {
            stoichA = 1;
            stoichB = 2;
        } else if (saltType === "A2B") {
            stoichA = 2;
            stoichB = 1;
        } else if (saltType === "AB3") {
            stoichA = 1;
            stoichB = 3;
        } else if (saltType === "A3B") {
            stoichA = 3;
            stoichB = 1;
        } else {
            throw new Error("Invalid salt type");
        }
        if (solveFor === "Ksp") {
            if (isNaN(solubility) || solubility <= 0) throw new Error("Molar solubility must be positive");
            resultS = solubility;
            concA = stoichA * resultS;
            concB = stoichB * resultS;
            resultKsp = Math.pow(concA, stoichA) * Math.pow(concB, stoichB);
        } else if (solveFor === "solubility") {
            if (isNaN(kspVal) || kspVal <= 0) throw new Error("Ksp must be positive");
            resultKsp = kspVal;
            let exponent = stoichA + stoichB;
            let coeff = Math.pow(stoichA, stoichA) * Math.pow(stoichB, stoichB);
            resultS = Math.pow(resultKsp / coeff, 1 / exponent);
            concA = stoichA * resultS;
            concB = stoichB * resultS;
        } else {
            throw new Error("Invalid solve-for selection");
        }
        this.resultDisplay.showResult(
            "<p>K<sub>sp</sub> = " + this.numberFormatter.format(resultKsp, 6) + "</p>" +
            "<p>Molar Solubility (s) = " + this.numberFormatter.format(resultS, 6) + " M</p>" +
            "<p>[A<sup>" + stoichA + "+</sup>] = " + this.numberFormatter.format(concA, 6) + " M</p>" +
            "<p>[B<sup>" + stoichB + "-</sup>] = " + this.numberFormatter.format(concB, 6) + " M</p>"
        );
    }
}

/**
 * Colligative properties: boiling point elevation, freezing point depression,
 * osmotic pressure, and vapor pressure lowering (Raoult's law).
 */
export class ColligativePropertiesCalculator extends Calculator {
    constructor() {
        super("colligative-result", [
            "collig-solute-mass", "collig-molar-mass", "collig-solvent-mass",
            "collig-vanthoff", "collig-Kb", "collig-Kf",
            "collig-solvent-bp", "collig-solvent-fp", "collig-Psolvent"
        ]);
    }

    protected performCalculation(): void {
        const soluteMass = this.getInput("collig-solute-mass").getValue();
        const molarMass = this.getInput("collig-molar-mass").getValue();
        const solventMass = this.getInput("collig-solvent-mass").getValue();
        const i = this.getInput("collig-vanthoff").getValue();
        const Kb = this.getInput("collig-Kb").getValue();
        const Kf = this.getInput("collig-Kf").getValue();
        const solventBp = this.getInput("collig-solvent-bp").getValue();
        const solventFp = this.getInput("collig-solvent-fp").getValue();
        const Psolvent = this.getInput("collig-Psolvent").getValue();
        InputValidator.validateValues(
            [soluteMass, molarMass, solventMass, i],
            ["collig-solute-mass", "collig-molar-mass", "collig-solvent-mass", "collig-vanthoff"]
        );
        if (soluteMass <= 0) throw new Error("Solute mass must be positive");
        if (molarMass <= 0) throw new Error("Molar mass must be positive");
        if (solventMass <= 0) throw new Error("Solvent mass must be positive");
        if (i < 1) throw new Error("Van't Hoff factor must be >= 1");
        let molesSolute = soluteMass / molarMass;
        let molality = molesSolute / (solventMass / 1000);
        let html = "<p>Molality (m) = " + this.numberFormatter.format(molality, 4) + " mol/kg</p>";
        if (!isNaN(Kb) && Kb > 0 && !isNaN(solventBp)) {
            let deltaTb = Kb * molality * i;
            let newBp = solventBp + deltaTb;
            html += "<p>&Delta;T<sub>b</sub> = " + this.numberFormatter.format(deltaTb, 4) + " &deg;C</p>";
            html += "<p>New Boiling Point = " + this.numberFormatter.format(newBp, 4) + " &deg;C</p>";
        }
        if (!isNaN(Kf) && Kf > 0 && !isNaN(solventFp)) {
            let deltaTf = Kf * molality * i;
            let newFp = solventFp - deltaTf;
            html += "<p>&Delta;T<sub>f</sub> = " + this.numberFormatter.format(deltaTf, 4) + " &deg;C</p>";
            html += "<p>New Freezing Point = " + this.numberFormatter.format(newFp, 4) + " &deg;C</p>";
        }
        let molesSolvent = (solventMass / 1000) / 0.018015;
        let xSolute = molesSolute / (molesSolute + molesSolvent);
        let molarity = molesSolute / (solventMass / 1000);
        let osmoticPressure = molarity * 0.08206 * 298.15 * i;
        html += "<p>Osmotic Pressure (&pi;) = " + this.numberFormatter.format(osmoticPressure, 4) + " atm (at 298.15 K)</p>";
        if (!isNaN(Psolvent) && Psolvent > 0) {
            let deltaP = xSolute * Psolvent;
            html += "<p>&Delta;P = " + this.numberFormatter.format(deltaP, 4) + " atm</p>";
            html += "<p>New Vapor Pressure = " + this.numberFormatter.format(Psolvent - deltaP, 4) + " atm</p>";
        }
        this.resultDisplay.showResult(html);
    }
}

/**
 * Titration curve calculator: generates pH vs volume data points
 * for strong acid / weak acid titrated with strong base (NaOH).
 */
export class TitrationCurveCalculator extends Calculator {
    constructor() {
        super("titration-result", [
            "titration-acid-conc", "titration-acid-vol",
            "titration-base-conc", "titration-max-vol", "titration-Ka"
        ]);
    }

    protected performCalculation(): void {
        const acidConc = this.getInput("titration-acid-conc").getValue();
        const acidVol = this.getInput("titration-acid-vol").getValue();
        const baseConc = this.getInput("titration-base-conc").getValue();
        const maxVol = this.getInput("titration-max-vol").getValue();
        const acidType = (document.getElementById("titration-acid-type") as HTMLSelectElement).value;
        let Ka: number;
        if (acidType === "weak") {
            Ka = this.getInput("titration-Ka").getValue();
            if (isNaN(Ka) || Ka <= 0) throw new Error("Ka is required for weak acid");
        } else {
            Ka = 1e7;
        }
        InputValidator.validateValues(
            [acidConc, acidVol, baseConc, maxVol],
            ["titration-acid-conc", "titration-acid-vol", "titration-base-conc", "titration-max-vol"]
        );
        if (acidConc <= 0) throw new Error("Acid concentration must be positive");
        if (acidVol <= 0) throw new Error("Acid volume must be positive");
        if (baseConc <= 0) throw new Error("Base concentration must be positive");
        if (maxVol <= 0) throw new Error("Max volume must be positive");
        let equivVol = (acidConc * acidVol) / baseConc;
        let halfEquivVol = equivVol / 2;
        let dataPoints: Array<{ volume: number; pH: number }> = [];
        let steps = 50;
        let stepSize = maxVol / steps;
        for (let step = 0; step <= steps; step = step + 1) {
            let Vb = step * stepSize;
            let pH: number;
            let totalAcid = acidConc * acidVol;
            let addedBase = baseConc * Vb;
            let totalVolume = acidVol + Vb;
            if (totalVolume === 0) {
                pH = -Math.log10(acidConc);
            } else if (Vb === 0) {
                if (acidType === "strong") {
                    pH = -Math.log10(acidConc);
                } else {
                    pH = -Math.log10(Math.sqrt(Ka * acidConc));
                }
            } else if (Vb < equivVol) {
                let remainingAcid = totalAcid - addedBase;
                let formedBase = addedBase;
                if (acidType === "strong") {
                    let concH = remainingAcid / totalVolume;
                    pH = -Math.log10(concH);
                } else {
                    let concHA = remainingAcid / totalVolume;
                    let concA = formedBase / totalVolume;
                    pH = -Math.log10(Ka) + Math.log10(concA / concHA);
                }
            } else if (Math.abs(Vb - equivVol) < stepSize * 0.01) {
                if (acidType === "strong") {
                    let concOH = (addedBase - totalAcid) / totalVolume;
                    if (concOH > 0) {
                        pH = 14 + Math.log10(concOH);
                    } else {
                        pH = 7;
                    }
                } else {
                    let concA = totalAcid / totalVolume;
                    let Kb = 1e-14 / Ka;
                    let concOH = Math.sqrt(Kb * concA);
                    pH = 14 + Math.log10(concOH);
                }
            } else {
                let excessBase = addedBase - totalAcid;
                let concOH = excessBase / totalVolume;
                pH = 14 + Math.log10(concOH);
            }
            if (pH < 0) { pH = 0; }
            if (pH > 14) { pH = 14; }
            dataPoints.push({ volume: Vb, pH: pH });
        }
        let html = "<p>Equivalence Point: " + this.numberFormatter.format(equivVol, 2) + " mL</p>";
        if (acidType === "weak") {
            html += "<p>Half-Equivalence Point: " + this.numberFormatter.format(halfEquivVol, 2) + " mL (pH = pKa = " + this.numberFormatter.format(-Math.log10(Ka), 4) + ")</p>";
        }
        html += "<p>Data Points (Volume mL, pH):</p><p>";
        for (let i = 0; i < dataPoints.length; i = i + 1) {
            html += "(" + this.numberFormatter.format(dataPoints[i].volume, 1) + ", " + this.numberFormatter.format(dataPoints[i].pH, 2) + ") ";
        }
        html += "</p>";
        this.resultDisplay.showResult(html);
    }
}

/**
 * Extended Debye-Huckel equation for activity coefficients.
 * log(γ±) = -0.509 * |z+*z-| * sqrt(I) / (1 + 3.28 * a * sqrt(I))
 */
export class DebyeHuckelCalculator extends Calculator {
    constructor() {
        super("debye-huckel-result", [
            "dh-zplus", "dh-zminus", "dh-concentration", "dh-ion-size"
        ]);
    }

    protected performCalculation(): void {
        const zplus = this.getInput("dh-zplus").getValue();
        const zminus = this.getInput("dh-zminus").getValue();
        const concentration = this.getInput("dh-concentration").getValue();
        const ionSize = this.getInput("dh-ion-size").getValue();
        InputValidator.validateValues(
            [zplus, zminus, concentration, ionSize],
            ["dh-zplus", "dh-zminus", "dh-concentration", "dh-ion-size"]
        );
        if (zplus === 0 || zminus === 0) throw new Error("Ion charges cannot be zero");
        if (concentration <= 0) throw new Error("Concentration must be positive");
        if (ionSize <= 0) throw new Error("Ion size parameter must be positive");
        let I = 0.5 * concentration * (zplus * zplus + zminus * zminus);
        let sqrtI = Math.sqrt(I);
        let absProduct = Math.abs(zplus * zminus);
        let logGamma = -0.509 * absProduct * sqrtI / (1 + 3.28 * ionSize * sqrtI);
        let gamma = Math.pow(10, logGamma);
        let meanActivity = gamma * Math.pow(concentration, 1);
        this.resultDisplay.showResult(
            "<p>Ionic Strength (I) = " + this.numberFormatter.format(I, 6) + " M</p>" +
            "<p>log(&gamma;<sub>&plusmn;</sub>) = " + this.numberFormatter.format(logGamma, 6) + "</p>" +
            "<p>&gamma;<sub>&plusmn;</sub> = " + this.numberFormatter.format(gamma, 6) + "</p>" +
            "<p>Mean Activity (a<sub>&plusmn;</sub>) = " + this.numberFormatter.format(meanActivity, 6) + "</p>"
        );
    }
}

/**
 * Common ion effect: molar solubility with a common ion present.
 * Ksp = [A]^a * [B + common]^b
 */
export class CommonIonEffectCalculator extends Calculator {
    constructor() {
        super("common-ion-result", ["common-ion-Ksp", "common-ion-concentration"]);
    }

    protected performCalculation(): void {
        const Ksp = this.getInput("common-ion-Ksp").getValue();
        const commonIonConc = this.getInput("common-ion-concentration").getValue();
        const saltType = (document.getElementById("common-ion-salt-type") as HTMLSelectElement).value;
        InputValidator.validateValues(
            [Ksp, commonIonConc],
            ["common-ion-Ksp", "common-ion-concentration"]
        );
        if (Ksp <= 0) throw new Error("Ksp must be positive");
        if (commonIonConc < 0) throw new Error("Common ion concentration cannot be negative");
        let stoichA: number, stoichB: number;
        if (saltType === "AB") {
            stoichA = 1;
            stoichB = 1;
        } else if (saltType === "AB2") {
            stoichA = 1;
            stoichB = 2;
        } else if (saltType === "A2B") {
            stoichA = 2;
            stoichB = 1;
        } else if (saltType === "AB3") {
            stoichA = 1;
            stoichB = 3;
        } else if (saltType === "A3B") {
            stoichA = 3;
            stoichB = 1;
        } else {
            throw new Error("Invalid salt type");
        }
        let s: number;
        let concA: number, concB: number;
        concB = stoichB * 0 + commonIonConc;
        s = Math.pow(Ksp / Math.pow(commonIonConc, stoichB), 1 / stoichA);
        concA = stoichA * s;
        concB = stoichB * s + commonIonConc;
        let exponent = stoichA + stoichB;
        let coeff = Math.pow(stoichA, stoichA) * Math.pow(stoichB, stoichB);
        let solubilityWithout = Math.pow(Ksp / coeff, 1 / exponent);
        this.resultDisplay.showResult(
            "<p>Molar Solubility (with common ion) = " + this.numberFormatter.format(s, 6) + " M</p>" +
            "<p>Molar Solubility (without common ion) = " + this.numberFormatter.format(solubilityWithout, 6) + " M</p>" +
            "<p>[A] = " + this.numberFormatter.format(concA, 6) + " M</p>" +
            "<p>[B] = " + this.numberFormatter.format(concB, 6) + " M</p>" +
            "<p>Solubility Ratio = " + this.numberFormatter.format(s / solubilityWithout, 6) + "</p>"
        );
    }
}

// Backwards-compatible free function exports. Each instantiates its
// calculator and runs the template-method calculate() entry point.
export function calculateDilution(): void {
    new DilutionCalculator().calculate();
}

export function calculateMassPercent(): void {
    new MassPercentCalculator().calculate();
}

export function calculateMixing(): void {
    new MixingCalculator().calculate();
}

export function calculateBufferSolution(): void {
    new BufferSolutionCalculator().calculate();
}

export function calculatePKaPKb(): void {
    new PKaPKbCalculator().calculate();
}

export function calculateKsp(): void {
    new KspCalculator().calculate();
}

export function calculateColligativeProperties(): void {
    new ColligativePropertiesCalculator().calculate();
}

export function calculateTitrationCurve(): void {
    new TitrationCurveCalculator().calculate();
}

export function calculateDebyeHuckel(): void {
    new DebyeHuckelCalculator().calculate();
}

export function calculateCommonIonEffect(): void {
    new CommonIonEffectCalculator().calculate();
}
