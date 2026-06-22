type Theme = "light" | "dark" | "amoled";

class ThemeManager {
	private static instance: ThemeManager;
	private currentTheme: Theme;
	private mediaQuery: MediaQueryList | null;
	private autoDarkModeEnabled: boolean;
	private autoDarkTimerId: number | null;

	private constructor() {
		this.currentTheme = "light";
		this.mediaQuery = null;
		this.autoDarkModeEnabled = false;
		this.autoDarkTimerId = null;
	}

	public static getInstance(): ThemeManager {
		if (!ThemeManager.instance) {
			ThemeManager.instance = new ThemeManager();
		}
		return ThemeManager.instance;
	}

	public init(): void {
		this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		let stored = localStorage.getItem("theme");
		if (stored === "dark" || stored === "light" || stored === "amoled") {
			this.currentTheme = stored;
		} else {
			this.currentTheme = this.mediaQuery.matches ? "dark" : "light";
		}
		let autoStored = localStorage.getItem("auto-dark-mode");
		if (autoStored === "true") {
			this.autoDarkModeEnabled = true;
			this.applyAutoDarkMode();
		}
		this.applyTheme();
		this.listenForSystemChanges();
	}

	public toggle(): void {
		if (this.currentTheme === "light") {
			this.currentTheme = "dark";
		} else if (this.currentTheme === "dark") {
			this.currentTheme = "amoled";
		} else {
			this.currentTheme = "light";
		}
		localStorage.setItem("theme", this.currentTheme);
		this.applyTheme();
	}

	public setTheme(theme: Theme): void {
		this.currentTheme = theme;
		localStorage.setItem("theme", theme);
		this.applyTheme();
	}

	public getTheme(): Theme {
		return this.currentTheme;
	}

	public setAutoDarkMode(enabled: boolean): void {
		this.autoDarkModeEnabled = enabled;
		localStorage.setItem("auto-dark-mode", String(enabled));
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
		this.updateToggleButton();
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
				meta.setAttribute("content", "#1c1b1f");
			} else {
				meta.setAttribute("content", "#1a73e8");
			}
		}
	}

	private updateToggleButton(): void {
		let toggle = document.getElementById("theme-toggle");
		if (!toggle) return;
		let isDark = this.currentTheme === "dark" || this.currentTheme === "amoled";
		if (isDark) {
			toggle.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>';
		} else {
			toggle.innerHTML = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>';
		}
		toggle.setAttribute("aria-pressed", String(isDark));
		toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
	}

	private listenForSystemChanges(): void {
		if (!this.mediaQuery) return;
		this.mediaQuery.addEventListener("change", (e: MediaQueryListEvent) => {
			let stored = localStorage.getItem("theme");
			if (!stored) {
				this.currentTheme = e.matches ? "dark" : "light";
				this.applyTheme();
			}
		});
	}
}

export { ThemeManager };
export type { Theme };
