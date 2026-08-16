import { HistoryEntry } from "./exportManager.js";

const ARCHIVE_VERSION: number = 1;
const HISTORY_KEY: string = "calc-history";
const THEME_KEY: string = "theme";
const AUTO_DARK_KEY: string = "auto-dark-mode";
const INPUTS_PREFIX: string = "calc-inputs-";
const LOGS_KEY: string = "chemutil_experiment_logs";
const PLUGIN_STATES_KEY: string = "chem-utility-plugin-states";
const EXPORT_FILENAME: string = "chemistry-utility-backup.chemutil";

/**
 * Shape of a portable archive file. Contains all user data that lives in
 * localStorage so it can be transferred between devices or restored later.
 */
export interface ChemutilArchive {
	version: number;
	exportedAt: string;
	history: HistoryEntry[];
	theme: string;
	autoDarkMode: boolean;
	inputs: Record<string, Record<string, string>>;
	logs: unknown[];
	plugins: Record<string, { enabled: boolean }>;
}

/**
 * Pure schema validator for ChemutilArchive objects. Kept separate from
 * DataPortabilityManager so it can be unit-tested in isolation and reused
 * by future tooling.
 */
export class ChemutilArchiveValidator {
	public static isValid(value: unknown): boolean {
		if (typeof value !== "object" || value === null) {
			return false;
		}
		let archive = value as Record<string, unknown>;
		if (typeof archive.version !== "number") {
			return false;
		}
		if (typeof archive.exportedAt !== "string") {
			return false;
		}
		if (!Array.isArray(archive.history)) {
			return false;
		}
		if (typeof archive.theme !== "string") {
			return false;
		}
		if (typeof archive.autoDarkMode !== "boolean") {
			return false;
		}
		if (typeof archive.inputs !== "object" || archive.inputs === null || Array.isArray(archive.inputs)) {
			return false;
		}
		if (!Array.isArray(archive.logs)) {
			return false;
		}
		if (typeof archive.plugins !== "object" || archive.plugins === null || Array.isArray(archive.plugins)) {
			return false;
		}
		return true;
	}
}

/**
 * Singleton that exports and imports the full local application state as a
 * ChemutilArchive. Replaces cloud sync: users can download a .chemutil file
 * on one device and import it on another to restore history, theme,
 * saved inputs, experiment logs, and plugin states.
 */
export class DataPortabilityManager {
	private static instance: DataPortabilityManager;

	private constructor() {}

	public static getInstance(): DataPortabilityManager {
		if (!DataPortabilityManager.instance) {
			DataPortabilityManager.instance = new DataPortabilityManager();
		}
		return DataPortabilityManager.instance;
	}

	public static resetInstance(): void {
		DataPortabilityManager.instance = null as unknown as DataPortabilityManager;
	}

	/**
	 * Collects all user data from localStorage into a portable archive.
	 */
	public export(): ChemutilArchive {
		let archive: ChemutilArchive = {
			version: ARCHIVE_VERSION,
			exportedAt: new Date().toISOString(),
			history: this.readHistory(),
			theme: this.readTheme(),
			autoDarkMode: this.readAutoDarkMode(),
			inputs: this.readInputs(),
			logs: this.readLogs(),
			plugins: this.readPlugins()
		};
		return archive;
	}

	/**
	 * Validates and writes an archive into localStorage, replacing the
	 * current state for each category.
	 * @throws Error when the archive fails schema validation.
	 */
	public import(archive: unknown): void {
		if (!ChemutilArchiveValidator.isValid(archive)) {
			throw new Error("Invalid archive: schema validation failed");
		}
		let valid = archive as ChemutilArchive;
		this.writeHistory(valid.history);
		this.writeTheme(valid.theme);
		this.writeAutoDarkMode(valid.autoDarkMode);
		this.writeInputs(valid.inputs);
		this.writeLogs(valid.logs);
		this.writePlugins(valid.plugins);
	}

	/**
	 * Exports the current state and triggers a .chemutil file download.
	 */
	public exportToFile(): void {
		let archive = this.export();
		let json = JSON.stringify(archive, null, 2);
		let blob = new Blob([json], { type: "application/json" });
		let url = URL.createObjectURL(blob);
		let link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", EXPORT_FILENAME);
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	/**
	 * Reads a File (from an <input type="file"> picker), parses it as JSON,
	 * validates the schema, and imports it.
	 * @throws Error when the file cannot be parsed as JSON or fails validation.
	 */
	public importFromFile(file: File): Promise<void> {
		let manager = this;
		return file.text().then(function (text: string): void {
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch (err) {
				throw new Error("File is not valid JSON: " + (err as Error).message);
			}
			manager.import(parsed);
		});
	}

	private readHistory(): HistoryEntry[] {
		try {
			let stored = localStorage.getItem(HISTORY_KEY);
			if (stored) {
				let parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					return parsed as HistoryEntry[];
				}
			}
		} catch {}
		return [];
	}

	private readTheme(): string {
		let stored = localStorage.getItem(THEME_KEY);
		if (stored === "dark" || stored === "light" || stored === "amoled") {
			return stored;
		}
		return "light";
	}

	private readAutoDarkMode(): boolean {
		return localStorage.getItem(AUTO_DARK_KEY) === "true";
	}

	private readInputs(): Record<string, Record<string, string>> {
		let result: Record<string, Record<string, string>> = {};
		try {
			for (let i = 0; i < localStorage.length; i++) {
				let key = localStorage.key(i);
				if (key === null) continue;
				if (key.indexOf(INPUTS_PREFIX) !== 0) continue;
				let calcId = key.substring(INPUTS_PREFIX.length);
				let stored = localStorage.getItem(key);
				if (stored === null) continue;
				let parsed = JSON.parse(stored);
				if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
					result[calcId] = parsed as Record<string, string>;
				}
			}
		} catch {}
		return result;
	}

	private readLogs(): unknown[] {
		try {
			let stored = localStorage.getItem(LOGS_KEY);
			if (stored) {
				let parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					return parsed;
				}
			}
		} catch {}
		return [];
	}

	private readPlugins(): Record<string, { enabled: boolean }> {
		try {
			let stored = localStorage.getItem(PLUGIN_STATES_KEY);
			if (stored) {
				let parsed = JSON.parse(stored);
				if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
					return parsed as Record<string, { enabled: boolean }>;
				}
			}
		} catch {}
		return {};
	}

	private writeHistory(history: HistoryEntry[]): void {
		try {
			localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
		} catch {}
	}

	private writeTheme(theme: string): void {
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {}
	}

	private writeAutoDarkMode(enabled: boolean): void {
		try {
			localStorage.setItem(AUTO_DARK_KEY, String(enabled));
		} catch {}
	}

	private writeInputs(inputs: Record<string, Record<string, string>>): void {
		try {
			for (let calcId in inputs) {
				if (!Object.prototype.hasOwnProperty.call(inputs, calcId)) continue;
				let values = inputs[calcId];
				localStorage.setItem(INPUTS_PREFIX + calcId, JSON.stringify(values));
			}
		} catch {}
	}

	private writeLogs(logs: unknown[]): void {
		try {
			localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
		} catch {}
	}

	private writePlugins(plugins: Record<string, { enabled: boolean }>): void {
		try {
			localStorage.setItem(PLUGIN_STATES_KEY, JSON.stringify(plugins));
		} catch {}
	}
}
