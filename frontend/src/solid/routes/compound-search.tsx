/**
 * Visual verification: The Solid-rendered Compound Database Search card
 * should match the legacy #compound-search card in frontend/index.html.
 * Intentional diff: this route is gated by WebModeGuard — in web mode
 * (browser without Wails) it renders a "web mode unavailable" placeholder
 * instead of initializing the CompoundSearchUI singleton. In desktop mode
 * it calls the pure searchCompounds / fetchCompoundDetail helpers and owns
 * the loading, error, and detail-panel state via Solid signals. Formula
 * subscripts are rendered via buildFormulaSegments (legacy built DOM
 * nodes imperatively). Cross-calculator prefill (Open in Molar Mass /
 * Stoichiometry) navigates to the target route without prefilling the
 * input — prefill requires a cross-route store and is deferred. No
 * Playwright screenshot test is added per task spec; parity is verified
 * by manual diff of the rendered DOM against the legacy markup.
 */
import type {JSX} from "solid-js";
import type {CompoundResult, CompoundDetail, FormulaSegment} from "../../modules/compoundSearchUI.js";
import {createSignal, For} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {WebModeGuard} from "../../modules/webModeGuard.js";
import {searchCompounds, fetchCompoundDetail, buildFormulaSegments} from "../../modules/compoundSearchUI.js";
import {CalculatorCard} from "../components/CalculatorCard";
import {ExampleDetails} from "../components/ExampleDetails";
import {SeeAlsoLink} from "../components/SeeAlsoLink";
import styles from "./compound-search.module.css";
let searchTypeOptions: {"value": string; "label": string}[] = [
    {"value": "name", "label": "Name"},
    {"value": "formula", "label": "Molecular Formula"},
    {"value": "cas", "label": "CAS Number"},
    {"value": "smiles", "label": "SMILES"}
];
function renderFormula(formula: string): JSX.Element {
    let segments: FormulaSegment[] = buildFormulaSegments(formula);
    return (
        <For each={segments}>
            {(segment) => segment.isSubscript ? <sub>{segment.text}</sub> : <span>{segment.text}</span>}
        </For>
    );
}
function CompoundSearch(): JSX.Element {
    let navigate = useNavigate();
    let guard = WebModeGuard.getInstance();
    let [query, setQuery] = createSignal("");
    let [searchType, setSearchType] = createSignal("name");
    let [results, setResults] = createSignal<CompoundResult[]>([]);
    let [loading, setLoading] = createSignal(false);
    let [error, setError] = createSignal("");
    let [hasSearched, setHasSearched] = createSignal(false);
    let [detail, setDetail] = createSignal<CompoundDetail | null>(null);
    let [detailLoading, setDetailLoading] = createSignal(false);
    let [detailError, setDetailError] = createSignal("");
    function handleQueryInput(e: Event): void {
        let target = e.currentTarget as HTMLInputElement;
        setQuery(target.value);
    }
    function handleTypeChange(e: Event): void {
        let target = e.currentTarget as HTMLSelectElement;
        setSearchType(target.value);
    }
    async function handleSearch(): Promise<void> {
        let trimmed: string = query().trim();
        if (trimmed === "") {
            setError("Please enter a search query");
            setResults([]);
            setHasSearched(false);
            return;
        }
        setError("");
        setLoading(true);
        setHasSearched(false);
        setDetail(null);
        setDetailError("");
        try {
            let compounds: CompoundResult[] = await searchCompounds(trimmed, searchType());
            setResults(compounds);
            setHasSearched(true);
        }
        catch (err: unknown) {
            let message: string = err instanceof Error ? err.message : String(err);
            setError("Search failed: " + message);
            setResults([]);
            setHasSearched(true);
        }
        finally {
            setLoading(false);
        }
    }
    function handleKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            handleSearch();
        }
    }
    async function handleViewDetails(id: string): Promise<void> {
        setDetailError("");
        setDetailLoading(true);
        setDetail(null);
        try {
            let d: CompoundDetail = await fetchCompoundDetail(id);
            setDetail(d);
        }
        catch (err: unknown) {
            let message: string = err instanceof Error ? err.message : String(err);
            setDetailError("Failed to load compound: " + message);
        }
        finally {
            setDetailLoading(false);
        }
    }
    function handleCloseDetail(): void {
        setDetail(null);
        setDetailError("");
    }
    function handleOpenInMolarMass(): void {
        navigate("/molar-mass");
    }
    function handleOpenInStoichiometry(): void {
        navigate("/stoichiometry");
    }
    function renderDetail(): JSX.Element {
        let d: CompoundDetail | null = detail();
        if (d === null) {
            return <></>;
        }
        let propKeys: string[] = d.properties ? Object.keys(d.properties) : [];
        return (
            <div class={styles.detailCard}>
                <h3 class={styles.detailTitle}>{d.name}</h3>
                <div class={styles.resultRow}>
                    <span class={styles.resultLabel}>Formula:</span>
                    <span class={styles.resultValue}>{renderFormula(d.formula)}</span>
                </div>
                <div class={styles.resultRow}>
                    <span class={styles.resultLabel}>Molar Mass:</span>
                    <span class={styles.resultValue}>{d.molarMass + " g/mol"}</span>
                </div>
                <div class={styles.resultRow}>
                    <span class={styles.resultLabel}>CAS Number:</span>
                    <span class={styles.resultValue}>{d.casNumber}</span>
                </div>
                <div class={styles.resultRow}>
                    <span class={styles.resultLabel}>SMILES:</span>
                    <span class={styles.resultValue}>{d.smiles}</span>
                </div>
                <div class={styles.resultRow}>
                    <span class={styles.resultLabel}>InChI:</span>
                    <span class={styles.resultValue}>{d.inchi}</span>
                </div>
                {propKeys.length > 0 && (
                    <div>
                        <h4 class={styles.detailPropertiesTitle}>Properties</h4>
                        <For each={propKeys}>
                            {(key) => (
                                <div class={styles.resultRow}>
                                    <span class={styles.resultLabel}>{key + ":"}</span>
                                    <span class={styles.resultValue}>{d.properties[key]}</span>
                                </div>
                            )}
                        </For>
                    </div>
                )}
                {d.source !== "" && (
                    <div class={styles.resultRow}>
                        <span class={styles.resultLabel}>Source:</span>
                        <span class={styles.resultValue}>{d.source}</span>
                    </div>
                )}
                <div class={styles.resultActions}>
                    <button class={styles.secondaryButton} onClick={handleCloseDetail}>Close</button>
                </div>
            </div>
        );
    }
    if (guard.isWebMode) {
        return (
            <CalculatorCard
                title="Compound Database Search - Search Compounds by Name, Formula, CAS, or SMILES"
                description="Look up chemical compounds by name, molecular formula, CAS number, or SMILES string. View detailed information including molar mass, InChI, and additional properties, then jump directly to the Molar Mass or Stoichiometry calculators with the formula pre-filled."
                exampleDetails={
                    <ExampleDetails>
                        <p>Try searching by <strong>name</strong> for "water", by <strong>formula</strong> for "H2O", or by <strong>CAS</strong> for "7732-18-5".</p>
                    </ExampleDetails>
                }
                seeAlso={
                    <SeeAlsoLink href="#molar-mass">Need a quick molar mass? Use the Molar Mass Calculator for any formula.</SeeAlsoLink>
                }
            >
                <div class={styles.placeholder}>Compound search is unavailable in web mode. Run the desktop app to access the compound database.</div>
            </CalculatorCard>
        );
    }
    return (
        <CalculatorCard
            title="Compound Database Search - Search Compounds by Name, Formula, CAS, or SMILES"
            description="Look up chemical compounds by name, molecular formula, CAS number, or SMILES string. View detailed information including molar mass, InChI, and additional properties, then jump directly to the Molar Mass or Stoichiometry calculators with the formula pre-filled."
            exampleDetails={
                <ExampleDetails>
                    <p>Try searching by <strong>name</strong> for "water", by <strong>formula</strong> for "H2O", or by <strong>CAS</strong> for "7732-18-5".</p>
                </ExampleDetails>
            }
            seeAlso={
                <SeeAlsoLink href="#molar-mass">Need a quick molar mass? Use the Molar Mass Calculator for any formula.</SeeAlsoLink>
            }
        >
            <label class={styles.labelText} for="compound-search-type">Search by</label>
            <select id="compound-search-type" class={styles.select} aria-label="Select compound search type" value={searchType()} onChange={handleTypeChange}>
                <For each={searchTypeOptions}>
                    {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
            </select>
            <label class={styles.labelText} for="compound-search-input">Search query</label>
            <input type="text" id="compound-search-input" class={styles.input} placeholder="E.g., water or H2O" aria-label="Compound search query" value={query()} onInput={handleQueryInput} onKeyDown={handleKeyDown} />
            <div class={styles.buttonRow}>
                <button class={styles.button} onClick={handleSearch} disabled={loading()}>Search Compounds</button>
            </div>
            {loading() && <div class={styles.status}>Searching compounds...</div>}
            {error() !== "" && <div class={styles.status + " " + styles.error} role="alert">{error()}</div>}
            {hasSearched() && !loading() && error() === "" && results().length === 0 && (
                <div class={styles.emptyState}>No compounds found. Try a different search query.</div>
            )}
            {results().length > 0 && (
                <div class={styles.results}>
                    <For each={results()}>
                        {(compound) => (
                            <div class={styles.resultCard}>
                                <h3 class={styles.resultName}>{compound.name}</h3>
                                <div class={styles.resultRow}>
                                    <span class={styles.resultLabel}>Formula:</span>
                                    <span class={styles.resultValue}>{renderFormula(compound.formula)}</span>
                                </div>
                                <div class={styles.resultRow}>
                                    <span class={styles.resultLabel}>Molar Mass:</span>
                                    <span class={styles.resultValue}>{compound.molarMass + " g/mol"}</span>
                                </div>
                                <div class={styles.resultRow}>
                                    <span class={styles.resultLabel}>CAS Number:</span>
                                    <span class={styles.resultValue}>{compound.casNumber}</span>
                                </div>
                                <div class={styles.resultRow}>
                                    <span class={styles.resultLabel}>SMILES:</span>
                                    <span class={styles.resultValue}>{compound.smiles}</span>
                                </div>
                                <div class={styles.resultActions}>
                                    <button class={styles.button} onClick={function (): void { handleViewDetails(compound.id); }}>View Details</button>
                                    <button class={styles.secondaryButton} onClick={handleOpenInMolarMass}>Open in Molar Mass Calculator</button>
                                    <button class={styles.secondaryButton} onClick={handleOpenInStoichiometry}>Open in Stoichiometry Calculator</button>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            )}
            {detailLoading() && <div class={styles.status}>Loading compound details...</div>}
            {detailError() !== "" && <div class={styles.status + " " + styles.error} role="alert">{detailError()}</div>}
            {detail() !== null && renderDetail()}
        </CalculatorCard>
    );
}
export {CompoundSearch};
