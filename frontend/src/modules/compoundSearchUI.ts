import { ApiClient, ApiError } from "./apiClient.js";
import { NavigationManager } from "./navigationManager.js";

export interface CompoundResult {
    id: string;
    name: string;
    formula: string;
    molarMass: number;
    casNumber: string;
    smiles: string;
}

export interface CompoundDetail extends CompoundResult {
    inchi: string;
    properties: Record<string, string>;
    source: string;
}

interface CompoundSearchResponse {
    compounds: CompoundResult[];
    query: string;
}

export class CompoundSearchUI {
    private static instance: CompoundSearchUI | null = null;
    private container: HTMLElement | null;
    private resultsContainer: HTMLElement | null;
    private detailContainer: HTMLElement | null;
    private loadingIndicator: HTMLElement | null;
    private errorContainer: HTMLElement | null;
    private initialized: boolean;
    private loading: boolean;

    private constructor() {
        this.container = null;
        this.resultsContainer = null;
        this.detailContainer = null;
        this.loadingIndicator = null;
        this.errorContainer = null;
        this.initialized = false;
        this.loading = false;
    }

    public static getInstance(): CompoundSearchUI {
        if (!CompoundSearchUI.instance) {
            CompoundSearchUI.instance = new CompoundSearchUI();
        }
        return CompoundSearchUI.instance;
    }

