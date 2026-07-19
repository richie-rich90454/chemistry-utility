import {describe, it, expect} from "vitest";
import {lookupElement} from "./elementLookup.js";
import type {ChemicalElement} from "../types.js";

const hydrogen: ChemicalElement = {
	symbol: "H",
	name: "Hydrogen",
	atomicMass: 1.008,
	atomicNumber: 1,
	electronegativity: 2.20,
	electronAffinity: 72.8,
	atomicRadius: 53,
	ionizationEnergy: 1312,
	valenceElectrons: 1,
	totalElectrons: 1,
	group: 1,
	period: 1,
	type: "non-metal",
};
const carbon: ChemicalElement = {
	symbol: "C",
	name: "Carbon",
	atomicMass: 12.011,
	atomicNumber: 6,
	electronegativity: 2.55,
	electronAffinity: 121.8,
	atomicRadius: 77,
	ionizationEnergy: 1086,
	valenceElectrons: 4,
	totalElectrons: 6,
	group: 14,
	period: 2,
	type: "non-metal",
};
const oxygen: ChemicalElement = {
	symbol: "O",
	name: "Oxygen",
	atomicMass: 15.999,
	atomicNumber: 8,
	electronegativity: 3.44,
	electronAffinity: 141.0,
	atomicRadius: 60,
	ionizationEnergy: 1314,
	valenceElectrons: 6,
	totalElectrons: 8,
	group: 16,
	period: 2,
	type: "non-metal",
};
const sampleElements: ChemicalElement[] = [hydrogen, carbon, oxygen];

describe("lookupElement", () => {
	it("returns null for an empty query", () => {
		expect(lookupElement("", sampleElements)).toBeNull();
	});
	it("returns null for a whitespace-only query", () => {
		expect(lookupElement("   ", sampleElements)).toBeNull();
	});
	it("returns null for a tab-only query", () => {
		expect(lookupElement("\t\t", sampleElements)).toBeNull();
	});
	it("matches by symbol with exact case", () => {
		expect(lookupElement("H", sampleElements)).toBe(hydrogen);
	});
	it("matches by symbol with lowercase", () => {
		expect(lookupElement("h", sampleElements)).toBe(hydrogen);
	});
	it("matches by symbol with uppercase", () => {
		expect(lookupElement("O", sampleElements)).toBe(oxygen);
	});
	it("matches by symbol with mixed case", () => {
		expect(lookupElement("c", sampleElements)).toBe(carbon);
	});
	it("matches by name with exact case", () => {
		expect(lookupElement("Hydrogen", sampleElements)).toBe(hydrogen);
	});
	it("matches by name with lowercase", () => {
		expect(lookupElement("carbon", sampleElements)).toBe(carbon);
	});
	it("matches by name with uppercase", () => {
		expect(lookupElement("OXYGEN", sampleElements)).toBe(oxygen);
	});
	it("matches by atomic number as string", () => {
		expect(lookupElement("1", sampleElements)).toBe(hydrogen);
	});
	it("matches by atomic number 6 for carbon", () => {
		expect(lookupElement("6", sampleElements)).toBe(carbon);
	});
	it("matches by atomic number 8 for oxygen", () => {
		expect(lookupElement("8", sampleElements)).toBe(oxygen);
	});
	it("trims whitespace before matching by symbol", () => {
		expect(lookupElement("  H  ", sampleElements)).toBe(hydrogen);
	});
	it("trims whitespace before matching by name", () => {
		expect(lookupElement("  Carbon  ", sampleElements)).toBe(carbon);
	});
	it("trims whitespace before matching by atomic number", () => {
		expect(lookupElement("  6  ", sampleElements)).toBe(carbon);
	});
	it("returns null when no element matches", () => {
		expect(lookupElement("Xyz", sampleElements)).toBeNull();
	});
	it("returns null when atomic number does not match any element", () => {
		expect(lookupElement("999", sampleElements)).toBeNull();
	});
	it("returns null for an empty elements list", () => {
		expect(lookupElement("H", [])).toBeNull();
	});
	it("returns the first element when query is non-empty and matches the first element", () => {
		expect(lookupElement("H", sampleElements)).toBe(hydrogen);
	});
	it("returns the last element when query matches only the last element", () => {
		expect(lookupElement("Oxygen", sampleElements)).toBe(oxygen);
	});
	it("does not match partial symbol", () => {
		expect(lookupElement("Hy", sampleElements)).toBeNull();
	});
	it("does not match partial name", () => {
		expect(lookupElement("Hydr", sampleElements)).toBeNull();
	});
	it("does not match atomic number with decimal", () => {
		expect(lookupElement("1.0", sampleElements)).toBeNull();
	});
});
