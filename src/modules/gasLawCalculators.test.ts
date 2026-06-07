import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
	calculateIdealGasLaw,
	calculateCombinedGasLaw,
	calculateVanDerWaals,
	calculateHalfLife,
} from "./gasLawCalculators.js";
import {createContainer, createInput, createSelect, createResultDiv, getResultText} from "../test/helpers.js";

function extractResultNumber(text: string): number | null {
	const match = text.match(/Result:\s*([\d.]+)/);
	return match ? parseFloat(match[1]) : null;
}

describe("calculateIdealGasLaw", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("ideal-gas-law");
		createResultDiv("ideal-result", "ideal-gas-law");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for P: n=1, V=22.4, T=273 → P≈1 atm", () => {
		createSelect("ideal-solve-for", "P", ["P"], "ideal-gas-law");
		createSelect("ideal-R-units", "atm-L", ["atm-L"], "ideal-gas-law");
		createInput("ideal-P", "", "ideal-gas-law");
		createInput("ideal-V", "22.4", "ideal-gas-law");
		createInput("ideal-n", "1", "ideal-gas-law");
		createInput("ideal-T", "273", "ideal-gas-law");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
		expect(text).toContain("atm");
	});

	it("should solve for V: P=1, n=1, T=273 → V≈22.4 L", () => {
		createSelect("ideal-solve-for", "V", ["V"], "ideal-gas-law");
		createSelect("ideal-R-units", "atm-L", ["atm-L"], "ideal-gas-law");
		createInput("ideal-P", "1", "ideal-gas-law");
		createInput("ideal-V", "", "ideal-gas-law");
		createInput("ideal-n", "1", "ideal-gas-law");
		createInput("ideal-T", "273", "ideal-gas-law");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(22.4, 1);
		expect(text).toContain("L");
	});

	it("should solve for n: P=1, V=22.4, T=273 → n≈1 mol", () => {
		createSelect("ideal-solve-for", "n", ["n"], "ideal-gas-law");
		createSelect("ideal-R-units", "atm-L", ["atm-L"], "ideal-gas-law");
		createInput("ideal-P", "1", "ideal-gas-law");
		createInput("ideal-V", "22.4", "ideal-gas-law");
		createInput("ideal-n", "", "ideal-gas-law");
		createInput("ideal-T", "273", "ideal-gas-law");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
		expect(text).toContain("mol");
	});

	it("should solve for T: P=1, n=1, V=22.4 → T≈273 K", () => {
		createSelect("ideal-solve-for", "T", ["T"], "ideal-gas-law");
		createSelect("ideal-R-units", "atm-L", ["atm-L"], "ideal-gas-law");
		createInput("ideal-P", "1", "ideal-gas-law");
		createInput("ideal-V", "22.4", "ideal-gas-law");
		createInput("ideal-n", "1", "ideal-gas-law");
		createInput("ideal-T", "", "ideal-gas-law");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(273, 0);
		expect(text).toContain("K");
	});
});

describe("calculateCombinedGasLaw", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("combined-gas-law");
		createResultDiv("combined-result", "combined-gas-law");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for T2: P1=1, V1=1, T1=273, P2=2, V2=1 → T2=546", () => {
		createSelect("combined-solve-for", "T2", ["T2"], "combined-gas-law");
		createInput("combined-P1", "1", "combined-gas-law");
		createInput("combined-V1", "1", "combined-gas-law");
		createInput("combined-T1", "273", "combined-gas-law");
		createInput("combined-P2", "2", "combined-gas-law");
		createInput("combined-V2", "1", "combined-gas-law");
		createInput("combined-T2", "", "combined-gas-law");

		calculateCombinedGasLaw();

		const text = getResultText("combined-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(546, 0);
	});

	it("should solve for P2: P1=1, V1=2, T1=300, V2=1, T2=300 → P2=2", () => {
		createSelect("combined-solve-for", "P2", ["P2"], "combined-gas-law");
		createInput("combined-P1", "1", "combined-gas-law");
		createInput("combined-V1", "2", "combined-gas-law");
		createInput("combined-T1", "300", "combined-gas-law");
		createInput("combined-P2", "", "combined-gas-law");
		createInput("combined-V2", "1", "combined-gas-law");
		createInput("combined-T2", "300", "combined-gas-law");

		calculateCombinedGasLaw();

		const text = getResultText("combined-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(2, 0);
	});

	it("should solve for V2: P1=2, V1=1, T1=300, P2=1, T2=300 → V2=2", () => {
		createSelect("combined-solve-for", "V2", ["V2"], "combined-gas-law");
		createInput("combined-P1", "2", "combined-gas-law");
		createInput("combined-V1", "1", "combined-gas-law");
		createInput("combined-T1", "300", "combined-gas-law");
		createInput("combined-P2", "1", "combined-gas-law");
		createInput("combined-V2", "", "combined-gas-law");
		createInput("combined-T2", "300", "combined-gas-law");

		calculateCombinedGasLaw();

		const text = getResultText("combined-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(2, 0);
	});
});

