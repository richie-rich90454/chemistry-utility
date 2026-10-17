/**
 * Singleton registry that manages SVG icons and generates sprite sheets.
 * Icons are registered with an id and their inner SVG content, then
 * referenced via `<use href="#icon-{id}">` elements.
 */
export class IconRegistry {
	private static instance: IconRegistry;
	private icons: Map<string, { content: string; viewBox: string; fill?: string; stroke?: string; strokeWidth?: string; strokeLinecap?: string; strokeLinejoin?: string }>;

	private constructor() {
		this.icons = new Map();
	}

	/** Returns the singleton registry instance, creating it on first access. */
	public static getInstance(): IconRegistry {
		if (!IconRegistry.instance) {
			IconRegistry.instance = new IconRegistry();
		}
		return IconRegistry.instance;
	}

	/**
	 * Registers an icon with the given id and SVG content.
	 * The svgContent should be the inner markup of the SVG (paths, circles, etc.).
	 */
	public register(id: string, svgContent: string, options?: { viewBox?: string; fill?: string; stroke?: string; strokeWidth?: string; strokeLinecap?: string; strokeLinejoin?: string }): void {
		this.icons.set(id, {
			content: svgContent,
			viewBox: options?.viewBox ?? "0 0 24 24",
			fill: options?.fill,
			stroke: options?.stroke,
			strokeWidth: options?.strokeWidth,
			strokeLinecap: options?.strokeLinecap,
			strokeLinejoin: options?.strokeLinejoin
		});
	}

	/** Returns the SVG content for a registered icon, or undefined if not found. */
	public get(id: string): string | undefined {
		let entry = this.icons.get(id);
		return entry ? entry.content : undefined;
	}

	/** Returns the complete SVG sprite sheet HTML with all registered icons as `<symbol>` elements. */
	public renderSpriteSheet(): string {
		let symbols: string[] = [];
		this.icons.forEach(function (entry, id): void {
			let attrs = ' id="icon-' + id + '" viewBox="' + entry.viewBox + '"';
			if (entry.fill) attrs += ' fill="' + entry.fill + '"';
			if (entry.stroke) attrs += ' stroke="' + entry.stroke + '"';
			if (entry.strokeWidth) attrs += ' stroke-width="' + entry.strokeWidth + '"';
			if (entry.strokeLinecap) attrs += ' stroke-linecap="' + entry.strokeLinecap + '"';
			if (entry.strokeLinejoin) attrs += ' stroke-linejoin="' + entry.strokeLinejoin + '"';
			symbols.push("<symbol" + attrs + ">" + entry.content + "</symbol>");
		});
		return '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' + symbols.join("") + "</svg>";
	}

	/** Returns an SVG element that references the icon via `<use href="#icon-{id}">`. */
	public getIconReference(id: string): string {
		return '<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-' + id + '"></use></svg>';
	}
}
