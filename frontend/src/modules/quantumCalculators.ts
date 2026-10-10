import { PureCalculator } from "./calculators/pureCalculator.js";
import type { CalculatorResult } from "./calculators/pureCalculator.js";
import {
    quantumNumbers,
    electronConfiguration,
    rydberg,
    deBroglie,
    photoelectric,
    heisenberg
} from "./calculators/quantum.js";
import { InputElement } from "./inputElement.js";
import { ResultDisplay } from "./resultDisplay.js";
import { NumberFormatter } from "./i18n/numberFormatter.js";

/**
 * Validates quantum number combinations.
 * n: positive integer (1, 2, 3, ...)
 * l: 0 to n-1
 * ml: -l to +l
 * ms: +1/2 or -1/2
 * Inputs: n, l, ml, ms
 * Output: valid/invalid, orbital designation, max electrons in subshell
 */
export class QuantumNumbersValidator extends PureCalculator {
	protected getCalculatorId(): string {
		return "quantum-numbers";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return quantumNumbers(
			parseFloat(inputs["qn-n"] ?? ""),
			parseFloat(inputs["qn-l"] ?? ""),
			parseFloat(inputs["qn-ml"] ?? ""),
			parseFloat(inputs["qn-ms"] ?? "")
		);
	}
}

/**
 * Generates electron configuration from atomic number.
 * Fill order follows Aufbau principle with known exceptions.
 * Inputs: atomic number (1-118)
 * Output: full configuration, noble gas notation, orbital diagram text, valence electrons
 */
export class ElectronConfigurationGenerator extends PureCalculator {
	protected getCalculatorId(): string {
		return "electron-config";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return electronConfiguration(parseFloat(inputs["ec-atomic-number"] ?? ""));
	}
}

/**
 * Calculates wavelength, frequency, and energy for hydrogen spectral lines
 * using the Rydberg formula: 1/lambda = R_H * (1/n1^2 - 1/n2^2)
 * Inputs: n1 (lower energy level), n2 (higher energy level)
 * Output: wavelength (nm), frequency (Hz), energy (eV), spectral series name
 */
export class RydbergCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "rydberg";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return rydberg(
			parseFloat(inputs["rydberg-n1"] ?? ""),
			parseFloat(inputs["rydberg-n2"] ?? "")
		);
	}
}

/**
 * Calculates de Broglie wavelength: lambda = h / (m * v)
 * h = 6.626e-34 J*s
 * Inputs: mass (kg, g, or amu), velocity (m/s)
 * Output: wavelength (pm, nm, um, or m depending on scale)
 */
export class DeBroglieWavelengthCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "debroglie";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return deBroglie(
			parseFloat(inputs["db-mass"] ?? ""),
			parseFloat(inputs["db-velocity"] ?? ""),
			inputs["db-mass-unit"] ?? "kg"
		);
	}
}

/**
 * Calculates photoelectric effect: KE = hf - phi (work function)
 * KE = hc/lambda - phi
 * Inputs: wavelength (nm) or frequency (Hz), work function phi (eV)
 * Can solve for KE, threshold frequency, threshold wavelength, or phi
 * Output: KE (eV), threshold frequency (Hz), threshold wavelength (nm)
 */
export class PhotoelectricEffectCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "photoelectric";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return photoelectric(
			inputs["pe-solve-for"] ?? "",
			parseFloat(inputs["pe-wavelength"] ?? ""),
			parseFloat(inputs["pe-frequency"] ?? ""),
			parseFloat(inputs["pe-work-function"] ?? ""),
			parseFloat(inputs["pe-ke"] ?? "")
		);
	}
}

/**
 * Calculates Heisenberg uncertainty principle: deltaX * deltaP >= hbar/2
 * hbar = h / (2*pi) = 1.055e-34 J*s
 * deltaP = m * deltaV
 * Inputs: uncertainty in position deltaX (m) OR uncertainty in momentum deltaP (kg*m/s)
 * Can also input mass to convert between deltaP and deltaV
 * Output: minimum deltaP or deltaX, deltaV if mass given
 */
