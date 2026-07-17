/**
 * Singleton class that measures Core Web Vitals and navigation performance.
 * Only runs in browser environments — all measurement is a no-op in tests
 * or server-side rendering contexts.
 */
export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private metrics: Record<string, number> = {};
	private calculationMetrics: Record<string, number> = {};
	private apiCallMetrics: Record<string, number> = {};
	private isProd: boolean;

	private constructor() {
		this.isProd = this.detectProduction();
	}

	/** Returns the singleton instance of {@link PerformanceMonitor}. */
	public static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	/**
	 * Measures Core Web Vitals: TTFB, LCP, CLS, and INP.
	 * Uses performance.getEntriesByType('navigation') for TTFB and
	 * PerformanceObserver for LCP, CLS, and INP when available.
	 * Only runs in browser environments.
	 */
	public measure(): void {
		if (typeof window === "undefined" || typeof performance === "undefined") {
			return;
		}

		// TTFB from Navigation Timing API
		this.measureTtfb();

		// LCP, CLS, INP via PerformanceObserver
		this.observeLcp();
		this.observeCls();
		this.observeInp();
	}

	/**
	 * Returns the collected performance metrics as a flat record.
	 * Keys are metric names (ttfb, lcp, cls, inp, pageLoad) and values are
	 * in their standard units (milliseconds for timing, unitless for CLS).
	 * Calculation metrics are prefixed with "calc:" and API call metrics
	 * are prefixed with "api:".
	 */
	public report(): Record<string, number> {
		let result: Record<string, number> = {};
		let keys = Object.keys(this.metrics);
		for (let i = 0; i < keys.length; i++) {
			result[keys[i]] = this.metrics[keys[i]];
		}
		let calcKeys = Object.keys(this.calculationMetrics);
		for (let i = 0; i < calcKeys.length; i++) {
			result["calc:" + calcKeys[i]] = this.calculationMetrics[calcKeys[i]];
		}
		let apiKeys = Object.keys(this.apiCallMetrics);
		for (let i = 0; i < apiKeys.length; i++) {
			result["api:" + apiKeys[i]] = this.apiCallMetrics[apiKeys[i]];
		}
		return result;
	}

	/** Measures TTFB and page load duration from the Navigation Timing API. */
	private measureTtfb(): void {
		try {
			let entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
			if (entries.length > 0) {
				let nav = entries[0];
				let ttfb = nav.responseStart - nav.requestStart;
				this.metrics["ttfb"] = ttfb;
				let loadEventEnd = nav.loadEventEnd;
				if (loadEventEnd && loadEventEnd > 0) {
					this.metrics["pageLoad"] = loadEventEnd - nav.startTime;
				}
			}
		} catch {
			// Navigation Timing API not available
		}
	}

	/** Observes Largest Contentful Paint (LCP). */
	private observeLcp(): void {
		try {
			let observer = new PerformanceObserver(function (this: PerformanceMonitor, entryList: PerformanceObserverEntryList): void {
				let entries = entryList.getEntries();
				if (entries.length > 0) {
					let lastEntry = entries[entries.length - 1];
					this.metrics["lcp"] = lastEntry.startTime;
				}
			}.bind(this));
			observer.observe({ type: "largest-contentful-paint", buffered: true });
		} catch {
			// PerformanceObserver or LCP not supported
		}
	}

	/** Observes Cumulative Layout Shift (CLS). */
	private observeCls(): void {
		try {
			let clsValue = 0;
			let observer = new PerformanceObserver(function (this: PerformanceMonitor, entryList: PerformanceObserverEntryList): void {
				let entries = entryList.getEntries();
				for (let i = 0; i < entries.length; i++) {
					let entry = entries[i] as PerformanceEntry & { hadRecentInput: boolean; value: number };
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
					}
				}
				this.metrics["cls"] = clsValue;
			}.bind(this));
			observer.observe({ type: "layout-shift", buffered: true });
		} catch {
			// PerformanceObserver or CLS not supported
		}
	}

	/** Observes Interaction to Next Paint (INP). */
	private observeInp(): void {
		try {
			let maxDuration = 0;
			let observer = new PerformanceObserver(function (this: PerformanceMonitor, entryList: PerformanceObserverEntryList): void {
				let entries = entryList.getEntries();
				for (let i = 0; i < entries.length; i++) {
					let entry = entries[i] as PerformanceEntry & { duration: number };
					if (entry.duration > maxDuration) {
						maxDuration = entry.duration;
					}
				}
				this.metrics["inp"] = maxDuration;
			}.bind(this));
			observer.observe({ type: "event", buffered: true });
		} catch {
			// PerformanceObserver or INP not supported
		}
	}

	/**
	 * Records the execution duration of a named calculation. Subsequent
	 * calls with the same name overwrite the previous value.
	 */
	public trackCalculation(name: string, durationMs: number): void {
		this.calculationMetrics[name] = durationMs;
	}

	/**
	 * Records the duration of an API call to a given endpoint. Subsequent
	 * calls with the same endpoint overwrite the previous value.
	 */
	public trackApiCall(endpoint: string, durationMs: number): void {
		this.apiCallMetrics[endpoint] = durationMs;
	}

	/**
	 * Reports the collected metrics to the console. Only runs in
	 * development mode; in production this is a no-op.
	 */
	public reportToConsole(): void {
		if (this.isProd) {
			return;
		}
		console.info("[Performance] Metrics:", this.report());
	}

	/** Detects whether the app is running in production mode. */
	private detectProduction(): boolean {
		if (typeof process !== "undefined" && process.env && process.env.NODE_ENV) {
			return process.env.NODE_ENV === "production";
		}
		return false;
	}

	/** Resets the singleton instance. For testing only. */
	public static resetInstance(): void {
		PerformanceMonitor.instance = null as unknown as PerformanceMonitor;
	}
}
