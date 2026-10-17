import type { HistoryEntry } from "./exportManager.js";
import { escapePrintHtml } from "./exportPrintView.js";

/**
 * Builds the printable lab report over a calculation history.
 *
 * No PDF library is involved: the document is plain HTML, the /report
 * route injects it, and the browser's print dialog produces the PDF
 * ("Save as PDF"). Every interpolated value goes through the escaper
 * exportPrintView already uses, so the markup stays inert.
 */
const REPORT_CSS = ".lab-report{font-family:Georgia,'Times New Roman',serif;color:#111;line-height:1.5;}"
	+ ".lab-entry{border-top:1px solid #ccc;padding:1rem 0;page-break-inside:avoid;}"
	+ ".lab-entry h2{font-size:1.1rem;margin:0 0 0.5rem;}"
	+ ".lab-entry dl{display:grid;grid-template-columns:max-content 1fr;gap:0.15rem 1rem;margin:0 0 0.75rem;}"
	+ ".lab-entry dt{color:#555;}"
	+ ".lab-entry dd{margin:0;}"
	+ ".lab-steps{margin:0 0 0.75rem;}"
	+ ".lab-steps h3{font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:#555;margin:0 0 0.25rem;}"
	+ ".lab-steps p{margin:0;white-space:pre-wrap;}"
	+ ".lab-result{font-weight:bold;margin:0 0 0.25rem;}"
	+ ".lab-timestamp{color:#555;font-size:0.8rem;margin:0;}"
	+ ".lab-empty{color:#555;font-style:italic;}";

/** Renders one calculation as a report section. */
export function buildLabEntryHtml(entry: HistoryEntry, position: number): string {
	let inputs = "";
	let keys = Object.keys(entry.inputs);
	for (let i = 0; i < keys.length; i++) {
		inputs += "<dt>" + escapePrintHtml(keys[i]) + "</dt><dd>" + escapePrintHtml(entry.inputs[keys[i]]) + "</dd>";
	}
	let steps = "";
	if (entry.explanation !== undefined && entry.explanation !== "") {
		steps = "<div class=\"lab-steps\"><h3>Worked steps</h3><p>" + escapePrintHtml(entry.explanation) + "</p></div>";
	}
	return "<section class=\"lab-entry\">"
		+ "<h2>" + escapePrintHtml(reportHeading(entry, position)) + "</h2>"
		+ "<dl>" + inputs + "</dl>"
		+ steps
		+ "<p class=\"lab-result\">Result: " + escapePrintHtml(entry.result) + "</p>"
		+ "<p class=\"lab-timestamp\">" + escapePrintHtml(formatReportTimestamp(entry.timestamp)) + "</p>"
		+ "</section>";
}

/**
 * Heads a section with the formula or equation when the calculator took
 * one (molar mass, stoichiometry, the balancer) and with the calculator
 * id plus its position otherwise.
 */
function reportHeading(entry: HistoryEntry, position: number): string {
	let keys = Object.keys(entry.inputs);
	for (let i = 0; i < keys.length; i++) {
		if (/formula|equation/i.test(keys[i])) {
			return entry.inputs[keys[i]];
		}
	}
	return entry.calculatorId + " (" + position + ")";
}

/** Renders the whole report, one section per history entry. */
export function buildLabReportHtml(entries: HistoryEntry[]): string {
	let sections = "";
	for (let i = 0; i < entries.length; i++) {
		sections += buildLabEntryHtml(entries[i], i + 1);
	}
	if (sections === "") {
		sections = "<p class=\"lab-empty\">No calculations recorded.</p>";
	}
	return "<div class=\"lab-report\">"
		+ "<style>" + REPORT_CSS + "</style>"
		+ sections
		+ "</div>";
}

/** Formats a history timestamp as a readable local date-time. */
export function formatReportTimestamp(iso: string): string {
	let date = new Date(iso);
	if (isNaN(date.getTime())) {
		return iso;
	}
	let pad = function (value: number): string {
		return value < 10 ? "0" + String(value) : String(value);
	};
	return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
		+ " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}
