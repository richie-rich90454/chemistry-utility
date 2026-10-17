type Theme = "light" | "dark" | "amoled";
type ThemeChangeCallback = (theme: Theme) => void;

class ThemeManager {
	private static instance: ThemeManager;
	private currentTheme: Theme;
	private mediaQuery: MediaQueryList | null;
	private autoDarkModeEnabled: boolean;
	private autoDarkTimerId: number | null;
	private listeners: ThemeChangeCallback[];

	private constructor() {
		this.currentTheme = "light";
		this.mediaQuery = null;
		this.autoDarkModeEnabled = false;
		this.autoDarkTimerId = null;
		this.listeners = [];
	}

	public subscribe(listener: ThemeChangeCallback): void {
		let i: number;
		for (i = 0; i < this.listeners.length; i++) {
			if (this.listeners[i] === listener) {
				return;
			}
		}
		this.listeners.push(listener);
	}

	public unsubscribe(listener: ThemeChangeCallback): void {
		let i: number;
		for (i = 0; i < this.listeners.length; i++) {
			if (this.listeners[i] === listener) {
				this.listeners.splice(i, 1);
				return;
			}
		}
	}

	public static getInstance(): ThemeManager {
		if (!ThemeManager.instance) {
			ThemeManager.instance = new ThemeManager();
		}
		return ThemeManager.instance;
	}

	public init(): void {
		try {
			this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		} catch {
			this.mediaQuery = null;
		}
		let stored: string | null = null;
		let autoStored: string | null = null;
		try {
			stored = localStorage.getItem("theme");
			autoStored = localStorage.getItem("auto-dark-mode");
		} catch {
			stored = null;
			autoStored = null;
		}
		if (stored === "dark" || stored === "light" || stored === "amoled") {
			this.currentTheme = stored;
		} else if (this.mediaQuery) {
			this.currentTheme = this.mediaQuery.matches ? "dark" : "light";
		} else {
			this.currentTheme = "light";
		}
		if (autoStored === "true") {
			this.autoDarkModeEnabled = true;
			this.applyAutoDarkMode();
		}
		this.applyTheme();
		this.listenForSystemChanges();
	}

	public toggle(): void {
		// A manual choice wins: stop the auto-dark timer so it cannot flip
		// the theme back on its next tick.
		if (this.autoDarkModeEnabled) {
			this.setAutoDarkMode(false);
		}
		if (this.currentTheme === "light") {
			this.currentTheme = "dark";
		} else if (this.currentTheme === "dark") {
			this.currentTheme = "amoled";
		} else {
			this.currentTheme = "light";
		}
		try {
			localStorage.setItem("theme", this.currentTheme);
		} catch {}
		this.applyTheme();
	}

	public setTheme(theme: Theme): void {
		// Explicit setTheme is a user choice: it must override auto-dark.
		// (updateAutoDarkTheme writes currentTheme directly, not via this.)
		if (this.autoDarkModeEnabled) {
			this.setAutoDarkMode(false);
		}
		this.currentTheme = theme;
		try {
			localStorage.setItem("theme", this.currentTheme);
		} catch {}
		this.applyTheme();
	}

	public getTheme(): Theme {
		return this.currentTheme;
	}

	public setAutoDarkMode(enabled: boolean): void {
		this.autoDarkModeEnabled = enabled;
		try {
			localStorage.setItem("auto-dark-mode", String(enabled));
		} catch {}
		if (enabled) {
			this.applyAutoDarkMode();
		} else {
			this.stopAutoDarkMode();
		}
	}

	public isAutoDarkModeEnabled(): boolean {
		return this.autoDarkModeEnabled;
	}

	public applyTheme(): void {
		let root = document.documentElement;
		root.classList.remove("dark", "light", "amoled");
		if (this.currentTheme === "dark") {
			root.classList.add("dark");
		} else if (this.currentTheme === "amoled") {
			root.classList.add("amoled");
		} else {
			root.classList.add("light");
		}
		this.updateThemeColorMeta();
		this.notifyListeners();
	}

	private notifyListeners(): void {
		let i: number;
		for (i = 0; i < this.listeners.length; i++) {
			this.listeners[i](this.currentTheme);
		}
	}

	private applyAutoDarkMode(): void {
		this.stopAutoDarkMode();
		this.updateAutoDarkTheme();
		this.autoDarkTimerId = window.setInterval(() => {
			this.updateAutoDarkTheme();
		}, 60000);
	}

	private updateAutoDarkTheme(): void {
		let hour = new Date().getHours();
		let targetTheme: Theme;
		if (hour >= 6 && hour < 18) {
			targetTheme = "light";
		} else {
			targetTheme = "dark";
		}
		if (this.currentTheme !== targetTheme) {
			this.currentTheme = targetTheme;
			localStorage.setItem("theme", this.currentTheme);
			this.applyTheme();
		}
	}

	private stopAutoDarkMode(): void {
		if (this.autoDarkTimerId !== null) {
			window.clearInterval(this.autoDarkTimerId);
			this.autoDarkTimerId = null;
		}
	}

	private updateThemeColorMeta(): void {
		let meta = document.querySelector('meta[name="theme-color"]');
		if (meta) {
			if (this.currentTheme === "amoled") {
				meta.setAttribute("content", "#000000");
			} else if (this.currentTheme === "dark") {
				meta.setAttribute("content", "#16161A");
			} else {
				meta.setAttribute("content", "#F8F9FA");
			}
		}
	}

	private listenForSystemChanges(): void {
		if (!this.mediaQuery) return;
		let handler = (e: MediaQueryListEvent): void => {
			let stored: string | null = null;
			try {
				stored = localStorage.getItem("theme");
			} catch {
				stored = null;
			}
			if (!stored) {
				this.currentTheme = e.matches ? "dark" : "light";
				this.applyTheme();
			}
		};
		// addEventListener is modern; fall back to addListener for old Safari.
		let mq = this.mediaQuery as MediaQueryList & {addListener?: (l: (e: MediaQueryListEvent) => void) => void};
		if (typeof this.mediaQuery.addEventListener === "function") {
			this.mediaQuery.addEventListener("change", handler);
		} else if (typeof mq.addListener === "function") {
			mq.addListener(handler);
		}
	}
}

export { ThemeManager };
export type { Theme };
