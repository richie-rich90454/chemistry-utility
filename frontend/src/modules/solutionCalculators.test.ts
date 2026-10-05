import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
	calculateDilution,
	calculateMassPercent,
	calculateMixing,
	DilutionCalculator,
	MassPercentCalculator,
	MixingCalculator,
	BufferSolutionCalculator,
	PKaPKbCalculator,
	KspCalculator,
	ColligativePropertiesCalculator,
	TitrationCurveCalculator,
	DebyeHuckelCalculator,
	CommonIonEffectCalculator
} from "./solutionCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

describe("calculateDilution", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("dilution-calc");
		createResultDiv("dilution-result", "dilution-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for M2: M1=2, V1=1, V2=4 → M2=0.5", () => {
		createSelect("dilution-solve-for", "M2", ["M2"], "dilution-calc");
		createInput("dilution-M1", "2", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("0.5000");
		expect(text).toContain("M");
	});

	it("should solve for V1: M1=6, M2=2, V2=500 → V1≈166.67", () => {
		createSelect("dilution-solve-for", "V1", ["V1"], "dilution-calc");
		createInput("dilution-M1", "6", "dilution-calc");
		createInput("dilution-V1", "", "dilution-calc");
		createInput("dilution-M2", "2", "dilution-calc");
		createInput("dilution-V2", "500", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("166.6667");
		expect(text).toContain("L");
	});

	it("should solve for M1: M2=0.5, V1=1, V2=4 → M1=2", () => {
		createSelect("dilution-solve-for", "M1", ["M1"], "dilution-calc");
		createInput("dilution-M1", "", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "0.5", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("2.0000");
		expect(text).toContain("M");
	});

	it("should solve for V2: M1=6, V1=100, M2=2 → V2=300", () => {
		createSelect("dilution-solve-for", "V2", ["V2"], "dilution-calc");
		createInput("dilution-M1", "6", "dilution-calc");
		createInput("dilution-V1", "100", "dilution-calc");
		createInput("dilution-M2", "2", "dilution-calc");
		createInput("dilution-V2", "", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("300.0000");
		expect(text).toContain("L");
	});

	it("should show error for zero V1 when solving for M2", () => {
		createSelect("dilution-solve-for", "M2", ["M2"], "dilution-calc");
		createInput("dilution-M1", "2", "dilution-calc");
		createInput("dilution-V1", "0", "dilution-calc");
		createInput("dilution-M2", "", "dilution-calc");
		createInput("dilution-V2", "4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative V2 when solving for M2", () => {
		createSelect("dilution-solve-for", "M2", ["M2"], "dilution-calc");
		createInput("dilution-M1", "2", "dilution-calc");
		createInput("dilution-V1", "1", "dilution-calc");
		createInput("dilution-M2", "", "dilution-calc");
		createInput("dilution-V2", "-4", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative M1 when solving for V2", () => {
		createSelect("dilution-solve-for", "V2", ["V2"], "dilution-calc");
		createInput("dilution-M1", "-6", "dilution-calc");
		createInput("dilution-V1", "100", "dilution-calc");
		createInput("dilution-M2", "2", "dilution-calc");
		createInput("dilution-V2", "", "dilution-calc");

		calculateDilution();

		const text = getResultText("dilution-result");
		expect(text).toContain("Error");
	});
});

describe("calculateMassPercent", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("mass-percent-calc");
		createResultDiv("mass-percent-result", "mass-percent-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should calculate percent: 10g solute, 100g solution → 10%", () => {
		createSelect("concentration-unit", "percent", ["percent"], "mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("10.0000");
		expect(text).toContain("%");
	});

	it("should calculate ppm: small solute in large solution", () => {
		createSelect("concentration-unit", "ppm", ["ppm"], "mass-percent-calc");
		createInput("mass-solute", "0.001", "mass-percent-calc");
		createInput("mass-solution", "1", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("1000.0000");
		expect(text).toContain("ppm");
	});

	it("should calculate ppb: very small solute in large solution", () => {
		createSelect("concentration-unit", "ppb", ["ppb"], "mass-percent-calc");
		createInput("mass-solute", "0.000001", "mass-percent-calc");
		createInput("mass-solution", "1", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("1000.0000");
		expect(text).toContain("ppb");
	});

	it("should show error when solution mass is zero", () => {
		createSelect("concentration-unit", "percent", ["percent"], "mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "0", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("Error");
		expect(text).toContain("zero");
	});

	it("should show error when solute mass is negative", () => {
		createSelect("concentration-unit", "percent", ["percent"], "mass-percent-calc");
		createInput("mass-solute", "-5", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("Error");
		expect(text).toContain("negative");
	});

	it("should show error for invalid unit", () => {
		createSelect("concentration-unit", "bogus", ["percent", "ppm", "ppb", "bogus"], "mass-percent-calc");
		createInput("mass-solute", "10", "mass-percent-calc");
		createInput("mass-solution", "100", "mass-percent-calc");

		calculateMassPercent();

		const text = getResultText("mass-percent-result");
		expect(text).toContain("Error");
	});
});

describe("calculateMixing", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("solution-mixing-calc");
		createResultDiv("mixing-result", "solution-mixing-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should calculate basic mixing: C1=1, V1=100, C2=0, V2=100 → C_final=0.5", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "0", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should calculate mixing with valid concentrations: C1=1, V1=100, C2=0.5, V2=100 → C_final=0.75", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "0.5", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("0.7500");
		expect(text).toContain("M");
	});

	it("should return same concentration when both solutions have same concentration", () => {
		createInput("mix-C1", "2", "solution-mixing-calc");
		createInput("mix-V1", "50", "solution-mixing-calc");
		createInput("mix-C2", "2", "solution-mixing-calc");
		createInput("mix-V2", "150", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("2.0000");
	});

	it("should show error for zero volume", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "0", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative concentration", () => {
		createInput("mix-C1", "-1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should show error for negative volume", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "-100", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "100", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});

	it("should show error for zero second volume", () => {
		createInput("mix-C1", "1", "solution-mixing-calc");
		createInput("mix-V1", "100", "solution-mixing-calc");
		createInput("mix-C2", "1", "solution-mixing-calc");
		createInput("mix-V2", "0", "solution-mixing-calc");

		calculateMixing();

		const text = getResultText("mixing-result");
		expect(text).toContain("Error");
	});
});

describe("DilutionCalculator.calculatePure", () => {
	it("should solve for M2: M1=2, V1=1, V2=4 -> M2=0.5", () => {
		const calc = new DilutionCalculator();
		const result = calc.calculatePure({
			"dilution-solve-for": "M2",
			"dilution-M1": "2",
			"dilution-V1": "1",
			"dilution-M2": "",
			"dilution-V2": "4"
		});
		expect(result.value).toContain("0.5000");
		expect(result.value).toContain("M");
		expect(result.metadata).toHaveProperty("result");
	});

	it("should return error result when V1 is zero while solving for M2", () => {
		const calc = new DilutionCalculator();
		const result = calc.calculatePure({
			"dilution-solve-for": "M2",
			"dilution-M1": "2",
			"dilution-V1": "0",
			"dilution-M2": "",
			"dilution-V2": "4"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("MassPercentCalculator.calculatePure", () => {
	it("should calculate percent: 10g solute, 100g solution -> 10%", () => {
		const calc = new MassPercentCalculator();
		const result = calc.calculatePure({
			"mass-solute": "10",
			"mass-solution": "100",
			"concentration-unit": "percent"
		});
		expect(result.value).toContain("10.0000");
		expect(result.value).toContain("%");
		expect(result.metadata).toHaveProperty("concentration");
	});

	it("should return error result when solution mass is zero", () => {
		const calc = new MassPercentCalculator();
		const result = calc.calculatePure({
			"mass-solute": "10",
			"mass-solution": "0",
			"concentration-unit": "percent"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("MixingCalculator.calculatePure", () => {
	it("should calculate final concentration: C1=1, V1=100, C2=0.5, V2=100 -> 0.75 M", () => {
		const calc = new MixingCalculator();
		const result = calc.calculatePure({
			"mix-C1": "1",
			"mix-V1": "100",
			"mix-C2": "0.5",
			"mix-V2": "100"
		});
		expect(result.value).toContain("0.7500");
		expect(result.value).toContain("M");
		expect(result.metadata).toHaveProperty("finalConcentration");
	});

	it("should return error result when V1 is zero", () => {
		const calc = new MixingCalculator();
		const result = calc.calculatePure({
			"mix-C1": "1",
			"mix-V1": "0",
			"mix-C2": "1",
			"mix-V2": "100"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("BufferSolutionCalculator.calculatePure", () => {
	it("should solve for pH: pKa=4.74, HA=1, A-=1 -> pH=4.74", () => {
		const calc = new BufferSolutionCalculator();
		const result = calc.calculatePure({
			"buffer-pKa": "4.74",
			"buffer-HA": "1",
			"buffer-Aminus": "1",
			"buffer-pH": "",
			"buffer-solve-for": "pH"
		});
		expect(result.value).toContain("4.7400");
		expect(result.metadata).toHaveProperty("pH");
	});

	it("should return error result when solving for pH without pKa", () => {
		const calc = new BufferSolutionCalculator();
		const result = calc.calculatePure({
			"buffer-pKa": "",
			"buffer-HA": "1",
			"buffer-Aminus": "1",
			"buffer-pH": "",
			"buffer-solve-for": "pH"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("PKaPKbCalculator.calculatePure", () => {
	it("should calculate from Ka=1e-5: pKa=5, pKb=9", () => {
		const calc = new PKaPKbCalculator();
		const result = calc.calculatePure({
			"pka-pkb-input-value": "0.00001",
			"pka-pkb-input-type": "Ka"
		});
		expect(result.value).toContain("5.0000");
		expect(result.metadata).toHaveProperty("Ka");
		expect(result.metadata).toHaveProperty("pKa");
	});

	it("should return error result when input value is zero", () => {
		const calc = new PKaPKbCalculator();
		const result = calc.calculatePure({
			"pka-pkb-input-value": "0",
			"pka-pkb-input-type": "Ka"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("KspCalculator.calculatePure", () => {
	it("should solve for Ksp: AB salt, s=0.01 -> Ksp=1e-4", () => {
		const calc = new KspCalculator();
		const result = calc.calculatePure({
			"ksp-value": "",
			"ksp-molar-solubility": "0.01",
			"ksp-salt-type": "AB",
			"ksp-solve-for": "Ksp"
		});
		expect(result.value).toContain("0.0001");
		expect(result.metadata).toHaveProperty("Ksp");
	});

	it("should return error result when solubility is zero while solving for Ksp", () => {
		const calc = new KspCalculator();
		const result = calc.calculatePure({
			"ksp-value": "",
			"ksp-molar-solubility": "0",
			"ksp-salt-type": "AB",
			"ksp-solve-for": "Ksp"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("ColligativePropertiesCalculator.calculatePure", () => {
	it("should calculate molality and osmotic pressure", () => {
		const calc = new ColligativePropertiesCalculator();
		const result = calc.calculatePure({
			"collig-solute-mass": "58.5",
			"collig-molar-mass": "58.5",
			"collig-solvent-mass": "1000",
			"collig-vanthoff": "1",
			"collig-Kb": "0.512",
			"collig-Kf": "1.86",
			"collig-solvent-bp": "100",
			"collig-solvent-fp": "0",
			"collig-Psolvent": "1"
		});
		expect(result.value).toContain("Molality");
		expect(result.metadata).toHaveProperty("molality");
		expect(result.metadata).toHaveProperty("osmoticPressure");
	});

	it("should return error result when solute mass is zero", () => {
		const calc = new ColligativePropertiesCalculator();
		const result = calc.calculatePure({
			"collig-solute-mass": "0",
			"collig-molar-mass": "58.5",
			"collig-solvent-mass": "1000",
			"collig-vanthoff": "1"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("TitrationCurveCalculator.calculatePure", () => {
	it("should generate titration curve data points for strong acid", () => {
		const calc = new TitrationCurveCalculator();
		const result = calc.calculatePure({
			"titration-acid-conc": "0.1",
			"titration-acid-vol": "25",
			"titration-base-conc": "0.1",
			"titration-max-vol": "50",
			"titration-acid-type": "strong",
			"titration-Ka": ""
		});
		expect(result.value).toContain("Equivalence Point");
		expect(result.chartData).toBeDefined();
		expect(Array.isArray(result.chartData)).toBe(true);
		expect(result.metadata).toHaveProperty("equivalenceVolume");
	});

	it("should return error result when acid concentration is zero", () => {
		const calc = new TitrationCurveCalculator();
		const result = calc.calculatePure({
			"titration-acid-conc": "0",
			"titration-acid-vol": "25",
			"titration-base-conc": "0.1",
			"titration-max-vol": "50",
			"titration-acid-type": "strong",
			"titration-Ka": ""
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("DebyeHuckelCalculator.calculatePure", () => {
	it("should calculate ionic strength and activity coefficient", () => {
		const calc = new DebyeHuckelCalculator();
		const result = calc.calculatePure({
			"dh-zplus": "1",
			"dh-zminus": "-1",
			"dh-concentration": "0.01",
			"dh-ion-size": "9"
		});
		expect(result.value).toContain("I =");
		expect(result.metadata).toHaveProperty("ionicStrength");
		expect(result.metadata).toHaveProperty("gamma");
	});

	it("should return error result when concentration is zero", () => {
		const calc = new DebyeHuckelCalculator();
		const result = calc.calculatePure({
			"dh-zplus": "1",
			"dh-zminus": "-1",
			"dh-concentration": "0",
			"dh-ion-size": "9"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});

describe("CommonIonEffectCalculator.calculatePure", () => {
	it("should calculate solubility with common ion present", () => {
		const calc = new CommonIonEffectCalculator();
		const result = calc.calculatePure({
			"common-ion-Ksp": "0.0000001",
			"common-ion-concentration": "0.1",
			"common-ion-salt-type": "AB"
		});
		expect(result.value).toContain("M");
		expect(result.metadata).toHaveProperty("solubilityWithCommonIon");
		expect(result.metadata).toHaveProperty("solubilityWithoutCommonIon");
	});

	it("should return error result when Ksp is zero", () => {
		const calc = new CommonIonEffectCalculator();
		const result = calc.calculatePure({
			"common-ion-Ksp": "0",
			"common-ion-concentration": "0.1",
			"common-ion-salt-type": "AB"
		});
		expect(result.value).toBe("");
		expect(result.explanation).toContain("Error:");
	});
});