export class HeisenbergUncertaintyCalculator extends PureCalculator {
	protected getCalculatorId(): string {
		return "heisenberg";
	}

	protected performCalculationPure(inputs: Record<string, string>): CalculatorResult {
		return heisenberg(
			inputs["heis-solve-for"] ?? "",
			parseFloat(inputs["heis-delta-x"] ?? ""),
			parseFloat(inputs["heis-delta-p"] ?? ""),
			parseFloat(inputs["heis-mass"] ?? "")
		);
	}
}

interface QuantumNumbersMetadata {
	n: number;
	l: number;
	ml: number;
	ms: number;
	shell: string;
	subshell: string;
	orbitalDesignation: string;
	maxElectrons: number;
	valid: boolean;
	errors: string[];
}

interface ElectronConfigurationMetadata {
	atomicNumber: number;
	fullConfig: string;
	nobleGasNotation: string;
	valenceElectrons: number;
	orbitalDiagram: string;
}

interface RydbergMetadata {
	n1: number;
	n2: number;
	seriesName: string;
	wavelengthNm: number;
	frequencyHz: number;
	energyEv: number;
}

interface DeBroglieMetadata {
	massRaw: number;
	massKg: number;
	massUnit: string;
	wavelengthDisplay: number;
	unit: string;
	wavelengthM: number;
}

interface PhotoelectricKeMetadata {
	photonEnergyEv: number;
	workFunctionEv: number;
	kineticEnergyEv: number;
	thresholdFrequencyHz: number;
	thresholdWavelengthNm: number;
}

interface ThresholdFrequencyMetadata {
	thresholdFrequencyHz: number;
	thresholdWavelengthNm: number;
	workFunctionEv: number;
}

interface WorkFunctionMetadata {
	photonEnergyEv: number;
	workFunctionEv: number;
}

interface PhotoelectricWavelengthMetadata {
	totalPhotonEnergyEv: number;
	wavelengthNm: number;
	frequencyHz: number;
}

interface HeisenbergMetadata {
	minProduct: number;
	minDeltaX?: number;
	minDeltaP?: number;
	deltaV?: number;
	minDeltaV?: number;
}

function metadataOf<T>(result: CalculatorResult): T {
	return result.metadata as unknown as T;
}

function readValue(id: string): string {
	return new InputElement(id).getStringValue();
}

/**
 * Legacy DOM entry point shared by the free functions below. Reads the DOM
 * inputs, runs the DOM-free calculator, and renders the outcome on the legacy
 * result element. A failed run is reported through the same "Error: ..."
 * banner the old DOM calculators rendered.
 */
function runLegacy(
	calculator: PureCalculator,
	resultElementId: string,
	inputIds: string[],
	render: (result: CalculatorResult, nf: NumberFormatter) => string
): void {
	let inputs: Record<string, string> = {};
	for (let i = 0; i < inputIds.length; i++) {
		inputs[inputIds[i]] = readValue(inputIds[i]);
	}
	let result: CalculatorResult = calculator.calculatePure(inputs);
	let explanation: string = result.explanation ?? "";
	let display: ResultDisplay = new ResultDisplay(resultElementId);
	if (explanation.startsWith("Error")) {
		display.showError(explanation.slice("Error: ".length));
		return;
	}
	display.showResult(render(result, NumberFormatter.createFromCurrentLocale()));
}

function quantumNumbersHtml(result: CalculatorResult): string {
	let meta: QuantumNumbersMetadata = metadataOf<QuantumNumbersMetadata>(result);
	let html: string = "";
	html += "<p>n = " + meta.n + " (shell " + meta.shell + ")</p>";
	html += "<p>l = " + meta.l + " (subshell " + meta.subshell + ")</p>";
	html += "<p>ml = " + meta.ml + "</p>";
	html += "<p>ms = " + (meta.ms > 0 ? "+1/2" : "-1/2") + "</p>";
	if (meta.valid) {
		html += "<p><strong>Valid</strong> set of quantum numbers</p>";
	} else {
		for (let i = 0; i < meta.errors.length; i++) {
			html += "<p><strong>ERROR:</strong> " + meta.errors[i] + "</p>";
		}
	}
	html += "<p>Orbital designation: <strong>" + meta.orbitalDesignation + "</strong></p>";
	html += "<p>Max electrons in " + meta.orbitalDesignation + " subshell: <strong>" + meta.maxElectrons + "</strong></p>";
	return html;
}

