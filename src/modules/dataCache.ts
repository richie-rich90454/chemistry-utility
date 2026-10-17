/**
 * Singleton class that provides a simple key-value cache backed by
 * localStorage. Designed for caching periodic table data and other
 * static payloads that rarely change.
 */
import type { ChemicalElement } from "../types.js";

export class DataCache {
	private static instance: DataCache;
	private static readonly PREFIX = "chem-cache-";

	private constructor() {}

	/** Returns the singleton instance of {@link DataCache}. */
	public static getInstance(): DataCache {
		if (!DataCache.instance) {
			DataCache.instance = new DataCache();
		}
		return DataCache.instance;
	}

	/**
	 * Retrieves a cached value by key.
	 * Returns null if the key does not exist or localStorage is unavailable.
	 */
	public async get(key: string): Promise<string | null> {
		try {
			let value = localStorage.getItem(DataCache.PREFIX + key);
			return value;
		} catch {
			return null;
		}
	}

	/**
	 * Stores a value in the cache.
	 * Silently fails if localStorage is unavailable or quota is exceeded.
	 */
	public async set(key: string, value: string): Promise<void> {
		try {
			localStorage.setItem(DataCache.PREFIX + key, value);
		} catch {
			// QuotaExceededError or storage unavailable — ignore
		}
	}

	/**
	 * Checks whether a key exists in the cache.
	 */
	public async has(key: string): Promise<boolean> {
		try {
			return localStorage.getItem(DataCache.PREFIX + key) !== null;
		} catch {
			return false;
		}
	}

	/**
	 * Removes a key from the cache. Silently fails when unavailable.
	 */
	public async remove(key: string): Promise<void> {
		try {
			localStorage.removeItem(DataCache.PREFIX + key);
		} catch {
			// Storage unavailable — ignore
		}
	}

	/**
	 * Reads the cached periodic-table payload ("ptable" key) and
	 * shape-validates it like the other localStorage-backed stores: the JSON
	 * must parse to an array whose elements each carry at least a string
	 * `symbol` and a numeric `atomicNumber`. Returns null when the entry is
	 * missing, corrupt, or wrongly shaped; corrupt entries are removed so
	 * the next read falls through to a fresh fetch.
	 */
	public async getPtable(): Promise<ChemicalElement[] | null> {
		let raw: string | null;
		try {
			raw = localStorage.getItem(DataCache.PREFIX + "ptable");
		} catch {
			return null;
		}
		if (raw === null) {
			return null;
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			await this.remove("ptable");
			return null;
		}
		if (!Array.isArray(parsed)) {
			await this.remove("ptable");
			return null;
		}
		for (let i = 0; i < parsed.length; i++) {
			let el: unknown = parsed[i];
			if (typeof el !== "object" || el === null) {
				await this.remove("ptable");
				return null;
			}
			let rec: Record<string, unknown> = el as Record<string, unknown>;
			if (typeof rec.symbol !== "string" || typeof rec.atomicNumber !== "number") {
				await this.remove("ptable");
				return null;
			}
		}
		return parsed as ChemicalElement[];
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		DataCache.instance = null as unknown as DataCache;
	}
}
