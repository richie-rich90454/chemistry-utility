/**
 * Singleton class that manages internationalization (i18n) for the application.
 * Provides translation lookup with parameter interpolation, locale management,
 * and DOM translation via `data-i18n` attributes.
 */
export class TranslationManager {
	private static instance: TranslationManager;
	private locale: string;
	private catalogs: Map<string, Record<string, string>>;
	private currentCatalog: Record<string, string>;

	private constructor() {
		this.locale = "en";
		this.catalogs = new Map();
		this.currentCatalog = {};
	}

	/** Returns the singleton instance of TranslationManager. */
	public static getInstance(): TranslationManager {
		if (!TranslationManager.instance) {
			TranslationManager.instance = new TranslationManager();
		}
		return TranslationManager.instance;
	}

	/**
	 * Translates a key using the current locale's catalog.
	 * Supports parameter interpolation: `t('greeting', { name: 'World' })`
	 * with catalog entry `"greeting": "Hello, {name}!"` → "Hello, World!"
	 * Falls back to the key itself if no translation is found.
	 */
	public t(key: string, params?: Record<string, string>): string {
		let value = this.currentCatalog[key];
		if (value === undefined) {
			return key;
		}
		if (params) {
			let result = value;
			let paramKeys = Object.keys(params);
			for (let i = 0; i < paramKeys.length; i++) {
				let paramKey = paramKeys[i];
				result = result.replace(new RegExp("\\{" + paramKey + "\\}", "g"), params[paramKey]);
			}
			return result;
		}
		return value;
	}

	/**
	 * Sets the current locale and loads its catalog if available.
	 * Persists the locale choice to localStorage.
	 */
	public setLocale(locale: string): void {
		this.locale = locale;
		let catalog = this.catalogs.get(locale);
		if (catalog) {
			this.currentCatalog = catalog;
		}
		try {
			localStorage.setItem("locale", locale);
		} catch (_e) {
			// localStorage may be unavailable (e.g. private browsing)
		}
	}

	/** Returns the current locale code. */
	public getLocale(): string {
		return this.locale;
	}

	/**
	 * Loads a translation catalog for a given locale.
	 * The catalog is a flat key-value map where keys use dot notation
	 * (e.g., "calculators.mass.title") and values are the translated strings.
	 */
	public loadCatalog(locale: string, catalog: Record<string, string>): void {
		this.catalogs.set(locale, catalog);
		if (locale === this.locale) {
			this.currentCatalog = catalog;
		}
	}

	/**
	 * Applies translations to all elements with `data-i18n` attributes
	 * and `data-i18n-placeholder` attributes in the current document.
	 *
	 * - `data-i18n`: The attribute value is used as the translation key.
	 *   Only text content is replaced; child elements are preserved if
	 *   the target is a parent with mixed content.
	 *
	 * - `data-i18n-placeholder`: The attribute value is used as the
	 *   translation key for the element's `placeholder` attribute.
	 */
	public applyTranslations(): void {
		let textElements = document.querySelectorAll("[data-i18n]");
		for (let i = 0; i < textElements.length; i++) {
			let element = textElements[i] as HTMLElement;
			let key = element.getAttribute("data-i18n");
			if (key) {
				let translated = this.t(key);
				if (translated !== key) {
					element.textContent = translated;
				}
			}
		}
		let placeholderElements = document.querySelectorAll("[data-i18n-placeholder]");
		for (let i = 0; i < placeholderElements.length; i++) {
			let element = placeholderElements[i] as HTMLInputElement;
			let key = element.getAttribute("data-i18n-placeholder");
			if (key) {
				let translated = this.t(key);
				if (translated !== key) {
					element.placeholder = translated;
				}
			}
		}
	}
}
