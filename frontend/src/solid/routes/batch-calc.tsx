/**
 * Visual verification: The Solid-rendered Batch Calculation card should
 * match the legacy #batch-calc card in frontend/index.html. Intentional
 * diff: this route is gated by WebModeGuard — in web mode (browser
 * without Wails) it renders a "web mode unavailable" placeholder instead
 * of initializing the BatchCalculator singleton's DOM listeners. In
 * desktop mode it calls the pure processCsvText helper and owns the file
 * input, progress bar, download button, and preview table via Solid
 * signals. The legacy singleton's progressCallback is bypassed (the
 * component supplies its own onProgress) so progress UI is reactive. No
 * Playwright screenshot test is added per task spec; parity is verified
 * by manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import type {BatchResult, ProgressInfo} from "../../modules/batchCalculator.js";
import {createSignal, For, Show} from "solid-js";
import {BatchCalculator} from "../../modules/batchCalculator.js";
import {WebModeGuard} from "../../modules/webModeGuard.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./batch-calc.module.css";
let calculatorTypeOptions: {"value": string; "label": string}[] = [
    {"value": "molar-mass", "label": "Molar Mass"},
    {"value": "dilution", "label": "Dilution"},
    {"value": "mass-percent", "label": "Mass Percent"},
    {"value": "solution-mixing", "label": "Solution Mixing"},
    {"value": "ideal-gas", "label": "Ideal Gas Law"},
    {"value": "combined-gas", "label": "Combined Gas Law"},
    {"value": "van-der-waals", "label": "Van der Waals"},
    {"value": "half-life", "label": "Half-Life"},
    {"value": "cell-potential", "label": "Cell Potential"},
    {"value": "nernst", "label": "Nernst Equation"},
    {"value": "electrolysis", "label": "Electrolysis"},
    {"value": "bond-type", "label": "Bond Type"},
    {"value": "gibbs-free-energy", "label": "Gibbs Free Energy"},
    {"value": "hess-law", "label": "Hess's Law"},
    {"value": "entropy", "label": "Entropy"},
    {"value": "heat-capacity", "label": "Heat Capacity"},
    {"value": "arrhenius", "label": "Arrhenius"},
    {"value": "rate-law", "label": "Rate Law"},
    {"value": "integrated-rate-law", "label": "Integrated Rate Law"},
    {"value": "buffer-solution", "label": "Buffer Solution"},
    {"value": "pka-pkb", "label": "pKa / pkb"},
    {"value": "ksp", "label": "Ksp"},
    {"value": "colligative-properties", "label": "Colligative Properties"},
    {"value": "titration-curve", "label": "Titration Curve"},
    {"value": "quantum-numbers", "label": "Quantum Numbers"},
    {"value": "electron-configuration", "label": "Electron Configuration"},
    {"value": "debroglie-wavelength", "label": "De Broglie Wavelength"},
    {"value": "photoelectric-effect", "label": "Photoelectric Effect"},
    {"value": "heisenberg-uncertainty", "label": "Heisenberg Uncertainty"}
];
function BatchCalc(): JSX.Element {
    let guard = WebModeGuard.getInstance();
    let calc = BatchCalculator.getInstance();
    let [calculatorType, setCalculatorType] = createSignal("molar-mass");
    let [file, setFile] = createSignal<File | null>(null);
    let [processing, setProcessing] = createSignal(false);
    let [progressCurrent, setProgressCurrent] = createSignal(0);
    let [progressTotal, setProgressTotal] = createSignal(1);
    let [result, setResult] = createSignal<BatchResult | null>(null);
    let [error, setError] = createSignal("");
    let [statusMessage, setStatusMessage] = createSignal("");
    function handleTypeChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setCalculatorType(target.value);
    }
    function handleFileChange(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            setFile(target.files[0]);
        }
        else {
            setFile(null);
        }
        setError("");
        setStatusMessage("");
    }
    async function handleProcess(): Promise<void> {
        let f: File | null = file();
        if (f === null) {
            setError("Please choose a CSV file.");
            return;
        }
        setError("");
        setStatusMessage("");
        setResult(null);
        setProcessing(true);
        setProgressCurrent(0);
        setProgressTotal(1);
        try {
            let text: string = await f.text();
            let res: BatchResult = await calc.processCsvText(text, calculatorType(), function (info: ProgressInfo): void {
                setProgressCurrent(info.current);
                setProgressTotal(info.total);
            });
            setResult(res);
            setStatusMessage("Processed " + res.totalRows + " rows. Success: " + res.successCount + ", Errors: " + res.errorCount + ".");
        }
        catch (err: unknown) {
            let message: string = err instanceof Error ? err.message : String(err);
            setError(message);
        }
        finally {
            setProcessing(false);
        }
    }
    function handleDownload(): void {
        let res: BatchResult | null = result();
        if (res === null) {
            return;
        }
        calc.downloadResults(res.csvString, "batch-results.csv");
    }
    function handleClear(): void {
        setFile(null);
        setResult(null);
        setError("");
        setStatusMessage("");
        setProgressCurrent(0);
        setProgressTotal(1);
        let input: HTMLInputElement | null = document.getElementById("batch-calc-file-input") as HTMLInputElement | null;
        if (input) {
            input.value = "";
        }
    }
    function renderPreview(): JSX.Element {
        let res: BatchResult | null = result();
        if (res === null) {
            return <></>;
        }
        let rows: string[][] = calc.parseCsv(res.csvString);
        if (rows.length === 0) {
            return <></>;
        }
        let previewRows: string[][] = rows.slice(0, 11);
        let header: string[] = previewRows[0];
        let body: string[][] = previewRows.slice(1);
        return (
            <div class={styles.previewContainer}>
                <h3 class={styles.previewTitle}>Results Preview (first 10 rows)</h3>
                <div class={styles.previewTable}>
                    <table class={styles.previewTableElement}>
                        <thead>
                            <tr>
                                <For each={header}>
                                    {(cell) => <th>{cell}</th>}
                                </For>
                            </tr>
                        </thead>
                        <tbody>
                            <For each={body}>
                                {(row) => (
                                    <tr>
                                        <For each={row}>
                                            {(cell) => <td>{cell}</td>}
                                        </For>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    if (guard.isWebMode) {
        return (
            <CalculatorCard
                title="Batch Calculation - Process Multiple Inputs from CSV"
                description="Upload a CSV file to run the same calculator across many rows of inputs at once. The first row must contain headers matching the calculator's input field names; each subsequent row is processed independently and appended to the results CSV."
                exampleDetails={
                    <ExampleDetails>
                        <p>Prepare a CSV like <strong>formula\nH2O\nNaCl\n</strong>, pick <em>Molar Mass</em>, and click Process. A results CSV with molar_mass/unit/status columns is generated for download.</p>
                    </ExampleDetails>
                }
                seeAlso={
                    <SeeAlsoLink href="#molar-mass">Need a single calculation? Use the Molar Mass Calculator for one-off formulas.</SeeAlsoLink>
                }
            >
                <div class={styles.placeholder}>Batch calculation is unavailable in web mode. Run the desktop app to process CSV files against the calculator backend.</div>
            </CalculatorCard>
        );
    }
    return (
        <CalculatorCard
            title="Batch Calculation - Process Multiple Inputs from CSV"
            description="Upload a CSV file to run the same calculator across many rows of inputs at once. The first row must contain headers matching the calculator's input field names; each subsequent row is processed independently and appended to the results CSV."
            exampleDetails={
                <ExampleDetails>
                    <p>Prepare a CSV like <strong>formula\nH2O\nNaCl\n</strong>, pick <em>Molar Mass</em>, and click Process. A results CSV with molar_mass/unit/status columns is generated for download.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#molar-mass">Need a single calculation? Use the Molar Mass Calculator for one-off formulas.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="batch-calc-calculator-type">Calculator type</label>
            <select id="batch-calc-calculator-type" class={styles.select} aria-label="Select calculator type for batch processing" value={calculatorType()} onChange={handleTypeChange}>
                <For each={calculatorTypeOptions}>
                    {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
            </select>
            <label class={styles.labelText} for="batch-calc-file-input">CSV file</label>
            <input type="file" id="batch-calc-file-input" class={styles.fileInput} accept=".csv" aria-label="Choose CSV file" onChange={handleFileChange} />
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleProcess} disabled={processing() || file() === null}>Process</button>
                <button class={styles.secondaryButton} onClick={handleClear} disabled={processing()}>Clear</button>
                <Show when={result() !== null}>
                    <button class={styles.secondaryButton} onClick={handleDownload}>Download Results</button>
                </Show>
            </div>
            <Show when={processing()}>
                <div class={styles.progressContainer}>
                    <progress class={styles.progressBar} max={progressTotal()} value={progressCurrent()} aria-label="Batch processing progress" />
                    <span class={styles.progressText}>{progressCurrent() + " / " + progressTotal()}</span>
                </div>
            </Show>
            <Show when={statusMessage() !== ""}>
                <div class={styles.status} role="status">{statusMessage()}</div>
            </Show>
            <Show when={error() !== ""}>
                <div class={styles.status + " " + styles.error} role="alert">{error()}</div>
            </Show>
            {renderPreview()}
        </CalculatorCard>
    );
}
export {BatchCalc};
