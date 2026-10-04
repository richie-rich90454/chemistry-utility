import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import gsap from "gsap";
import { AppNavigationStrategy } from "./appNavigationStrategy.js";
import { NavigationManager } from "./navigationManager.js";
import { UrlStateManager } from "./urlStateManager.js";
import { InputPersistence } from "./inputPersistence.js";
import { ExportManager } from "./exportManager.js";
import { IdealGasLawCalculator } from "./gasLawCalculators.js";

function setupAppDOM(): void {
    document.body.innerHTML = [
        '<div class="app-view">',
        '<div class="welcome-screen"></div>',
        '<div class="view-header"><span class="view-title"></span><span class="view-category"></span></div>',
        '<div class="calculator-view"></div>',
        '<section id="view-a" class="main-groups card view-active"></section>',
        '<section id="molar-mass" class="main-groups card view-hidden"></section>',
        '<section id="gas-laws" class="main-groups card view-hidden"></section>',
        "</div>",
        '<nav class="sidebar-nav"><a href="/molar-mass">Molar</a><a href="/gas-laws">Gas</a></nav>',
        '<div class="tab-item" data-target="molar-mass"></div>',
        '<div class="bottom-tabs"><div class="tab-item" data-target="molar-mass"></div></div>',
        '<div class="tab-indicator"></div>',
        '<div class="nav-sheet"><div class="sheet-item" data-target="molar-mass"></div></div>',
        '<div class="nav-recent"></div>',
    ].join("");
}