function electronConfigurationHtml(result: CalculatorResult): string {
	let meta: ElectronConfigurationMetadata = metadataOf<ElectronConfigurationMetadata>(result);
	let html: string = "";
	html += "<p>Atomic number: <strong>" + meta.atomicNumber + "</strong></p>";
	html += "<p>Full configuration: <strong>" + meta.fullConfig + "</strong></p>";
	html += "<p>Noble gas notation: <strong>" + meta.nobleGasNotation + "</strong></p>";
	html += "<p>Valence electrons: <strong>" + meta.valenceElectrons + "</strong></p>";
	html += "<p>Orbital diagram:</p>";
	html += "<pre>" + meta.orbitalDiagram + "</pre>";
	return html;
}

function rydbergHtml(result: CalculatorResult, nf: NumberFormatter): string {
	let meta: RydbergMetadata = metadataOf<RydbergMetadata>(result);
	let html: string = "";
	html += "<p>Spectral series: <strong>" + meta.seriesName + "</strong> (n\u2081 = " + meta.n1 + ")</p>";
	html += "<p>Transition: n = " + meta.n2 + " \u2192 n = " + meta.n1 + "</p>";
	html += "<p>Wavelength: <strong>" + nf.format(meta.wavelengthNm, 2) + " nm</strong></p>";
	html += "<p>Frequency: <strong>" + nf.format(meta.frequencyHz, 4) + " Hz</strong></p>";
	html += "<p>Energy: <strong>" + nf.format(meta.energyEv, 4) + " eV</strong></p>";
	return html;
}

function deBroglieHtml(result: CalculatorResult, nf: NumberFormatter): string {
	let meta: DeBroglieMetadata = metadataOf<DeBroglieMetadata>(result);
	let html: string = "";
	html += "<p>\u03BB = h / (m\u00B7v)</p>";
	if (meta.massUnit === "amu") {
		html += "<p>Mass: " + nf.format(meta.massRaw, 4) + " amu = " + nf.format(meta.massKg, 4) + " kg</p>";
	}
	html += "<p>De Broglie wavelength: <strong>" + nf.format(meta.wavelengthDisplay, 4) + " " + meta.unit + "</strong></p>";
	html += "<p>Wavelength in meters: " + nf.format(meta.wavelengthM, 4) + " m</p>";
	return html;
}

function photoelectricHtml(solveFor: string, result: CalculatorResult, nf: NumberFormatter): string {
	if (solveFor === "KE") {
		let meta: PhotoelectricKeMetadata = metadataOf<PhotoelectricKeMetadata>(result);
		let html: string = "";
		html += "<p>Photon energy: " + nf.format(meta.photonEnergyEv, 4) + " eV</p>";
		html += "<p>Work function \u03C6: " + nf.format(meta.workFunctionEv, 4) + " eV</p>";
		if (meta.kineticEnergyEv < 0) {
			html += "<p><strong>No electron emission</strong> (photon energy below work function)</p>";
			html += "<p>KE would be: " + nf.format(meta.kineticEnergyEv, 4) + " eV (negative = no emission)</p>";
		} else {
			html += "<p>Kinetic energy KE: <strong>" + nf.format(meta.kineticEnergyEv, 4) + " eV</strong></p>";
		}
		html += "<p>Threshold frequency: " + nf.format(meta.thresholdFrequencyHz, 4) + " Hz</p>";
		html += "<p>Threshold wavelength: " + nf.format(meta.thresholdWavelengthNm, 2) + " nm</p>";
		return html;
	}
	if (solveFor === "threshold-frequency") {
		let meta: ThresholdFrequencyMetadata = metadataOf<ThresholdFrequencyMetadata>(result);
		return "<p>Threshold frequency: <strong>" + nf.format(meta.thresholdFrequencyHz, 4) + " Hz</strong></p>" +
			"<p>Threshold wavelength: <strong>" + nf.format(meta.thresholdWavelengthNm, 2) + " nm</strong></p>";
	}
	if (solveFor === "work-function") {
		let meta: WorkFunctionMetadata = metadataOf<WorkFunctionMetadata>(result);
		return "<p>Photon energy: " + nf.format(meta.photonEnergyEv, 4) + " eV</p>" +
			"<p>Work function \u03C6: <strong>" + nf.format(meta.workFunctionEv, 4) + " eV</strong></p>";
	}
	let meta: PhotoelectricWavelengthMetadata = metadataOf<PhotoelectricWavelengthMetadata>(result);
	return "<p>Total photon energy: " + nf.format(meta.totalPhotonEnergyEv, 4) + " eV</p>" +
		"<p>Required wavelength: <strong>" + nf.format(meta.wavelengthNm, 2) + " nm</strong></p>" +
		"<p>Required frequency: <strong>" + nf.format(meta.frequencyHz, 4) + " Hz</strong></p>";
}

