import gsap from "gsap";
import { NavigationManager, CALCULATORS } from "./modules/navigationManager.js";
import type { CalculatorInfo } from "./modules/navigationManager.js";
import { IconRegistry } from "./modules/iconRegistry.js";
import { ExportManager } from "./modules/exportManager.js";
import { OnboardingManager } from "./modules/onboardingManager.js";

const RECENT_KEY = "chem-utility-recent";
const COLLAPSED_KEY = "chem-utility-sidebar-collapsed";
const CUSTOM_SHORTCUTS_KEY = "custom-shortcuts";

let paletteSelectedIndex = 0;

/** Map of icon type keys to sprite sheet symbol ids. */
const ICON_MAP: Record<string, string> = {
	element: "element",
	mass: "molar-mass",
	balance: "balance",
	dilution: "dilution",
	percent: "mass-percent",
	mixing: "solution-mixing",
	nuclear: "nuclear",
	gas: "gas-laws",
	electro: "electrochemistry",
	stoich: "stoichiometry",
	bond: "bond-type",
	more: "more",
	clock: "clock",
	search: "search",
	collapse: "collapse",
	expand: "expand"
};

function getIconSvg(type: string): string {
	let registry = IconRegistry.getInstance();
	let iconId = ICON_MAP[type] || "element";
	return registry.getIconReference(iconId);
}

// ── Fuzzy search (Levenshtein distance) ──
function levenshteinDistance(a: string, b: string): number {
	let m = a.length;
	let n = b.length;
	let d: number[][] = [];
	for (let i = 0; i <= m; i++) {
		d[i] = [i];
	}
	for (let j = 0; j <= n; j++) {
		d[0][j] = j;
	}
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			let cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
		}
	}
	return d[m][n];
}

function fuzzyMatch(query: string, text: string): boolean {
	if (text.includes(query)) return true;
	let words = text.split(/\s+/);
	for (let i = 0; i < words.length; i++) {
		let distance = levenshteinDistance(query, words[i]);
		if (distance <= Math.max(1, Math.floor(query.length * 0.3))) {
			return true;
		}
	}
	return false;
}

// ── Welcome screen ──
function showWelcome(): void {
	let manager = NavigationManager.getInstance();
	let sections = document.querySelectorAll(".app-view .main-groups.card") as NodeListOf<HTMLElement>;
	let welcomeScreen = document.querySelector(".app-view .welcome-screen") as HTMLElement;
	let header = document.querySelector(".view-header") as HTMLElement;

	sections.forEach(function (section: HTMLElement): void {
		section.classList.remove("view-active");
		section.classList.add("view-hidden");
	});

	if (welcomeScreen) {
		welcomeScreen.style.display = "block";
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			gsap.fromTo(welcomeScreen, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
		}
	}

	if (header) header.style.display = "none";

	manager.setActiveViewId(null);

	let links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	links.forEach(function (link: HTMLElement): void {
		link.classList.remove("active");
	});

	let tabs = document.querySelectorAll(".tab-item") as NodeListOf<HTMLElement>;
	tabs.forEach(function (tab: HTMLElement): void {
		tab.classList.remove("active");
		tab.setAttribute("aria-selected", "false");
	});
}

