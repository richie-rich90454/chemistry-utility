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
 *
 * Structure sketch: a hand-rolled SVG overlay lets the user place atoms
 * and connect them; the sketch emits SMILES (via structureSketch.ts)
 * into the same SmilesDrawer viewer, with a molar-mass prefill link.
 */
import type {JSX} from "solid-js";
import {createSignal, For} from "solid-js";
import {MolecularViewer, validateSmiles} from "../../modules/molecularViewer.js";
import {
    SKETCH_PALETTE,
    SketchBond,
    SketchState,
    addSketchAtom,
    clearSketch,
    connectSketchAtoms,
    createSketch,
    sketchToFormula,
    sketchToMolarMassUrl,
    sketchToSmiles,
    undoLastSketchAtom
} from "../../modules/structureSketch.js";
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
    let [sketchVersion, setSketchVersion] = createSignal(0);
    let [sketchElement, setSketchElement] = createSignal("C");
    let [sketchError, setSketchError] = createSignal("");
    let sketch: SketchState = createSketch();
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
    function touchSketch(): void {
        setSketchVersion(sketchVersion() + 1);
    }
    function handleSketchElementChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setSketchElement(target.value);
    }
    function handleSketchPadClick(e: MouseEvent): void {
        let target = e.currentTarget as SVGSVGElement;
        let rect = target.getBoundingClientRect();
        let x = Math.round(e.clientX - rect.left);
        let y = Math.round(e.clientY - rect.top);
        try {
            addSketchAtom(sketch, sketchElement(), x, y);
            setSketchError("");
            touchSketch();
        } catch (err: unknown) {
            // addSketchAtom only throws Error ("Invalid element symbol").
            /* v8 ignore next -- String(err) unreachable: no non-Error throw site exists */
            setSketchError(err instanceof Error ? err.message : String(err));
        }
    }
    function handleConnectLastTwo(): void {
        if (sketch.atoms.length < 2) {
            setSketchError("Sketch needs at least two atoms to connect.");
            return;
        }
        let a = sketch.atoms[sketch.atoms.length - 2];
        let b = sketch.atoms[sketch.atoms.length - 1];
        try {
            connectSketchAtoms(sketch, a.id, b.id, 1);
            setSketchError("");
            touchSketch();
        } catch (err: unknown) {
            // connectSketchAtoms only throws Error (order/self/unknown/duplicate).
            /* v8 ignore next -- String(err) unreachable: no non-Error throw site exists */
            setSketchError(err instanceof Error ? err.message : String(err));
        }
    }
    function handleUndoSketchAtom(): void {
        undoLastSketchAtom(sketch);
        setSketchError("");
        touchSketch();
    }
    function handleClearSketch(): void {
        clearSketch(sketch);
        setSketchError("");
        touchSketch();
    }
    function handleUseSketch(): void {
        let smiles = sketchToSmiles(sketch);
        if (smiles === "" || validateSmiles(smiles) === false) {
            setSketchError("Sketch is empty or produced invalid SMILES.");
            return;
        }
        setSketchError("");
        setSmilesInput(smiles);
        setRenderedSmiles(smiles);
        setZoom(1);
    }
    function getSketchSmiles(): string {
        sketchVersion();
        return sketchToSmiles(sketch);
    }
    function getSketchFormula(): string {
        sketchVersion();
        return sketchToFormula(sketch);
    }
    function getSketchBonds(): { x1: number; y1: number; x2: number; y2: number; key: string; order: number }[] {
        sketchVersion();
        let byId: Record<number, { x: number; y: number }> = {};
        for (let i = 0; i < sketch.atoms.length; i++) {
            byId[sketch.atoms[i].id] = { x: sketch.atoms[i].x, y: sketch.atoms[i].y };
        }
        let lines: { x1: number; y1: number; x2: number; y2: number; key: string; order: number }[] = [];
        for (let i = 0; i < sketch.bonds.length; i++) {
            let bond: SketchBond = sketch.bonds[i];
            // Bond endpoints always exist: connectSketchAtoms rejects unknown
            // ids, undo removes attached bonds, and clear resets both lists.
            let a = byId[bond.from];
            let b = byId[bond.to];
            lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: bond.from + "-" + bond.to, order: bond.order });
        }
        return lines;
    }
    function getSketchAtoms(): SketchState["atoms"] {
        sketchVersion();
        return sketch.atoms.slice();
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
                <SeeAlsoLink href="/stoichiometry">Working with reaction equations? Try the Stoichiometry Calculator for mole ratios and limiting reactants.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="molecular-viewer-smiles">SMILES string</label>
            <input type="text" id="molecular-viewer-smiles" class={styles.input} placeholder="e.g., CCO for ethanol" aria-label="SMILES string" value={smilesInput()} onInput={handleSmilesInput} autocomplete="off" spellcheck={false} />
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
            <div style={{ "margin": "0 20px 12px 20px", "padding": "12px", "border": "1px solid var(--app-border)" }}>
                <h3 style={{ "margin": "0 0 4px 0", "font-size": "0.9rem" }}>Structure sketch</h3>
                <p style={{ "margin": "0 0 8px 0", "font-size": "0.8rem" }}>Pick an element, click the pad to place atoms, connect the last two, then use the sketch as SMILES.</p>
                <label class={styles.labelText} for="molecular-viewer-sketch-element">Sketch element</label>
                <select id="molecular-viewer-sketch-element" class={styles.select} aria-label="Sketch element" value={sketchElement()} onChange={handleSketchElementChange}>
                    <For each={SKETCH_PALETTE}>
                        {(element) => <option value={element}>{element}</option>}
                    </For>
                </select>
                <svg width="100%" height="220" viewBox="0 0 400 220" role="img" aria-label="Structure sketch pad" style={{ "display": "block", "background": "var(--app-pane)", "border": "1px dashed var(--app-border)", "cursor": "crosshair" }} onClick={handleSketchPadClick}>
                    <For each={getSketchBonds()}>
                        {(line) => <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="currentColor" stroke-width={line.order} />}
                    </For>
                    <For each={getSketchAtoms()}>
                        {(atom) => (
                            <g>
                                <circle cx={atom.x} cy={atom.y} r="12" fill="var(--app-pane)" stroke="currentColor" stroke-width="1.5" />
                                <text x={atom.x} y={atom.y + 4} text-anchor="middle" font-size="11">{atom.element}</text>
                            </g>
                        )}
                    </For>
                </svg>
                <div class={styles.buttonRow}>
                    <button class={styles.secondaryButton} onClick={handleConnectLastTwo}>Connect last two</button>
                    <button class={styles.secondaryButton} onClick={handleUndoSketchAtom}>Undo atom</button>
                    <button class={styles.secondaryButton} onClick={handleClearSketch}>Clear sketch</button>
                    <button class={styles.button} onClick={handleUseSketch}>Use sketch as SMILES</button>
                </div>
                {sketchError() !== "" && <div role="alert" style={{ "color": "#d93025", "font-size": "0.8rem" }}>{sketchError()}</div>}
                {getSketchSmiles() !== "" && (
                    <div style={{ "font-size": "0.8rem" }}>
                        Sketch SMILES: <code>{getSketchSmiles()}</code>
                        {" "}
                        {/* A non-empty sketch SMILES implies atoms exist, which implies
                            a non-empty formula (verified in structureSketch). */}
                        <a href={sketchToMolarMassUrl(sketch)}>Open in Molar-Mass Calculator{" (" + getSketchFormula() + ")"}</a>
                    </div>
                )}
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