function heisenbergHtml(result: CalculatorResult, nf: NumberFormatter): string {
	let meta: HeisenbergMetadata = metadataOf<HeisenbergMetadata>(result);
	let html: string = "";
	html += "<p>\u0394x\u00B7\u0394p \u2265 \u0127/2 = " + nf.format(meta.minProduct, 4) + " J\u00B7s</p>";
	if (meta.minDeltaX !== undefined) {
		html += "<p>Minimum \u0394x: <strong>" + nf.format(meta.minDeltaX, 4) + " m</strong></p>";
		if (meta.deltaV !== undefined) {
			html += "<p>\u0394v corresponding to \u0394p: <strong>" + nf.format(meta.deltaV, 4) + " m/s</strong></p>";
			html += "<p>Minimum \u0394v from \u0394x: <strong>" + nf.format(meta.minDeltaV as number, 4) + " m/s</strong></p>";
		}
	} else {
		html += "<p>Minimum \u0394p: <strong>" + nf.format(meta.minDeltaP as number, 4) + " kg\u00B7m/s</strong></p>";
		if (meta.minDeltaV !== undefined) {
			html += "<p>Minimum \u0394v: <strong>" + nf.format(meta.minDeltaV, 4) + " m/s</strong></p>";
		}
	}
	return html;
}

// Legacy DOM entry points. The calculator classes are DOM-free; these free
// functions exist only for the pre-migration index.html wiring and the tests
// that still drive the legacy element ids.
export function calculateQuantumNumbers(): void {
	runLegacy(new QuantumNumbersValidator(), "quantum-numbers-result", ["qn-n", "qn-l", "qn-ml", "qn-ms"], quantumNumbersHtml);
}

export function calculateElectronConfiguration(): void {
	runLegacy(new ElectronConfigurationGenerator(), "electron-config-result", ["ec-atomic-number"], electronConfigurationHtml);
}

export function calculateRydberg(): void {
	runLegacy(new RydbergCalculator(), "rydberg-result", ["rydberg-n1", "rydberg-n2"], rydbergHtml);
}

export function calculateDeBroglie(): void {
	runLegacy(new DeBroglieWavelengthCalculator(), "debroglie-result", ["db-mass", "db-velocity", "db-mass-unit"], deBroglieHtml);
}

export function calculatePhotoelectricEffect(): void {
	let solveFor: string = readValue("pe-solve-for");
	runLegacy(
		new PhotoelectricEffectCalculator(),
		"photoelectric-result",
		["pe-solve-for", "pe-wavelength", "pe-frequency", "pe-work-function", "pe-ke"],
		function (result: CalculatorResult, nf: NumberFormatter): string {
			return photoelectricHtml(solveFor, result, nf);
		}
	);
}

export function calculateHeisenbergUncertainty(): void {
	runLegacy(
		new HeisenbergUncertaintyCalculator(),
		"heisenberg-result",
		["heis-solve-for", "heis-delta-x", "heis-delta-p", "heis-mass"],
		heisenbergHtml
	);
}
