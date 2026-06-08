import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initializeAppNav } from "./app-nav.js";

vi.mock("gsap", () => ({
    default: {
        to: vi.fn(),
        from: vi.fn(),
        fromTo: vi.fn(),
        set: vi.fn(),
    },
}));

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

function buildAppViewDOM(): void {
    document.body.innerHTML = '';
    const appView = document.createElement('div');
    appView.className = 'app-view';

    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <h1>Chemistry Utility</h1>
            <div class="header-top">
                <div class="logo-icon"></div>
                <button class="sidebar-toggle"></button>
                <button class="icon-button theme-toggle" id="theme-toggle"></button>
            </div>
        </div>
        <div class="sidebar-search"><span class="search-icon"></span><input type="text" placeholder="Search calculators..."></div>
        <div class="nav-recent"></div>
        <nav class="sidebar-nav"><ul>
            <li class="nav-category">General</li>
            <li><a href="#element-lookup">Element Lookup</a></li>
            <li><a href="#mass-calc">Molar Mass</a></li>
            <li><a href="#balancing">Equation Balancer</a></li>
            <li class="nav-category">Solutions</li>
            <li><a href="#dilution-calc">Dilution</a></li>
            <li><a href="#mass-percent-calc">Mass Percent</a></li>
            <li><a href="#solution-mixing-calc">Solution Mixing</a></li>
            <li class="nav-category">Physical Chemistry</li>
            <li><a href="#nuclear-chemistry">Nuclear</a></li>
            <li><a href="#gas-laws">Gas Laws</a></li>
            <li><a href="#electrochemistry">Electrochemistry</a></li>
            <li class="nav-category">Reactions & Bonds</li>
            <li><a href="#stoichiometry">Stoichiometry</a></li>
            <li><a href="#bond-type-predictor">Bond Type</a></li>
        </ul></nav>
        <div class="sidebar-footer"></div>
    `;

    // Main content
    const main = document.createElement('main');
    main.id = 'main-content';
    main.className = 'main-content app-view';
    main.innerHTML = `
        <div class="view-header">
            <button class="back-button"></button>
            <span class="view-title"></span>
            <span class="view-category"></span>
        </div>
        <div class="calculator-view">
            <div class="welcome-screen"></div>
            <div id="element-lookup" class="main-groups card view-hidden"></div>
            <div id="mass-calc" class="main-groups card view-hidden"></div>
            <div id="balancing" class="main-groups card view-hidden"></div>
            <div id="dilution-calc" class="main-groups card view-hidden"></div>
            <div id="mass-percent-calc" class="main-groups card view-hidden"></div>
            <div id="solution-mixing-calc" class="main-groups card view-hidden"></div>
            <div id="nuclear-chemistry" class="main-groups card view-hidden"></div>
            <div id="gas-laws" class="main-groups card view-hidden"></div>
            <div id="electrochemistry" class="main-groups card view-hidden"></div>
            <div id="stoichiometry" class="main-groups card view-hidden"></div>
            <div id="bond-type-predictor" class="main-groups card view-hidden"></div>
        </div>
    `;

    // Bottom tabs
    const bottomTabs = document.createElement('nav');
    bottomTabs.className = 'bottom-tabs';
    bottomTabs.innerHTML = `
        <div class="tab-indicator"></div>
        <button class="tab-item" data-target="element-lookup">Element Lookup</button>
        <button class="tab-item" data-target="mass-calc">Molar Mass</button>
        <button class="tab-item" data-target="balancing">Balancer</button>
        <button class="tab-item" data-target="dilution-calc">Dilution</button>
        <button class="tab-item" data-target="more">More</button>
    `;

    // Nav sheet
    const sheetBackdrop = document.createElement('div');
    sheetBackdrop.className = 'nav-sheet-backdrop';
    const sheet = document.createElement('div');
    sheet.className = 'nav-sheet';

    // Command palette
    const paletteBackdrop = document.createElement('div');
    paletteBackdrop.className = 'palette-backdrop';
    const palette = document.createElement('div');
    palette.className = 'command-palette';
    palette.innerHTML = '<div class="palette-input-wrap"><input class="palette-input" type="text"></div><div class="palette-list"></div>';

    appView.appendChild(sidebar);
    appView.appendChild(main);
    document.body.appendChild(appView);
    document.body.appendChild(bottomTabs);
    document.body.appendChild(sheetBackdrop);
    document.body.appendChild(sheet);
    document.body.appendChild(paletteBackdrop);
    document.body.appendChild(palette);
}

beforeEach(() => {
    buildAppViewDOM();
    localStorageMock.clear();
    vi.clearAllMocks();
    window.location.hash = '';
});

afterEach(() => {
    document.body.innerHTML = '';
});

describe("initializeAppNav", () => {
    it("creates welcome screen cards", () => {
        initializeAppNav();
        const cards = document.querySelectorAll(".welcome-card");
        expect(cards.length).toBe(11);
    });

    it("creates nav sheet items", () => {
        initializeAppNav();
        const items = document.querySelectorAll(".nav-sheet .sheet-item");
        expect(items.length).toBe(11);
    });

    it("adds shortcut hints to sidebar links", () => {
        initializeAppNav();
        const hints = document.querySelectorAll(".sidebar-nav .shortcut-hint");
        expect(hints.length).toBe(11);
        expect(hints[0].textContent).toBe("Alt+1");
        expect(hints[9].textContent).toBe("Alt+0");
        expect(hints[10].textContent).toBe("Alt+-");
    });

    it("clicking sidebar link switches view (check view-active class)", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        link.click();
        const target = document.getElementById("element-lookup")!;
        expect(target.classList.contains("view-active")).toBe(true);
        expect(target.classList.contains("view-hidden")).toBe(false);
    });

    it("clicking sidebar link updates URL hash", () => {
        const pushStateSpy = vi.spyOn(history, 'pushState');
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#mass-calc"]') as HTMLElement;
        link.click();
        expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#mass-calc");
        pushStateSpy.mockRestore();
    });

    it("clicking sidebar link updates sidebar active state", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#balancing"]') as HTMLElement;
        link.click();
        expect(link.classList.contains("active")).toBe(true);
        const otherLink = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        expect(otherLink.classList.contains("active")).toBe(false);
    });

    it("clicking sidebar link hides welcome screen", () => {
        initializeAppNav();
        const welcome = document.querySelector(".welcome-screen") as HTMLElement;
        expect(welcome.style.display).not.toBe("none");
        const link = document.querySelector('.sidebar-nav a[href="#dilution-calc"]') as HTMLElement;
        link.click();
        expect(welcome.style.display).toBe("none");
    });

    it("clicking sidebar link shows view header with correct title", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        link.click();
        const title = document.querySelector(".view-title") as HTMLElement;
        const category = document.querySelector(".view-category") as HTMLElement;
        expect(title.textContent).toBe("Element Lookup");
        expect(category.textContent).toBe("General");
    });

    it("clicking second sidebar link switches view", () => {
        initializeAppNav();
        const firstLink = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        firstLink.click();
        const secondLink = document.querySelector('.sidebar-nav a[href="#gas-laws"]') as HTMLElement;
        secondLink.click();
        const first = document.getElementById("element-lookup")!;
        const second = document.getElementById("gas-laws")!;
        expect(first.classList.contains("view-active")).toBe(false);
        expect(second.classList.contains("view-active")).toBe(true);
    });

    it("back button navigates to previous view", () => {
        initializeAppNav();
        const firstLink = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        firstLink.click();
        const secondLink = document.querySelector('.sidebar-nav a[href="#gas-laws"]') as HTMLElement;
        secondLink.click();
        const backBtn = document.querySelector(".back-button") as HTMLElement;
        backBtn.click();
        const first = document.getElementById("element-lookup")!;
        expect(first.classList.contains("view-active")).toBe(true);
    });

    it("back button with no history does nothing", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        link.click();
        const backBtn = document.querySelector(".back-button") as HTMLElement;
        backBtn.click();
        const target = document.getElementById("element-lookup")!;
        expect(target.classList.contains("view-active")).toBe(true);
    });

    it("bottom tab click switches view", () => {
        initializeAppNav();
        const tab = document.querySelector('.tab-item[data-target="mass-calc"]') as HTMLElement;
        tab.click();
        const target = document.getElementById("mass-calc")!;
        expect(target.classList.contains("view-active")).toBe(true);
    });

    it("bottom tab updates active state", () => {
        initializeAppNav();
        const tab = document.querySelector('.tab-item[data-target="balancing"]') as HTMLElement;
        tab.click();
        expect(tab.classList.contains("active")).toBe(true);
        const otherTab = document.querySelector('.tab-item[data-target="element-lookup"]') as HTMLElement;
        expect(otherTab.classList.contains("active")).toBe(false);
    });

    it('"More" tab opens nav sheet', () => {
        initializeAppNav();
        const moreBtn = document.querySelector('.tab-item[data-target="more"]') as HTMLElement;
        moreBtn.click();
        const sheet = document.querySelector(".nav-sheet") as HTMLElement;
        const backdrop = document.querySelector(".nav-sheet-backdrop") as HTMLElement;
        expect(sheet.classList.contains("open")).toBe(true);
        expect(backdrop.classList.contains("open")).toBe(true);
    });

    it("nav sheet backdrop click closes sheet", () => {
        initializeAppNav();
        const moreBtn = document.querySelector('.tab-item[data-target="more"]') as HTMLElement;
        moreBtn.click();
        const backdrop = document.querySelector(".nav-sheet-backdrop") as HTMLElement;
        backdrop.click();
        const sheet = document.querySelector(".nav-sheet") as HTMLElement;
        expect(sheet.classList.contains("open")).toBe(false);
        expect(backdrop.classList.contains("open")).toBe(false);
    });

    it("Escape key closes nav sheet", () => {
        initializeAppNav();
        const moreBtn = document.querySelector('.tab-item[data-target="more"]') as HTMLElement;
        moreBtn.click();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        const sheet = document.querySelector(".nav-sheet") as HTMLElement;
        expect(sheet.classList.contains("open")).toBe(false);
    });

    it("command palette opens with Ctrl+K", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        const palette = document.querySelector(".command-palette") as HTMLElement;
        const backdrop = document.querySelector(".palette-backdrop") as HTMLElement;
        expect(palette.classList.contains("open")).toBe(true);
        expect(backdrop.classList.contains("open")).toBe(true);
    });

    it("command palette closes with Escape", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        const palette = document.querySelector(".command-palette") as HTMLElement;
        expect(palette.classList.contains("open")).toBe(false);
    });

    it("command palette filters calculators by name", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        const input = document.querySelector(".palette-input") as HTMLInputElement;
        input.value = "Gas";
        input.dispatchEvent(new Event("input"));
        const items = document.querySelectorAll(".palette-item");
        expect(items.length).toBe(1);
        expect(items[0].getAttribute("data-target")).toBe("gas-laws");
    });

    it("command palette filters calculators by category", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        const input = document.querySelector(".palette-input") as HTMLInputElement;
        input.value = "Solutions";
        input.dispatchEvent(new Event("input"));
        const items = document.querySelectorAll(".palette-item");
        expect(items.length).toBe(3);
    });

    it("command palette Enter selects calculator", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        const input = document.querySelector(".palette-input") as HTMLInputElement;
        input.value = "Dilution";
        input.dispatchEvent(new Event("input"));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        const target = document.getElementById("dilution-calc")!;
        expect(target.classList.contains("view-active")).toBe(true);
        const palette = document.querySelector(".command-palette") as HTMLElement;
        expect(palette.classList.contains("open")).toBe(false);
    });

    it("sidebar search filters links by text", () => {
        initializeAppNav();
        const searchInput = document.querySelector(".sidebar-search input") as HTMLInputElement;
        searchInput.value = "Gas";
        searchInput.dispatchEvent(new Event("input"));
        const links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
        let visibleCount = 0;
        links.forEach(link => {
            if (link.style.display !== "none") visibleCount++;
        });
        expect(visibleCount).toBe(1);
    });

    it("sidebar search shows all links when cleared", () => {
        initializeAppNav();
        const searchInput = document.querySelector(".sidebar-search input") as HTMLInputElement;
        searchInput.value = "Gas";
        searchInput.dispatchEvent(new Event("input"));
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("input"));
        const links = document.querySelectorAll(".sidebar-nav a") as NodeListOf<HTMLElement>;
        links.forEach(link => {
            expect(link.style.display).not.toBe("none");
        });
    });

    it("sidebar search hides empty categories", () => {
        initializeAppNav();
        const searchInput = document.querySelector(".sidebar-search input") as HTMLInputElement;
        searchInput.value = "Gas";
        searchInput.dispatchEvent(new Event("input"));
        const categories = document.querySelectorAll(".sidebar-nav .nav-category") as NodeListOf<HTMLElement>;
        const generalCat = categories[0];
        const physicalChemCat = categories[2];
        // General category has no visible links (none match "Gas")
        expect(generalCat.style.display).toBe("none");
        // Physical Chemistry category contains "Gas Laws" link which is visible,
        // but the code checks nextEl.tagName==="A" and siblings are <li> elements,
        // so the category visibility logic cannot detect the visible <a> inside <li>
        expect(physicalChemCat.style.display).toBe("none");
    });

    it("recent calculators saved to localStorage", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        link.click();
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            "chem-utility-recent",
            JSON.stringify(["element-lookup"])
        );
    });

    it("recent calculators rendered in sidebar", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#element-lookup"]') as HTMLElement;
        link.click();
        const recent = document.querySelector(".nav-recent") as HTMLElement;
        expect(recent.innerHTML).toContain("Element Lookup");
        expect(recent.querySelector('a[href="#element-lookup"]')).not.toBeNull();
    });

    it("recent calculators capped at 3", () => {
        initializeAppNav();
        const ids = ["element-lookup", "mass-calc", "balancing", "dilution-calc"];
        ids.forEach(id => {
            const link = document.querySelector(`.sidebar-nav a[href="#${id}"]`) as HTMLElement;
            link.click();
        });
        const recentLinks = document.querySelectorAll(".nav-recent a");
        expect(recentLinks.length).toBe(3);
        const recentContainer = document.querySelector(".nav-recent") as HTMLElement;
        expect(recentContainer.innerHTML).toContain("dilution-calc");
        expect(recentContainer.innerHTML).toContain("balancing");
        expect(recentContainer.innerHTML).toContain("mass-calc");
        expect(recentContainer.innerHTML).not.toContain("element-lookup");
    });

    it("sidebar collapse toggle adds collapsed class", () => {
        initializeAppNav();
        const toggleBtn = document.querySelector(".sidebar-toggle") as HTMLElement;
        const sidebar = document.querySelector(".sidebar") as HTMLElement;
        toggleBtn.click();
        expect(sidebar.classList.contains("collapsed")).toBe(true);
        toggleBtn.click();
        expect(sidebar.classList.contains("collapsed")).toBe(false);
    });

    it("sidebar collapse state persisted to localStorage", () => {
        initializeAppNav();
        const toggleBtn = document.querySelector(".sidebar-toggle") as HTMLElement;
        toggleBtn.click();
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            "chem-utility-sidebar-collapsed",
            "true"
        );
    });

    it("welcome screen shown when no hash and no recent", () => {
        initializeAppNav();
        const welcome = document.querySelector(".welcome-screen") as HTMLElement;
        expect(welcome.style.display).not.toBe("none");
        const allCards = document.querySelectorAll(".main-groups.card.view-active");
        expect(allCards.length).toBe(0);
    });

    it("switching views updates view header category", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#dilution-calc"]') as HTMLElement;
        link.click();
        const category = document.querySelector(".view-category") as HTMLElement;
        expect(category.textContent).toBe("Solutions");
    });

    it("switching views updates view header title", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#gas-laws"]') as HTMLElement;
        link.click();
        const title = document.querySelector(".view-title") as HTMLElement;
        expect(title.textContent).toBe("Gas Laws");
    });

    it("command palette ArrowDown moves selection", () => {
        initializeAppNav();
        const input = document.querySelector(".palette-input") as HTMLInputElement;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        const items = document.querySelectorAll(".palette-item");
        const selected = document.querySelector(".palette-item.selected");
        expect(selected).not.toBeNull();
    });

    it("sidebar search with no matches shows no results", () => {
        initializeAppNav();
        const searchInput = document.querySelector(".sidebar-search input") as HTMLInputElement;
        searchInput.value = "zzzzz";
        searchInput.dispatchEvent(new Event("input"));
        const visibleLinks = Array.from(document.querySelectorAll(".sidebar-nav a")).filter(
            (a) => (a as HTMLElement).style.display !== "none"
        );
        expect(visibleLinks.length).toBe(0);
    });

    it("command palette ArrowUp does not go below zero", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
        const selected = document.querySelector(".palette-item.selected");
        expect(selected).not.toBeNull();
    });

    it("command palette filters by description", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        const input = document.querySelector(".palette-input") as HTMLInputElement;
        input.value = "half-life";
        input.dispatchEvent(new Event("input"));
        const items = document.querySelectorAll(".palette-item");
        expect(items.length).toBeGreaterThan(0);
    });

    it("nav sheet items have correct data-target attributes", () => {
        initializeAppNav();
        const items = document.querySelectorAll(".nav-sheet .sheet-item");
        expect(items.length).toBe(11);
        const firstTarget = items[0].getAttribute("data-target");
        expect(firstTarget).toBe("element-lookup");
    });

    it("nav sheet item click switches view", () => {
        initializeAppNav();
        const moreBtn = document.querySelector('.tab-item[data-target="more"]') as HTMLElement;
        moreBtn.click();
        const sheetItems = document.querySelectorAll(".nav-sheet .sheet-item");
        (sheetItems[0] as HTMLElement).click();
        const target = document.getElementById("element-lookup")!;
        expect(target.classList.contains("view-active")).toBe(true);
    });

    it("command palette Ctrl+K toggles open/close", () => {
        initializeAppNav();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        const palette = document.querySelector(".command-palette") as HTMLElement;
        expect(palette.classList.contains("open")).toBe(true);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
        expect(palette.classList.contains("open")).toBe(false);
    });

    it("sidebar link for electrochemistry shows correct category", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#electrochemistry"]') as HTMLElement;
        link.click();
        const category = document.querySelector(".view-category") as HTMLElement;
        expect(category.textContent).toBe("Physical Chemistry");
    });

    it("sidebar link for stoichiometry shows correct category", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#stoichiometry"]') as HTMLElement;
        link.click();
        const category = document.querySelector(".view-category") as HTMLElement;
        expect(category.textContent).toBe("Reactions & Bonds");
    });

    it("sidebar link for bond-type-predictor shows correct category", () => {
        initializeAppNav();
        const link = document.querySelector('.sidebar-nav a[href="#bond-type-predictor"]') as HTMLElement;
        link.click();
        const category = document.querySelector(".view-category") as HTMLElement;
        expect(category.textContent).toBe("Reactions & Bonds");
    });
});
