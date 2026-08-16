/**
 * Visual verification: The Solid-rendered Thermodynamics card should match
 * the legacy #thermodynamics card in frontend/index.html. Intentional diffs:
 *  - This route surfaces a Clear button per calculator (legacy lacked one)
 *  - Each sub-section is wrapped in a <section> with a divider to mirror
 *    the legacy .sub-group visual rhythm
 *  - Hess's Law and Entropy inputs use type="text" via the shared
 *    CalculatorForm (legacy used <input type="text">); Bond Enthalpy
 *    uses a dynamic BondEditor component (see SubTask 20.2) that
 *    serializes rows of bond-type + count into the comma-separated
 *    format expected by BondEnthalpyCalculator.calculatePure
 * Routes math through calculatePure on GibbsFreeEnergyCalculator,
 * HessLawCalculator, EntropyCalculator, HeatCapacityCalculator,
 * BondEnthalpyCalculator, and BornHaberCycleCalculator. No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM.
 */
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {GibbsFreeEnergyCalculator, HessLawCalculator, EntropyCalculator, HeatCapacityCalculator, BondEnthalpyCalculator, BornHaberCycleCalculator} from "../../modules/thermodynamicsCalculators.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {CalculatorForm} from "../components/CalculatorForm";
import type {CalculatorField, CalculatorSelect} from "../components/CalculatorForm";
import {BondEditor} from "../components/BondEditor";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import {resolveResult} from "../../modules/resultResolver.js";
import styles from "./thermodynamics.module.css";
let gibbsCalculator = new GibbsFreeEnergyCalculator();
let hessCalculator = new HessLawCalculator();
let entropyCalculator = new EntropyCalculator();
let heatCapacityCalculator = new HeatCapacityCalculator();
let bondEnthalpyCalculator = new BondEnthalpyCalculator();
let bornHaberCalculator = new BornHaberCycleCalculator();
let gibbsFields: CalculatorField[] = [
    {"id": "gibbs-deltaH", "label": "ΔH", "placeholder": "ΔH (kJ/mol)", "ariaLabel": "Enthalpy change"},
    {"id": "gibbs-deltaS", "label": "ΔS", "placeholder": "ΔS (J/(mol·K))", "ariaLabel": "Entropy change"},
    {"id": "gibbs-T", "label": "T", "placeholder": "T (K)", "ariaLabel": "Temperature"}
];
let hessFields: CalculatorField[] = [
    {"id": "hess-steps", "label": "ΔH steps", "placeholder": "E.g., -100, 50, -200", "ariaLabel": "Enthalpy steps", "type": "text"}
];
let entropyFields: CalculatorField[] = [
    {"id": "entropy-products", "label": "Products S°", "placeholder": "Products S° (comma-separated, J/(mol·K))", "ariaLabel": "Product entropies", "type": "text"},
    {"id": "entropy-reactants", "label": "Reactants S°", "placeholder": "Reactants S° (comma-separated, J/(mol·K))", "ariaLabel": "Reactant entropies", "type": "text"}
];
let heatCapacityFields: CalculatorField[] = [
    {"id": "heat-cap-mass", "label": "Mass", "placeholder": "Mass (g)", "ariaLabel": "Mass"},
    {"id": "heat-cap-specific-heat", "label": "Specific heat", "placeholder": "Specific heat (J/(g·K))", "ariaLabel": "Specific heat"},
    {"id": "heat-cap-initial-temp", "label": "Initial temp", "placeholder": "Initial temp (K)", "ariaLabel": "Initial temperature"},
    {"id": "heat-cap-final-temp", "label": "Final temp", "placeholder": "Final temp (K)", "ariaLabel": "Final temperature"},
    {"id": "heat-cap-heat", "label": "Heat", "placeholder": "Heat (J)", "ariaLabel": "Heat"}
];
let heatCapacitySelects: CalculatorSelect[] = [{
    "id": "heat-cap-solve-for",
    "label": "Solve for",
    "ariaLabel": "Select heat capacity parameter to solve for",
    "options": [
        {"value": "q", "label": "Heat (q)"},
        {"value": "c", "label": "Specific Heat (c)"},
        {"value": "deltaT", "label": "Temperature Change (ΔT)"},
        {"value": "Tfinal", "label": "Final Temperature (T_final)"}
    ],
    "defaultValue": "q"
}];
let bornHaberFields: CalculatorField[] = [
    {"id": "born-haber-dHf", "label": "ΔHf", "placeholder": "ΔHf (kJ/mol)", "ariaLabel": "Enthalpy of formation"},
    {"id": "born-haber-dHsub", "label": "ΔHsub", "placeholder": "ΔHsub (kJ/mol)", "ariaLabel": "Enthalpy of sublimation"},
    {"id": "born-haber-IE", "label": "IE", "placeholder": "IE (kJ/mol)", "ariaLabel": "Ionization energy"},
    {"id": "born-haber-dHdiss", "label": "ΔHdiss", "placeholder": "ΔHdiss (kJ/mol)", "ariaLabel": "Enthalpy of dissociation"},
    {"id": "born-haber-EA", "label": "EA", "placeholder": "EA (kJ/mol)", "ariaLabel": "Electron affinity"}
];
function Thermodynamics(): JSX.Element {
    let [gibbsResult, setGibbsResult] = createSignal("");
    let [gibbsError, setGibbsError] = createSignal("");
    let [hessResult, setHessResult] = createSignal("");
    let [hessError, setHessError] = createSignal("");
    let [entropyResult, setEntropyResult] = createSignal("");
    let [entropyError, setEntropyError] = createSignal("");
    let [heatCapacityResult, setHeatCapacityResult] = createSignal("");
    let [heatCapacityError, setHeatCapacityError] = createSignal("");
    let [bondEnthalpyResult, setBondEnthalpyResult] = createSignal("");
    let [bondEnthalpyError, setBondEnthalpyError] = createSignal("");
    let [bornHaberResult, setBornHaberResult] = createSignal("");
    let [bornHaberError, setBornHaberError] = createSignal("");
    function handleGibbsCalculate(inputs: Record<string, string>): void {
        resolveResult(gibbsCalculator.calculatePure(inputs), setGibbsResult, setGibbsError);
    }
    function handleGibbsClear(): void {
        setGibbsResult("");
        setGibbsError("");
    }
    function handleHessCalculate(inputs: Record<string, string>): void {
        resolveResult(hessCalculator.calculatePure(inputs), setHessResult, setHessError);
    }
    function handleHessClear(): void {
        setHessResult("");
        setHessError("");
    }
    function handleEntropyCalculate(inputs: Record<string, string>): void {
        resolveResult(entropyCalculator.calculatePure(inputs), setEntropyResult, setEntropyError);
    }
    function handleEntropyClear(): void {
        setEntropyResult("");
        setEntropyError("");
    }
    function handleHeatCapacityCalculate(inputs: Record<string, string>): void {
        resolveResult(heatCapacityCalculator.calculatePure(inputs), setHeatCapacityResult, setHeatCapacityError);
    }
    function handleHeatCapacityClear(): void {
        setHeatCapacityResult("");
        setHeatCapacityError("");
    }
    function handleBondEnthalpyCalculate(inputs: Record<string, string>): void {
        resolveResult(bondEnthalpyCalculator.calculatePure(inputs), setBondEnthalpyResult, setBondEnthalpyError);
    }
    function handleBondEnthalpyClear(): void {
        setBondEnthalpyResult("");
        setBondEnthalpyError("");
    }
    function handleBornHaberCalculate(inputs: Record<string, string>): void {
        resolveResult(bornHaberCalculator.calculatePure(inputs), setBornHaberResult, setBornHaberError);
    }
    function handleBornHaberClear(): void {
        setBornHaberResult("");
        setBornHaberError("");
    }
    return (
        <CalculatorCard
            title="Thermodynamics"
            description="Calculate Gibbs free energy, Hess's Law enthalpy sums, entropy changes, heat capacity, bond enthalpy estimates, and Born-Haber cycle lattice energies. These tools cover the core thermodynamic relationships needed for general and physical chemistry courses."
            seeAlso={
                <SeeAlsoLink href="/gas-laws">Working with thermochemistry? See the Gas Laws calculators for pressure, volume, and temperature relationships.</SeeAlsoLink>
            }
        >
            <section class={styles.subGroup}>
                <h3>Gibbs Free Energy Calculator - ΔG = ΔH - TΔS</h3>
                <p>Calculate Gibbs free energy and determine reaction spontaneity.</p>
                <CalculatorForm
                    fields={gibbsFields}
                    inputGroupLabel="Gibbs free energy parameters"
                    calculateLabel="Calculate ΔG"
                    onCalculate={handleGibbsCalculate}
                    onClear={handleGibbsClear}
                    result={gibbsResult}
                    error={gibbsError}
                />
                <ExampleDetails>
                    <p>Try ΔH=-100 kJ/mol, ΔS=200 J/(mol·K), T=298 K. ΔG = -100 - 298×0.200 = -159.6 kJ/mol (Spontaneous).</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Hess's Law Calculator - Sum of Enthalpy Steps</h3>
                <p>Calculate total ΔH from multiple reaction steps (2-10 values).</p>
                <CalculatorForm
                    fields={hessFields}
                    inputGroupLabel="ΔH values (comma-separated, kJ/mol)"
                    calculateLabel="Calculate Total ΔH"
                    onCalculate={handleHessCalculate}
                    onClear={handleHessClear}
                    result={hessResult}
                    error={hessError}
                />
                <ExampleDetails>
                    <p>Try entering -100, 50, -200 to get total ΔH = -250 kJ/mol.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Entropy Change Calculator - ΔS° = ΣS°(products) - ΣS°(reactants)</h3>
                <p>Calculate the standard entropy change of a reaction.</p>
                <CalculatorForm
                    fields={entropyFields}
                    inputGroupLabel="Entropy values"
                    calculateLabel="Calculate ΔS°"
                    onCalculate={handleEntropyCalculate}
                    onClear={handleEntropyClear}
                    result={entropyResult}
                    error={entropyError}
                />
                <ExampleDetails>
                    <p>Try products: 188.8, reactants: 130.7, 205.2 to get ΔS° = -147.1 J/(mol·K).</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Heat Capacity Calculator - q = mcΔT</h3>
                <p>Solve for heat (q), specific heat (c), temperature change (ΔT), or final temperature.</p>
                <CalculatorForm
                    fields={heatCapacityFields}
                    selects={heatCapacitySelects}
                    inputGroupLabel="Heat capacity parameters"
                    onCalculate={handleHeatCapacityCalculate}
                    onClear={handleHeatCapacityClear}
                    result={heatCapacityResult}
                    error={heatCapacityError}
                />
                <ExampleDetails>
                    <p>Try solving for q: mass=100 g, specific heat=4.184 J/(g·K), initial temp=25 K, final temp=75 K. Result: q=20920 J.</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Bond Enthalpy Calculator - ΔH ≈ Σ(bonds broken) - Σ(bonds formed)</h3>
                <p>Estimate reaction enthalpy from bond energies. Add bonds broken and formed using the dynamic editors below. Supported bonds: C-H, C-C, C=C, C≡C, O-H, O=O, N≡N, C-O, C=O, H-H.</p>
                <BondEditor
                    onCalculate={handleBondEnthalpyCalculate}
                    onClear={handleBondEnthalpyClear}
                    result={bondEnthalpyResult}
                    error={bondEnthalpyError}
                    calculateLabel="Calculate ΔH"
                />
                <ExampleDetails>
                    <p>Try broken: O=O (count 1) + H-H (count 2) and formed: O-H (count 4). ΔH = (495 + 872) - 1852 = -485 kJ/mol (Exothermic).</p>
                </ExampleDetails>
            </section>
            <section class={styles.subGroup}>
                <h3>Born-Haber Cycle Calculator - Lattice Energy</h3>
                <p>Calculate lattice energy from the Born-Haber cycle: ΔH_f = ΔH_sub + IE + ΔH_diss/2 + EA + U</p>
                <CalculatorForm
                    fields={bornHaberFields}
                    inputGroupLabel="Born-Haber cycle parameters"
                    calculateLabel="Calculate Lattice Energy"
                    onCalculate={handleBornHaberCalculate}
                    onClear={handleBornHaberClear}
                    result={bornHaberResult}
                    error={bornHaberError}
                />
                <ExampleDetails>
                    <p>Try NaCl: ΔHf=-411, ΔHsub=108, IE=496, ΔHdiss=244, EA=-349. Lattice energy U ≈ -787 kJ/mol.</p>
                </ExampleDetails>
            </section>
        </CalculatorCard>
    );
}
export {Thermodynamics};
