/**
 * Detects the user's preferred locale from various sources
 * in a priority order: localStorage → navigator.language →
 * document.documentElement.lang → 'en' (default).
 */
export class LocaleDetector {
	private static instance: LocaleDetector;

	private constructor() {}

	/** Returns the singleton instance of LocaleDetector. */
	public static getInstance(): LocaleDetector {
		if (!LocaleDetector.instance) {
			LocaleDetector.instance = new LocaleDetector();
		}
		return LocaleDetector.instance;
	}

	/**
	 * Detects the user's preferred locale.
	 * Detection order:
	 * 1. localStorage ('locale' key)
	 * 2. navigator.language
	 * 3. document.documentElement.lang
	 * 4. 'en' (default)
	 */
	public detect(): string {
		// 1. Check localStorage
		try {
			let stored = localStorage.getItem("locale");
			if (stored) {
				return this.normalize(stored);
			}
		} catch (_e) {
			// localStorage may be unavailable
		}

		// 2. Check navigator.language
		if (typeof navigator !== "undefined" && navigator.language) {
			return this.normalize(navigator.language);
		}

		// 3. Check document.documentElement.lang
		if (typeof document !== "undefined" && document.documentElement.lang) {
			return this.normalize(document.documentElement.lang);
		}

		// 4. Default
		return "en";
	}

	/**
	 * Normalizes locale codes to a consistent format.
	 * Examples: 'en-US' → 'en', 'zh-CN' → 'zh', 'EN' → 'en'
	 */
	public normalize(locale: string): string {
		if (!locale) return "en";
		let lower = locale.toLowerCase();
		let dashIndex = lower.indexOf("-");
		if (dashIndex !== -1) {
			return lower.substring(0, dashIndex);
		}
		return lower;
	}
}
