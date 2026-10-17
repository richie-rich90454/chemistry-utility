import { getEngine } from "./engine.js";

/**
 * Result returned by processCsvText: the generated CSV plus summary counters.
 */
export interface BatchResult {
    csvString: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
}

/** Progress information passed to the progress callback during processing. */
export interface ProgressInfo {
    current: number;
    total: number;
}

/**
 * Parses CSV text into a 2D array of strings. Handles quoted fields that
 * contain embedded commas, newlines, and escaped double quotes ("").
 */
export function parseCsv(text: string): string[][] {
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

function escapeField(value: string): string {
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
 * Converts a 2D array of strings into CSV text. Fields containing commas,
 * quotes, or newlines are wrapped in double quotes with embedded quotes
 * doubled per RFC 4180.
 */
export function toCsv(rows: string[][]): string {
    let lines: string[] = [];
    let r: number;
    for (r = 0; r < rows.length; r++) {
        let row: string[] = rows[r];
        let fields: string[] = [];
        let c: number;
        for (c = 0; c < row.length; c++) {
            fields.push(escapeField(row[c]));
        }
        lines.push(fields.join(","));
    }
    return lines.join("\n");
}

/**
 * Triggers a browser download of the provided CSV string with the given
 * filename. Creates a temporary object URL and anchor element.
 */
export function downloadResults(csvString: string, filename: string): void {
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

/**
 * Runs one calculator across every CSV data row and returns a results CSV.
 *
 * The header row names the calculator's input fields, so a cell is passed
 * through under its own header. Each row runs through the same engine seam
 * every other route uses, which means batch works identically on the website
 * and in the desktop app. The result CSV echoes the input columns and appends
 * `value` and `status`.
 */
export async function processCsvText(
    text: string,
    calculatorType: string,
    onProgress?: (info: ProgressInfo) => void
): Promise<BatchResult> {
    let rows: string[][] = parseCsv(text);
    if (rows.length === 0) {
        throw new Error("CSV file is empty");
    }
    let headers: string[] = rows[0];
    if (headers.length === 0 || headers.some(function (h: string): boolean { return h.trim() === ""; })) {
        throw new Error("CSV header row must name the calculator's input fields");
    }
    let dataRows: string[][] = rows.slice(1);
    let outputRows: string[][] = [headers.concat(["value", "status"])];
    let successCount: number = 0;
    let errorCount: number = 0;
    let engine = getEngine();
    let d: number;
    for (d = 0; d < dataRows.length; d++) {
        let row: string[] = dataRows[d];
        let inputs: Record<string, string> = {};
        let h: number;
        for (h = 0; h < headers.length; h++) {
            inputs[headers[h]] = h < row.length ? row[h] : "";
        }
        let value: string = "";
        let status: string = "ok";
        try {
            let res = await engine.calculate(calculatorType, inputs);
            let explanation: string = res.explanation ?? "";
            if (res.value === "" || explanation.startsWith("Error")) {
                status = explanation !== "" ? explanation : "Calculation failed";
                errorCount = errorCount + 1;
            } else {
                value = res.value;
                successCount = successCount + 1;
            }
        } catch (e) {
            status = e instanceof Error ? e.message : String(e);
            errorCount = errorCount + 1;
        }
        let outRow: string[] = row.slice();
        // Pad ragged rows so every output row has the same column count.
        while (outRow.length < headers.length) {
            outRow.push("");
        }
        outRow.push(value, status);
        outputRows.push(outRow);
        if (onProgress) {
            onProgress({"current": d + 1, "total": dataRows.length});
        }
    }
    return {
        "csvString": toCsv(outputRows),
        "totalRows": dataRows.length,
        "successCount": successCount,
        "errorCount": errorCount
    };
}