// ── Recent calculators ──
function getRecent(): string[] {
	try {
		let stored = localStorage.getItem(RECENT_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

// ── Sidebar search (with fuzzy matching) ──
function initializeSearch(): void {
	let searchInput = document.querySelector(".sidebar-search input") as HTMLInputElement;
	if (!searchInput) return;

	searchInput.addEventListener("input", function (): void {
		let query = searchInput.value.toLowerCase().trim();
		let links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
		let categories = document.querySelectorAll(".sidebar-nav .nav-category") as NodeListOf<HTMLElement>;
		let noResults = document.querySelector(".sidebar-nav .no-results") as HTMLElement;

		if (!query) {
			links.forEach(function (link: HTMLElement): void { link.style.display = ""; });
			categories.forEach(function (cat: HTMLElement): void { cat.style.display = ""; });
			if (noResults) noResults.style.display = "none";
			return;
		}

		let visibleCount = 0;
		links.forEach(function (link: HTMLElement): void {
			let text = (link.textContent || "").toLowerCase();
			if (fuzzyMatch(query, text)) {
				link.style.display = "";
				visibleCount++;
			} else {
				link.style.display = "none";
			}
		});

		categories.forEach(function (cat: HTMLElement): void {
			let nextEl = cat.nextElementSibling;
			let hasVisible = false;
			while (nextEl && !nextEl.classList.contains("nav-category")) {
				if (nextEl.tagName === "A" && (nextEl as HTMLElement).style.display !== "none") {
					hasVisible = true;
					break;
				}
				nextEl = nextEl.nextElementSibling;
			}
			cat.style.display = hasVisible ? "" : "none";
		});

		if (noResults) noResults.style.display = visibleCount === 0 ? "block" : "none";
	});
}

// ── Command Palette ──
function openPalette(): void {
	let backdrop = document.querySelector(".palette-backdrop") as HTMLElement;
	let palette = document.querySelector(".command-palette") as HTMLElement;
	let input = document.querySelector(".palette-input") as HTMLInputElement;
	if (!backdrop || !palette || !input) return;
	backdrop.classList.add("open");
	palette.classList.add("open");
	input.value = "";
	input.focus();
	paletteSelectedIndex = 0;
	renderPaletteList("");
}

function closePalette(): void {
	let backdrop = document.querySelector(".palette-backdrop") as HTMLElement;
	let palette = document.querySelector(".command-palette") as HTMLElement;
	if (!backdrop || !palette) return;
	backdrop.classList.remove("open");
	palette.classList.remove("open");
}

function renderPaletteList(query: string): void {
	let list = document.querySelector(".palette-list") as HTMLElement;
	let input = document.querySelector(".palette-input") as HTMLInputElement;
	if (!list) return;
	let q = query.toLowerCase().trim();
	let filtered = CALCULATORS.filter(function (c: CalculatorInfo): boolean {
		if (!q) return true;
		return fuzzyMatch(q, c.name.toLowerCase()) || fuzzyMatch(q, c.category.toLowerCase()) || fuzzyMatch(q, c.description.toLowerCase());
	});
	if (filtered.length === 0) {
		list.innerHTML = '<div class="palette-empty">No calculators found</div>';
		if (input) input.removeAttribute("aria-activedescendant");
		return;
	}
	let html = "";
	filtered.forEach(function (calc: CalculatorInfo, i: number): void {
		let shortcut = "";
		if (i < 9) shortcut = "Alt+" + (i + 1);
		else if (i === 9) shortcut = "Alt+0";
		else if (i === 10) shortcut = "Alt+-";
		html += '<button class="palette-item' + (i === paletteSelectedIndex ? " selected" : "") + '" id="palette-item-' + i + '" data-target="' + calc.id + '" role="option">';
		html += getIconSvg(calc.icon);
		html += '<span class="palette-item-name">' + calc.name + '</span>';
		html += '<span class="palette-item-category">' + calc.category + '</span>';
		if (shortcut) html += '<span class="palette-item-shortcut">' + shortcut + '</span>';
		html += '</button>';
	});
	list.innerHTML = html;

	// Set aria-activedescendant on the input to the currently selected item
	if (input) {
		input.setAttribute("aria-activedescendant", "palette-item-" + paletteSelectedIndex);
	}

	list.querySelectorAll(".palette-item").forEach(function (item: HTMLElement): void {
		item.addEventListener("click", function (): void {
			let targetId = item.getAttribute("data-target");
			if (targetId) {
				NavigationManager.getInstance().navigate(targetId);
				closePalette();
			}
		});
	});
}

function initializeCommandPalette(): void {
	let backdrop = document.querySelector(".palette-backdrop") as HTMLElement;
	let input = document.querySelector(".palette-input") as HTMLInputElement;
	if (!backdrop || !input) return;

	document.addEventListener("keydown", function (e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === "k") {
			e.preventDefault();
			let palette = document.querySelector(".command-palette") as HTMLElement;
			if (palette && palette.classList.contains("open")) {
				closePalette();
			} else {
				openPalette();
			}
		}
		if (e.key === "Escape") {
			let palette = document.querySelector(".command-palette") as HTMLElement;
			if (palette && palette.classList.contains("open")) {
				closePalette();
			}
		}
		if (document.querySelector(".command-palette.open")) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				let items = document.querySelectorAll(".palette-item") as NodeListOf<HTMLElement>;
				if (items.length > 0) {
					paletteSelectedIndex = Math.min(paletteSelectedIndex + 1, items.length - 1);
					renderPaletteList(input.value);
				}
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				paletteSelectedIndex = Math.max(paletteSelectedIndex - 1, 0);
				renderPaletteList(input.value);
			}
			if (e.key === "Enter") {
				e.preventDefault();
				let items = document.querySelectorAll(".palette-item") as NodeListOf<HTMLElement>;
				if (items[paletteSelectedIndex]) {
					let targetId = items[paletteSelectedIndex].getAttribute("data-target");
					if (targetId) {
						NavigationManager.getInstance().navigate(targetId);
						closePalette();
					}
				}
			}
			// Focus trap: Tab/Shift+Tab cycle within palette
			if (e.key === "Tab") {
				e.preventDefault();
				let items = document.querySelectorAll(".palette-item") as NodeListOf<HTMLElement>;
				if (items.length === 0) {
					input.focus();
					return;
				}
				if (e.shiftKey) {
					// Shift+Tab: if on input, go to last item; if on item, go to previous or input
					let focusedEl = document.activeElement;
					if (focusedEl === input) {
						items[items.length - 1].focus();
					} else {
						let focusedIndex = -1;
						items.forEach(function (item: HTMLElement, idx: number): void {
							if (item === focusedEl) focusedIndex = idx;
						});
						if (focusedIndex <= 0) {
							input.focus();
						} else {
							items[focusedIndex - 1].focus();
						}
					}
				} else {
					// Tab: if on input, go to first item; if on last item, go to input
					let focusedEl = document.activeElement;
					if (focusedEl === input) {
						items[0].focus();
					} else {
						let focusedIndex = -1;
						items.forEach(function (item: HTMLElement, idx: number): void {
							if (item === focusedEl) focusedIndex = idx;
						});
						if (focusedIndex === items.length - 1 || focusedIndex === -1) {
							input.focus();
						} else {
							items[focusedIndex + 1].focus();
						}
					}
				}
			}
		}
	});

	backdrop.addEventListener("click", closePalette);

	input.addEventListener("input", function (): void {
		paletteSelectedIndex = 0;
		renderPaletteList(input.value);
	});
}

