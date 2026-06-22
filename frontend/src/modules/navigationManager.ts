import { ScrollNavigationStrategy } from "./scrollNavigationStrategy.js";
import { AppNavigationStrategy } from "./appNavigationStrategy.js";

export interface NavigationStrategy {
	navigate(targetId: string): void;
}

interface CalculatorInfo {
	id: string;
	name: string;
	category: string;
	icon: string;
	description: string;
}

const CALCULATORS: CalculatorInfo[] = [
	{ id: "element-lookup", name: "Element Lookup", category: "General", icon: "element", description: "Look up element properties" },
	{ id: "mass-calc", name: "Molar Mass", category: "General", icon: "mass", description: "Calculate molar mass of compounds" },
	{ id: "balancing", name: "Equation Balancer", category: "General", icon: "balance", description: "Balance chemical equations" },
	{ id: "dilution-calc", name: "Dilution", category: "Solutions", icon: "dilution", description: "Molarity and dilution calculations" },
	{ id: "mass-percent-calc", name: "Mass Percent", category: "Solutions", icon: "percent", description: "Concentration and mass percent" },
	{ id: "solution-mixing-calc", name: "Solution Mixing", category: "Solutions", icon: "mixing", description: "Mix solutions of different concentrations" },
	{ id: "nuclear-chemistry", name: "Nuclear", category: "Physical Chemistry", icon: "nuclear", description: "Half-life and nuclear decay" },
	{ id: "gas-laws", name: "Gas Laws", category: "Physical Chemistry", icon: "gas", description: "Ideal, combined, Van der Waals" },
	{ id: "electrochemistry", name: "Electrochemistry", category: "Physical Chemistry", icon: "electro", description: "Cell potential, Nernst, electrolysis" },
	{ id: "stoichiometry", name: "Stoichiometry", category: "Reactions & Bonds", icon: "stoich", description: "Reaction stoichiometry calculations" },
	{ id: "bond-type-predictor", name: "Bond Type", category: "Reactions & Bonds", icon: "bond", description: "Predict ionic, covalent, or metallic" }
];

const BREADCRUMB_CATEGORIES: Record<string, string> = {
	"element-lookup": "Reference",
	"mass-calc": "Reference",
	"balancing": "Reactions",
	"dilution-calc": "Solutions",
	"mass-percent-calc": "Solutions",
	"solution-mixing-calc": "Solutions",
	"nuclear-chemistry": "Nuclear",
	"gas-laws": "Physical Chemistry",
	"electrochemistry": "Electrochemistry",
	"stoichiometry": "Reactions",
	"bond-type-predictor": "Reactions"
};

const FAVORITES_KEY = "favorites";

class NavigationManager {
	private static instance: NavigationManager;
	private strategy: NavigationStrategy | null = null;
	private navHistory: string[] = [];
	private forwardHistory: string[] = [];
	private activeViewId: string | null = null;

	private constructor() {}

	public static getInstance(): NavigationManager {
		if (!NavigationManager.instance) {
			NavigationManager.instance = new NavigationManager();
		}
		return NavigationManager.instance;
	}

	public initialize(): void {
		let isAppView = document.querySelector(".app-view") !== null;
		if (isAppView) {
			this.strategy = new AppNavigationStrategy();
		} else {
			this.strategy = new ScrollNavigationStrategy();
		}
	}

	public setStrategy(strategy: NavigationStrategy): void {
		this.strategy = strategy;
	}

	public navigate(targetId: string): void {
		if (this.activeViewId === targetId) return;
		if (this.activeViewId) {
			this.pushHistory(targetId);
		}
		if (this.strategy) {
			this.strategy.navigate(targetId);
		}
	}

	public navigateBack(): void {
		let prevId = this.goBack();
		if (prevId && this.strategy) {
			this.strategy.navigate(prevId);
		}
	}

	public navigateForward(): void {
		let nextId = this.goForward();
		if (nextId && this.strategy) {
			this.strategy.navigate(nextId);
		}
	}

	public getStrategy(): NavigationStrategy | null {
		return this.strategy;
	}

	public getCalculators(): CalculatorInfo[] {
		return CALCULATORS.slice();
	}

	public getCalculatorById(id: string): CalculatorInfo | undefined {
		return CALCULATORS.find(function (c: CalculatorInfo): boolean { return c.id === id; });
	}

	public getBreadcrumbCategory(id: string): string {
		return BREADCRUMB_CATEGORIES[id] || "";
	}

	public getActiveViewId(): string | null {
		return this.activeViewId;
	}

	public setActiveViewId(id: string | null): void {
		this.activeViewId = id;
	}

	public pushHistory(_id: string): void {
		if (this.activeViewId) {
			this.navHistory.push(this.activeViewId);
			if (this.navHistory.length > 20) this.navHistory.shift();
		}
		this.forwardHistory = [];
	}

	public goBack(): string | null {
		if (this.navHistory.length === 0) return null;
		let prevId = this.navHistory.pop()!;
		if (this.activeViewId) {
			this.forwardHistory.push(this.activeViewId);
		}
		return prevId;
	}

	public goForward(): string | null {
		if (this.forwardHistory.length === 0) return null;
		let nextId = this.forwardHistory.pop()!;
		if (this.activeViewId) {
			this.navHistory.push(this.activeViewId);
		}
		return nextId;
	}

	public canGoBack(): boolean {
		return this.navHistory.length > 0;
	}

