import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {
	calculateIdealGasLaw,
	calculateCombinedGasLaw,
	calculateVanDerWaals,
	calculateHalfLife,
} from "./gasLawCalculators.js";

function createInput(id: string, value: string): HTMLInputElement {
	const input = document.createElement("input");
	input.id = id;
	input.type = "number";
	input.value = value;
	document.body.appendChild(input);
	return input;
}

function createSelect(id: string, value: string): HTMLSelectElement {
	const select = document.createElement("select");
	select.id = id;
	const option = document.createElement("option");
	option.value = value;
	option.textContent = value;
	select.appendChild(option);
	select.value = value;
	document.body.appendChild(select);
	return select;
}

function createResultDiv(id: string): HTMLDivElement {
	const div = document.createElement("div");
	div.id = id;
	document.body.appendChild(div);
	return div;
}

function createFormDiv(id: string): HTMLDivElement {
	const div = document.createElement("div");
	div.id = id;
	document.body.appendChild(div);
	return div;
}

function getResultText(id: string): string {
	const el = document.getElementById(id);
	return el?.textContent?.trim() || "";
}

function extractResultNumber(text: string): number | null {
	const match = text.match(/Result:\s*([\d.]+)/);
	return match ? parseFloat(match[1]) : null;
}

describe("calculateIdealGasLaw", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createFormDiv("ideal-gas-law");
		createResultDiv("ideal-result");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for P: n=1, V=22.4, T=273 → P≈1 atm", () => {
		createSelect("ideal-solve-for", "P");
		createSelect("ideal-R-units", "atm-L");
		createInput("ideal-P", "");
		createInput("ideal-V", "22.4");
		createInput("ideal-n", "1");
		createInput("ideal-T", "273");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
		expect(text).toContain("atm");
	});

	it("should solve for V: P=1, n=1, T=273 → V≈22.4 L", () => {
		createSelect("ideal-solve-for", "V");
		createSelect("ideal-R-units", "atm-L");
		createInput("ideal-P", "1");
		createInput("ideal-V", "");
		createInput("ideal-n", "1");
		createInput("ideal-T", "273");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(22.4, 1);
		expect(text).toContain("L");
	});

	it("should solve for n: P=1, V=22.4, T=273 → n≈1 mol", () => {
		createSelect("ideal-solve-for", "n");
		createSelect("ideal-R-units", "atm-L");
		createInput("ideal-P", "1");
		createInput("ideal-V", "22.4");
		createInput("ideal-n", "");
		createInput("ideal-T", "273");

		calculateIdealGasLaw();

		const text = getResultText("ideal-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(1, 1);
		expect(text).toContain("mol");
	});

	it("should solve for T: P=1, n=1, V=22.4 → T≈273 K", () => {
		createSelect("ideal-solve-for", "T");
		createSelect("ideal-R-units", "atm-L");
		createInput("ideal-P", "1");
		createInput("ideal-V", "22.4");
		createInput("ideal-n", "1");
		createInput("ideal-T", "");

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
		createFormDiv("combined-gas-law");
		createResultDiv("combined-result");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for T2: P1=1, V1=1, T1=273, P2=2, V2=1 → T2=546", () => {
		createSelect("combined-solve-for", "T2");
		createInput("combined-P1", "1");
		createInput("combined-V1", "1");
		createInput("combined-T1", "273");
		createInput("combined-P2", "2");
		createInput("combined-V2", "1");
		createInput("combined-T2", "");

		calculateCombinedGasLaw();

		const text = getResultText("combined-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(546, 0);
	});

	it("should solve for P2: P1=1, V1=2, T1=300, V2=1, T2=300 → P2=2", () => {
		createSelect("combined-solve-for", "P2");
		createInput("combined-P1", "1");
		createInput("combined-V1", "2");
		createInput("combined-T1", "300");
		createInput("combined-P2", "");
		createInput("combined-V2", "1");
		createInput("combined-T2", "300");

		calculateCombinedGasLaw();

		const text = getResultText("combined-result");
		const result = extractResultNumber(text);
		expect(result).not.toBeNull();
		expect(result!).toBeCloseTo(2, 0);
	});

	it("should solve for V2: P1=2, V1=1, T1=300, P2=1, T2=300 → V2=2", () => {
		createSelect("combined-solve-for", "V2");
		createInput("combined-P1", "2");
		createInput("combined-V1", "1");
		createInput("combined-T1", "300");
		createInput("combined-P2", "1");
		createInput("combined-V2", "");
		createInput("combined-T2", "300");

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
		createFormDiv("van-der-waals");
		createResultDiv("vdw-result");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should calculate pressure with Van der Waals equation", () => {
		// For N2: a=1.39, b=0.0391, n=1, V=22.4, T=273
		createInput("vdw-V", "22.4");
		createInput("vdw-n", "1");
		createInput("vdw-T", "273");
		createInput("vdw-a", "1.39");
		createInput("vdw-b", "0.0391");

		calculateVanDerWaals();

		const text = getResultText("vdw-result");
		// P = (nRT)/(V-nb) - a*(n/V)^2
		// P = (1*0.08206*273)/(22.4-0.0391) - 1.39*(1/22.4)^2
		// P ≈ 22.40238/22.3609 - 1.39*0.001993
		// P ≈ 1.00185 - 0.002770 ≈ 0.9991
		expect(text).not.toContain("Error");
		expect(text).toContain("atm");
		// Extract the P value
		const match = text.match(/P=\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(0.9991, 2);
	});

	it("should show error when V<=0", () => {
		createInput("vdw-V", "0");
		createInput("vdw-n", "1");
		createInput("vdw-T", "273");
		createInput("vdw-a", "1.39");
		createInput("vdw-b", "0.0391");

		calculateVanDerWaals();

		const text = getResultText("vdw-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when V-n*b<=0", () => {
		// V=0.03, n=1, b=0.0391 → V-nb = 0.03-0.0391 = -0.0091 < 0
		createInput("vdw-V", "0.03");
		createInput("vdw-n", "1");
		createInput("vdw-T", "273");
		createInput("vdw-a", "1.39");
		createInput("vdw-b", "0.0391");

		calculateVanDerWaals();

		const text = getResultText("vdw-result");
		expect(text).toContain("Error");
		expect(text).toContain("too small");
	});
});

describe("calculateHalfLife", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		createFormDiv("half-life-calc");
		createResultDiv("half-life-result");
	});

	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("should solve for remaining: N0=100, t=10, t_half=5 → Nt≈25", () => {
		createSelect("half-life-solve-for", "remaining");
		createInput("initial-quantity", "100");
		createInput("time-input", "10");
		createInput("half-life-input", "5");
		createInput("remaining-quantity", "");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		const match = text.match(/Remaining:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(25, 0);
	});

	it("should solve for time: N0=100, Nt=25, t_half=5 → t≈10", () => {
		createSelect("half-life-solve-for", "time");
		createInput("initial-quantity", "100");
		createInput("time-input", "");
		createInput("half-life-input", "5");
		createInput("remaining-quantity", "25");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		const match = text.match(/Time needed:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(10, 0);
	});

	it("should solve for half-life: N0=100, Nt=25, t=10 → t_half≈5", () => {
		createSelect("half-life-solve-for", "half-life");
		createInput("initial-quantity", "100");
		createInput("time-input", "10");
		createInput("half-life-input", "");
		createInput("remaining-quantity", "25");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		const match = text.match(/Half-life:\s*([\d.]+)/);
		expect(match).not.toBeNull();
		expect(parseFloat(match![1])).toBeCloseTo(5, 0);
	});

	it("should show error when t_half<=0 (solving for remaining)", () => {
		createSelect("half-life-solve-for", "remaining");
		createInput("initial-quantity", "100");
		createInput("time-input", "10");
		createInput("half-life-input", "0");
		createInput("remaining-quantity", "");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when N0<=0 (solving for remaining)", () => {
		createSelect("half-life-solve-for", "remaining");
		createInput("initial-quantity", "0");
		createInput("time-input", "10");
		createInput("half-life-input", "5");
		createInput("remaining-quantity", "");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when N0<=0 (solving for time)", () => {
		createSelect("half-life-solve-for", "time");
		createInput("initial-quantity", "-10");
		createInput("time-input", "");
		createInput("half-life-input", "5");
		createInput("remaining-quantity", "25");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});

	it("should show error when Nt<=0 (solving for time)", () => {
		createSelect("half-life-solve-for", "time");
		createInput("initial-quantity", "100");
		createInput("time-input", "");
		createInput("half-life-input", "5");
		createInput("remaining-quantity", "0");

		calculateHalfLife();

		const text = getResultText("half-life-result");
		expect(text).toContain("Error");
		expect(text).toContain("positive");
	});
});
