/**
 * Singleton class that announces messages to screen readers via
 * an aria-live region. Creates a hidden live region in the DOM
 * on first use and updates its text content to trigger announcements.
 */
export class ScreenReaderAnnouncer {
	private static instance: ScreenReaderAnnouncer;
	private static readonly LIVE_REGION_ID = "sr-announce";
	private liveRegion: HTMLElement | null = null;

	private constructor() {}

	/** Returns the singleton instance of {@link ScreenReaderAnnouncer}. */
	public static getInstance(): ScreenReaderAnnouncer {
		if (!ScreenReaderAnnouncer.instance) {
			ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
		}
		return ScreenReaderAnnouncer.instance;
	}

	/**
	 * Announces a message to screen readers.
	 * @param message The text to announce.
	 * @param priority 'polite' waits for the screen reader to finish,
	 *                 'assertive' interrupts immediately. Defaults to 'polite'.
	 */
	public announce(message: string, priority: "polite" | "assertive" = "polite"): void {
		if (typeof document === "undefined") return;

		let region = this.getOrCreateLiveRegion(priority);
		if (!region) return;

		// Clear and re-set to force screen readers to re-announce
		region.textContent = "";
		// Use a microtask delay so the screen reader detects the change
		setTimeout(function (): void {
			region.textContent = message;
		}, 100);
	}

	/** Gets or creates the hidden aria-live region in the DOM. */
	private getOrCreateLiveRegion(priority: "polite" | "assertive"): HTMLElement | null {
		if (this.liveRegion && this.liveRegion.parentNode) {
			this.liveRegion.setAttribute("aria-live", priority);
			return this.liveRegion;
		}

		let existing = document.getElementById(ScreenReaderAnnouncer.LIVE_REGION_ID);
		if (existing) {
			this.liveRegion = existing;
			existing.setAttribute("aria-live", priority);
			return existing;
		}

		let region = document.createElement("div");
		region.id = ScreenReaderAnnouncer.LIVE_REGION_ID;
		region.setAttribute("aria-live", priority);
		region.setAttribute("aria-atomic", "true");
		region.setAttribute("role", "status");
		region.className = "sr-only";
		region.style.position = "absolute";
		region.style.width = "1px";
		region.style.height = "1px";
		region.style.padding = "0";
		region.style.margin = "-1px";
		region.style.overflow = "hidden";
		region.style.clip = "rect(0,0,0,0)";
		region.style.whiteSpace = "nowrap";
		region.style.border = "0";
		document.body.appendChild(region);
		this.liveRegion = region;
		return region;
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		ScreenReaderAnnouncer.instance = null as any;
	}
}