// ── Keyboard shortcuts ──
function getCustomShortcuts(): Record<string, string> {
	try {
		let stored = localStorage.getItem(CUSTOM_SHORTCUTS_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

function saveCustomShortcuts(shortcuts: Record<string, string>): void {
	try {
		localStorage.setItem(CUSTOM_SHORTCUTS_KEY, JSON.stringify(shortcuts));
	} catch {}
}

function initializeKeyboardShortcuts(): void {
	document.addEventListener("keydown", function (e: KeyboardEvent): void {
		if (e.altKey && e.key >= "1" && e.key <= "9") {
			e.preventDefault();
			let customShortcuts = getCustomShortcuts();
			let shortcutKey = "Alt+" + e.key;
			let targetId = customShortcuts[shortcutKey];
			if (targetId) {
				NavigationManager.getInstance().navigate(targetId);
			} else {
				let index = parseInt(e.key) - 1;
				if (index < CALCULATORS.length) {
					NavigationManager.getInstance().navigate(CALCULATORS[index].id);
				}
			}
		}
		if (e.altKey && e.key === "0") {
			e.preventDefault();
			let customShortcuts = getCustomShortcuts();
			let targetId = customShortcuts["Alt+0"];
			if (targetId) {
				NavigationManager.getInstance().navigate(targetId);
			} else {
				if (CALCULATORS.length >= 10) NavigationManager.getInstance().navigate(CALCULATORS[9].id);
			}
		}
		if (e.altKey && e.key === "-") {
			e.preventDefault();
			let customShortcuts = getCustomShortcuts();
			let targetId = customShortcuts["Alt+-"];
			if (targetId) {
				NavigationManager.getInstance().navigate(targetId);
			} else {
				if (CALCULATORS.length >= 11) NavigationManager.getInstance().navigate(CALCULATORS[10].id);
			}
		}
	});
}

// ── Keyboard shortcut discovery panel ──
function initializeShortcutPanel(): void {
	let panel = document.querySelector(".shortcut-panel") as HTMLElement;
	if (!panel) return;

	let backdrop = panel.querySelector(".shortcut-panel-backdrop") as HTMLElement;
	let closeBtn = panel.querySelector(".shortcut-panel-close") as HTMLElement;

	function openPanel(): void {
		panel.classList.add("open");
		panel.setAttribute("aria-hidden", "false");
	}

	function closePanel(): void {
		panel.classList.remove("open");
		panel.setAttribute("aria-hidden", "true");
	}

	function togglePanel(): void {
		if (panel.classList.contains("open")) {
			closePanel();
		} else {
			openPanel();
		}
	}

	document.addEventListener("keydown", function (e: KeyboardEvent): void {
		if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
			let target = e.target as HTMLElement;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
			e.preventDefault();
			togglePanel();
		}
		if (e.key === "Escape" && panel.classList.contains("open")) {
			closePanel();
		}
	});

	if (backdrop) backdrop.addEventListener("click", closePanel);
	if (closeBtn) closeBtn.addEventListener("click", closePanel);
}

// ── Swipe gesture support ──
function initializeSwipeGestures(): void {
	let main = document.querySelector(".main-content") as HTMLElement;
	if (!main) return;

	let touchStartX = 0;
	let touchStartY = 0;

	main.addEventListener("touchstart", function (e: TouchEvent): void {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	}, { passive: true });

	main.addEventListener("touchend", function (e: TouchEvent): void {
		let touchEndX = e.changedTouches[0].screenX;
		let touchEndY = e.changedTouches[0].screenY;
		let deltaX = touchEndX - touchStartX;
		let deltaY = touchEndY - touchStartY;
		let minSwipeDist = 50;

		if (Math.abs(deltaX) < minSwipeDist) return;
		if (Math.abs(deltaY) > Math.abs(deltaX)) return;

		if (deltaX > 0) {
			NavigationManager.getInstance().navigateBack();
		} else {
			NavigationManager.getInstance().navigateForward();
		}
	}, { passive: true });
}

// ── Sidebar collapse ──
function initializeSidebarCollapse(): void {
	let sidebar = document.querySelector(".sidebar") as HTMLElement;
	let toggleBtn = document.querySelector(".sidebar-toggle") as HTMLElement;
	if (!sidebar || !toggleBtn) return;

	let collapsed = localStorage.getItem(COLLAPSED_KEY) === "true";
	// Auto-collapse sidebar on mobile (< 768px)
	if (window.innerWidth < 768) {
		collapsed = true;
	}
	if (collapsed) sidebar.classList.add("collapsed");

	toggleBtn.addEventListener("click", function (): void {
		sidebar.classList.toggle("collapsed");
		let isCollapsed = sidebar.classList.contains("collapsed");
		try { localStorage.setItem(COLLAPSED_KEY, String(isCollapsed)); } catch {}

		let useEl = toggleBtn.querySelector("svg use");
		if (useEl) useEl.setAttribute("href", isCollapsed ? "#icon-expand" : "#icon-collapse");
	});
}

// ── Nav sheet (mobile) ──
function initializeNavSheet(): void {
	let backdrop = document.querySelector(".nav-sheet-backdrop") as HTMLElement;
	let sheet = document.querySelector(".nav-sheet") as HTMLElement;
	let moreBtn = document.querySelector(".tab-item[data-target='more']") as HTMLElement;
	if (!backdrop || !sheet || !moreBtn) return;

	function openSheet(): void {
		backdrop.classList.add("open");
		sheet.classList.add("open");
		// Focus the first sheet item when opening
		let firstItem = sheet.querySelector(".sheet-item") as HTMLElement;
		if (firstItem) {
			setTimeout(function (): void { firstItem.focus(); }, 100);
		}
	}
	function closeSheet(): void {
		backdrop.classList.remove("open");
		sheet.classList.remove("open");
	}

	moreBtn.addEventListener("click", openSheet);
	backdrop.addEventListener("click", closeSheet);
	document.addEventListener("keydown", function (e: KeyboardEvent): void {
		if (e.key === "Escape") closeSheet();

		// Focus trap: Tab/Shift+Tab cycle within sheet
		if (e.key === "Tab" && sheet.classList.contains("open")) {
			let items = sheet.querySelectorAll(".sheet-item") as NodeListOf<HTMLElement>;
			if (items.length === 0) return;
			e.preventDefault();
			let focusedEl = document.activeElement;
			let focusedIndex = -1;
			items.forEach(function (item: HTMLElement, idx: number): void {
				if (item === focusedEl) focusedIndex = idx;
			});
			if (e.shiftKey) {
				if (focusedIndex <= 0) {
					items[items.length - 1].focus();
				} else {
					items[focusedIndex - 1].focus();
				}
			} else {
				if (focusedIndex === items.length - 1 || focusedIndex === -1) {
					items[0].focus();
				} else {
					items[focusedIndex + 1].focus();
				}
			}
		}
	});

	sheet.querySelectorAll(".sheet-item").forEach(function (item: HTMLElement): void {
		item.addEventListener("click", function (): void {
			let targetId = item.getAttribute("data-target");
			if (targetId) {
				NavigationManager.getInstance().navigate(targetId);
				closeSheet();
			}
		});
	});
}

// ── Bottom tab bar ──
function initializeBottomTabs(): void {
	let tabs = document.querySelectorAll(".tab-item") as NodeListOf<HTMLElement>;
	tabs.forEach(function (tab: HTMLElement): void {
		let target = tab.getAttribute("data-target");
		if (target && target !== "more") {
			tab.addEventListener("click", function (): void {
				NavigationManager.getInstance().navigate(target);
			});
		}
	});
}

// ── Welcome screen ──
function buildWelcomeScreen(): void {
	let container = document.querySelector(".app-view .welcome-screen");
	if (!container) return;

	let html = '<h2>Chemistry Utility</h2><p>Pick a calculator to get started</p><div class="welcome-grid">';
	CALCULATORS.forEach(function (calc: CalculatorInfo): void {
		html += '<div class="welcome-card" tabindex="0" data-target="' + calc.id + '">';
		html += '<div class="welcome-card-icon">' + getIconSvg(calc.icon) + '</div>';
		html += '<div class="welcome-card-title">' + calc.name + '</div>';
		html += '<div class="welcome-card-desc">' + calc.description + '</div>';
		html += '</div>';
	});
	html += '</div>';
	container.innerHTML = html;

	container.querySelectorAll(".welcome-card").forEach(function (card: HTMLElement): void {
		card.addEventListener("click", function (): void {
			let targetId = card.getAttribute("data-target");
			if (targetId) NavigationManager.getInstance().navigate(targetId);
		});
		card.addEventListener("keydown", function (e: KeyboardEvent): void {
			if (e.key === "Enter") {
				let targetId = card.getAttribute("data-target");
				if (targetId) NavigationManager.getInstance().navigate(targetId);
			}
		});
	});
}

// ── Build nav sheet content ──
function buildNavSheet(): void {
	let sheet = document.querySelector(".nav-sheet");
	if (!sheet) return;

	let html = '<div class="sheet-handle"></div>';
	let currentCategory = "";
	CALCULATORS.forEach(function (calc: CalculatorInfo): void {
		if (calc.category !== currentCategory) {
			currentCategory = calc.category;
			html += '<div class="sheet-category">' + currentCategory + '</div>';
		}
		html += '<button class="sheet-item" data-target="' + calc.id + '">' + getIconSvg(calc.icon) + '<span>' + calc.name + '</span></button>';
	});
	sheet.innerHTML = html;
}

// ── Add shortcut hints to sidebar ──
function addShortcutHints(): void {
	let links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	links.forEach(function (link: HTMLElement, i: number): void {
		if (i < 9) {
			let hint = document.createElement("span");
			hint.className = "shortcut-hint";
			hint.textContent = "Alt+" + (i + 1);
			link.appendChild(hint);
		} else if (i === 9) {
			let hint = document.createElement("span");
			hint.className = "shortcut-hint";
			hint.textContent = "Alt+0";
			link.appendChild(hint);
		} else if (i === 10) {
			let hint = document.createElement("span");
			hint.className = "shortcut-hint";
			hint.textContent = "Alt+-";
			link.appendChild(hint);
		}
	});
}

// ── Customizable shortcuts settings panel ──
function initializeShortcutsSettings(): void {
	let sidebarFooter = document.querySelector(".sidebar-footer") as HTMLElement;
	if (!sidebarFooter) return;

	let settingsBtn = document.createElement("button");
	settingsBtn.className = "icon-button";
	settingsBtn.setAttribute("aria-label", "Customize shortcuts");
	settingsBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

	let panel: HTMLElement | null = null;

	function openSettings(): void {
		if (panel) {
			panel.remove();
			panel = null;
			return;
		}
		panel = document.createElement("div");
		panel.className = "shortcuts-settings-panel";
		panel.setAttribute("role", "dialog");
		panel.setAttribute("aria-label", "Customize keyboard shortcuts");

		let customShortcuts = getCustomShortcuts();
		let html = '<div class="shortcuts-settings-header"><span>Customize Shortcuts</span><button class="shortcuts-settings-close" aria-label="Close">&times;</button></div>';
		html += '<div class="shortcuts-settings-body">';
		for (let i = 1; i <= 9; i++) {
			let key = "Alt+" + i;
			let currentTarget = customShortcuts[key] || (i <= CALCULATORS.length ? CALCULATORS[i - 1].id : "");
			let calcName = "";
			for (let j = 0; j < CALCULATORS.length; j++) {
				if (CALCULATORS[j].id === currentTarget) {
					calcName = CALCULATORS[j].name;
					break;
				}
			}
			html += '<div class="shortcuts-settings-row">';
			html += '<span class="shortcuts-settings-key">' + key + '</span>';
			html += '<select class="shortcuts-settings-select" data-shortcut-key="' + key + '">';
			html += '<option value="">Default</option>';
			for (let j = 0; j < CALCULATORS.length; j++) {
				let selected = CALCULATORS[j].id === currentTarget ? " selected" : "";
				html += '<option value="' + CALCULATORS[j].id + '"' + selected + '>' + CALCULATORS[j].name + '</option>';
			}
			html += '</select>';
			html += '</div>';
		}
		html += '</div>';
		html += '<div class="shortcuts-settings-footer"><button class="primary-button shortcuts-settings-save">Save</button></div>';
		panel.innerHTML = html;
		sidebarFooter.appendChild(panel);

		let closeBtn = panel.querySelector(".shortcuts-settings-close") as HTMLElement;
		if (closeBtn) {
			closeBtn.addEventListener("click", function (): void {
				if (panel) { panel.remove(); panel = null; }
			});
		}

		let saveBtn = panel.querySelector(".shortcuts-settings-save") as HTMLElement;
		if (saveBtn) {
			saveBtn.addEventListener("click", function (): void {
				let newShortcuts: Record<string, string> = {};
				let selects = panel!.querySelectorAll(".shortcuts-settings-select") as NodeListOf<HTMLSelectElement>;
				selects.forEach(function (sel: HTMLSelectElement): void {
					let shortcutKey = sel.getAttribute("data-shortcut-key") || "";
					let value = sel.value;
					if (value) {
						newShortcuts[shortcutKey] = value;
					}
				});
				saveCustomShortcuts(newShortcuts);
				if (panel) { panel.remove(); panel = null; }
			});
		}
	}

	settingsBtn.addEventListener("click", openSettings);
	sidebarFooter.insertBefore(settingsBtn, sidebarFooter.firstChild);
}

// ── Dynamic prefetching of adjacent calculator modules ──
const prefetchedModules = new Set<string>();

/** Maps calculator IDs to their dynamic import modules for prefetching. */
const CALCULATOR_MODULES: Record<string, () => Promise<any>> = {
	"dilution-calc": () => import("./modules/solutionCalculators.js"),
	"mass-percent-calc": () => import("./modules/solutionCalculators.js"),
	"solution-mixing-calc": () => import("./modules/solutionCalculators.js"),
	"gas-laws": () => import("./modules/gasLawCalculators.js"),
	"nuclear-chemistry": () => import("./modules/gasLawCalculators.js"),
	"electrochemistry": () => import("./modules/electrochemistryCalculators.js"),
	"stoichiometry": () => import("./modules/stoichiometryCalculator.js"),
	"bond-type-predictor": () => import("./modules/bondPredictor.js"),
};

function prefetchAdjacentCalculators(currentId: string): void {
	let currentIndex = -1;
	for (let i = 0; i < CALCULATORS.length; i++) {
		if (CALCULATORS[i].id === currentId) {
			currentIndex = i;
			break;
		}
	}
	if (currentIndex === -1) return;

	// Prefetch previous and next calculator modules
	let adjacentIndices = [currentIndex - 1, currentIndex + 1];
	for (let i = 0; i < adjacentIndices.length; i++) {
		let idx = adjacentIndices[i];
		if (idx >= 0 && idx < CALCULATORS.length) {
			let adjacentId = CALCULATORS[idx].id;
			if (!prefetchedModules.has(adjacentId) && CALCULATOR_MODULES[adjacentId]) {
				prefetchedModules.add(adjacentId);
				// Fire and forget — the import will be cached for later use
				CALCULATOR_MODULES[adjacentId]().catch(function (): void {
					// Prefetch failed — non-critical, ignore
				});
			}
		}
	}
}

// ── Main initialization ──
export function initializeAppNav(): void {
	let isAppView = document.querySelector(".app-view") !== null;
	if (!isAppView) return;

	let manager = NavigationManager.getInstance();
	manager.initialize();

	// Build dynamic content
	buildWelcomeScreen();
	buildNavSheet();
	addShortcutHints();

	// Initialize features
	initializeSearch();
	initializeCommandPalette();
	initializeKeyboardShortcuts();
	initializeShortcutPanel();
	initializeSwipeGestures();
	initializeSidebarCollapse();
	initializeBottomTabs();
	initializeNavSheet();
	initializeShortcutsSettings();

	// Favorites
	manager.renderFavorites();
	manager.addFavoriteStarsToSidebar();

	// Back button
	let backBtn = document.querySelector(".back-button") as HTMLElement;
	if (backBtn) {
		backBtn.addEventListener("click", function (): void {
			manager.navigateBack();
		});
	}

	// Forward button
	let forwardBtn = document.querySelector(".forward-button") as HTMLElement;
	if (forwardBtn) {
		forwardBtn.addEventListener("click", function (): void {
			manager.navigateForward();
		});
	}

	// Sidebar link click handlers (override scroll behavior)
	let sidebarLinks = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
	sidebarLinks.forEach(function (link: HTMLElement, index: number): void {
		// Roving tabindex: only the first link has tabindex="0", all others have tabindex="-1"
		link.setAttribute("tabindex", index === 0 ? "0" : "-1");

		link.addEventListener("click", function (e: MouseEvent): void {
			e.preventDefault();
			let href = link.getAttribute("href");
			if (href) {
				let targetId = href.charAt(0) === "/" || href.charAt(0) === "#" ? href.slice(1) : href;
				manager.navigate(targetId);
				prefetchAdjacentCalculators(targetId);
			}
		});

		// Roving tabindex: Arrow Up/Down moves focus between links
		link.addEventListener("keydown", function (e: KeyboardEvent): void {
			let links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
			let currentIdx = -1;
			links.forEach(function (l: HTMLElement, i: number): void {
				if (l === link) currentIdx = i;
			});

			if (e.key === "ArrowDown") {
				e.preventDefault();
				let nextIdx = currentIdx + 1;
				if (nextIdx < links.length) {
					link.setAttribute("tabindex", "-1");
					links[nextIdx].setAttribute("tabindex", "0");
					links[nextIdx].focus();
				}
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				let prevIdx = currentIdx - 1;
				if (prevIdx >= 0) {
					link.setAttribute("tabindex", "-1");
					links[prevIdx].setAttribute("tabindex", "0");
					links[prevIdx].focus();
				}
			} else if (e.key === "Home") {
				e.preventDefault();
				link.setAttribute("tabindex", "-1");
				links[0].setAttribute("tabindex", "0");
				links[0].focus();
			} else if (e.key === "End") {
				e.preventDefault();
				link.setAttribute("tabindex", "-1");
				links[links.length - 1].setAttribute("tabindex", "0");
				links[links.length - 1].focus();
			}
		});
	});

	// Handle initial path or hash
	let path = window.location.pathname.slice(1);
	let hash = window.location.hash.slice(1);
	let initialTarget = path || hash;
	if (initialTarget && document.getElementById(initialTarget)) {
		manager.navigate(initialTarget);
	} else {
		let recent = getRecent();
		if (recent.length > 0 && document.getElementById(recent[0])) {
			manager.navigate(recent[0]);
		} else {
			showWelcome();
		}
	}

	// Handle browser back/forward
	window.addEventListener("popstate", function (): void {
		let popPath = window.location.pathname.slice(1);
		let popHash = window.location.hash.slice(1);
		let popTarget = popPath || popHash;
		if (popTarget && document.getElementById(popTarget)) {
			manager.navigate(popTarget);
		} else {
			showWelcome();
		}
	});

	// First-run onboarding tour
	let onboarding = OnboardingManager.getInstance();
	if (onboarding.isFirstRun()) {
		setTimeout(function (): void {
			onboarding.startTour();
		}, 1000);
	}
}
