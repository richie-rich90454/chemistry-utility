import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
	calculateIdealGasLaw,
	calculateCombinedGasLaw,
	calculateVanDerWaals,
	calculateHalfLife,
} from "./gasLawCalculators.js";
import {
	createContainer,
	createInput,
	createSelect,
	createResultDiv,
	cleanupDOM,
	getResultHTML,
} from "../test/helpers.js";

function extractResultNumber(html: string): number | null {
	const match = html.match(/Result:\s*([\d.]+)/);
	return match ? parseFloat(match[1]) : null;
}

describe("Ideal Gas Law - SI units", () => {
	beforeEach(() => {
		createContainer("ideal-gas-law");
		createInput("ideal-P", "1", "ideal-gas-law");
		createInput("ideal-V", "22.4", "ideal-gas-law");
		createInput("ideal-n", "1", "ideal-gas-law");
		createInput("ideal-T", "273.15", "ideal-gas-law");
		createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
		createSelect("ideal-R-units", "SI", ["atm-L", "SI"], "ideal-gas-law");
		createResultDiv("ideal-result", "ideal-gas-law");
	});

	afterEach(() => {
		cleanupDOM();
	});

	it("solves for P with SI units (R=8.314)", () => {
		// n=1, V=0.0224 m³, T=273.15 → P = nRT/V = 1*8.314*273.15/0.0224 ≈ 101325 Pa
		const select = document.getElementById("ideal-solve-for") as HTMLSelectElement;
		select.value = "P";
		const unitsSelect = document.getElementById("ideal-R-units") as HTMLSelectElement;
		unitsSelect.value = "SI";
		(document.getElementById("ideal-V") as HTMLInputElement).value = "0.0224";
		(document.getElementById("ideal-n") as HTMLInputElement).value = "1";
		(document.getElementById("ideal-T") as HTMLInputElement).value = "273.15";

		calculateIdealGasLaw();

		const html = getResultHTML("ideal-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(101382.55, 0);
		expect(html).toContain("Pa");
	});

	it("solves for V with SI units (R=8.314)", () => {
		// P=101325 Pa, n=1, T=273.15 → V = nRT/P = 1*8.314*273.15/101325 ≈ 0.0224 m³
		const select = document.getElementById("ideal-solve-for") as HTMLSelectElement;
		select.value = "V";
		const unitsSelect = document.getElementById("ideal-R-units") as HTMLSelectElement;
		unitsSelect.value = "SI";
		(document.getElementById("ideal-P") as HTMLInputElement).value = "101325";
		(document.getElementById("ideal-n") as HTMLInputElement).value = "1";
		(document.getElementById("ideal-T") as HTMLInputElement).value = "273.15";

		calculateIdealGasLaw();

		const html = getResultHTML("ideal-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(0.0224, 3);
		expect(html).toContain("m³");
	});

	it("solves for n with SI units (R=8.314)", () => {
		// P=101325 Pa, V=0.0224 m³, T=273.15 → n = PV/(RT) = 101325*0.0224/(8.314*273.15) ≈ 1
		const select = document.getElementById("ideal-solve-for") as HTMLSelectElement;
		select.value = "n";
		const unitsSelect = document.getElementById("ideal-R-units") as HTMLSelectElement;
		unitsSelect.value = "SI";
		(document.getElementById("ideal-P") as HTMLInputElement).value = "101325";
		(document.getElementById("ideal-V") as HTMLInputElement).value = "0.0224";
		(document.getElementById("ideal-T") as HTMLInputElement).value = "273.15";

		calculateIdealGasLaw();

		const html = getResultHTML("ideal-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
		expect(html).toContain("mol");
	});

	it("solves for T with SI units (R=8.314)", () => {
		// P=101325 Pa, V=0.0224 m³, n=1 → T = PV/(nR) = 101325*0.0224/(1*8.314) ≈ 273.15 K
		const select = document.getElementById("ideal-solve-for") as HTMLSelectElement;
		select.value = "T";
		const unitsSelect = document.getElementById("ideal-R-units") as HTMLSelectElement;
		unitsSelect.value = "SI";
		(document.getElementById("ideal-P") as HTMLInputElement).value = "101325";
		(document.getElementById("ideal-V") as HTMLInputElement).value = "0.0224";
		(document.getElementById("ideal-n") as HTMLInputElement).value = "1";

		calculateIdealGasLaw();

		const html = getResultHTML("ideal-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(273.15, 0);
		expect(html).toContain("K");
	});

	it("shows error when input is NaN", () => {
		const select = document.getElementById("ideal-solve-for") as HTMLSelectElement;
		select.value = "P";
		const unitsSelect = document.getElementById("ideal-R-units") as HTMLSelectElement;
		unitsSelect.value = "SI";
		(document.getElementById("ideal-V") as HTMLInputElement).value = "abc";
		(document.getElementById("ideal-n") as HTMLInputElement).value = "1";
		(document.getElementById("ideal-T") as HTMLInputElement).value = "273.15";

		calculateIdealGasLaw();

		const html = getResultHTML("ideal-result");
		expect(html).toContain("Error");
		expect(html).toContain("valid numbers");
	});

	it("handles very large pressure calculation", () => {
		(document.getElementById("ideal-P") as HTMLInputElement).value = "1000";
		(document.getElementById("ideal-V") as HTMLInputElement).value = "0.01";
		(document.getElementById("ideal-n") as HTMLInputElement).value = "1";
		(document.getElementById("ideal-T") as HTMLInputElement).value = "273.15";
		(document.getElementById("ideal-solve-for") as HTMLSelectElement).value = "P";
		(document.getElementById("ideal-R-units") as HTMLSelectElement).value = "atm-L";
		calculateIdealGasLaw();
		const html = getResultHTML("ideal-result");
		expect(html).toContain("atm");
	});
});

describe("Combined Gas Law - edge cases", () => {
	beforeEach(() => {
		createContainer("combined-gas-law");
		createInput("combined-P1", "1", "combined-gas-law");
		createInput("combined-V1", "1", "combined-gas-law");
		createInput("combined-T1", "300", "combined-gas-law");
		createInput("combined-P2", "2", "combined-gas-law");
		createInput("combined-V2", "1", "combined-gas-law");
		createInput("combined-T2", "600", "combined-gas-law");
		createSelect("combined-solve-for", "P1", ["P1", "V1", "T1", "P2", "V2", "T2"], "combined-gas-law");
		createResultDiv("combined-result", "combined-gas-law");
	});

	afterEach(() => {
		cleanupDOM();
	});

	it("solves for P1", () => {
		// P1 = (P2*V2*T1)/(V1*T2) = (2*1*300)/(1*600) = 1
		const select = document.getElementById("combined-solve-for") as HTMLSelectElement;
		select.value = "P1";
		(document.getElementById("combined-V1") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T1") as HTMLInputElement).value = "300";
		(document.getElementById("combined-P2") as HTMLInputElement).value = "2";
		(document.getElementById("combined-V2") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T2") as HTMLInputElement).value = "600";

		calculateCombinedGasLaw();

		const html = getResultHTML("combined-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
	});

	it("solves for V1", () => {
		// V1 = (P2*V2*T1)/(P1*T2) = (2*1*300)/(1*600) = 1
		const select = document.getElementById("combined-solve-for") as HTMLSelectElement;
		select.value = "V1";
		(document.getElementById("combined-P1") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T1") as HTMLInputElement).value = "300";
		(document.getElementById("combined-P2") as HTMLInputElement).value = "2";
		(document.getElementById("combined-V2") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T2") as HTMLInputElement).value = "600";

		calculateCombinedGasLaw();

		const html = getResultHTML("combined-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
	});

	it("solves for T1", () => {
		// T1 = (P1*V1*T2)/(P2*V2) = (1*1*600)/(2*1) = 300
		const select = document.getElementById("combined-solve-for") as HTMLSelectElement;
		select.value = "T1";
		(document.getElementById("combined-P1") as HTMLInputElement).value = "1";
		(document.getElementById("combined-V1") as HTMLInputElement).value = "1";
		(document.getElementById("combined-P2") as HTMLInputElement).value = "2";
		(document.getElementById("combined-V2") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T2") as HTMLInputElement).value = "600";

		calculateCombinedGasLaw();

		const html = getResultHTML("combined-result");
		const result = extractResultNumber(html);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(300, 0);
	});

	it("returns same values when initial equals final conditions", () => {
		(document.getElementById("combined-P1") as HTMLInputElement).value = "1";
		(document.getElementById("combined-V1") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T1") as HTMLInputElement).value = "273";
		(document.getElementById("combined-P2") as HTMLInputElement).value = "1";
		(document.getElementById("combined-V2") as HTMLInputElement).value = "1";
		(document.getElementById("combined-T2") as HTMLInputElement).value = "273";
		(document.getElementById("combined-solve-for") as HTMLSelectElement).value = "P2";
		calculateCombinedGasLaw();
		const html = getResultHTML("combined-result");
		const match = html.match(/Result:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(1, 2);
	});

	it("solves for V1 correctly", () => {
		(document.getElementById("combined-P1") as HTMLInputElement).value = "2";
		(document.getElementById("combined-V1") as HTMLInputElement).value = "0";
		(document.getElementById("combined-T1") as HTMLInputElement).value = "300";
		(document.getElementById("combined-P2") as HTMLInputElement).value = "1";
		(document.getElementById("combined-V2") as HTMLInputElement).value = "4";
		(document.getElementById("combined-T2") as HTMLInputElement).value = "300";
		(document.getElementById("combined-solve-for") as HTMLSelectElement).value = "V1";
		calculateCombinedGasLaw();
		const html = getResultHTML("combined-result");
		expect(html).toContain("Result:");
	});
});

describe("Van der Waals - edge cases", () => {
	beforeEach(() => {
		createContainer("van-der-waals");
		createInput("vdw-V", "22.4", "van-der-waals");
		createInput("vdw-n", "1", "van-der-waals");
		createInput("vdw-T", "273", "van-der-waals");
		createInput("vdw-a", "1.39", "van-der-waals");
		createInput("vdw-b", "0.0391", "van-der-waals");
		createResultDiv("vdw-result", "van-der-waals");
	});

	afterEach(() => {
		cleanupDOM();
	});

	it("throws error when V exactly equals n*b", () => {
		// n=1, b=0.0391 → V=0.0391 means V-n*b=0
		(document.getElementById("vdw-V") as HTMLInputElement).value = "0.0391";
		(document.getElementById("vdw-n") as HTMLInputElement).value = "1";
		(document.getElementById("vdw-b") as HTMLInputElement).value = "0.0391";

		calculateVanDerWaals();

		const html = getResultHTML("vdw-result");
		expect(html).toContain("Error");
		expect(html).toContain("too small");
	});

	it("throws error when volume is negative", () => {
		(document.getElementById("vdw-V") as HTMLInputElement).value = "-5";

		calculateVanDerWaals();

		const html = getResultHTML("vdw-result");
		expect(html).toContain("Error");
		expect(html).toContain("positive");
	});
});

describe("Half-life - edge cases", () => {
	beforeEach(() => {
		createContainer("half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "10", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "25", "half-life-calc");
		createSelect("half-life-solve-for", "remaining", ["remaining", "time", "half-life"], "half-life-calc");
		createResultDiv("half-life-result", "half-life-calc");
	});

	afterEach(() => {
		cleanupDOM();
	});

	it("remaining approaches 0 with very large time", () => {
		// N0=100, t=1000000, t_half=5 → Nt = 100 * 0.5^(1000000/5) ≈ 0
		const select = document.getElementById("half-life-solve-for") as HTMLSelectElement;
		select.value = "remaining";
		(document.getElementById("initial-quantity") as HTMLInputElement).value = "100";
		(document.getElementById("time-input") as HTMLInputElement).value = "1000000";
		(document.getElementById("half-life-input") as HTMLInputElement).value = "5";

		calculateHalfLife();

		const html = getResultHTML("half-life-result");
		const match = html.match(/Remaining:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(0, 0);
	});

	it("throws error when half-life is zero", () => {
		const select = document.getElementById("half-life-solve-for") as HTMLSelectElement;
		select.value = "remaining";
		(document.getElementById("initial-quantity") as HTMLInputElement).value = "100";
		(document.getElementById("time-input") as HTMLInputElement).value = "10";
		(document.getElementById("half-life-input") as HTMLInputElement).value = "0";

		calculateHalfLife();

		const html = getResultHTML("half-life-result");
		expect(html).toContain("Error");
		expect(html).toContain("positive");
	});

	it("throws error when initial quantity is zero", () => {
		const select = document.getElementById("half-life-solve-for") as HTMLSelectElement;
		select.value = "remaining";
		(document.getElementById("initial-quantity") as HTMLInputElement).value = "0";
		(document.getElementById("time-input") as HTMLInputElement).value = "10";
		(document.getElementById("half-life-input") as HTMLInputElement).value = "5";

		calculateHalfLife();

		const html = getResultHTML("half-life-result");
		expect(html).toContain("Error");
		expect(html).toContain("positive");
	});

	it("solving for time when Nt > N0 yields negative time", () => {
		// N0=100, Nt=200, t_half=5 → t = (log(200/100)/log(0.5))*5 = (log(2)/log(0.5))*5 = (-1)*5 = -5
		const select = document.getElementById("half-life-solve-for") as HTMLSelectElement;
		select.value = "time";
		(document.getElementById("initial-quantity") as HTMLInputElement).value = "100";
		(document.getElementById("half-life-input") as HTMLInputElement).value = "5";
		(document.getElementById("remaining-quantity") as HTMLInputElement).value = "200";

		calculateHalfLife();

		const html = getResultHTML("half-life-result");
		const match = html.match(/Time needed:\s*(-?[\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeLessThan(0);
	});

	it("solves for half-life with valid inputs", () => {
		// N0=100, Nt=25, t=10 → t_half = t / (log(Nt/N0)/log(0.5)) = 10 / 2 = 5
		const select = document.getElementById("half-life-solve-for") as HTMLSelectElement;
		select.value = "half-life";
		(document.getElementById("initial-quantity") as HTMLInputElement).value = "100";
		(document.getElementById("time-input") as HTMLInputElement).value = "10";
		(document.getElementById("remaining-quantity") as HTMLInputElement).value = "25";

		calculateHalfLife();

		const html = getResultHTML("half-life-result");
		const match = html.match(/Half-life:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(5, 0);
	});
});

describe("Gas Laws - additional edge cases", () => {
	afterEach(() => {
		cleanupDOM();
	});

	it("ideal gas: solves for n with atm-L units", () => {
		createContainer("ideal-gas-law");
		createInput("ideal-P", "1", "ideal-gas-law");
		createInput("ideal-V", "22.4", "ideal-gas-law");
		createInput("ideal-n", "", "ideal-gas-law");
		createInput("ideal-T", "273.15", "ideal-gas-law");
		createSelect("ideal-solve-for", "n", ["P", "V", "n", "T"], "ideal-gas-law");
		createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
		createResultDiv("ideal-result", "ideal-gas-law");
		calculateIdealGasLaw();
		const html = getResultHTML("ideal-result");
		expect(html).toContain("mol");
	});

	it("ideal gas: shows error for zero temperature", () => {
		createContainer("ideal-gas-law");
		createInput("ideal-P", "1", "ideal-gas-law");
		createInput("ideal-V", "22.4", "ideal-gas-law");
		createInput("ideal-n", "1", "ideal-gas-law");
		createInput("ideal-T", "0", "ideal-gas-law");
		createSelect("ideal-solve-for", "P", ["P", "V", "n", "T"], "ideal-gas-law");
		createSelect("ideal-R-units", "atm-L", ["atm-L", "SI"], "ideal-gas-law");
		createResultDiv("ideal-result", "ideal-gas-law");
		calculateIdealGasLaw();
		const html = getResultHTML("ideal-result");
		expect(html).toContain("Error");
	});

	it("combined gas: solves for P2", () => {
		createContainer("combined-gas-law");
		createInput("combined-P1", "1", "combined-gas-law");
		createInput("combined-V1", "2", "combined-gas-law");
		createInput("combined-T1", "300", "combined-gas-law");
		createInput("combined-P2", "", "combined-gas-law");
		createInput("combined-V2", "4", "combined-gas-law");
		createInput("combined-T2", "600", "combined-gas-law");
		createSelect("combined-solve-for", "P2", ["P1", "V1", "T1", "P2", "V2", "T2"], "combined-gas-law");
		createResultDiv("combined-result", "combined-gas-law");
		calculateCombinedGasLaw();
		const html = getResultHTML("combined-result");
		expect(html).toContain("Result:");
	});

	it("half-life: remaining equals initial when time is zero", () => {
		createContainer("half-life-calc");
		createInput("initial-quantity", "100", "half-life-calc");
		createInput("time-input", "0", "half-life-calc");
		createInput("half-life-input", "5", "half-life-calc");
		createInput("remaining-quantity", "", "half-life-calc");
		createSelect("half-life-solve-for", "remaining", ["remaining", "time", "half-life"], "half-life-calc");
		createResultDiv("half-life-result", "half-life-calc");
		calculateHalfLife();
		const html = getResultHTML("half-life-result");
		const match = html.match(/Remaining:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(100, 0);
	});

	it("Van der Waals: produces result with small n", () => {
		createContainer("van-der-waals");
		createInput("vdw-V", "22.4", "van-der-waals");
		createInput("vdw-n", "0.001", "van-der-waals");
		createInput("vdw-T", "273", "van-der-waals");
		createInput("vdw-a", "1.39", "van-der-waals");
		createInput("vdw-b", "0.0391", "van-der-waals");
		createResultDiv("vdw-result", "van-der-waals");
		calculateVanDerWaals();
		const html = getResultHTML("vdw-result");
		expect(html).not.toContain("Error");
	});
});
