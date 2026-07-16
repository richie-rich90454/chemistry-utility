import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGet = vi.fn();
const mockNavigate = vi.fn();

vi.mock("./apiClient.js", function () {
    return {
        ApiClient: {
            getInstance: function () {
                return {
                    get: mockGet
                };
            }
        },
        ApiError: function (this: { status: number; type: string; detail: string; name: string; message: string }, status: number, type: string, detail: string) {
            this.status = status;
            this.type = type;
            this.detail = detail;
            this.name = "ApiError";
            this.message = detail;
        }
    };
});

vi.mock("./navigationManager.js", function () {
    return {
        NavigationManager: {
            getInstance: function () {
                return {
                    navigate: mockNavigate
                };
            }
        }
    };
});

import { CompoundSearchUI, CompoundResult, CompoundDetail } from "./compoundSearchUI.js";
import { ApiError } from "./apiClient.js";

function setupSection(): HTMLElement {
    let section: HTMLElement = document.createElement("div");
    section.id = "compound-search";
    section.innerHTML =
        '<label for="compound-search-type">Search by</label>' +
        '<select id="compound-search-type" class="compound-search-type" aria-label="Select compound search type">' +
        '<option value="name">Name</option>' +
        '<option value="formula">Molecular Formula</option>' +
        '<option value="cas">CAS Number</option>' +
        '<option value="smiles">SMILES</option>' +
        '</select>' +
        '<label for="compound-search-input">Search query</label>' +
        '<input type="text" id="compound-search-input" class="compound-search-input" placeholder="water" aria-label="Compound search query">' +
        '<button id="compound-search-button" class="compound-search-button primary-button" type="button">Search Compounds</button>' +
        '<div class="compound-search-loading" role="status" style="display:none">Searching compounds...</div>' +
        '<div class="compound-search-error" role="alert" style="display:none"></div>' +
        '<div class="compound-search-results"></div>' +
        '<div class="compound-search-detail" style="display:none"></div>';
    document.body.appendChild(section);
    return section;
}

function makeCompound(overrides?: Partial<CompoundResult>): CompoundResult {
    let base: CompoundResult = {
        "id": "c1",
        "name": "Water",
        "formula": "H2O",
        "molarMass": 18.015,
        "casNumber": "7732-18-5",
        "smiles": "O"
    };
    if (overrides) {
        let keys: string[] = Object.keys(overrides);
        let i: number;
        for (i = 0; i < keys.length; i++) {
            let key: string = keys[i];
            (base as unknown as Record<string, unknown>)[key] = (overrides as unknown as Record<string, unknown>)[key];
        }
    }
    return base;
}