	public canGoForward(): boolean {
		return this.forwardHistory.length > 0;
	}

	public getNavHistory(): string[] {
		return this.navHistory.slice();
	}

	public getForwardHistory(): string[] {
		return this.forwardHistory.slice();
	}

	public clearForwardHistory(): void {
		this.forwardHistory = [];
	}

	public updateBreadcrumbs(targetId: string): void {
		let breadcrumbList = document.getElementById("breadcrumb-list") as HTMLElement;
		if (!breadcrumbList) return;
		let calc = this.getCalculatorById(targetId);
		if (!calc) {
			breadcrumbList.innerHTML = "";
			return;
		}
		let category = this.getBreadcrumbCategory(targetId);
		let html = '<li><a href="/">Home</a></li>';
		if (category) {
			html += '<li><span aria-hidden="true">/</span></li><li>' + category + '</li>';
		}
		html += '<li><span aria-hidden="true">/</span></li><li aria-current="page">' + calc.name + '</li>';
		breadcrumbList.innerHTML = html;
	}

	public getFavorites(): string[] {
		try {
			let stored = localStorage.getItem(FAVORITES_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	public toggleFavorite(id: string): void {
		let favorites = this.getFavorites();
		let index = favorites.indexOf(id);
		if (index !== -1) {
			favorites.splice(index, 1);
		} else {
			favorites.push(id);
		}
		try {
			localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
		} catch {}
		this.renderFavorites();
		this.updateFavoriteStars();
	}

	public isFavorite(id: string): boolean {
		return this.getFavorites().indexOf(id) !== -1;
	}

	public renderFavorites(): void {
		let container = document.querySelector(".nav-favorites") as HTMLElement;
		if (!container) return;
		let favorites = this.getFavorites();
		if (favorites.length === 0) {
			container.innerHTML = "";
			return;
		}
		let html = '<div class="nav-favorites-label">Favorites</div>';
		let self = this;
		favorites.forEach(function (id: string): void {
			let calc = CALCULATORS.find(function (c: CalculatorInfo): boolean { return c.id === id; });
			if (calc) {
				html += '<a href="/' + id + '"><span class="fav-star" data-fav="' + id + '" aria-label="Remove from favorites">\u2605</span>' + calc.name + '</a>';
			}
		});
		container.innerHTML = html;

		container.querySelectorAll("a").forEach(function (link: HTMLAnchorElement): void {
			link.addEventListener("click", function (e: MouseEvent): void {
				e.preventDefault();
				let targetId = link.getAttribute("href")?.slice(1);
				if (targetId) {
					self.navigate(targetId);
				}
			});
		});

		container.querySelectorAll<HTMLElement>(".fav-star").forEach(function (star: HTMLElement): void {
			star.addEventListener("click", function (e: MouseEvent): void {
				e.preventDefault();
				e.stopPropagation();
				let favId = star.getAttribute("data-fav");
				if (favId) {
					self.toggleFavorite(favId);
				}
			});
		});
	}

	public updateFavoriteStars(): void {
		let favorites = this.getFavorites();
		document.querySelectorAll<HTMLElement>(".fav-star-icon").forEach(function (star: HTMLElement): void {
			let id = star.getAttribute("data-fav");
			if (id) {
				if (favorites.indexOf(id) !== -1) {
					star.classList.add("is-favorite");
					star.setAttribute("aria-label", "Remove from favorites");
				} else {
					star.classList.remove("is-favorite");
					star.setAttribute("aria-label", "Add to favorites");
				}
			}
		});
	}

	public addFavoriteStarsToSidebar(): void {
		let self = this;
		let links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
		links.forEach(function (link: HTMLElement): void {
			let href = link.getAttribute("href");
			if (!href) return;
			let id = href.slice(1);
			let star = document.createElement("span");
			star.className = "fav-star-icon";
			star.setAttribute("data-fav", id);
			star.setAttribute("aria-label", "Add to favorites");
			star.setAttribute("role", "button");
			star.setAttribute("tabindex", "0");
			star.innerHTML = "\u2606";
			star.addEventListener("click", function (e: MouseEvent): void {
				e.preventDefault();
				e.stopPropagation();
				self.toggleFavorite(id);
			});
			star.addEventListener("keydown", function (e: KeyboardEvent): void {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					self.toggleFavorite(id);
				}
			});
			link.appendChild(star);
		});
		this.updateFavoriteStars();
	}

	public updateHistoryButtons(): void {
		let backBtn = document.querySelector(".back-button") as HTMLElement;
		if (backBtn) {
			if (this.canGoBack()) {
				backBtn.classList.remove("disabled");
				backBtn.setAttribute("aria-disabled", "false");
			} else {
				backBtn.classList.add("disabled");
				backBtn.setAttribute("aria-disabled", "true");
			}
		}
		let forwardBtn = document.querySelector(".forward-button") as HTMLElement;
		if (forwardBtn) {
			if (this.canGoForward()) {
				forwardBtn.classList.remove("disabled");
				forwardBtn.setAttribute("aria-disabled", "false");
			} else {
				forwardBtn.classList.add("disabled");
				forwardBtn.setAttribute("aria-disabled", "true");
			}
		}
	}
}

export { NavigationManager, CALCULATORS, BREADCRUMB_CATEGORIES, FAVORITES_KEY };
export type { CalculatorInfo };