describe("calculateVanDerWaals", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("van-der-waals");
		createResultDiv("vdw-result", "van-der-waals");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should calculate pressure with Van der Waals equation", () => {
		createInput("vdw-V", "22.4", "van-der-waals");
		createInput("vdw-n", "1", "van-der-waals");
		createInput("vdw-T", "273", "van-der-waals");
		createInput("vdw-a", "1.39", "van-der-waals");
		createInput("vdw-b", "0.0391", "van-der-waals");

		calculateVanDerWaals();

		const text = getResultText("vdw-result");
		expect(text).not.toContain("Error");
		expect(text).toContain("atm");
		const match = text.match(/P=\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(0.9991, 2);
	});

	it("should show error when V<=0", () => {
		createInput("vdw-V", "0", "van-der-waals");
		createInput("vdw-n", "1", "van-der-waals");
		createInput("vdw-T", "273", "van-der-waals");
		createInput("vdw-a", "1.39", "van-der-waals");
		createInput("vdw-b", "0.0391", "van-der-waals");

		calculateVanDerWaals();

		const text = getResultText("vdw-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when V-n*b<=0", () => {
		createInput("vdw-V", "0.03", "van-der-waals");
		createInput("vdw-n", "1", "van-der-waals");
		createInput("vdw-T", "273", "van-der-waals");
		createInput("vdw-a", "1.39", "van-der-waals");
		createInput("vdw-b", "0.0391", "van-der-waals");

		calculateVanDerWaals();

		const text = getResultText("vdw-result");
		expect(text).toContain("Error");
		expect(text).toContain("too small");
	});
});

describe("calculateHalfLife", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createContainer("half-life-calc");
		createResultDiv("half-life-result", "half-life-calc");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for remaining: N0=100, t=10, t_half=5 → Nt≈25", () => {
		createSelect("half-life-solve-for", "remaining", ["remaining"], "half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "10", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		const match = text.match(/Remaining:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(25, 0);
	});

	it("should solve for time: N0=100, Nt=25, t_half=5 → t≈10", () => {
		createSelect("half-life-solve-for", "time", ["time"], "half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "25", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		const match = text.match(/Time needed:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(10, 0);
	});

	it("should solve for half-life: N0=100, Nt=25, t=10 → t_half≈5", () => {
		createSelect("half-life-solve-for", "half-life", ["half-life"], "half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "10", "half-life-calc");
		createInput("half-life-input", "", "half-life-calc");
		createInput("remaining-quantity", "25", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		const match = text.match(/Half-life:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(5, 0);
	});

	it("should show error when t_half<=0 (solving for remaining)", () => {
		createSelect("half-life-solve-for", "remaining", ["remaining"], "half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "10", "half-life-calc");
		createInput("half-life-input", "0", "half-life-calc");
		createInput("remaining-quantity", "", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when N0<=0 (solving for remaining)", () => {
		createSelect("half-life-solve-for", "remaining", ["remaining"], "half-life-calc");
		createInput("initial-quantity", "0", "half-life-calc");
		createInput("time-input", "10", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when N0<=0 (solving for time)", () => {
		createSelect("half-life-solve-for", "time", ["time"], "half-life-calc");
		createInput("initial-quantity", "-10", "half-life-calc");
		createInput("time-input", "", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "25", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when Nt<=0 (solving for time)", () => {
		createSelect("half-life-solve-for", "time", ["time"], "half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "0", "half-life-calc");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});
});
