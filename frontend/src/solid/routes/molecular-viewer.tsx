/**
 * Visual verification: The Solid-rendered Molecular Structure Viewer card
 * should match the legacy #molecular-viewer card in frontend/index.html.
 * Intentional diff: this route delegates canvas rendering to the shared
 * <MoleculeRenderer> component (legacy used the MolecularViewer singleton
 * directly), binds zoom to a Solid signal instead of imperative CSS
 * transforms, and shows an empty-state placeholder before the first
 * render. Presets come from MolecularViewer.getPresets(). No Playwright
 * screenshot test is added per task spec; parity is verified by manual
 * diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import {createSignal, For} from "solid-js";
import {MolecularViewer} from "../../modules/molecularViewer.js";
import {MoleculeRenderer} from "../components/third-party/MoleculeRenderer";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./molecular-viewer.module.css";
let presets = MolecularViewer.getPresets();
function MolecularViewerRoute(): JSX.Element {
    let [smilesInput, setSmilesInput] = createSignal("");
    let [renderedSmiles, setRenderedSmiles] = createSignal("");
    let [zoom, setZoom] = createSignal(1);
    function handleSmilesInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setSmilesInput(target.value);
    }
    function handlePresetChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        let value = target.value;
        if (value === "") {
            return;
        }
        setSmilesInput(value);
        setRenderedSmiles(value);
        setZoom(1);
    }
    function handleRender(): void {
        setRenderedSmiles(smilesInput().trim());
    }
    function handleZoomIn(): void {
        let next = zoom() * 1.2;
        if (next > 5) {
            next = 5;
        }
        setZoom(next);
    }
    function handleZoomOut(): void {
        let next = zoom() / 1.2;
        if (next < 0.2) {
            next = 0.2;
        }
        setZoom(next);
    }
    function handleReset(): void {
        setZoom(1);
    }
    function handleClear(): void {
        setSmilesInput("");
        setRenderedSmiles("");
        setZoom(1);
    }
    return (
        <CalculatorCard
            title="Molecular Structure Viewer - Render Molecules from SMILES"
            description="Render 2D molecular structures from SMILES notation using SmilesDrawer. Choose a preset molecule or enter your own SMILES string, then click Render. Use the zoom controls (+/-) to adjust the scale, and Reset to return to the default view."
            exampleDetails={
                <ExampleDetails>
                    <p>Try <strong>CCO</strong> for ethanol, <strong>c1ccccc1</strong> for benzene, or select a preset from the dropdown above.</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#stoichiometry">Working with reaction equations? Try the Stoichiometry Calculator for mole ratios and limiting reactants.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="molecular-viewer-smiles">SMILES string</label>
            <input type="text" id="molecular-viewer-smiles" class={styles.input} placeholder="e.g., CCO for ethanol" aria-label="SMILES string" value={smilesInput()} onInput={handleSmilesInput} />
            <label class={styles.labelText} for="molecular-viewer-preset">Preset molecules</label>
            <select id="molecular-viewer-preset" class={styles.select} aria-label="Preset molecules" onChange={handlePresetChange}>
                <option value="">Select a preset...</option>
                <For each={presets}>
                    {(preset) => <option value={preset.smiles}>{preset.name}</option>}
                </For>
            </select>
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleRender}>Render Molecule</button>
                <button class={styles.secondaryButton} onClick={handleClear}>Clear</button>
            </div>
            <div class={styles.controls}>
                <button class={styles.secondaryButton} onClick={handleZoomIn} aria-label="Zoom in">+</button>
                <button class={styles.secondaryButton} onClick={handleZoomOut} aria-label="Zoom out">-</button>
                <button class={styles.secondaryButton} onClick={handleReset} aria-label="Reset view">Reset</button>
            </div>
            {renderedSmiles() === "" && <div class={styles.emptyState}>Enter a SMILES string or pick a preset, then click Render Molecule.</div>}
            {renderedSmiles() !== "" && (
                <div class={styles.canvasContainer}>
                    <MoleculeRenderer smiles={renderedSmiles()} zoom={zoom()} />
                </div>
            )}
        </CalculatorCard>
    );
}
export {MolecularViewerRoute};
