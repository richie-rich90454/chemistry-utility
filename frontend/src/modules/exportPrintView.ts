import type { HistoryEntry } from "./exportManager.js";

const PRINT_STYLE_ID = "export-print-styles";

const PRINT_CSS = "@media print{"
	+ "body.printing-history > *:not(.export-print-view){display:none !important;}"
	+ ".export-print-view{display:block !important;font-family:sans-serif;color:#000;}"
	+ ".export-print-view table{width:100%;border-collapse:collapse;}"
	+ ".export-print-view th,.export-print-view td{border:1px solid #000;padding:4px 8px;text-align:left;}"
	+ "}"
	+ ".export-print-view{display:none;}"
	+ "body.printing-history .export-print-view{display:block;}";

/**
 * Escapes a string for safe interpolation into print-view HTML.
 */
export function escapePrintHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Builds a standalone printable HTML document over history entries.
 * Zero dependencies: the caller opens it in a new window and calls
 * `print()` on it (see {@link openHistoryPrintView}), letting the
 * browser produce the PDF via "Save as PDF".
 */
export function buildHistoryPrintHtml(entries: HistoryEntry[], title?: string): string {
	let docTitle = title !== undefined && title.length > 0 ? title : "Chemistry Utility — Calculation History";
	let rows = "";
	for (let i = 0; i < entries.length; i++) {
		let entry = entries[i];
		rows += "<tr><td>" + escapePrintHtml(entry.calculatorId) + "</td>"
			+ "<td>" + escapePrintHtml(JSON.stringify(entry.inputs)) + "</td>"
			+ "<td>" + escapePrintHtml(entry.result) + "</td>"
			+ "<td>" + escapePrintHtml(entry.timestamp) + "</td></tr>";
	}
	if (rows.length === 0) {
		rows = "<tr><td colspan=\"4\">No calculations recorded.</td></tr>";
	}
	return "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
		+ "<title>" + escapePrintHtml(docTitle) + "</title>"
		+ "<style>" + PRINT_CSS + ".export-print-view{display:block;}</style>"
		+ "</head><body>"
		+ "<div class=\"export-print-view\">"
		+ "<h1>" + escapePrintHtml(docTitle) + "</h1>"
		+ "<table><thead><tr><th>Calculator</th><th>Input</th><th>Result</th><th>Timestamp</th></tr></thead>"
		+ "<tbody>" + rows + "</tbody></table>"
		+ "</div></body></html>";
}

/**
 * Injects the print stylesheet into the current document (idempotent).
 * Required for the in-place `window.print()` fallback path.
 */
export function ensurePrintStyles(): void {
	if (document.getElementById(PRINT_STYLE_ID) !== null) {
		return;
	}
	let style = document.createElement("style");
	style.id = PRINT_STYLE_ID;
	style.textContent = PRINT_CSS;
	document.head.appendChild(style);
}

/**
 * Opens the dedicated print view over history entries in a new window
 * and returns it, or null when popups are blocked/unavailable.
 */
export function openHistoryPrintView(entries: HistoryEntry[], title?: string): Window | null {
	let html = buildHistoryPrintHtml(entries, title);
	let popup: Window | null = null;
	try {
		if (typeof window.open !== "function") {
			return null;
		}
		popup = window.open("", "_blank");
	} catch {
		return null;
	}
	if (popup === null) {
		return null;
	}
	try {
		popup.document.write(html);
		popup.document.close();
		popup.focus();
	} catch {
		return null;
	}
	return popup;
}
