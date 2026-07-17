import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NavigationManager, NavigationStrategy } from "./navigationManager.js";

class MockStrategy implements NavigationStrategy {
    public navigateCalls: string[] = [];
    public navigate(targetId: string): void {
        this.navigateCalls.push(targetId);
    }
}

describe("NavigationManager", () => {
    let manager: NavigationManager;

    beforeEach(() => {
        NavigationManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        manager = NavigationManager.getInstance();
    });

    afterEach(() => {
        NavigationManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(NavigationManager.getInstance()).toBe(NavigationManager.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = NavigationManager.getInstance();
        NavigationManager.resetInstance();
        const second = NavigationManager.getInstance();
        expect(first).not.toBe(second);
    });

    describe("initialize", () => {
        it("creates a ScrollNavigationStrategy when no .app-view element exists", () => {
            manager.initialize();
            expect(manager.getStrategy()).not.toBeNull();
        });

        it("creates an AppNavigationStrategy when .app-view element exists", () => {
            const appView = document.createElement("div");
            appView.className = "app-view";
            document.body.appendChild(appView);
            manager.initialize();
            expect(manager.getStrategy()).not.toBeNull();
        });
    });

    describe("setStrategy", () => {
        it("sets a custom strategy", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            expect(manager.getStrategy()).toBe(strategy);
        });
    });

    describe("navigate", () => {
        it("calls strategy.navigate with the target id", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.navigate("mass-calc");
            expect(strategy.navigateCalls).toContain("mass-calc");
        });

        it("does nothing when targetId equals activeViewId", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("mass-calc");
            manager.navigate("mass-calc");
            expect(strategy.navigateCalls.length).toBe(0);
        });

        it("pushes to history when navigating from an active view", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("mass-calc");
            manager.navigate("balancing");
            expect(manager.canGoBack()).toBe(true);
        });

        it("does not push to history when there is no active view", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.navigate("mass-calc");
            expect(manager.canGoBack()).toBe(false);
        });

        it("does not throw when no strategy is set", () => {
            expect(() => manager.navigate("mass-calc")).not.toThrow();
        });
    });

    describe("navigateBack", () => {
        it("navigates to the previous view when history exists", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("mass-calc");
            manager.navigate("balancing");
            manager.navigateBack();
            // goBack returns "mass-calc" (the previous view from history)
            expect(strategy.navigateCalls[strategy.navigateCalls.length - 1]).toBe("mass-calc");
        });

        it("does nothing when there is no history", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.navigateBack();
            expect(strategy.navigateCalls.length).toBe(0);
        });
    });

    describe("navigateForward", () => {
        it("navigates forward after going back", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("mass-calc");
            manager.navigate("balancing");
            manager.setActiveViewId("balancing");
            manager.navigateBack();
            manager.navigateForward();
            // The last navigation should be back to "balancing"
            expect(strategy.navigateCalls[strategy.navigateCalls.length - 1]).toBe("balancing");
        });

        it("does nothing when there is no forward history", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.navigateForward();
            expect(strategy.navigateCalls.length).toBe(0);
        });
    });

    describe("getCalculators", () => {
        it("returns the list of calculators", () => {
            const calcs = manager.getCalculators();
            expect(calcs.length).toBeGreaterThan(0);
        });

        it("returns a copy (not the original array)", () => {
            const calcs1 = manager.getCalculators();
            const calcs2 = manager.getCalculators();
            expect(calcs1).not.toBe(calcs2);
            expect(calcs1).toEqual(calcs2);
        });

        it("includes element-lookup calculator", () => {
            const calcs = manager.getCalculators();
            expect(calcs.some(c => c.id === "element-lookup")).toBe(true);
        });

        it("includes mass-calc calculator", () => {
            const calcs = manager.getCalculators();
            expect(calcs.some(c => c.id === "mass-calc")).toBe(true);
        });
    });

    describe("getCalculatorById", () => {
        it("returns the calculator when id exists", () => {
            const calc = manager.getCalculatorById("mass-calc");
            expect(calc).toBeDefined();
            expect(calc!.id).toBe("mass-calc");
            expect(calc!.name).toBe("Molar Mass");
        });

        it("returns undefined when id does not exist", () => {
            const calc = manager.getCalculatorById("nonexistent");
            expect(calc).toBeUndefined();
        });
    });

    describe("getBreadcrumbCategory", () => {
        it("returns the category for a known id", () => {
            expect(manager.getBreadcrumbCategory("mass-calc")).toBe("Reference");
        });

        it("returns empty string for an unknown id", () => {
            expect(manager.getBreadcrumbCategory("nonexistent")).toBe("");
        });

        it("returns Solutions for dilution-calc", () => {
            expect(manager.getBreadcrumbCategory("dilution-calc")).toBe("Solutions");
        });

        it("returns Reactions for stoichiometry", () => {
            expect(manager.getBreadcrumbCategory("stoichiometry")).toBe("Reactions");
        });
    });

    describe("active view id", () => {
        it("defaults to null", () => {
            expect(manager.getActiveViewId()).toBeNull();
        });

        it("setActiveViewId sets the active view", () => {
            manager.setActiveViewId("mass-calc");
            expect(manager.getActiveViewId()).toBe("mass-calc");
        });

        it("setActiveViewId can set null", () => {
            manager.setActiveViewId("mass-calc");
            manager.setActiveViewId(null);
            expect(manager.getActiveViewId()).toBeNull();
        });
    });

    describe("history management", () => {
        it("pushHistory pushes the current active view", () => {
            manager.setActiveViewId("view1");
            manager.pushHistory("view2");
            expect(manager.canGoBack()).toBe(true);
        });

        it("pushHistory does not push when there is no active view", () => {
            manager.pushHistory("view1");
            expect(manager.canGoBack()).toBe(false);
        });

        it("pushHistory clears forward history", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.navigateBack(); // forward history now has view2
            expect(manager.canGoForward()).toBe(true);
            manager.setActiveViewId("view1");
            manager.pushHistory("view3");
            expect(manager.canGoForward()).toBe(false);
        });

        it("pushHistory limits history to 20 entries", () => {
            manager.setActiveViewId("initial");
            for (let i = 0; i < 25; i++) {
                manager.setActiveViewId("view" + i);
                manager.pushHistory("next");
            }
            expect(manager.getNavHistory().length).toBeLessThanOrEqual(20);
        });

        it("goBack returns null when history is empty", () => {
            expect(manager.goBack()).toBeNull();
        });

        it("goBack returns the previous view id", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            expect(manager.goBack()).toBe("view1");
        });

        it("goBack pushes current view to forward history", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.goBack();
            expect(manager.canGoForward()).toBe(true);
        });

        it("goForward returns null when forward history is empty", () => {
            expect(manager.goForward()).toBeNull();
        });

        it("goForward returns the next view id", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.setActiveViewId("view2");
            manager.goBack();
            // After going back, activeViewId is still "view2" (navigate doesn't update it),
            // but forwardHistory should have "view2"
            expect(manager.goForward()).toBe("view2");
        });

        it("goForward pushes current view to nav history", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.setActiveViewId("view2");
            manager.goBack();
            manager.goForward();
            expect(manager.canGoBack()).toBe(true);
        });

        it("canGoBack returns false when history is empty", () => {
            expect(manager.canGoBack()).toBe(false);
        });

        it("canGoBack returns true when history has entries", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            expect(manager.canGoBack()).toBe(true);
        });

        it("canGoForward returns false when forward history is empty", () => {
            expect(manager.canGoForward()).toBe(false);
        });

        it("canGoForward returns true when forward history has entries", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.goBack();
            expect(manager.canGoForward()).toBe(true);
        });

        it("getNavHistory returns a copy", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            const hist1 = manager.getNavHistory();
            const hist2 = manager.getNavHistory();
            expect(hist1).not.toBe(hist2);
            expect(hist1).toEqual(hist2);
        });

        it("getForwardHistory returns a copy", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.goBack();
            const fwd1 = manager.getForwardHistory();
            const fwd2 = manager.getForwardHistory();
            expect(fwd1).not.toBe(fwd2);
            expect(fwd1).toEqual(fwd2);
        });

        it("clearForwardHistory empties the forward history", () => {
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.goBack();
            manager.clearForwardHistory();
            expect(manager.canGoForward()).toBe(false);
        });
    });

    describe("updateBreadcrumbs", () => {
        it("renders breadcrumbs for a known calculator", () => {
            const list = document.createElement("ol");
            list.id = "breadcrumb-list";
            document.body.appendChild(list);
            manager.updateBreadcrumbs("mass-calc");
            expect(list.innerHTML).toContain("Home");
            expect(list.innerHTML).toContain("Molar Mass");
            expect(list.innerHTML).toContain("Reference");
        });

        it("includes the category in the breadcrumbs", () => {
            const list = document.createElement("ol");
            list.id = "breadcrumb-list";
            document.body.appendChild(list);
            manager.updateBreadcrumbs("dilution-calc");
            expect(list.innerHTML).toContain("Solutions");
        });

        it("clears breadcrumbs for an unknown calculator", () => {
            const list = document.createElement("ol");
            list.id = "breadcrumb-list";
            list.innerHTML = "<li>old</li>";
            document.body.appendChild(list);
            manager.updateBreadcrumbs("nonexistent");
            expect(list.innerHTML).toBe("");
        });

        it("does nothing when there is no breadcrumb-list element", () => {
            expect(() => manager.updateBreadcrumbs("mass-calc")).not.toThrow();
        });
    });

    describe("favorites", () => {
        it("getFavorites returns empty array when none stored", () => {
            expect(manager.getFavorites()).toEqual([]);
        });

        it("getFavorites returns stored favorites", () => {
            localStorage.setItem("favorites", JSON.stringify(["mass-calc", "balancing"]));
            expect(manager.getFavorites()).toEqual(["mass-calc", "balancing"]);
        });

        it("getFavorites returns empty array when localStorage has invalid JSON", () => {
            localStorage.setItem("favorites", "invalid-json");
            expect(manager.getFavorites()).toEqual([]);
        });

        it("isFavorite returns false when id is not in favorites", () => {
            expect(manager.isFavorite("mass-calc")).toBe(false);
        });

        it("isFavorite returns true when id is in favorites", () => {
            localStorage.setItem("favorites", JSON.stringify(["mass-calc"]));
            expect(manager.isFavorite("mass-calc")).toBe(true);
        });

        it("toggleFavorite adds an id to favorites", () => {
            manager.toggleFavorite("mass-calc");
            expect(manager.isFavorite("mass-calc")).toBe(true);
        });

        it("toggleFavorite removes an id from favorites", () => {
            manager.toggleFavorite("mass-calc");
            manager.toggleFavorite("mass-calc");
            expect(manager.isFavorite("mass-calc")).toBe(false);
        });

        it("toggleFavorite persists to localStorage", () => {
            manager.toggleFavorite("mass-calc");
            const stored = localStorage.getItem("favorites");
            expect(stored).not.toBeNull();
            expect(JSON.parse(stored!)).toContain("mass-calc");
        });
    });

    describe("renderFavorites", () => {
        it("clears the container when there are no favorites", () => {
            const container = document.createElement("div");
            container.className = "nav-favorites";
            container.innerHTML = "<div>old</div>";
            document.body.appendChild(container);
            manager.renderFavorites();
            expect(container.innerHTML).toBe("");
        });

        it("renders favorite links when favorites exist", () => {
            const container = document.createElement("div");
            container.className = "nav-favorites";
            document.body.appendChild(container);
            localStorage.setItem("favorites", JSON.stringify(["mass-calc"]));
            manager.renderFavorites();
            expect(container.innerHTML).toContain("Molar Mass");
            expect(container.innerHTML).toContain("fav-star");
        });

        it("does nothing when there is no .nav-favorites container", () => {
            expect(() => manager.renderFavorites()).not.toThrow();
        });
    });

    describe("updateFavoriteStars", () => {
        it("adds is-favorite class to starred elements", () => {
            const star = document.createElement("span");
            star.className = "fav-star-icon";
            star.setAttribute("data-fav", "mass-calc");
            document.body.appendChild(star);
            localStorage.setItem("favorites", JSON.stringify(["mass-calc"]));
            manager.updateFavoriteStars();
            expect(star.classList.contains("is-favorite")).toBe(true);
            expect(star.getAttribute("aria-label")).toBe("Remove from favorites");
        });

        it("removes is-favorite class from unstarred elements", () => {
            const star = document.createElement("span");
            star.className = "fav-star-icon is-favorite";
            star.setAttribute("data-fav", "mass-calc");
            document.body.appendChild(star);
            manager.updateFavoriteStars();
            expect(star.classList.contains("is-favorite")).toBe(false);
            expect(star.getAttribute("aria-label")).toBe("Add to favorites");
        });

        it("does nothing when there are no fav-star-icon elements", () => {
            expect(() => manager.updateFavoriteStars()).not.toThrow();
        });
    });

    describe("updateHistoryButtons", () => {
        it("enables back button when canGoBack is true", () => {
            const backBtn = document.createElement("button");
            backBtn.className = "back-button disabled";
            backBtn.setAttribute("aria-disabled", "true");
            document.body.appendChild(backBtn);
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.updateHistoryButtons();
            expect(backBtn.classList.contains("disabled")).toBe(false);
            expect(backBtn.getAttribute("aria-disabled")).toBe("false");
        });

        it("disables back button when canGoBack is false", () => {
            const backBtn = document.createElement("button");
            backBtn.className = "back-button";
            document.body.appendChild(backBtn);
            manager.updateHistoryButtons();
            expect(backBtn.classList.contains("disabled")).toBe(true);
            expect(backBtn.getAttribute("aria-disabled")).toBe("true");
        });

        it("enables forward button when canGoForward is true", () => {
            const forwardBtn = document.createElement("button");
            forwardBtn.className = "forward-button disabled";
            forwardBtn.setAttribute("aria-disabled", "true");
            document.body.appendChild(forwardBtn);
            manager.setActiveViewId("view1");
            manager.navigate("view2");
            manager.navigateBack();
            manager.updateHistoryButtons();
            expect(forwardBtn.classList.contains("disabled")).toBe(false);
            expect(forwardBtn.getAttribute("aria-disabled")).toBe("false");
        });

        it("disables forward button when canGoForward is false", () => {
            const forwardBtn = document.createElement("button");
            forwardBtn.className = "forward-button";
            document.body.appendChild(forwardBtn);
            manager.updateHistoryButtons();
            expect(forwardBtn.classList.contains("disabled")).toBe(true);
            expect(forwardBtn.getAttribute("aria-disabled")).toBe("true");
        });

        it("does nothing when there are no history buttons", () => {
            expect(() => manager.updateHistoryButtons()).not.toThrow();
        });
    });
});
