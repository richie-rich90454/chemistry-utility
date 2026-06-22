import gsap from "gsap";
import type { NavigationStrategy } from "./navigationManager.js";
import { NavigationManager, CALCULATORS } from "./navigationManager.js";

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
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			gsap.fromTo(header, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out", clearProps: "opacity" });
		}
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
}
