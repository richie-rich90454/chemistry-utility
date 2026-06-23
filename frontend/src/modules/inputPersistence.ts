/**
 * Singleton class that persists calculator input values to localStorage.
 * On calculator input change, values are saved; on calculator view load,
 * values are restored. Uses the key pattern "calc-inputs-{calculatorId}".
 */
export class InputPersistence {
	private static instance: InputPersistence;

	private constructor() {}

	public static getInstance(): InputPersistence {
		if (!InputPersistence.instance) {
			InputPersistence.instance = new InputPersistence();
		}
		return InputPersistence.instance;
	}

	/**
	 * Saves calculator input values to localStorage.
	 * @param calculatorId - The calculator view ID (e.g., "gas-laws")
	 * @param values - A record mapping input element IDs to their values
	 */
	public save(calculatorId: string, values: Record<string, string>): void {
		try {
			let key = "calc-inputs-" + calculatorId;
			localStorage.setItem(key, JSON.stringify(values));
		} catch {}
	}

	/**
	 * Restores calculator input values from localStorage.
	 * @param calculatorId - The calculator view ID
	 * @returns The saved values record, or null if none exists
	 */
	public restore(calculatorId: string): Record<string, string> | null {
		try {
			let key = "calc-inputs-" + calculatorId;
			let stored = localStorage.getItem(key);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch {}
		return null;
	}

	/**
	 * Clears saved calculator input values from localStorage.
	 * @param calculatorId - The calculator view ID
	 */
	public clear(calculatorId: string): void {
		try {
			let key = "calc-inputs-" + calculatorId;
			localStorage.removeItem(key);
		} catch {}
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		InputPersistence.instance = null as any;
	}
}
