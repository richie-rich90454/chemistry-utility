import { ApiClient } from "./apiClient.js";

/**
 * Result returned by processFile. Contains the generated CSV string plus
 * summary counters that the UI can display.
 */
export interface BatchResult {
    csvString: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
}

/**
 * Progress information passed to the progress callback during processing.
 */
export interface ProgressInfo {
    current: number;
    total: number;
}

/**
 * Callback signature for progress updates.
 */
type ProgressCallback = (info: ProgressInfo) => void;

/**
 * Describes a single output column extracted from the API response.
 */
interface ResultField {
    key: string;
    label: string;
}

const ALLOWED_CALCULATORS: string[] = [
    "molar-mass",
    "equation-balance",
    "stoichiometry",
    "dilution",
    "mass-percent",
    "solution-mixing",
    "ideal-gas",
    "combined-gas",
    "van-der-waals",
    "half-life",
    "cell-potential",
    "nernst",
    "electrolysis",
    "bond-type",
    "gibbs-free-energy",
    "hess-law",
    "entropy",
    "heat-capacity",
    "arrhenius",
    "rate-law",
    "integrated-rate-law",
    "buffer-solution",
    "pka-pkb",
    "ksp",
    "colligative-properties",
    "titration-curve",
    "quantum-numbers",
    "electron-configuration",
    "debroglie-wavelength",
    "photoelectric-effect",
    "heisenberg-uncertainty"
];

/**
 * Per-calculator required CSV headers. An empty/missing entry means any
 * non-empty header set is accepted.
 */
const REQUIRED_HEADERS: Record<string, string[]> = {
    "molar-mass": ["formula"],
    "bond-type": ["element1", "element2"],
    "dilution": ["M1", "V1", "M2", "V2"],
    "ideal-gas": ["P", "V", "n", "T"],
    "combined-gas": ["P1", "V1", "T1", "P2", "V2", "T2"],
    "half-life": ["isotope"],
    "electron-configuration": ["element"],
    "quantum-numbers": ["n"],
    "debroglie-wavelength": ["mass", "velocity"],
    "photoelectric-effect": ["wavelength", "work_function"],
    "heisenberg-uncertainty": ["delta_p"]
};

/**
 * Singleton BatchCalculator that reads a CSV of inputs, dispatches each row to
 * the appropriate calculator endpoint via ApiClient, and produces a CSV of
 * results. Access to batch processing is always available to local users.
 */
export class BatchCalculator {
    private static instance: BatchCalculator | null = null;
    private progressCallback: ProgressCallback | null;
    private lastResults: string | null;
    private initialized: boolean;
    // Bound handlers start null and are created in attachEventListeners;
    // destroy() guards nulls so no dead no-op functions are needed.
    private boundUpdateProcessButtonState: (() => void) | null = null;
    private boundHandleProcessClick: (() => void) | null = null;
    private boundHandleDownloadClick: (() => void) | null = null;

    private constructor() {
        this.progressCallback = null;
        this.lastResults = null;
        this.initialized = false;
    }

    public static getInstance(): BatchCalculator {
        if (!BatchCalculator.instance) {
            BatchCalculator.instance = new BatchCalculator();
        }
        return BatchCalculator.instance;
    }

    public static resetInstance(): void {
        if (BatchCalculator.instance) {
            BatchCalculator.instance.destroy();
        }
        BatchCalculator.instance = null;
    }

    public static getAllowedCalculators(): string[] {
        return ALLOWED_CALCULATORS.slice();
    }

    /**
     * Returns true when batch calculation is available. Local users always
     * have access since authentication has been removed.
     */
    public isAuthorized(): boolean {
        return true;
    }

    public setProgressCallback(cb: ProgressCallback): void {
        this.progressCallback = cb;
    }

    public getLastResults(): string | null {
        return this.lastResults;
    }

