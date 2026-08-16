import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OnboardingManager } from "./onboardingManager.js";

describe("OnboardingManager", () => {
    beforeEach(() => {
        OnboardingManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
    });

    afterEach(() => {
        OnboardingManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns the same singleton instance from getInstance", () => {
        expect(OnboardingManager.getInstance()).toBe(OnboardingManager.getInstance());
    });

    it("creates a new instance after resetInstance", () => {
        const first = OnboardingManager.getInstance();
        OnboardingManager.resetInstance();
        const second = OnboardingManager.getInstance();
        expect(first).not.toBe(second);
    });

    describe("isFirstRun", () => {
        it("returns true when onboarding-complete is not in localStorage", () => {
            expect(OnboardingManager.getInstance().isFirstRun()).toBe(true);
        });

        it("returns false when onboarding-complete is set in localStorage", () => {
            localStorage.setItem("onboarding-complete", "true");
            expect(OnboardingManager.getInstance().isFirstRun()).toBe(false);
        });

        it("returns true when localStorage.getItem throws", () => {
            const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new Error("unavailable");
            });
            expect(OnboardingManager.getInstance().isFirstRun()).toBe(true);
            spy.mockRestore();
        });
    });

    describe("completeTour", () => {
        it("sets onboarding-complete to 'true' in localStorage", () => {
            OnboardingManager.getInstance().completeTour();
            expect(localStorage.getItem("onboarding-complete")).toBe("true");
        });

        it("does not throw when localStorage.setItem throws", () => {
            const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new Error("unavailable");
            });
            expect(() => OnboardingManager.getInstance().completeTour()).not.toThrow();
            spy.mockRestore();
        });

        it("removes any existing overlay", () => {
            const manager = OnboardingManager.getInstance();
            // Manually create an overlay by starting a tour first
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            manager.startTour();
            expect(document.querySelector(".onboarding-overlay")).not.toBeNull();
            manager.completeTour();
            expect(document.querySelector(".onboarding-overlay")).toBeNull();
        });

        it("removes onboarding-highlight class from elements", () => {
            const manager = OnboardingManager.getInstance();
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar onboarding-highlight";
            document.body.appendChild(sidebar);
            manager.completeTour();
            expect(sidebar.classList.contains("onboarding-highlight")).toBe(false);
        });
    });

    describe("showTooltip", () => {
        it("creates a tooltip element anchored to the target", () => {
            const target = document.createElement("button");
            target.getBoundingClientRect = vi.fn().mockReturnValue({
                bottom: 100,
                left: 50,
                top: 80,
                right: 100,
                width: 50,
                height: 20,
                x: 50,
                y: 80,
                toJSON: () => ({})
            });
            document.body.appendChild(target);
            OnboardingManager.getInstance().showTooltip(target, "Click me!");
            const tooltip = document.querySelector(".onboarding-tooltip") as HTMLElement;
            expect(tooltip).not.toBeNull();
            expect(tooltip.getAttribute("role")).toBe("tooltip");
            expect(tooltip.textContent).toContain("Click me!");
        });

        it("positions the tooltip below the target element", () => {
            const target = document.createElement("button");
            target.getBoundingClientRect = vi.fn().mockReturnValue({
                bottom: 200,
                left: 30,
                top: 180,
                right: 80,
                width: 50,
                height: 20,
                x: 30,
                y: 180,
                toJSON: () => ({})
            });
            document.body.appendChild(target);
            OnboardingManager.getInstance().showTooltip(target, "Hi");
            const tooltip = document.querySelector(".onboarding-tooltip") as HTMLElement;
            // bottom (200) + scrollY (0) + 8 = 208
            expect(tooltip.style.top).toBe("208px");
            expect(tooltip.style.left).toBe("30px");
        });

        it("removes any existing tooltip before creating a new one", () => {
            const target1 = document.createElement("button");
            target1.getBoundingClientRect = vi.fn().mockReturnValue({
                bottom: 0, left: 0, top: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
            });
            document.body.appendChild(target1);
            OnboardingManager.getInstance().showTooltip(target1, "First");
            const target2 = document.createElement("button");
            target2.getBoundingClientRect = vi.fn().mockReturnValue({
                bottom: 0, left: 0, top: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
            });
            document.body.appendChild(target2);
            OnboardingManager.getInstance().showTooltip(target2, "Second");
            const tooltips = document.querySelectorAll(".onboarding-tooltip");
            expect(tooltips.length).toBe(1);
            expect(tooltips[0].textContent).toContain("Second");
        });

        it("creates a dismiss button that removes the tooltip on click", () => {
            const target = document.createElement("button");
            target.getBoundingClientRect = vi.fn().mockReturnValue({
                bottom: 0, left: 0, top: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
            });
            document.body.appendChild(target);
            OnboardingManager.getInstance().showTooltip(target, "Test");
            const dismissBtn = document.querySelector(".onboarding-tooltip-dismiss") as HTMLElement;
            expect(dismissBtn).not.toBeNull();
            dismissBtn.click();
            expect(document.querySelector(".onboarding-tooltip")).toBeNull();
        });
    });

    describe("startTour", () => {
        it("creates an overlay when the first step target exists", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            expect(document.querySelector(".onboarding-overlay")).not.toBeNull();
            expect(document.querySelector(".onboarding-step-tooltip")).not.toBeNull();
        });

        it("shows the step indicator with 1 / total", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            const indicator = document.querySelector(".onboarding-step-indicator");
            expect(indicator).not.toBeNull();
            expect(indicator!.textContent).toContain("1");
            expect(indicator!.textContent).toContain("/");
        });

        it("shows a Next button on the first step", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
            expect(nextBtn).not.toBeNull();
            expect(nextBtn.textContent).toBe("Next");
        });

        it("does not show a Back button on the first step", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            const prevBtn = document.querySelector(".onboarding-prev");
            expect(prevBtn).toBeNull();
        });

        it("shows a Skip tour button", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            const skipBtn = document.querySelector(".onboarding-skip") as HTMLElement;
            expect(skipBtn).not.toBeNull();
            expect(skipBtn.textContent).toContain("Skip");
        });

        it("highlights the target element with onboarding-highlight class", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            expect(sidebar.classList.contains("onboarding-highlight")).toBe(true);
        });

        it("advances to the next step when Next is clicked", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            const search = document.createElement("div");
            search.className = "sidebar-search";
            search.dataset.tour = "sidebar-search";
            const searchInput = document.createElement("input");
            search.appendChild(searchInput);
            document.body.appendChild(sidebar);
            document.body.appendChild(search);
            OnboardingManager.getInstance().startTour();
            // Click next to go to step 2
            const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
            nextBtn.click();
            // Sidebar should no longer be highlighted, search should be
            expect(sidebar.classList.contains("onboarding-highlight")).toBe(false);
            // The search element's input is the target, but highlight is on the .sidebar-search
            // Wait — the step selector is ".sidebar-search input", so highlight is on the input
            expect(searchInput.classList.contains("onboarding-highlight")).toBe(true);
        });

        it("shows a Done button on the last step", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            const search = document.createElement("div");
            search.className = "sidebar-search";
            search.dataset.tour = "sidebar-search";
            const searchInput = document.createElement("input");
            search.appendChild(searchInput);
            const themeToggle = document.createElement("button");
            themeToggle.id = "theme-toggle";
            // Step 4 selector is ".sidebar-nav a" — needs an <a> inside .sidebar-nav
            const navContainer = document.createElement("div");
            navContainer.className = "sidebar-nav";
            navContainer.dataset.tour = "sidebar-nav";
            const navLink = document.createElement("a");
            navLink.href = "#";
            navContainer.appendChild(navLink);
            document.body.appendChild(sidebar);
            document.body.appendChild(search);
            document.body.appendChild(themeToggle);
            document.body.appendChild(navContainer);

            OnboardingManager.getInstance().startTour();
            // Click through all 4 steps
            for (let i = 0; i < 3; i++) {
                const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
                nextBtn.click();
            }
            const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
            expect(nextBtn.textContent).toBe("Done");
        });

        it("completes the tour when Done is clicked", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            const search = document.createElement("div");
            search.className = "sidebar-search";
            search.dataset.tour = "sidebar-search";
            const searchInput = document.createElement("input");
            search.appendChild(searchInput);
            const themeToggle = document.createElement("button");
            themeToggle.id = "theme-toggle";
            const navContainer = document.createElement("div");
            navContainer.className = "sidebar-nav";
            navContainer.dataset.tour = "sidebar-nav";
            const navLink = document.createElement("a");
            navLink.href = "#";
            navContainer.appendChild(navLink);
            document.body.appendChild(sidebar);
            document.body.appendChild(search);
            document.body.appendChild(themeToggle);
            document.body.appendChild(navContainer);

            OnboardingManager.getInstance().startTour();
            for (let i = 0; i < 3; i++) {
                const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
                nextBtn.click();
            }
            const doneBtn = document.querySelector(".onboarding-next") as HTMLElement;
            doneBtn.click();
            expect(localStorage.getItem("onboarding-complete")).toBe("true");
            expect(document.querySelector(".onboarding-overlay")).toBeNull();
        });

        it("completes the tour when Skip tour is clicked", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            document.body.appendChild(sidebar);
            OnboardingManager.getInstance().startTour();
            const skipBtn = document.querySelector(".onboarding-skip") as HTMLElement;
            skipBtn.click();
            expect(localStorage.getItem("onboarding-complete")).toBe("true");
            expect(document.querySelector(".onboarding-overlay")).toBeNull();
        });

        it("shows a Back button on step 2 onwards", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            const search = document.createElement("div");
            search.className = "sidebar-search";
            search.dataset.tour = "sidebar-search";
            const searchInput = document.createElement("input");
            search.appendChild(searchInput);
            document.body.appendChild(sidebar);
            document.body.appendChild(search);
            OnboardingManager.getInstance().startTour();
            const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
            nextBtn.click();
            const prevBtn = document.querySelector(".onboarding-prev") as HTMLElement;
            expect(prevBtn).not.toBeNull();
        });

        it("goes back to the previous step when Back is clicked", () => {
            const sidebar = document.createElement("div");
            sidebar.className = "sidebar";
            sidebar.dataset.tour = "sidebar";
            const search = document.createElement("div");
            search.className = "sidebar-search";
            search.dataset.tour = "sidebar-search";
            const searchInput = document.createElement("input");
            search.appendChild(searchInput);
            document.body.appendChild(sidebar);
            document.body.appendChild(search);
            OnboardingManager.getInstance().startTour();
            // Go to step 2
            const nextBtn = document.querySelector(".onboarding-next") as HTMLElement;
            nextBtn.click();
            expect(searchInput.classList.contains("onboarding-highlight")).toBe(true);
            // Go back to step 1
            const prevBtn = document.querySelector(".onboarding-prev") as HTMLElement;
            prevBtn.click();
            expect(sidebar.classList.contains("onboarding-highlight")).toBe(true);
            expect(searchInput.classList.contains("onboarding-highlight")).toBe(false);
        });

        it("skips missing step targets and advances to the next available", () => {
            // Only the theme-toggle exists; sidebar/search/nav-link are missing
            const themeToggle = document.createElement("button");
            themeToggle.id = "theme-toggle";
            document.body.appendChild(themeToggle);
            OnboardingManager.getInstance().startTour();
            // Steps 1 and 2 are skipped because their targets don't exist
            // Step 3 targets #theme-toggle which exists
            const indicator = document.querySelector(".onboarding-step-indicator");
            expect(indicator).not.toBeNull();
            expect(themeToggle.classList.contains("onboarding-highlight")).toBe(true);
        });

        it("completes the tour when no step targets exist", () => {
            OnboardingManager.getInstance().startTour();
            expect(localStorage.getItem("onboarding-complete")).toBe("true");
            expect(document.querySelector(".onboarding-overlay")).toBeNull();
        });
    });
});
