/**
 * Visual verification: The Solid-rendered Quantum & Atomic card should match
 * the legacy #quantum-atomic card in frontend/index.html. Intentional diffs:
 *  - This route surfaces a Clear button per calculator (legacy lacked one)
 *  - Each sub-section is wrapped in a <section> with a divider to mirror
 *    the legacy .sub-group visual rhythm
 * Routes math through calculatePure on QuantumNumbersValidator,
 * ElectronConfigurationGenerator, RydbergCalculator,
 * DeBroglieWavelengthCalculator, PhotoelectricEffectCalculator, and
 * HeisenbergUncertaintyCalculator. No Playwright screenshot test is added
 * per task spec; parity is verified by manual diff of the rendered DOM.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {QuantumNumbersValidator, ElectronConfigurationGenerator, RydbergCalculator, DeBroglieWavelengthCalculator, PhotoelectricEffectCalculator, HeisenbergUncertaintyCalculator} from "../../modules/quantumCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import {resolveResult} from "../../modules/resultResolver.js";
import styles from "./quantum-atomic.module.css";
let quantumNumbersCalculator = new QuantumNumbersValidator();
let electronConfigurationCalculator = new ElectronConfigurationGenerator();
let rydbergCalculator = new RydbergCalculator();
let deBroglieCalculator = new DeBroglieWavelengthCalculator();
let photoelectricCalculator = new PhotoelectricEffectCalculator();
let heisenbergCalculator = new HeisenbergUncertaintyCalculator();
let quantumNumberFields: CalculatorField[] = [
    {"id": "qn-n", "label": "n", "placeholder": "n (1,2,3,...)", "ariaLabel": "Principal quantum number"},
    {"id": "qn-l", "label": "l", "placeholder": "l (0 to n-1)", "ariaLabel": "Angular momentum quantum number"},
    {"id": "qn-ml", "label": "ml", "placeholder": "ml (-l to +l)", "ariaLabel": "Magnetic quantum number"},
    {"id": "qn-ms", "label": "ms", "placeholder": "ms (+0.5 or -0.5)", "ariaLabel": "Spin quantum number"}
];
let electronConfigFields: CalculatorField[] = [
    {"id": "ec-atomic-number", "label": "Z", "placeholder": "E.g., 26 for Fe", "ariaLabel": "Atomic number for electron configuration"}
];
let rydbergFields: CalculatorField[] = [
    {"id": "rydberg-n1", "label": "n₁", "placeholder": "n₁ (lower level)", "ariaLabel": "Rydberg lower energy level n1"},
    {"id": "rydberg-n2", "label": "n₂", "placeholder": "n₂ (higher level)", "ariaLabel": "Rydberg higher energy level n2"}
];
let deBroglieFields: CalculatorField[] = [
    {"id": "db-mass", "label": "Mass", "placeholder": "Mass", "ariaLabel": "De Broglie mass"},
    {"id": "db-velocity", "label": "v", "placeholder": "Velocity (m/s)", "ariaLabel": "De Broglie velocity"}
];
let deBroglieSelects: CalculatorSelect[] = [{
    "id": "db-mass-unit",
    "label": "Mass unit",
    "ariaLabel": "De Broglie mass unit",
    "options": [
        {"value": "kg", "label": "kg"},
        {"value": "amu", "label": "amu"}
    ],
    "defaultValue": "kg"
}];
let photoelectricFields: CalculatorField[] = [
    {"id": "pe-wavelength", "label": "λ", "placeholder": "Wavelength (nm)", "ariaLabel": "Photoelectric wavelength in nm"},
    {"id": "pe-frequency", "label": "f", "placeholder": "Frequency (Hz)", "ariaLabel": "Photoelectric frequency in Hz"},
    {"id": "pe-work-function", "label": "φ", "placeholder": "Work function φ (eV)", "ariaLabel": "Photoelectric work function in eV"},
    {"id": "pe-ke", "label": "KE", "placeholder": "Kinetic energy KE (eV)", "ariaLabel": "Photoelectric kinetic energy in eV"}
];
let photoelectricSelects: CalculatorSelect[] = [{
    "id": "pe-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select photoelectric parameter to solve for",
    "options": [
        {"value": "KE", "label": "Kinetic Energy (KE)"},
        {"value": "threshold-frequency", "label": "Threshold Frequency"},
        {"value": "work-function", "label": "Work Function (φ)"},
        {"value": "wavelength", "label": "Wavelength (λ)"}
    ],
    "defaultValue": "KE"
}];
let heisenbergFields: CalculatorField[] = [
    {"id": "heis-delta-x", "label": "Δx", "placeholder": "Δx (m)", "ariaLabel": "Uncertainty in position"},
    {"id": "heis-delta-p", "label": "Δp", "placeholder": "Δp (kg·m/s)", "ariaLabel": "Uncertainty in momentum"},
    {"id": "heis-mass", "label": "m", "placeholder": "Mass (kg, optional)", "ariaLabel": "Mass for delta-v calculation"}
];
let heisenbergSelects: CalculatorSelect[] = [{
    "id": "heis-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select Heisenberg parameter to solve for",
    "options": [
        {"value": "min-delta-x", "label": "Minimum Δx (from Δp)"},
        {"value": "min-delta-p", "label": "Minimum Δp (from Δx)"}
    ],
    "defaultValue": "min-delta-x"
}];
function QuantumAtomic(): JSX.Element {
    let [quantumNumbersResult, setQuantumNumbersResult] = createSignal("");
    let [quantumNumbersError, setQuantumNumbersError] = createSignal("");
    let [electronConfigResult, setElectronConfigResult] = createSignal("");
    let [electronConfigError, setElectronConfigError] = createSignal("");
    let [rydbergResult, setRydbergResult] = createSignal("");
    let [rydbergError, setRydbergError] = createSignal("");
    let [deBroglieResult, setDeBroglieResult] = createSignal("");
    let [deBroglieError, setDeBroglieError] = createSignal("");
    let [photoelectricResult, setPhotoelectricResult] = createSignal("");
    let [photoelectricError, setPhotoelectricError] = createSignal("");
    let [heisenbergResult, setHeisenbergResult] = createSignal("");
    let [heisenbergError, setHeisenbergError] = createSignal("");
    function handleQuantumNumbersCalculate(inputs: Record<string, string>): void {
        resolveResult(quantumNumbersCalculator.calculatePure(inputs), setQuantumNumbersResult, setQuantumNumbersError);
    }
    function handleQuantumNumbersClear(): void {
        setQuantumNumbersResult("");
        setQuantumNumbersError("");
    }
    function handleElectronConfigCalculate(inputs: Record<string, string>): void {
        resolveResult(electronConfigurationCalculator.calculatePure(inputs), setElectronConfigResult, setElectronConfigError);
    }
    function handleElectronConfigClear(): void {
        setElectronConfigResult("");
        setElectronConfigError("");
    }
    function handleRydbergCalculate(inputs: Record<string, string>): void {
        resolveResult(rydbergCalculator.calculatePure(inputs), setRydbergResult, setRydbergError);
    }
    function handleRydbergClear(): void {
        setRydbergResult("");
        setRydbergError("");
    }
    function handleDeBroglieCalculate(inputs: Record<string, string>): void {
        resolveResult(deBroglieCalculator.calculatePure(inputs), setDeBroglieResult, setDeBroglieError);
    }
    function handleDeBroglieClear(): void {
        setDeBroglieResult("");
        setDeBroglieError("");
    }
    function handlePhotoelectricCalculate(inputs: Record<string, string>): void {
        resolveResult(photoelectricCalculator.calculatePure(inputs), setPhotoelectricResult, setPhotoelectricError);
    }
    function handlePhotoelectricClear(): void {
        setPhotoelectricResult("");
        setPhotoelectricError("");
    }
    function handleHeisenbergCalculate(inputs: Record<string, string>): void {
        resolveResult(heisenbergCalculator.calculatePure(inputs), setHeisenbergResult, setHeisenbergError);
    }
    function handleHeisenbergClear(): void {
        setHeisenbergResult("");
        setHeisenbergError("");
    }
    return (
        <CalculatorCard
            title="Quantum & Atomic"
            description="Validate quantum numbers, generate electron configurations, calculate wavelengths with the Rydberg formula, de Broglie wavelengths, photoelectric effect parameters, and Heisenberg uncertainty limits. These tools cover the fundamental quantum mechanics concepts essential for modern chemistry and atomic physics courses."
            seeAlso={
                <SeeAlsoLink href="/kinetics">Exploring reaction dynamics? See the Kinetics calculators for Arrhenius, rate laws, and collision theory.</SeeAlsoLink>
            }
        >
            <section class={styles.subGroup}>
                <h3>Quantum Numbers Validator</h3>
                <p>Validate a set of quantum numbers (n, l, ml, ms) and determine the orbital designation.</p>
                <CalculatorForm
                    fields={quantumNumberFields}
                    inputGroupLabel="Quantum numbers"
                    calculateLabel="Validate Quantum Numbers"
                    onCalculate={handleQuantumNumbersCalculate}
                    onClear={handleQuantumNumbersClear}
                    result={quantumNumbersResult}
                    error={quantumNumbersError}
                />
                <ExampleDetails>
                    <p>Try n=2, l=1, ml=0, ms=0.5 for a valid 2p orbital. Or try n=1, l=1 to see an invalid combination (l must be less than n).</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Electron Configuration Generator</h3>
                <p>Generate the electron configuration from an atomic number (1-118).</p>
                <CalculatorForm
                    fields={electronConfigFields}
                    inputGroupLabel="Atomic number"
                    calculateLabel="Generate Configuration"
                    onCalculate={handleElectronConfigCalculate}
                    onClear={handleElectronConfigClear}
                    result={electronConfigResult}
                    error={electronConfigError}
                />
                <ExampleDetails>
                    <p>Try atomic number 26 for Iron (Fe): [Ar] 3d6 4s2. Or try 24 for Chromium (Cr) which has the exception [Ar] 3d5 4s1.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Rydberg Formula Calculator - 1/λ = R_H(1/n₁² - 1/n₂²)</h3>
                <p>Calculate wavelength, frequency, and energy for hydrogen spectral lines.</p>
                <CalculatorForm
                    fields={rydbergFields}
                    inputGroupLabel="Rydberg formula parameters"
                    calculateLabel="Calculate Rydberg"
                    onCalculate={handleRydbergCalculate}
                    onClear={handleRydbergClear}
                    result={rydbergResult}
                    error={rydbergError}
                />
                <ExampleDetails>
                    <p>Try n₁=2, n₂=3 for the Balmer series H-alpha line (656.3 nm, visible red). Or n₁=1, n₂=2 for the Lyman series (121.5 nm, UV).</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>De Broglie Wavelength Calculator - λ = h/(mv)</h3>
                <p>Calculate the de Broglie wavelength of a particle.</p>
                <CalculatorForm
                    fields={deBroglieFields}
                    selects={deBroglieSelects}
                    inputGroupLabel="De Broglie parameters"
                    calculateLabel="Calculate λ"
                    onCalculate={handleDeBroglieCalculate}
                    onClear={handleDeBroglieClear}
                    result={deBroglieResult}
                    error={deBroglieError}
                />
                <ExampleDetails>
                    <p>Try an electron (9.109e-31 kg) at 1e6 m/s to get λ ≈ 0.727 nm. Or use 1 amu at 1000 m/s for a heavy particle.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Photoelectric Effect Calculator - KE = hf - φ</h3>
                <p>Solve for kinetic energy, threshold frequency, work function, or wavelength.</p>
                <CalculatorForm
                    fields={photoelectricFields}
                    selects={photoelectricSelects}
                    inputGroupLabel="Photoelectric effect parameters"
                    calculateLabel="Calculate Photoelectric"
                    onCalculate={handlePhotoelectricCalculate}
                    onClear={handlePhotoelectricClear}
                    result={photoelectricResult}
                    error={photoelectricError}
                />
                <ExampleDetails>
                    <p>Try wavelength=400 nm, work function=2.3 eV (sodium) to find KE ≈ 0.8 eV. Or find the threshold frequency for a 4.5 eV work function.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Heisenberg Uncertainty Calculator - Δx·Δp ≥ ℏ/2</h3>
                <p>Solve for minimum uncertainty in position or momentum.</p>
                <CalculatorForm
                    fields={heisenbergFields}
                    selects={heisenbergSelects}
                    inputGroupLabel="Uncertainty parameters"
                    calculateLabel="Calculate Heisenberg"
                    onCalculate={handleHeisenbergCalculate}
                    onClear={handleHeisenbergClear}
                    result={heisenbergResult}
                    error={heisenbergError}
                />
                <ExampleDetails>
                    <p>Try Δp=1e-24 kg·m/s to find minimum Δx ≈ 5.275e-11 m. Or enter a mass like 9.109e-31 kg to also get Δv.</p>
                </ExampleDetails>
            </section>
        </CalculatorCard>
    );
}
export {QuantumAtomic};