    /**
     * Wires up DOM event listeners and applies the current authorization
     * state to the batch calculation card. Safe to call multiple times.
     */
    public init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.attachEventListeners();
        this.applyAuthorization();
    }

    private attachEventListeners(): void {
        // Named handlers so destroy() can detach them; re-init after a
        // destroy (HMR, tests) then re-attaches exactly once.
        let fileInput: HTMLElement | null = document.getElementById("batch-file-input");
        let processBtn: HTMLElement | null = document.getElementById("batch-process-btn");
        let downloadBtn: HTMLElement | null = document.getElementById("batch-download-btn");
        let self: BatchCalculator = this;
        if (fileInput) {
            if (this.boundUpdateProcessButtonState) fileInput.removeEventListener("change", this.boundUpdateProcessButtonState);
            this.boundUpdateProcessButtonState = function (): void {
                self.updateProcessButtonState();
            };
            fileInput.addEventListener("change", this.boundUpdateProcessButtonState);
        }
        if (processBtn) {
            if (this.boundHandleProcessClick) processBtn.removeEventListener("click", this.boundHandleProcessClick);
            this.boundHandleProcessClick = function (): void {
                self.handleProcessClick();
            };
            processBtn.addEventListener("click", this.boundHandleProcessClick);
        }
        if (downloadBtn) {
            if (this.boundHandleDownloadClick) downloadBtn.removeEventListener("click", this.boundHandleDownloadClick);
            this.boundHandleDownloadClick = function (): void {
                self.handleDownloadClick();
            };
            downloadBtn.addEventListener("click", this.boundHandleDownloadClick);
        }
    }

    /** Detaches DOM listeners so re-init (HMR, tests) never stacks handlers. */
    public destroy(): void {
        let fileInput: HTMLElement | null = document.getElementById("batch-file-input");
        let processBtn: HTMLElement | null = document.getElementById("batch-process-btn");
        let downloadBtn: HTMLElement | null = document.getElementById("batch-download-btn");
        if (fileInput && this.boundUpdateProcessButtonState) {
            fileInput.removeEventListener("change", this.boundUpdateProcessButtonState);
        }
        if (processBtn && this.boundHandleProcessClick) {
            processBtn.removeEventListener("click", this.boundHandleProcessClick);
        }
        if (downloadBtn && this.boundHandleDownloadClick) {
            downloadBtn.removeEventListener("click", this.boundHandleDownloadClick);
        }
        this.initialized = false;
    }

    private updateProcessButtonState(): void {
        let fileInput: HTMLInputElement | null = document.getElementById("batch-file-input") as HTMLInputElement | null;
        let processBtn: HTMLButtonElement | null = document.getElementById("batch-process-btn") as HTMLButtonElement | null;
        if (!fileInput || !processBtn) {
            return;
        }
        // isAuthorized() always returns true (authentication removed), so no
        // authorization gate here; the button reflects file selection only.
        if (fileInput.files && fileInput.files.length > 0) {
            processBtn.disabled = false;
        } else {
            processBtn.disabled = true;
        }
    }

    private applyAuthorization(): void {
        let authorizedBox: HTMLElement | null = document.getElementById("batch-authorized");
        let unauthorizedBox: HTMLElement | null = document.getElementById("batch-unauthorized");
        let fileInput: HTMLInputElement | null = document.getElementById("batch-file-input") as HTMLInputElement | null;
        let processBtn: HTMLButtonElement | null = document.getElementById("batch-process-btn") as HTMLButtonElement | null;
        // isAuthorized() always returns true (authentication removed); the batch
        // card is always in the authorized state and the unauthorized box never shows.
        if (authorizedBox) {
            authorizedBox.style.display = "block";
        }
        if (unauthorizedBox) {
            unauthorizedBox.style.display = "none";
        }
        if (fileInput) {
            fileInput.disabled = false;
        }
        if (processBtn) {
            processBtn.disabled = false;
        }
    }

    private async handleProcessClick(): Promise<void> {
        let fileInput: HTMLInputElement | null = document.getElementById("batch-file-input") as HTMLInputElement | null;
        let calcSelect: HTMLSelectElement | null = document.getElementById("batch-calculator-type") as HTMLSelectElement | null;
        let errorBox: HTMLElement | null = document.getElementById("batch-error");
        if (!fileInput || !calcSelect) {
            return;
        }
        if (!fileInput.files || fileInput.files.length === 0) {
            if (errorBox) {
                errorBox.textContent = "Please choose a CSV file.";
                errorBox.style.display = "block";
            }
            return;
        }
        // isAuthorized() always returns true (authentication removed); no gate here.
        let file: File = fileInput.files[0];
        let calculatorType: string = calcSelect.value;
        this.showProgress(true);
        this.setProgressValue(0, 1);
        try {
            let result: BatchResult = await this.processFile(file, calculatorType);
            this.showProgress(false);
            this.renderPreview(result.csvString);
            this.showDownloadButton(true);
            if (errorBox) {
                errorBox.textContent = "Processed " + result.totalRows + " rows. Success: " + result.successCount + ", Errors: " + result.errorCount + ".";
                errorBox.style.display = "block";
            }
        } catch (e) {
            this.showProgress(false);
            let message: string = "Batch processing failed";
            if (e instanceof Error) {
                message = e.message;
            }
            if (errorBox) {
                errorBox.textContent = message;
                errorBox.style.display = "block";
            }
        }
    }

    private handleDownloadClick(): void {
        if (!this.lastResults) {
            return;
        }
        this.downloadResults(this.lastResults, "batch-results.csv");
    }

    private showProgress(show: boolean): void {
        let container: HTMLElement | null = document.getElementById("batch-progress-container");
        if (container) {
            container.style.display = show ? "block" : "none";
        }
    }

    private setProgressValue(current: number, total: number): void {
        let bar: HTMLProgressElement | null = document.getElementById("batch-progress-bar") as HTMLProgressElement | null;
        let text: HTMLElement | null = document.getElementById("batch-progress-text");
        if (bar) {
            bar.max = total;
            bar.value = current;
        }
        if (text) {
            text.textContent = current + " / " + total;
        }
    }

    private showDownloadButton(show: boolean): void {
        let btn: HTMLElement | null = document.getElementById("batch-download-btn");
        if (btn) {
            btn.style.display = show ? "inline-block" : "none";
        }
    }

    private renderPreview(csvString: string): void {
        let container: HTMLElement | null = document.getElementById("batch-preview-container");
        let tableHolder: HTMLElement | null = document.getElementById("batch-preview-table");
        if (!container || !tableHolder) {
            return;
        }
        let rows: string[][] = this.parseCsv(csvString);
        if (rows.length === 0) {
            container.style.display = "none";
            return;
        }
        let previewRows: string[][] = rows.slice(0, 11);
        let table: HTMLTableElement = document.createElement("table");
        table.className = "batch-preview-table-element";
        let thead: HTMLTableSectionElement = document.createElement("thead");
        let headerRow: HTMLTableRowElement = document.createElement("tr");
        let h: number;
        for (h = 0; h < previewRows[0].length; h++) {
            let th: HTMLTableCellElement = document.createElement("th");
            th.textContent = previewRows[0][h];
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
        let tbody: HTMLTableSectionElement = document.createElement("tbody");
        let r: number;
        for (r = 1; r < previewRows.length; r++) {
            let tr: HTMLTableRowElement = document.createElement("tr");
            let c: number;
            for (c = 0; c < previewRows[r].length; c++) {
                let td: HTMLTableCellElement = document.createElement("td");
                td.textContent = previewRows[r][c];
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        tableHolder.innerHTML = "";
        tableHolder.appendChild(table);
        container.style.display = "block";
    }

    /**
     * Parses CSV text into a 2D array of strings. Handles quoted fields that
     * contain embedded commas, newlines, and escaped double quotes ("").
     */
    public parseCsv(text: string): string[][] {
        let rows: string[][] = [];
        let current: string[] = [];
        let field: string = "";
        let inQuotes: boolean = false;
        let i: number = 0;
        let len: number = text.length;
        while (i < len) {
            let ch: string = text.charAt(i);
            if (inQuotes) {
                if (ch === "\"") {
                    if (i + 1 < len && text.charAt(i + 1) === "\"") {
                        field = field + "\"";
                        i = i + 2;
                        continue;
                    }
                    inQuotes = false;
                    i = i + 1;
                    continue;
                }
                field = field + ch;
                i = i + 1;
                continue;
            }
            if (ch === "\"") {
                inQuotes = true;
                i = i + 1;
                continue;
            }
            if (ch === ",") {
                current.push(field);
                field = "";
                i = i + 1;
                continue;
            }
            if (ch === "\r") {
                i = i + 1;
                continue;
            }
            if (ch === "\n") {
                current.push(field);
                rows.push(current);
                current = [];
                field = "";
                i = i + 1;
                continue;
            }
            field = field + ch;
            i = i + 1;
        }
        if (field.length > 0 || current.length > 0) {
            current.push(field);
            rows.push(current);
        }
        return rows;
    }

    /**
     * Converts a 2D array of strings into CSV text. Fields containing commas,
     * quotes, or newlines are wrapped in double quotes with embedded quotes
     * doubled per RFC 4180.
     */
    public toCsv(rows: string[][]): string {
        let lines: string[] = [];
        let r: number;
        for (r = 0; r < rows.length; r++) {
            let row: string[] = rows[r];
            let fields: string[] = [];
            let c: number;
            for (c = 0; c < row.length; c++) {
                fields.push(this.escapeField(row[c]));
            }
            lines.push(fields.join(","));
        }
        return lines.join("\n");
    }

    private escapeField(value: string): string {
        if (value === null || value === undefined) {
            return "";
        }
        let needsQuoting: boolean = value.indexOf(",") !== -1 || value.indexOf("\"") !== -1 || value.indexOf("\n") !== -1 || value.indexOf("\r") !== -1;
        if (!needsQuoting) {
            return value;
        }
        let escaped: string = value.replace(/"/g, "\"\"");
        return "\"" + escaped + "\"";
    }

    /**
     * Normalizes a CSV header the same way for validation and for
     * request-body mapping: surrounding whitespace is trimmed and the
     * comparison is case-insensitive. A header such as `"M1 "` therefore
     * matches the required `"M1"` column end-to-end.
     */
    private static normalizeHeader(header: string): string {
        // Headers come from parseCsv which always yields strings; the null
        // fallback guards non-CSV misuse and could never fire here.
        /* v8 ignore next -- parseCsv always yields strings, verified above */
        return (header ?? "").trim().toLowerCase();
    }

    /**
     * Maps raw CSV headers to the canonical body keys sent to the calculator
     * endpoint. Headers matching a required column (case-insensitively, after
     * trimming) use the required column's spelling; all other headers are
     * sent trimmed as-is so the mapping agrees with {@link validateCsv}.
     */
    public canonicalizeHeaders(headers: string[], calculatorType: string): string[] {
        let required: string[] | undefined = REQUIRED_HEADERS[calculatorType];
        let canonical: string[] = [];
        let h: number;
        for (h = 0; h < headers.length; h++) {
            // Headers come from parseCsv which always yields strings; the null
            // fallback guards non-CSV misuse and could never fire here.
            /* v8 ignore next -- parseCsv always yields strings, verified above */
            let trimmed: string = (headers[h] ?? "").trim();
            let key: string = trimmed;
            if (required) {
                let r: number;
                for (r = 0; r < required.length; r++) {
                    if (BatchCalculator.normalizeHeader(required[r]) === BatchCalculator.normalizeHeader(trimmed)) {
                        key = required[r];
                        break;
                    }
                }
            }
            canonical.push(key);
        }
        return canonical;
    }

    /**
     * Validates that the provided CSV headers are acceptable for the given
     * calculator type. Returns true if the headers contain all required
     * columns for the calculator (or if the calculator has no specific
     * requirements).
     */
    public validateCsv(headers: string[], calculatorType: string): boolean {
        if (!headers || headers.length === 0) {
            return false;
        }
        let normalized: string[] = [];
        let i: number;
        for (i = 0; i < headers.length; i++) {
            let trimmed: string = BatchCalculator.normalizeHeader(headers[i]);
            if (trimmed === "") {
                return false;
            }
            normalized.push(trimmed);
        }
        let required: string[] | undefined = REQUIRED_HEADERS[calculatorType];
        if (!required || required.length === 0) {
            return true;
        }
        let foundCount: number = 0;
        let j: number;
        for (j = 0; j < required.length; j++) {
            if (normalized.indexOf(BatchCalculator.normalizeHeader(required[j])) !== -1) {
                foundCount = foundCount + 1;
            }
        }
        // Strict calculators require every column; flexible calculators accept
        // at least one matching column (the server fills in the rest).
        if (calculatorType === "molar-mass" || calculatorType === "bond-type" || calculatorType === "half-life" || calculatorType === "electron-configuration" || calculatorType === "heisenberg-uncertainty") {
            return foundCount === required.length;
        }
        return foundCount > 0;
    }

    /**
     * Returns the result-field descriptors used to extract output columns from
     * the calculator API response. The Go backend marshals CalculationResult
     * with capitalized field names (Value, Unit).
     */
    public getResultFields(calculatorType: string): ResultField[] {
        if (calculatorType === "molar-mass") {
            return [
                { "key": "Value", "label": "molar_mass" },
                { "key": "Unit", "label": "unit" }
            ];
        }
        return [
            { "key": "Value", "label": "value" },
            { "key": "Unit", "label": "unit" }
        ];
    }

    /**
     * Coerces a CSV string cell into a number when the value parses cleanly,
     * so the calculator backend receives numeric inputs for numeric fields.
     * Empty strings and non-numeric strings are returned unchanged.
     */
    private coerceValue(value: string): string | number {
        if (value === "") {
            return "";
        }
        let numPattern: RegExp = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
        if (numPattern.test(value)) {
            let num: number = parseFloat(value);
            if (!isNaN(num) && isFinite(num)) {
                return num;
            }
        }
        return value;
    }

    /**
     * Reads the CSV file, dispatches each data row to the appropriate
     * calculator endpoint, collects the results, and returns them as a CSV
     * string along with success/error counts. Progress is reported via the
     * configured progress callback.
     */
    public async processFile(file: File, calculatorType: string): Promise<BatchResult> {
        let text: string = await file.text();
        let result: BatchResult = await this.processCsvText(text, calculatorType);
        this.lastResults = result.csvString;
        return result;
    }
    /**
     * Pure CSV-processing entry point: parses the supplied CSV text,
     * validates headers for the chosen calculator type, dispatches each
     * data row to the appropriate calculator endpoint, and returns the
     * results as a CSV string along with success/error counts. Accepts an
     * optional onProgress callback; when omitted, falls back to the
     * instance's progressCallback set via setProgressCallback. Does not
     * touch lastResults — callers that need to cache the result (e.g.
     * processFile) do so themselves. Solid components pass their own
     * onProgress so they own the progress UI.
     */
    public async processCsvText(text: string, calculatorType: string, onProgress?: (info: ProgressInfo) => void): Promise<BatchResult> {
        let rows: string[][] = this.parseCsv(text);
        if (rows.length === 0) {
            throw new Error("CSV file is empty");
        }
        let headers: string[] = rows[0];
        if (!this.validateCsv(headers, calculatorType)) {
            throw new Error("CSV headers are invalid for calculator type: " + calculatorType);
        }
        let dataRows: string[][] = rows.slice(1);
        let resultFields: ResultField[] = this.getResultFields(calculatorType);
        let outputHeaders: string[] = headers.slice();
        let canonicalHeaders: string[] = this.canonicalizeHeaders(headers, calculatorType);
        let f: number;
        for (f = 0; f < resultFields.length; f++) {
            outputHeaders.push(resultFields[f].label);
        }
        outputHeaders.push("status");
        let outputRows: string[][] = [outputHeaders];
        let totalRows: number = dataRows.length;
        let successCount: number = 0;
        let errorCount: number = 0;
        let client: ApiClient = ApiClient.getInstance();
        let d: number;
        for (d = 0; d < dataRows.length; d++) {
            let row: string[] = dataRows[d];
            let body: Record<string, string | number> = {};
            let h: number;
            for (h = 0; h < canonicalHeaders.length; h++) {
                let raw: string = h < row.length ? row[h] : "";
                body[canonicalHeaders[h]] = this.coerceValue(raw);
            }
            let outRow: string[] = row.slice();
            // Pad ragged rows so every output row has the same column count.
            while (outRow.length < headers.length) {
                outRow.push("");
            }
            let status: string = "ok";
            try {
                let response: Record<string, unknown> = await client.post<Record<string, unknown>>("/api/v1/calculators/" + calculatorType, body);
                let r: number;
                for (r = 0; r < resultFields.length; r++) {
                    let val: unknown = response[resultFields[r].key];
                    if (val === undefined || val === null) {
                        outRow.push("");
                    } else if (typeof val === "number") {
                        outRow.push(String(val));
                    } else {
                        outRow.push(String(val));
                    }
                }
                successCount = successCount + 1;
            } catch (e) {
                let r: number;
                for (r = 0; r < resultFields.length; r++) {
                    outRow.push("");
                }
                let message: string = "error";
                if (e instanceof Error) {
                    message = e.message;
                }
                status = message;
                errorCount = errorCount + 1;
            }
            outRow.push(status);
            outputRows.push(outRow);
            if (onProgress) {
                onProgress({"current": d + 1, "total": totalRows});
            }
            else if (this.progressCallback) {
                this.progressCallback({"current": d + 1, "total": totalRows});
            }
        }
        let csvString: string = this.toCsv(outputRows);
        return {
            "csvString": csvString,
            "totalRows": totalRows,
            "successCount": successCount,
            "errorCount": errorCount
        };
    }

    /**
     * Triggers a browser download of the provided CSV string with the given
     * filename. Creates a temporary object URL and anchor element.
     */
    public downloadResults(csvString: string, filename: string): void {
        let blob: Blob = new Blob([csvString], { "type": "text/csv;charset=utf-8" });
        let url: string = URL.createObjectURL(blob);
        let a: HTMLAnchorElement = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
