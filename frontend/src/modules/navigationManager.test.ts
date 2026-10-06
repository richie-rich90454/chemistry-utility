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
            manager.navigate("molar-mass");
            expect(strategy.navigateCalls).toContain("molar-mass");
        });

        it("does nothing when targetId equals activeViewId", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("molar-mass");
            manager.navigate("molar-mass");
            expect(strategy.navigateCalls.length).toBe(0);
        });

        it("pushes to history when navigating from an active view", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("molar-mass");
            manager.navigate("equation-balancer");
            expect(manager.canGoBack()).toBe(true);
        });

        it("does not push to history when there is no active view", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.navigate("molar-mass");
            expect(manager.canGoBack()).toBe(false);
        });

        it("does not throw when no strategy is set", () => {
            expect(() => manager.navigate("molar-mass")).not.toThrow();
        });
    });

    describe("navigateBack", () => {
        it("navigates to the previous view when history exists", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("molar-mass");
            manager.navigate("equation-balancer");
            manager.navigateBack();
            // goBack returns "molar-mass" (the previous view from history)
            expect(strategy.navigateCalls[strategy.navigateCalls.length - 1]).toBe("molar-mass");
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
            manager.setActiveViewId("molar-mass");
            manager.navigate("equation-balancer");
            manager.setActiveViewId("equation-balancer");
            manager.navigateBack();
            manager.navigateForward();
            // The last navigation should be back to "equation-balancer"
            expect(strategy.navigateCalls[strategy.navigateCalls.length - 1]).toBe("equation-balancer");
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

        it("includes molar-mass calculator", () => {
            const calcs = manager.getCalculators();
            expect(calcs.some(c => c.id === "molar-mass")).toBe(true);
        });
    });

    describe("getCalculatorById", () => {
        it("returns the calculator when id exists", () => {
            const calc = manager.getCalculatorById("molar-mass");
            expect(calc).toBeDefined();
            expect(calc!.id).toBe("molar-mass");
            expect(calc!.name).toBe("Molar Mass");
        });

        it("returns undefined when id does not exist", () => {
            const calc = manager.getCalculatorById("nonexistent");
            expect(calc).toBeUndefined();
        });
    });

    describe("getBreadcrumbCategory", () => {
        it("returns the category for a known id", () => {
            expect(manager.getBreadcrumbCategory("molar-mass")).toBe("Reference");
        });

        it("returns empty string for an unknown id", () => {
            expect(manager.getBreadcrumbCategory("nonexistent")).toBe("");
        });

        it("returns Solutions for dilution", () => {
            expect(manager.getBreadcrumbCategory("dilution")).toBe("Solutions");
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
            manager.setActiveViewId("molar-mass");
            expect(manager.getActiveViewId()).toBe("molar-mass");
        });

        it("setActiveViewId can set null", () => {
            manager.setActiveViewId("molar-mass");
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
            manager.updateBreadcrumbs("molar-mass");
            expect(list.innerHTML).toContain("Home");
            expect(list.innerHTML).toContain("Molar Mass");
            expect(list.innerHTML).toContain("Reference");
        });

        it("includes the category in the breadcrumbs", () => {
            const list = document.createElement("ol");
            list.id = "breadcrumb-list";
            document.body.appendChild(list);
            manager.updateBreadcrumbs("dilution");
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
            expect(() => manager.updateBreadcrumbs("molar-mass")).not.toThrow();
        });
    });

    describe("favorites", () => {
        it("getFavorites returns empty array when none stored", () => {
            expect(manager.getFavorites()).toEqual([]);
        });

        it("getFavorites returns stored favorites", () => {
            localStorage.setItem("favorites", JSON.stringify(["molar-mass", "equation-balancer"]));
            expect(manager.getFavorites()).toEqual(["molar-mass", "equation-balancer"]);
        });

        it("getFavorites returns empty array when localStorage has invalid JSON", () => {
            localStorage.setItem("favorites", "invalid-json");
            expect(manager.getFavorites()).toEqual([]);
        });

        it("isFavorite returns false when id is not in favorites", () => {
            expect(manager.isFavorite("molar-mass")).toBe(false);
        });

        it("isFavorite returns true when id is in favorites", () => {
            localStorage.setItem("favorites", JSON.stringify(["molar-mass"]));
            expect(manager.isFavorite("molar-mass")).toBe(true);
        });

        it("toggleFavorite adds an id to favorites", () => {
            manager.toggleFavorite("molar-mass");
            expect(manager.isFavorite("molar-mass")).toBe(true);
        });

        it("toggleFavorite removes an id from favorites", () => {
            manager.toggleFavorite("molar-mass");
            manager.toggleFavorite("molar-mass");
            expect(manager.isFavorite("molar-mass")).toBe(false);
        });

        it("toggleFavorite persists to localStorage", () => {
            manager.toggleFavorite("molar-mass");
            const stored = localStorage.getItem("favorites");
            expect(stored).not.toBeNull();
            expect(JSON.parse(stored!)).toContain("molar-mass");
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
            localStorage.setItem("favorites", JSON.stringify(["molar-mass"]));
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
            star.setAttribute("data-fav", "molar-mass");
            document.body.appendChild(star);
            localStorage.setItem("favorites", JSON.stringify(["molar-mass"]));
            manager.updateFavoriteStars();
            expect(star.classList.contains("is-favorite")).toBe(true);
            expect(star.getAttribute("aria-label")).toBe("Remove from favorites");
        });

        it("removes is-favorite class from unstarred elements", () => {
            const star = document.createElement("span");
            star.className = "fav-star-icon is-favorite";
            star.setAttribute("data-fav", "molar-mass");
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

    describe("subscribe / unsubscribe", () => {
        it("calls the listener immediately with the current active view id", () => {
            manager.setActiveViewId("molar-mass");
            const calls: Array<string | null> = [];
            manager.subscribe((id: string | null): void => {
                calls.push(id);
            });
            expect(calls.length).toBe(1);
            expect(calls[0]).toBe("molar-mass");
        });

        it("calls the listener with null when no active view is set", () => {
            const calls: Array<string | null> = [];
            manager.subscribe((id: string | null): void => {
                calls.push(id);
            });
            expect(calls.length).toBe(1);
            expect(calls[0]).toBeNull();
        });

        it("notifies the listener when setActiveViewId is called after subscribe", () => {
            const calls: Array<string | null> = [];
            manager.subscribe((id: string | null): void => {
                calls.push(id);
            });
            manager.setActiveViewId("equation-balancer");
            expect(calls.length).toBe(2);
            expect(calls[1]).toBe("equation-balancer");
        });

        it("notifies the listener when setActiveViewId is set to null", () => {
            manager.setActiveViewId("molar-mass");
            const calls: Array<string | null> = [];
            manager.subscribe((id: string | null): void => {
                calls.push(id);
            });
            manager.setActiveViewId(null);
            expect(calls[calls.length - 1]).toBeNull();
        });

        it("does not notify after unsubscribe is called", () => {
            const calls: Array<string | null> = [];
            const listener = (id: string | null): void => {
                calls.push(id);
            };
            manager.subscribe(listener);
            manager.unsubscribe(listener);
            manager.setActiveViewId("equation-balancer");
            expect(calls.length).toBe(1);
        });

        it("does not add the same listener twice", () => {
            manager.setActiveViewId("molar-mass");
            const calls: Array<string | null> = [];
            const listener = (id: string | null): void => {
                calls.push(id);
            };
            manager.subscribe(listener);
            manager.subscribe(listener);
            expect(calls.length).toBe(1);
        });

        it("unsubscribe is a no-op for an unknown listener", () => {
            const listener = (id: string | null): void => {
                void id;
            };
            expect(() => manager.unsubscribe(listener)).not.toThrow();
        });

        it("notifies multiple listeners on setActiveViewId", () => {
            const callsA: Array<string | null> = [];
            const callsB: Array<string | null> = [];
            manager.subscribe((id: string | null): void => {
                callsA.push(id);
            });
            manager.subscribe((id: string | null): void => {
                callsB.push(id);
            });
            manager.setActiveViewId("equation-balancer");
            expect(callsA[callsA.length - 1]).toBe("equation-balancer");
            expect(callsB[callsB.length - 1]).toBe("equation-balancer");
        });

        it("keeps other listeners working after one unsubscribes", () => {
            const callsA: Array<string | null> = [];
            const callsB: Array<string | null> = [];
            const listenerA = (id: string | null): void => {
                callsA.push(id);
            };
            manager.subscribe(listenerA);
            manager.subscribe((id: string | null): void => {
                callsB.push(id);
            });
            manager.unsubscribe(listenerA);
            manager.setActiveViewId("equation-balancer");
            expect(callsA.length).toBe(1);
            expect(callsB[callsB.length - 1]).toBe("equation-balancer");
        });

        it("ignores a duplicate subscription", () => {
            const calls: Array<string | null> = [];
            const listener = (id: string | null): void => {
                calls.push(id);
            };
            manager.subscribe(listener);
            manager.subscribe(listener);
            manager.setActiveViewId("molar-mass");
            expect(calls).toEqual([null, "molar-mass"]);
        });
    });

    describe("history navigation without an active view", () => {
        it("goBack skips pushing when no view is active", () => {
            manager.setActiveViewId("a");
            manager.navigate("b");
            manager.setActiveViewId(null);
            expect(manager.goBack()).toBe("a");
            expect(manager.getForwardHistory()).toEqual([]);
        });

        it("goForward skips pushing when no view is active", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("a");
            manager.navigate("b");
            manager.setActiveViewId("b");
            manager.navigateBack();
            manager.setActiveViewId(null);
            expect(manager.goForward()).toBe("b");
            expect(strategy.navigateCalls).toContain("b");
        });
    });

    describe("favorites UI", () => {        it("renderFavorites does nothing without a container", () => {
            manager.toggleFavorite("molar-mass");
            expect(document.querySelector(".nav-favorites")).toBeNull();
        });

        it("renderFavorites clears the container with no favorites", () => {
            const container = document.createElement("div");
            container.className = "nav-favorites";
            container.innerHTML = "stale";
            document.body.appendChild(container);
            manager.renderFavorites();
            expect(container.innerHTML).toBe("");
        });

        it("renderFavorites skips unknown favorite ids", () => {
            const container = document.createElement("div");
            container.className = "nav-favorites";
            document.body.appendChild(container);
            manager.toggleFavorite("ghost-id");
            expect(container.querySelectorAll("a").length).toBe(0);
            expect(manager.isFavorite("ghost-id")).toBe(true);
        });

        it("renderFavorites links navigate on click", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            manager.setActiveViewId("other");
            const container = document.createElement("div");
            container.className = "nav-favorites";
            document.body.appendChild(container);
            manager.toggleFavorite("molar-mass");
            const link = container.querySelector("a") as HTMLAnchorElement;
            expect(link).not.toBeNull();
            link.click();
            expect(strategy.navigateCalls).toContain("molar-mass");
        });

        it("renderFavorites star click removes the favorite", () => {
            const strategy = new MockStrategy();
            manager.setStrategy(strategy);
            const container = document.createElement("div");
            container.className = "nav-favorites";
            document.body.appendChild(container);
            manager.toggleFavorite("molar-mass");
            expect(manager.isFavorite("molar-mass")).toBe(true);
            const star = container.querySelector(".fav-star") as HTMLElement;
            star.click();
            expect(manager.isFavorite("molar-mass")).toBe(false);
        });

        it("updateFavoriteStars skips icons without an id", () => {
            const icon = document.createElement("span");
            icon.className = "fav-star-icon";
            document.body.appendChild(icon);
            expect(() => manager.updateFavoriteStars()).not.toThrow();
            expect(icon.classList.contains("is-favorite")).toBe(false);
        });

        it("addFavoriteStarsToSidebar decorates links and toggles on click", () => {
            const nav = document.createElement("nav");
            nav.className = "sidebar-nav";
            nav.innerHTML = '<a href="/molar-mass">Molar</a><a>No href</a>';
            document.body.appendChild(nav);
            manager.addFavoriteStarsToSidebar();
            const star = nav.querySelector(".fav-star-icon") as HTMLElement;
            expect(star).not.toBeNull();
            expect(star.getAttribute("data-fav")).toBe("molar-mass");
            star.click();
            expect(manager.isFavorite("molar-mass")).toBe(true);
            manager.addFavoriteStarsToSidebar();
            expect(nav.querySelectorAll(".fav-star-icon").length).toBe(1);
        });

        it("sidebar stars toggle on Enter and Space but ignore other keys", () => {
            const nav = document.createElement("nav");
            nav.className = "sidebar-nav";
            nav.innerHTML = '<a href="/molar-mass">Molar</a>';
            document.body.appendChild(nav);
            manager.addFavoriteStarsToSidebar();
            const star = nav.querySelector(".fav-star-icon") as HTMLElement;
            star.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
            expect(manager.isFavorite("molar-mass")).toBe(false);
            star.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            expect(manager.isFavorite("molar-mass")).toBe(true);
            star.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
            expect(manager.isFavorite("molar-mass")).toBe(false);
        });
    });
});
