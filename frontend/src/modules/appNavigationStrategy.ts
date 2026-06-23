import gsap from "gsap";
import type { NavigationStrategy } from "./navigationManager.js";
import { NavigationManager, CALCULATORS } from "./navigationManager.js";
import { IdealGasLawCalculator } from "./gasLawCalculators.js";
import { InputPersistence } from "./inputPersistence.js";
import { UrlStateManager } from "./urlStateManager.js";
import { ExportManager } from "./exportManager.js";

const RECENT_KEY = "chem-utility-recent";
const MAX_RECENT = 3;

export class AppNavigationStrategy implements NavigationStrategy {
	constructor() {}

	public navigate(targetId: string): void {
		let manager = NavigationManager.getInstance();
		let activeViewId = manager.getActiveViewId();
		if (targetId === activeViewId) return;

		let sections = document.querySelectorAll(".app-view .main-groups.card") as NodeListOf<HTMLElement>;
		let welcomeScreen = document.querySelector(".app-view .welcome-screen") as HTMLElement;

		let direction: "forward" | "back" | "none" = "forward";
		let navHistory = manager.getNavHistory();
		if (direction === "forward" && navHistory.indexOf(targetId) !== -1) {
			direction = "back";
		}

		let outgoing = document.querySelector(".app-view .main-groups.card.view-active") as HTMLElement;
		if (outgoing && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			let outX = direction === "back" ? 30 : -30;
			gsap.to(outgoing, {
				opacity: 0,
				x: outX,
				duration: 0.15,
				ease: "power2.in",
				onComplete: function (): void {
					outgoing.classList.remove("view-active");
					outgoing.classList.add("view-hidden");
					gsap.set(outgoing, { opacity: 1, x: 0 });
				}
			});
		} else {
			sections.forEach(function (section: HTMLElement): void {
				section.classList.remove("view-active");
				section.classList.add("view-hidden");
			});
		}

		if (welcomeScreen) welcomeScreen.style.display = "none";

		let target = document.getElementById(targetId) as HTMLElement;
		if (target) {
			target.classList.remove("view-hidden");
			target.classList.add("view-active");
			if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				let inX = direction === "back" ? -30 : 30;
				gsap.fromTo(target, { opacity: 0, x: inX }, { opacity: 1, x: 0, duration: 0.2, ease: "power2.out" });
			}
		}

		manager.setActiveViewId(targetId);

		// Apply smart defaults for gas law calculator
		if (targetId === "gas-laws") {
			IdealGasLawCalculator.applyDefaults();
		}

		// Restore persisted input values
		this.restoreInputs(targetId);