describe("CompoundSearchUI", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        CompoundSearchUI.resetInstance();
        mockGet.mockReset();
        mockNavigate.mockReset();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        localStorage.clear();
        CompoundSearchUI.resetInstance();
        vi.restoreAllMocks();
    });

    describe("getInstance (singleton pattern)", function () {
        it("should return same instance on subsequent calls", function () {
            let a: CompoundSearchUI = CompoundSearchUI.getInstance();
            let b: CompoundSearchUI = CompoundSearchUI.getInstance();
            expect(a).toBe(b);
        });

        it("should return a new instance after resetInstance", function () {
            let a: CompoundSearchUI = CompoundSearchUI.getInstance();
            CompoundSearchUI.resetInstance();
            let b: CompoundSearchUI = CompoundSearchUI.getInstance();
            expect(a).not.toBe(b);
        });
    });

    describe("init", function () {
        it("should attach to existing compound-search section", function () {
            setupSection();
            let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
            ui.init();
            let button: HTMLElement | null = document.querySelector(".compound-search-button");
            expect(button).not.toBeNull();
        });

        it("should not throw when section is missing", function () {
            let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
            ui.init();
            expect(true).toBe(true);
        });

        it("should not re-initialize on second call", function () {
            setupSection();
            let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
            ui.init();
            ui.init();
            expect(true).toBe(true);
        });
    });

    describe("search query construction", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should construct search URL with encoded query and type", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "water & co" });
            await ui.search("water & co", "name");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds/search?q=water%20%26%20co&type=name");
        });

        it("should pass type parameter as provided", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "H2O" });
            await ui.search("H2O", "formula");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds/search?q=H2O&type=formula");
        });

        it("should support CAS type", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "7732-18-5" });
            await ui.search("7732-18-5", "cas");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds/search?q=7732-18-5&type=cas");
        });

        it("should support SMILES type", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "O" });
            await ui.search("O", "smiles");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds/search?q=O&type=smiles");
        });

        it("should call renderResults with compounds from response", async function () {
            let compound: CompoundResult = makeCompound();
            mockGet.mockResolvedValue({ "compounds": [compound], "query": "water" });
            await ui.search("water", "name");
            let cards: NodeListOf<HTMLElement> = document.querySelectorAll(".compound-result-card");
            expect(cards.length).toBe(1);
        });

        it("should not fetch when already loading", async function () {
            let resolveFirst: (val: { compounds: CompoundResult[]; query: string }) => void = function (): void { return; };
            mockGet.mockImplementation(function () {
                return new Promise(function (resolve: (val: { compounds: CompoundResult[]; query: string }) => void): void {
                    resolveFirst = resolve;
                });
            });
            let p1: Promise<void> = ui.search("water", "name");
            let p2: Promise<void> = ui.search("water", "name");
            resolveFirst({ "compounds": [] as CompoundResult[], "query": "water" });
            await p1;
            await p2;
            let searchCalls: number = mockGet.mock.calls.filter(function (call: unknown[]): boolean {
                return typeof call[0] === "string" && (call[0] as string).indexOf("/api/v1/compounds/search") === 0;
            }).length;
            expect(searchCalls).toBe(1);
        });
    });

    describe("renderResults", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should render empty state when no compounds returned", function () {
            ui.renderResults([]);
            let empty: HTMLElement | null = document.querySelector(".compound-search-empty");
            expect(empty).not.toBeNull();
            if (empty) {
                expect(empty.textContent).toContain("No compounds");
            }
        });

        it("should render one card per compound", function () {
            let c1: CompoundResult = makeCompound();
            let c2: CompoundResult = makeCompound({ "id": "c2", "name": "Methane", "formula": "CH4", "molarMass": 16.04, "casNumber": "74-82-8", "smiles": "C" });
            ui.renderResults([c1, c2]);
            let cards: NodeListOf<HTMLElement> = document.querySelectorAll(".compound-result-card");
            expect(cards.length).toBe(2);
        });

        it("should render compound name as heading", function () {
            ui.renderResults([makeCompound()]);
            let nameEl: HTMLElement | null = document.querySelector(".compound-result-name");
            expect(nameEl).not.toBeNull();
            if (nameEl) {
                expect(nameEl.textContent).toBe("Water");
            }
        });

        it("should render formula with digits as subscripts", function () {
            ui.renderResults([makeCompound({ "formula": "H2SO4" })]);
            let subs: NodeListOf<HTMLElement> = document.querySelectorAll(".compound-result-card sub");
            expect(subs.length).toBe(2);
            expect(subs[0].textContent).toBe("2");
            expect(subs[1].textContent).toBe("4");
        });

        it("should render molar mass and CAS fields", function () {
            ui.renderResults([makeCompound()]);
            let card: HTMLElement | null = document.querySelector(".compound-result-card");
            expect(card).not.toBeNull();
            if (card) {
                expect(card.textContent).toContain("18.015");
                expect(card.textContent).toContain("7732-18-5");
            }
        });

        it("should render View Details, Molar Mass, and Stoichiometry buttons", function () {
            ui.renderResults([makeCompound()]);
            let card: HTMLElement | null = document.querySelector(".compound-result-card");
            expect(card).not.toBeNull();
            if (card) {
                expect(card.querySelectorAll(".compound-view-details").length).toBe(1);
                expect(card.querySelectorAll(".compound-open-molar-mass").length).toBe(1);
                expect(card.querySelectorAll(".compound-open-stoichiometry").length).toBe(1);
            }
        });

        it("should attach data-compound-id to card", function () {
            ui.renderResults([makeCompound({ "id": "abc-123" })]);
            let card: HTMLElement | null = document.querySelector(".compound-result-card");
            expect(card).not.toBeNull();
            if (card) {
                expect(card.getAttribute("data-compound-id")).toBe("abc-123");
            }
        });

        it("should clear previous results before rendering new ones", function () {
            ui.renderResults([makeCompound()]);
            ui.renderResults([makeCompound({ "id": "c2", "name": "Methane" })]);
            let cards: NodeListOf<HTMLElement> = document.querySelectorAll(".compound-result-card");
            expect(cards.length).toBe(1);
        });
    });

    describe("search error handling", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should display error message on ApiError", async function () {
            let apiError: ApiError = new ApiError(500, "about:blank", "Server error");
            mockGet.mockRejectedValue(apiError);
            await ui.search("water", "name");
            let errorEl: HTMLElement | null = document.querySelector(".compound-search-error");
            expect(errorEl).not.toBeNull();
            if (errorEl) {
                expect(errorEl.style.display).toBe("block");
                expect(errorEl.textContent).toContain("Server error");
            }
        });

        it("should display error message on generic Error", async function () {
            mockGet.mockRejectedValue(new Error("Network failure"));
            await ui.search("water", "name");
            let errorEl: HTMLElement | null = document.querySelector(".compound-search-error");
            expect(errorEl).not.toBeNull();
            if (errorEl) {
                expect(errorEl.style.display).toBe("block");
                expect(errorEl.textContent).toContain("Network failure");
            }
        });

        it("should hide loading indicator after error", async function () {
            mockGet.mockRejectedValue(new Error("fail"));
            await ui.search("water", "name");
            let loading: HTMLElement | null = document.querySelector(".compound-search-loading");
            expect(loading).not.toBeNull();
            if (loading) {
                expect(loading.style.display).toBe("none");
            }
        });

        it("should hide loading indicator after success", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "water" });
            await ui.search("water", "name");
            let loading: HTMLElement | null = document.querySelector(".compound-search-loading");
            expect(loading).not.toBeNull();
            if (loading) {
                expect(loading.style.display).toBe("none");
            }
        });

        it("should clear error message on next search", async function () {
            mockGet.mockRejectedValueOnce(new Error("first failure"));
            await ui.search("water", "name");
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "water" });
            await ui.search("water", "name");
            let errorEl: HTMLElement | null = document.querySelector(".compound-search-error");
            expect(errorEl).not.toBeNull();
            if (errorEl) {
                expect(errorEl.style.display).toBe("none");
            }
        });
    });

    describe("empty results", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should render empty state when compounds array is empty", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "xyz" });
            await ui.search("xyz", "name");
            let empty: HTMLElement | null = document.querySelector(".compound-search-empty");
            expect(empty).not.toBeNull();
            if (empty) {
                expect(empty.textContent).toContain("No compounds");
            }
        });

        it("should not render any result cards in empty state", async function () {
            mockGet.mockResolvedValue({ "compounds": [] as CompoundResult[], "query": "xyz" });
            await ui.search("xyz", "name");
            let cards: NodeListOf<HTMLElement> = document.querySelectorAll(".compound-result-card");
            expect(cards.length).toBe(0);
        });
    });

    describe("showCompoundDetail", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should fetch compound detail by id", async function () {
            let detail: CompoundDetail = makeCompound() as CompoundDetail;
            detail.inchi = "InChI=1S/H2O/h1H2";
            detail.properties = { "density": "1.0 g/cm3" };
            detail.source = "pubchem";
            mockGet.mockResolvedValue(detail);
            await ui.showCompoundDetail("c1");
            expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds/c1");
        });

        it("should render detail card with name and properties", async function () {
            let detail: CompoundDetail = makeCompound() as CompoundDetail;
            detail.inchi = "InChI=1S/H2O/h1H2";
            detail.properties = { "density": "1.0 g/cm3", "boiling point": "100 C" };
            detail.source = "pubchem";
            mockGet.mockResolvedValue(detail);
            await ui.showCompoundDetail("c1");
            let detailCard: HTMLElement | null = document.querySelector(".compound-detail-card");
            expect(detailCard).not.toBeNull();
            if (detailCard) {
                expect(detailCard.textContent).toContain("Water");
                expect(detailCard.textContent).toContain("InChI");
                expect(detailCard.textContent).toContain("density");
                expect(detailCard.textContent).toContain("1.0 g/cm3");
                expect(detailCard.textContent).toContain("boiling point");
                expect(detailCard.textContent).toContain("pubchem");
            }
        });

        it("should display detail container on success", async function () {
            let detail: CompoundDetail = makeCompound() as CompoundDetail;
            detail.inchi = "";
            detail.properties = {};
            detail.source = "";
            mockGet.mockResolvedValue(detail);
            await ui.showCompoundDetail("c1");
            let detailContainer: HTMLElement | null = document.querySelector(".compound-search-detail");
            expect(detailContainer).not.toBeNull();
            if (detailContainer) {
                expect(detailContainer.style.display).toBe("block");
            }
        });

        it("should render close button that hides detail on click", async function () {
            let detail: CompoundDetail = makeCompound() as CompoundDetail;
            detail.inchi = "";
            detail.properties = {};
            detail.source = "";
            mockGet.mockResolvedValue(detail);
            await ui.showCompoundDetail("c1");
            let closeBtn: HTMLElement | null = document.querySelector(".compound-detail-close");
            expect(closeBtn).not.toBeNull();
            if (closeBtn) {
                closeBtn.click();
                let detailContainer: HTMLElement | null = document.querySelector(".compound-search-detail");
                expect(detailContainer).not.toBeNull();
                if (detailContainer) {
                    expect(detailContainer.style.display).toBe("none");
                }
            }
        });

        it("should render detail error on ApiError", async function () {
            let apiError: ApiError = new ApiError(404, "about:blank", "compound not found");
            mockGet.mockRejectedValue(apiError);
            await ui.showCompoundDetail("missing");
            let errorEl: HTMLElement | null = document.querySelector(".compound-detail-error");
            expect(errorEl).not.toBeNull();
            if (errorEl) {
                expect(errorEl.textContent).toContain("compound not found");
            }
        });
    });

    describe("calculator integration", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should navigate to molar mass calculator", function () {
            ui.openInMolarMassCalculator("H2O");
            expect(mockNavigate).toHaveBeenCalledWith("mass-calc");
        });

        it("should pre-fill molar mass formula input", function () {
            let input: HTMLInputElement = document.createElement("input");
            input.id = "formula-input";
            input.type = "text";
            document.body.appendChild(input);
            ui.openInMolarMassCalculator("H2O");
            expect(input.value).toBe("H2O");
        });

        it("should navigate to stoichiometry calculator", function () {
            ui.openInStoichiometryCalculator("H2O");
            expect(mockNavigate).toHaveBeenCalledWith("stoichiometry");
        });

        it("should pre-fill stoichiometry equation input", function () {
            let input: HTMLInputElement = document.createElement("input");
            input.id = "stoich-equation-input";
            input.type = "text";
            document.body.appendChild(input);
            ui.openInStoichiometryCalculator("H2O");
            expect(input.value).toBe("H2O");
        });

        it("should not throw when target input is missing", function () {
            expect(function (): void {
                ui.openInMolarMassCalculator("H2O");
            }).not.toThrow();
        });
    });

    describe("View Details button", function () {
        let ui: CompoundSearchUI;

        beforeEach(function () {
            setupSection();
            ui = CompoundSearchUI.getInstance();
            ui.init();
        });

        it("should trigger showCompoundDetail when clicked", async function () {
            let detail: CompoundDetail = makeCompound() as CompoundDetail;
            detail.inchi = "";
            detail.properties = {};
            detail.source = "";
            mockGet.mockResolvedValue(detail);
            ui.renderResults([makeCompound({ "id": "detail-id" })]);
            let viewButton: HTMLElement | null = document.querySelector(".compound-view-details");
            expect(viewButton).not.toBeNull();
            if (viewButton) {
                viewButton.click();
                await vi.waitFor(function (): void {
                    expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds/detail-id");
                });
            }
        });
    });
});
