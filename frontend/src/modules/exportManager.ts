import { UrlStateManager } from "./urlStateManager.js";

const HISTORY_KEY = "calc-history";
const MAX_HISTORY = 50;

interface HistoryEntry {
	calculatorId: string;
	inputs: Record<string, string>;
	result: string;
	timestamp: string;
}

/**
 * Singleton class that manages data export, URL sharing, and calculation
 * history. Provides CSV export, clipboard-based URL sharing, and persistent
 * calculation history stored in localStorage.
 */
export class ExportManager {
	private static instance: ExportManager;

	private constructor() {}

	public static getInstance(): ExportManager {
		if (!ExportManager.instance) {
			ExportManager.instance = new ExportManager();
		}
		return ExportManager.instance;
	}

	/**
	 * Returns the calculation history from localStorage.
	 * @returns Array of history entries, newest first
	 */
	public getHistory(): HistoryEntry[] {
		try {
			let stored = localStorage.getItem(HISTORY_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Adds a calculation to the history. Max 50 entries, newest first.
	 * @param calculatorId - The calculator view ID
	 * @param inputs - The input values used
	 * @param result - The result text
	 */
	public addToHistory(calculatorId: string, inputs: Record<string, string>, result: string): void {
		let history = this.getHistory();
		let entry: HistoryEntry = {
			calculatorId: calculatorId,
			inputs: inputs,
			result: result,
			timestamp: new Date().toISOString()
		};
		history.unshift(entry);
		if (history.length > MAX_HISTORY) {
			history = history.slice(0, MAX_HISTORY);
		}
		try {
			localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
		} catch {}
	}

	/**
	 * Exports the calculation history as a CSV file and triggers a download.
	 * CSV headers: Calculator, Input, Result, Timestamp
	 */
	public exportCsv(): void {
		let history = this.getHistory();
		let lines: string[] = ["Calculator,Input,Result,Timestamp"];
		for (let i = 0; i < history.length; i++) {
			let entry = history[i];
			let inputStr = ExportManager.escapeCsvField(JSON.stringify(entry.inputs));
			let resultStr = ExportManager.escapeCsvField(entry.result);
			let calcStr = ExportManager.escapeCsvField(entry.calculatorId);
			let tsStr = ExportManager.escapeCsvField(entry.timestamp);
			lines.push(calcStr + "," + inputStr + "," + resultStr + "," + tsStr);
		}
		let csvContent = lines.join("\n");
		let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		let url = URL.createObjectURL(blob);
		let link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", "chemistry-utility-history.csv");
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	/**
	 * Serializes the current calculator state to a URL and copies it to clipboard.
	 * Shows a brief "Copied!" toast notification.
	 * @param calculatorId - The calculator view ID
	 */
	public shareViaUrl(calculatorId: string): void {
		let urlManager = UrlStateManager.getInstance();
		let inputs = urlManager.readInputsFromDom(calculatorId);
		let serialized = urlManager.serializeState(calculatorId, inputs);
		let baseUrl = window.location.origin;
		let shareUrl = serialized ? baseUrl + "/" + calculatorId + "?" + serialized : baseUrl + "/" + calculatorId;

		navigator.clipboard.writeText(shareUrl).then(function (): void {
			ExportManager.showToast("Copied!");
		}).catch(function (): void {
			ExportManager.showToast("Failed to copy");
		});
	}

	/**
	 * Shows a brief toast notification.
	 */
	private static showToast(message: string): void {
		let existing = document.querySelector(".export-toast") as HTMLElement;
		if (existing) existing.remove();

		let toast = document.createElement("div");
		toast.className = "export-toast";
		toast.textContent = message;
		document.body.appendChild(toast);

		setTimeout(function (): void {
			toast.classList.add("visible");
		}, 10);

		setTimeout(function (): void {
			toast.classList.remove("visible");
			setTimeout(function (): void {
				toast.remove();
			}, 300);
		}, 2000);
	}

	/**
	 * Escapes a field for CSV output (wraps in quotes if it contains commas, quotes, or newlines).
	 */
	private static escapeCsvField(field: string): string {
		if (field.indexOf(",") !== -1 || field.indexOf('"') !== -1 || field.indexOf("\n") !== -1) {
			return '"' + field.replace(/"/g, '""') + '"';
		}
		return field;
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		ExportManager.instance = null as any;
	}
}
