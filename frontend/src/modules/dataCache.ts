/**
 * Singleton class that provides a simple key-value cache backed by
 * localStorage. Designed for caching periodic table data and other
 * static payloads that rarely change.
 */
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

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		DataCache.instance = null as any;
	}
}