describe("AppNavigationStrategy", () => {
    let strategy: AppNavigationStrategy;
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
        NavigationManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        originalMatchMedia = window.matchMedia;
        setupAppDOM();
        strategy = new AppNavigationStrategy();
        NavigationManager.getInstance().setActiveViewId("view-a");
        vi.spyOn(UrlStateManager.prototype, "restoreState").mockReturnValue(null);
        vi.spyOn(UrlStateManager.prototype, "fillInputs").mockImplementation(() => {});
        vi.spyOn(InputPersistence.prototype, "restore").mockReturnValue(null);
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
        NavigationManager.resetInstance();
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("returns early when the target is already active", () => {
        const pushSpy = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
        strategy.navigate("view-a");
        expect(pushSpy).not.toHaveBeenCalled();
        void pushSpy;
    });

    it("navigates forward with animation and updates state", () => {
        strategy.navigate("molar-mass");
        const target = document.getElementById("molar-mass")!;
        expect(target.classList.contains("view-active")).toBe(true);
        expect(document.querySelector(".welcome-screen")!.getAttribute("style")).toContain("none");
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("molar-mass");
        expect(window.history.pushState).toHaveBeenCalledWith(null, "", "/molar-mass");
        const activeLink = document.querySelector('.sidebar-nav a[href="/molar-mass"]')!;
        expect(activeLink.classList.contains("active")).toBe(true);
        expect(document.querySelector(".view-title")!.textContent).toBe("Molar Mass");
    });

    it("navigates back when the target is in history", () => {
        const manager = NavigationManager.getInstance();
        manager.navigate("molar-mass");
        manager.setStrategy(strategy);
        strategy.navigate("molar-mass");
        manager.navigate("view-a");
        strategy.navigate("view-a");
        expect(document.getElementById("view-a")!.classList.contains("view-active")).toBe(true);
        void manager;
    });

    it("hides sections without animation when there is no outgoing view", () => {
        document.querySelector(".app-view .main-groups.card.view-active")!.classList.remove("view-active");
        strategy.navigate("molar-mass");
        expect(document.getElementById("molar-mass")!.classList.contains("view-active")).toBe(true);
    });

    it("skips animation under reduced motion", () => {
        window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
        const toSpy = vi.mocked(gsap.to);
        const fromToSpy = vi.mocked(gsap.fromTo);
        toSpy.mockClear();
        fromToSpy.mockClear();
        strategy.navigate("molar-mass");
        expect(toSpy).not.toHaveBeenCalled();
        expect(fromToSpy).not.toHaveBeenCalled();
        expect(document.getElementById("molar-mass")!.classList.contains("view-active")).toBe(true);
    });

    it("runs the outgoing onComplete cleanup", () => {
        vi.mocked(gsap.to).mockImplementationOnce((_target: unknown, vars: { onComplete?: () => void }) => {
            vars.onComplete?.();
            return {} as never;
        });
        strategy.navigate("molar-mass");
        const outgoing = document.getElementById("view-a")!;
        expect(outgoing.classList.contains("view-hidden")).toBe(true);
        expect(outgoing.classList.contains("view-active")).toBe(false);
    });

    it("handles a missing welcome screen and missing target", () => {
        document.querySelector(".welcome-screen")!.remove();
        strategy.navigate("no-such-view");
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("no-such-view");
        expect(document.querySelector(".view-header")!.getAttribute("style")).toContain("none");
    });

    it("hides the view header when there is no header element", () => {
        document.querySelector(".view-header")!.remove();
        strategy.navigate("molar-mass");
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("molar-mass");
    });

    it("applies gas-law defaults when navigating to gas-laws", () => {
        const spy = vi.spyOn(IdealGasLawCalculator, "applyDefaults").mockImplementation(() => {});
        strategy.navigate("gas-laws");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("prefers URL state over persisted inputs", () => {
        const urlValues = { a: "1" };
        vi.mocked(UrlStateManager.prototype.restoreState).mockReturnValue(urlValues);
        const fillSpy = vi.mocked(UrlStateManager.prototype.fillInputs);
        const persistSpy = vi.mocked(InputPersistence.prototype.restore);
        strategy.navigate("molar-mass");
        expect(fillSpy).toHaveBeenCalledWith("molar-mass", urlValues);
        expect(persistSpy).not.toHaveBeenCalled();
    });

    it("falls back to persisted inputs when URL state is absent", () => {
        const saved = { a: "2" };
        vi.mocked(InputPersistence.prototype.restore).mockReturnValue(saved);
        strategy.navigate("molar-mass");
        expect(UrlStateManager.prototype.fillInputs).toHaveBeenCalledWith("molar-mass", saved);
    });

    it("creates export buttons once and updates them afterwards", () => {
        strategy.navigate("molar-mass");
        expect(document.querySelector(".view-header .export-actions")).not.toBeNull();
        strategy.navigate("gas-laws");
        const shareBtn = document.querySelector(".view-header .share-button")!;
        expect(shareBtn.getAttribute("data-target")).toBe("gas-laws");
    });

    it("wires share and export buttons", () => {
        const shareSpy = vi.spyOn(ExportManager.prototype, "shareViaUrl").mockImplementation(() => {});
        const csvSpy = vi.spyOn(ExportManager.prototype, "exportCsv").mockImplementation(() => {});
        strategy.navigate("molar-mass");
        (document.querySelector(".view-header .share-button") as HTMLButtonElement).click();
        expect(shareSpy).toHaveBeenCalledWith("molar-mass");
        (document.querySelectorAll(".view-header .export-actions .icon-button")[1] as HTMLButtonElement).click();
        expect(csvSpy).toHaveBeenCalledTimes(1);
    });

    it("marks tabs and sheet items and positions the indicator", () => {
        strategy.navigate("molar-mass");
        const tab = document.querySelector('.tab-item[data-target="molar-mass"]')!;
        expect(tab.classList.contains("active")).toBe(true);
        expect(tab.getAttribute("aria-selected")).toBe("true");
        expect(document.querySelector('.sheet-item[data-target="molar-mass"]')!.classList.contains("active")).toBe(true);
        expect((document.querySelector(".tab-indicator") as HTMLElement).style.width).not.toBe("0");
    });

    it("collapses the indicator when chrome is missing", () => {
        document.querySelector(".tab-indicator")!.remove();
        document.querySelector(".bottom-tabs")!.remove();
        strategy.navigate("molar-mass");
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("molar-mass");
    });

    it("collapses the indicator for the more target", () => {
        strategy.navigate("more");
        expect((document.querySelector(".tab-indicator") as HTMLElement).style.width).toBe("0px");
    });

    it("tracks recent calculators in localStorage", () => {
        strategy.navigate("molar-mass");
        strategy.navigate("gas-laws");
        const stored = JSON.parse(localStorage.getItem("chem-utility-recent")!);
        expect(stored[0]).toBe("gas-laws");
        expect(document.querySelector(".nav-recent")!.innerHTML).toContain("Recent");
    });

    it("resets corrupt recent storage", () => {
        localStorage.setItem("chem-utility-recent", "{broken");
        strategy.navigate("molar-mass");
        expect(JSON.parse(localStorage.getItem("chem-utility-recent")!)).toEqual(["molar-mass"]);
    });

    it("handles non-array recent storage", () => {
        localStorage.setItem("chem-utility-recent", JSON.stringify({ a: 1 }));
        strategy.navigate("molar-mass");
        expect(JSON.parse(localStorage.getItem("chem-utility-recent")!)).toEqual(["molar-mass"]);
    });

    it("tolerates localStorage write failures", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });
        strategy.navigate("molar-mass");
        expect(document.querySelector(".nav-recent")!.innerHTML).toBe("");
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("molar-mass");
    });

    it("skips rendering recents without a container", () => {
        document.querySelector(".nav-recent")!.remove();
        strategy.navigate("molar-mass");
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("molar-mass");
    });

    it("clears recents when the list is empty", () => {
        strategy.navigate("molar-mass");
        localStorage.setItem("chem-utility-recent", JSON.stringify(["molar-mass"]));
        document.querySelector(".nav-recent")!.innerHTML = "stale";
        localStorage.clear();
        NavigationManager.getInstance().setActiveViewId("view-a");
        strategy.navigate("gas-laws");
        expect(document.querySelector(".nav-recent")!.innerHTML).toContain("Recent");
    });

    it("handles header without title or category elements", () => {
        document.querySelector(".view-title")!.remove();
        document.querySelector(".view-category")!.remove();
        document.querySelector(".calculator-view")!.remove();
        strategy.navigate("molar-mass");
        expect((document.querySelector(".view-header") as HTMLElement).style.display).toBe("flex");
    });

    it("updates existing export actions without a share button", () => {
        const header = document.querySelector(".view-header")!;
        const actions = document.createElement("div");
        actions.className = "export-actions";
        header.appendChild(actions);
        strategy.navigate("molar-mass");
        expect(header.querySelector(".export-actions")).not.toBeNull();
    });

    it("matches sidebar links with relative and hash hrefs", () => {
        const nav = document.querySelector(".sidebar-nav")!;
        nav.insertAdjacentHTML("beforeend", '<a href="molar-mass">Plain</a><a href="#gas-laws">Hash</a><a>No href</a>');
        strategy.navigate("gas-laws");
        expect(document.querySelector('.sidebar-nav a[href="#gas-laws"]')!.classList.contains("active")).toBe(true);
        expect(document.querySelector('.sidebar-nav a[href="molar-mass"]')!.classList.contains("active")).toBe(false);
    });

    it("handles corrupt storage during recent rendering", () => {
        const getSpy = vi.spyOn(Storage.prototype, "getItem");
        getSpy.mockReturnValueOnce(null);
        getSpy.mockReturnValueOnce("{broken");
        strategy.navigate("molar-mass");
        expect(document.querySelector(".nav-recent")!.innerHTML).toBe("");
    });

    it("handles non-array storage during recent rendering", () => {
        const getSpy = vi.spyOn(Storage.prototype, "getItem");
        getSpy.mockReturnValueOnce(null);
        getSpy.mockReturnValueOnce(JSON.stringify({ a: 1 }));
        strategy.navigate("molar-mass");
        expect(document.querySelector(".nav-recent")!.innerHTML).toBe("");
    });

    it("filters non-string ids when rendering recents", () => {
        localStorage.setItem("chem-utility-recent", JSON.stringify(["molar-mass", 42]));
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("full");
        });
        strategy.navigate("gas-laws");
        expect(document.querySelector(".nav-recent")!.innerHTML).toContain("Molar Mass");
    });

    it("ignores unknown recent ids and follows recent links", () => {
        localStorage.setItem("chem-utility-recent", JSON.stringify(["nope", 42, "molar-mass"]));
        NavigationManager.getInstance().setActiveViewId("view-a");
        NavigationManager.getInstance().setStrategy(strategy);
        strategy.navigate("gas-laws");
        const links = document.querySelectorAll(".nav-recent a");
        expect(links.length).toBe(2);
        (links[1] as HTMLAnchorElement).click();
        expect(NavigationManager.getInstance().getActiveViewId()).toBe("molar-mass");
    });
});
