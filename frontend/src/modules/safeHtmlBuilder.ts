import { HtmlSanitizer } from "./htmlSanitizer.js";

/**
 * Fluent builder for constructing HTML strings from user-derived values.
 * All interpolated values are automatically escaped via
 * {@link HtmlSanitizer.escape}, while the HTML structure (tags) is preserved
 * as-is. This prevents XSS without sacrificing the ability to emit rich HTML.
 *
 * Example:
 * <pre>
 * new SafeHtmlBuilder()
 *     .text("Result: ")
 *     .bold(sanitizedValue)
 *     .text(" mol/L")
 *     .build();
 * </pre>
 */
export class SafeHtmlBuilder {
	private parts: string[] = [];

	/** Appends escaped plain text. */
	public text(value: string): this {
		this.parts.push(HtmlSanitizer.escape(value));
		return this;
	}

	/** Appends the value wrapped in {@code <strong>} tags (escaped). */
	public bold(value: string): this {
		this.parts.push("<strong>" + HtmlSanitizer.escape(value) + "</strong>");
		return this;
	}

	/** Appends the value wrapped in {@code <em>} tags (escaped). */
	public italic(value: string): this {
		this.parts.push("<em>" + HtmlSanitizer.escape(value) + "</em>");
		return this;
	}

	/** Appends the value wrapped in {@code <sub>} tags (escaped). */
	public sub(value: string): this {
		this.parts.push("<sub>" + HtmlSanitizer.escape(value) + "</sub>");
		return this;
	}

	/** Appends the value wrapped in {@code <sup>} tags (escaped). */
	public sup(value: string): this {
		this.parts.push("<sup>" + HtmlSanitizer.escape(value) + "</sup>");
		return this;
	}

	/** Appends the value wrapped in a {@code <span>} with the given class (both escaped). */
	public span(value: string, className: string): this {
		this.parts.push('<span class="' + HtmlSanitizer.escape(className) + '">' + HtmlSanitizer.escape(value) + "</span>");
		return this;
	}

	/** Returns the assembled HTML string. */
	public build(): string {
		return this.parts.join("");
	}
}