    public static resetInstance(): void {
        CompoundSearchUI.instance = null;
    }

    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.attachRefs();
        this.attachHandlers();
    }

    private attachRefs(): void {
        this.container = document.getElementById("compound-search");
        if (!this.container) {
            return;
        }
        this.resultsContainer = this.container.querySelector(".compound-search-results") as HTMLElement | null;
        this.detailContainer = this.container.querySelector(".compound-search-detail") as HTMLElement | null;
        this.loadingIndicator = this.container.querySelector(".compound-search-loading") as HTMLElement | null;
        this.errorContainer = this.container.querySelector(".compound-search-error") as HTMLElement | null;
    }

    private attachHandlers(): void {
        if (!this.container) {
            return;
        }
        let searchButton: HTMLElement | null = this.container.querySelector(".compound-search-button") as HTMLElement | null;
        let searchInput: HTMLInputElement | null = this.container.querySelector(".compound-search-input") as HTMLInputElement | null;
        let self: CompoundSearchUI = this;
        if (searchButton) {
            searchButton.addEventListener("click", function (): void {
                self.handleSearch();
            });
        }
        if (searchInput) {
            searchInput.addEventListener("keydown", function (e: KeyboardEvent): void {
                if (e.key === "Enter") {
                    self.handleSearch();
                }
            });
        }
    }

    private handleSearch(): void {
        if (!this.container) {
            return;
        }
        let searchInput: HTMLInputElement | null = this.container.querySelector(".compound-search-input") as HTMLInputElement | null;
        let typeSelect: HTMLSelectElement | null = this.container.querySelector(".compound-search-type") as HTMLSelectElement | null;
        if (!searchInput) {
            return;
        }
        let query: string = searchInput.value;
        let type: string = typeSelect ? typeSelect.value : "name";
        let trimmed: string = query.trim();
        if (!trimmed) {
            this.showError("Please enter a search query");
            return;
        }
        this.search(trimmed, type);
    }

    public async search(query: string, type: string): Promise<void> {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.showLoading(true);
        this.showError("");
        this.clearResults();
        try {
            let compounds: CompoundResult[] = await searchCompounds(query, type);
            this.renderResults(compounds);
        } catch (e) {
            this.handleError(e);
        } finally {
            this.loading = false;
            this.showLoading(false);
        }
    }

    private handleError(e: unknown): void {
        if (e instanceof ApiError) {
            this.showError("Search failed: " + e.detail);
        } else if (e instanceof Error) {
            this.showError("Search failed: " + e.message);
        } else {
            this.showError("Search failed: unknown error");
        }
    }

    public renderResults(compounds: CompoundResult[]): void {
        if (!this.resultsContainer) {
            return;
        }
        this.clearResults();
        if (!compounds || compounds.length === 0) {
            let empty: HTMLElement = document.createElement("p");
            empty.className = "compound-search-empty";
            empty.textContent = "No compounds found. Try a different search query.";
            this.resultsContainer.appendChild(empty);
            return;
        }
        let i: number;
        for (i = 0; i < compounds.length; i++) {
            let card: HTMLElement = this.buildResultCard(compounds[i]);
            this.resultsContainer.appendChild(card);
        }
    }

    private buildResultCard(compound: CompoundResult): HTMLElement {
        let card: HTMLElement = document.createElement("div");
        card.className = "compound-result-card";
        card.setAttribute("data-compound-id", compound.id);

        let nameEl: HTMLElement = document.createElement("h3");
        nameEl.className = "compound-result-name";
        nameEl.textContent = compound.name;
        card.appendChild(nameEl);

        let formulaRow: HTMLElement = this.buildDetailRow("Formula", this.buildFormulaWithSubscripts(compound.formula));
        card.appendChild(formulaRow);

        let molarMassRow: HTMLElement = this.buildDetailRow("Molar Mass", this.buildTextNode(String(compound.molarMass) + " g/mol"));
        card.appendChild(molarMassRow);

        let casRow: HTMLElement = this.buildDetailRow("CAS Number", this.buildTextNode(compound.casNumber));
        card.appendChild(casRow);

        let smilesRow: HTMLElement = this.buildDetailRow("SMILES", this.buildTextNode(compound.smiles));
        card.appendChild(smilesRow);

        let actions: HTMLElement = document.createElement("div");
        actions.className = "compound-result-actions";

        let self: CompoundSearchUI = this;
        let detailId: string = compound.id;
        let viewButton: HTMLButtonElement = document.createElement("button");
        viewButton.className = "compound-view-details primary-button";
        viewButton.type = "button";
        viewButton.textContent = "View Details";
        viewButton.addEventListener("click", function (): void {
            self.showCompoundDetail(detailId);
        });
        actions.appendChild(viewButton);

        let formulaForMass: string = compound.formula;
        let massButton: HTMLButtonElement = document.createElement("button");
        massButton.className = "compound-open-molar-mass";
        massButton.type = "button";
        massButton.textContent = "Open in Molar Mass Calculator";
        massButton.addEventListener("click", function (): void {
            self.openInMolarMassCalculator(formulaForMass);
        });
        actions.appendChild(massButton);

        let formulaForStoich: string = compound.formula;
        let stoichButton: HTMLButtonElement = document.createElement("button");
        stoichButton.className = "compound-open-stoichiometry";
        stoichButton.type = "button";
        stoichButton.textContent = "Open in Stoichiometry Calculator";
        stoichButton.addEventListener("click", function (): void {
            self.openInStoichiometryCalculator(formulaForStoich);
        });
        actions.appendChild(stoichButton);

        card.appendChild(actions);
        return card;
    }

    private buildDetailRow(label: string, valueNode: Node): HTMLElement {
        let row: HTMLElement = document.createElement("div");
        row.className = "compound-result-row";
        let labelEl: HTMLElement = document.createElement("span");
        labelEl.className = "compound-result-label";
        labelEl.textContent = label + ":";
        row.appendChild(labelEl);
        let valueEl: HTMLElement = document.createElement("span");
        valueEl.className = "compound-result-value";
        valueEl.appendChild(valueNode);
        row.appendChild(valueEl);
        return row;
    }

    private buildTextNode(text: string): Node {
        return document.createTextNode(text);
    }

    private buildFormulaWithSubscripts(formula: string): Node {
        let container: HTMLElement = document.createElement("span");
        container.className = "compound-formula";
        let segments: FormulaSegment[] = buildFormulaSegments(formula);
        let i: number;
        for (i = 0; i < segments.length; i++) {
            let segment: FormulaSegment = segments[i];
            if (segment.isSubscript) {
                let sub: HTMLElement = document.createElement("sub");
                sub.textContent = segment.text;
                container.appendChild(sub);
            }
            else {
                container.appendChild(document.createTextNode(segment.text));
            }
        }
        return container;
    }

    public async showCompoundDetail(id: string): Promise<void> {
        if (!this.detailContainer) {
            return;
        }
        this.clearDetail();
        this.showDetailLoading(true);
        try {
            let detail: CompoundDetail = await fetchCompoundDetail(id);
            this.renderDetail(detail);
        } catch (e) {
            this.handleDetailError(e);
        } finally {
            this.showDetailLoading(false);
        }
    }

    private handleDetailError(e: unknown): void {
        if (!this.detailContainer) {
            return;
        }
        this.clearDetail();
        let errorEl: HTMLElement = document.createElement("p");
        errorEl.className = "compound-detail-error";
        errorEl.setAttribute("role", "alert");
        if (e instanceof ApiError) {
            errorEl.textContent = "Failed to load compound: " + e.detail;
        } else if (e instanceof Error) {
            errorEl.textContent = "Failed to load compound: " + e.message;
        } else {
            errorEl.textContent = "Failed to load compound: unknown error";
        }
        this.detailContainer.appendChild(errorEl);
        this.detailContainer.style.display = "block";
    }

    public renderDetail(compound: CompoundDetail): void {
        if (!this.detailContainer) {
            return;
        }
        this.clearDetail();
        let card: HTMLElement = document.createElement("div");
        card.className = "compound-detail-card";

        let title: HTMLElement = document.createElement("h3");
        title.className = "compound-detail-title";
        title.textContent = compound.name;
        card.appendChild(title);

        card.appendChild(this.buildDetailRow("Formula", this.buildFormulaWithSubscripts(compound.formula)));
        card.appendChild(this.buildDetailRow("Molar Mass", this.buildTextNode(String(compound.molarMass) + " g/mol")));
        card.appendChild(this.buildDetailRow("CAS Number", this.buildTextNode(compound.casNumber)));
        card.appendChild(this.buildDetailRow("SMILES", this.buildTextNode(compound.smiles)));
        card.appendChild(this.buildDetailRow("InChI", this.buildTextNode(compound.inchi)));

        if (compound.properties) {
            let keys: string[] = Object.keys(compound.properties);
            if (keys.length > 0) {
                let propsTitle: HTMLElement = document.createElement("h4");
                propsTitle.className = "compound-detail-properties-title";
                propsTitle.textContent = "Properties";
                card.appendChild(propsTitle);
                let i: number;
                for (i = 0; i < keys.length; i++) {
                    let key: string = keys[i];
                    let value: string = compound.properties[key];
                    card.appendChild(this.buildDetailRow(key, this.buildTextNode(value)));
                }
            }
        }

        if (compound.source) {
            card.appendChild(this.buildDetailRow("Source", this.buildTextNode(compound.source)));
        }

        let self: CompoundSearchUI = this;
        let closeButton: HTMLButtonElement = document.createElement("button");
        closeButton.className = "compound-detail-close primary-button";
        closeButton.type = "button";
        closeButton.textContent = "Close";
        closeButton.addEventListener("click", function (): void {
            self.clearDetail();
        });
        card.appendChild(closeButton);

        this.detailContainer.appendChild(card);
        this.detailContainer.style.display = "block";
    }

    private clearResults(): void {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = "";
        }
    }

    private clearDetail(): void {
        if (this.detailContainer) {
            this.detailContainer.innerHTML = "";
            this.detailContainer.style.display = "none";
        }
    }

    private showLoading(show: boolean): void {
        if (!this.loadingIndicator) {
            return;
        }
        this.loadingIndicator.style.display = show ? "block" : "none";
    }

    private showDetailLoading(show: boolean): void {
        if (!this.detailContainer) {
            return;
        }
        if (show) {
            this.detailContainer.innerHTML = '<p class="compound-detail-loading">Loading compound details...</p>';
            this.detailContainer.style.display = "block";
        }
    }

    private showError(message: string): void {
        if (!this.errorContainer) {
            return;
        }
        if (message) {
            this.errorContainer.textContent = message;
            this.errorContainer.style.display = "block";
        } else {
            this.errorContainer.textContent = "";
            this.errorContainer.style.display = "none";
        }
    }

    public openInMolarMassCalculator(formula: string): void {
        let manager: NavigationManager = NavigationManager.getInstance();
        manager.navigate("molar-mass");
        let input: HTMLInputElement | null = document.getElementById("formula-input") as HTMLInputElement | null;
        if (input) {
            input.value = formula;
            input.dispatchEvent(new Event("input", { "bubbles": true }));
        }
    }

    public openInStoichiometryCalculator(formula: string): void {
        let manager: NavigationManager = NavigationManager.getInstance();
        manager.navigate("stoichiometry");
        let input: HTMLInputElement | null = document.getElementById("stoich-equation-input") as HTMLInputElement | null;
        if (input) {
            input.value = formula;
            input.dispatchEvent(new Event("input", { "bubbles": true }));
        }
    }
}
export interface FormulaSegment {
    text: string;
    isSubscript: boolean;
}
export function buildFormulaSegments(formula: string): FormulaSegment[] {
    let segments: FormulaSegment[] = [];
    let buffer: string = "";
    let i: number;
    for (i = 0; i < formula.length; i++) {
        let ch: string = formula.charAt(i);
        if (ch >= "0" && ch <= "9") {
            if (buffer.length > 0) {
                segments.push({"text": buffer, "isSubscript": false});
                buffer = "";
            }
            segments.push({"text": ch, "isSubscript": true});
        }
        else {
            buffer = buffer + ch;
        }
    }
    if (buffer.length > 0) {
        segments.push({"text": buffer, "isSubscript": false});
    }
    return segments;
}
export async function searchCompounds(query: string, _type: string): Promise<CompoundResult[]> {
    let client: ApiClient = ApiClient.getInstance();
    let path: string = "/api/v1/compounds?q=" + encodeURIComponent(query);
    let response: CompoundSearchResponse = await client.get<CompoundSearchResponse>(path);
    return (response && response.compounds) ? response.compounds : [];
}
export async function fetchCompoundDetail(id: string): Promise<CompoundDetail> {
    let client: ApiClient = ApiClient.getInstance();
    let path: string = "/api/v1/compounds/" + id;
    return await client.get<CompoundDetail>(path);
}
