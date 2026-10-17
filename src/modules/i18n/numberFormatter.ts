import { TranslationManager } from "./translationManager.js";

/**
 * Formats numbers with locale-aware grouping and decimal separators.
 * Wraps `Intl.NumberFormat` for consistent number display across
 * the application, replacing raw `.toFixed()` calls.
 */
export class NumberFormatter {
	private locale: string;
	private defaultDecimals: number;

	constructor(locale: string, defaultDecimals: number = 4) {
		this.locale = locale;
		this.defaultDecimals = defaultDecimals;
	}

	/**
	 * Formats a number with locale-aware grouping and decimal separator.
	 * @param value The number to format
	 * @param decimals Number of decimal places (defaults to 4)
	 * @returns The formatted string
	 */
	public format(value: number, decimals?: number): string {
		let d = decimals !== undefined ? decimals : this.defaultDecimals;
		// Handle special values that Intl.NumberFormat renders differently
		// than toFixed (e.g., Infinity → "∞" vs "Infinity")
		if (!isFinite(value)) {
			return value.toFixed(d);
		}
		let fixed = value.toFixed(d);
		let num = parseFloat(fixed);
		let formatter = new Intl.NumberFormat(this.locale, {
			minimumFractionDigits: d,
			maximumFractionDigits: d,
			useGrouping: false,
		});
		return formatter.format(num);
	}

	/**
	 * Formats a number in scientific notation for very large/small numbers.
	 * @param value The number to format
	 * @returns The formatted string in scientific notation
	 */
	public formatScientific(value: number): string {
		let formatter = new Intl.NumberFormat(this.locale, {
			notation: "scientific",
			maximumFractionDigits: this.defaultDecimals,
			useGrouping: false,
		});
		return formatter.format(value);
	}

	/**
	 * Creates a NumberFormatter using the current locale from TranslationManager.
	 */
	public static createFromCurrentLocale(): NumberFormatter {
		let tm = TranslationManager.getInstance();
		return new NumberFormatter(tm.getLocale());
	}
}
