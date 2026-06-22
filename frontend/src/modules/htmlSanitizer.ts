/**
 * Static utility class for escaping HTML special characters to prevent XSS
 * attacks when inserting user-derived text into {@code innerHTML}.
 */
export class HtmlSanitizer {
	/**
	 * Escapes the five HTML-significant characters in the given text:
	 * {@code &}, {@code <}, {@code >}, {@code "}, and {@code '}.
	 *
	 * @param text - The raw text to escape.
	 * @returns The escaped text safe for insertion into HTML.
	 */
	public static escape(text: string): string {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
}