		this.updateSidebarActive(targetId);
		this.updateTabActive(targetId);
		this.updateSheetActive(targetId);
		this.updateViewHeader(targetId);
		this.addRecent(targetId);
		manager.updateBreadcrumbs(targetId);
		manager.updateHistoryButtons();
		history.pushState(null, "", "/" + targetId);
	}

	private updateViewHeader(targetId: string): void {
		let header = document.querySelector(".view-header") as HTMLElement;
		if (!header) return;
		let calc = CALCULATORS.find(function (c): boolean { return c.id === targetId; });
		if (!calc) {
			header.style.display = "none";
			return;
		}
		header.style.display = "flex";
		let title = header.querySelector(".view-title") as HTMLElement;
		let category = header.querySelector(".view-category") as HTMLElement;
		if (title) title.textContent = calc.name;
		if (category) category.textContent = calc.category;
		let calculatorView = document.querySelector(".calculator-view") as HTMLElement;
		if (calculatorView) calculatorView.setAttribute("data-print-title", calc.name);

		// Add export/share buttons if not already present
		this.ensureExportButtons(header, targetId);

		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			gsap.fromTo(header, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out", clearProps: "opacity" });
		}
	}

	private ensureExportButtons(header: HTMLElement, targetId: string): void {
		let existing = header.querySelector(".export-actions");
		if (existing) {
			// Update data-target for the share button
			let shareBtn = existing.querySelector(".share-button") as HTMLElement;
			if (shareBtn) shareBtn.setAttribute("data-target", targetId);
			return;
		}

		let actions = document.createElement("div");
		actions.className = "export-actions";

		let shareBtn = document.createElement("button");
		shareBtn.className = "icon-button share-button";
		shareBtn.setAttribute("aria-label", "Share via URL");
		shareBtn.setAttribute("data-target", targetId);
		shareBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
		shareBtn.addEventListener("click", function (): void {
			ExportManager.getInstance().shareViaUrl(targetId);
		});

		let exportBtn = document.createElement("button");
		exportBtn.className = "icon-button";
		exportBtn.setAttribute("aria-label", "Export history as CSV");
		exportBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
		exportBtn.addEventListener("click", function (): void {
			ExportManager.getInstance().exportCsv();
		});

		actions.appendChild(shareBtn);
		actions.appendChild(exportBtn);
		header.appendChild(actions);
	}

	private updateSidebarActive(targetId: string): void {
		let links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
		links.forEach(function (link: HTMLElement): void {
			let href = link.getAttribute("href") || "";
			let linkId = href.charAt(0) === "/" || href.charAt(0) === "#" ? href.slice(1) : href;
			if (linkId === targetId) {
				link.classList.add("active");
			} else {
				link.classList.remove("active");
			}
		});
	}

	private updateTabActive(targetId: string): void {
		let tabs = document.querySelectorAll(".tab-item") as NodeListOf<HTMLElement>;
		tabs.forEach(function (tab: HTMLElement): void {
			let tabTarget = tab.getAttribute("data-target");
			if (tabTarget === targetId) {
				tab.classList.add("active");
				tab.setAttribute("aria-selected", "true");
			} else {
				tab.classList.remove("active");
				tab.setAttribute("aria-selected", "false");
			}
		});
		this.updateTabIndicator(targetId);
	}

	private updateTabIndicator(targetId: string): void {
		let indicator = document.querySelector(".tab-indicator") as HTMLElement;
		let tabContainer = document.querySelector(".bottom-tabs") as HTMLElement;
		if (!indicator || !tabContainer) return;
		let activeTab = tabContainer.querySelector('.tab-item[data-target="' + targetId + '"]') as HTMLElement;
		if (!activeTab || targetId === "more") {
			indicator.style.width = "0";
			return;
		}
		let containerRect = tabContainer.getBoundingClientRect();
		let tabRect = activeTab.getBoundingClientRect();
		indicator.style.left = (tabRect.left - containerRect.left + 4) + "px";
		indicator.style.width = (tabRect.width - 8) + "px";
	}

	private updateSheetActive(targetId: string): void {
		let items = document.querySelectorAll(".nav-sheet .sheet-item") as NodeListOf<HTMLElement>;
		items.forEach(function (item: HTMLElement): void {
			if (item.getAttribute("data-target") === targetId) {
				item.classList.add("active");
			} else {
				item.classList.remove("active");
			}
		});
	}

	private addRecent(id: string): void {
		let recent: string[] = [];
		try {
			let stored = localStorage.getItem(RECENT_KEY);
			recent = stored ? JSON.parse(stored) : [];
		} catch { recent = []; }
		recent = recent.filter(function (r: string): boolean { return r !== id; });
		recent.unshift(id);
		recent = recent.slice(0, MAX_RECENT);
		try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch {}
		this.renderRecent();
	}

	private renderRecent(): void {
		let container = document.querySelector(".nav-recent");
		if (!container) return;
		let recent: string[] = [];
		try {
			let stored = localStorage.getItem(RECENT_KEY);
			recent = stored ? JSON.parse(stored) : [];
		} catch { recent = []; }
		if (recent.length === 0) {
			container.innerHTML = "";
			return;
		}
		let html = '<div class="nav-recent-label">Recent</div>';
		recent.forEach(function (id: string): void {
			let calc = CALCULATORS.find(function (c): boolean { return c.id === id; });
			if (calc) {
				html += '<a href="/' + id + '"><svg aria-hidden="true" focusable="false" class="recent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' + calc.name + '</a>';
			}
		});
		container.innerHTML = html;

		container.querySelectorAll("a").forEach(function (link: HTMLAnchorElement): void {
			link.addEventListener("click", function (e: MouseEvent): void {
				e.preventDefault();
				let targetId = link.getAttribute("href")?.slice(1);
				if (targetId) {
					NavigationManager.getInstance().navigate(targetId);
				}
			});
		});
	}

	/**
	 * Restores persisted input values for the given calculator view.
	 * First checks URL params (for shared links), then falls back to localStorage.
	 */
	private restoreInputs(targetId: string): void {
		let urlManager = UrlStateManager.getInstance();
		let persistence = InputPersistence.getInstance();

		// URL params take priority (for shared links)
		let urlValues = urlManager.restoreState(targetId);
		if (urlValues) {
			urlManager.fillInputs(targetId, urlValues);
			return;
		}

		// Fall back to localStorage persistence
		let savedValues = persistence.restore(targetId);
		if (savedValues) {
			urlManager.fillInputs(targetId, savedValues);
		}
	}
}
