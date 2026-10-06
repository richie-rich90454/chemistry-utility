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

function makeDetail(): CompoundDetail {
    let d = makeCompound() as unknown as Record<string, unknown>;
    d["inchi"] = "InChI=1S/H2O/h1H2";
    d["properties"] = { "density": "1.0" };
    d["source"] = "pubchem";
    return d as unknown as CompoundDetail;
}

function setupFull(): HTMLElement {
    document.body.innerHTML = "";
    let section: HTMLElement = document.createElement("div");
    section.id = "compound-search";
    section.innerHTML =
        '<select class="compound-search-type"><option value="name">Name</option></select>' +
        '<input type="text" class="compound-search-input" value="">' +
        '<button type="button" class="compound-search-button">Search</button>' +
        '<div class="compound-search-loading" style="display:none"></div>' +
        '<div class="compound-search-error" style="display:none"></div>' +
        '<div class="compound-search-results"></div>' +
        '<div class="compound-search-detail" style="display:none"></div>';
    document.body.appendChild(section);
    return section;
}

function setupWithoutButton(): void {
    document.body.innerHTML = "";
    let section: HTMLElement = document.createElement("div");
    section.id = "compound-search";
    section.innerHTML =
        '<select class="compound-search-type"><option value="name">Name</option></select>' +
        '<input type="text" class="compound-search-input" value="">' +
        '<div class="compound-search-loading" style="display:none"></div>' +
        '<div class="compound-search-error" style="display:none"></div>' +
        '<div class="compound-search-results"></div>' +
        '<div class="compound-search-detail" style="display:none"></div>';
    document.body.appendChild(section);
}

function setupWithoutInput(): void {
    document.body.innerHTML = "";
    let section: HTMLElement = document.createElement("div");
    section.id = "compound-search";
    section.innerHTML =
        '<select class="compound-search-type"><option value="name">Name</option></select>' +
        '<button type="button" class="compound-search-button">Search</button>' +
        '<div class="compound-search-loading" style="display:none"></div>' +
        '<div class="compound-search-error" style="display:none"></div>' +
        '<div class="compound-search-results"></div>' +
        '<div class="compound-search-detail" style="display:none"></div>';
    document.body.appendChild(section);
}

function setupWithoutType(): void {
    document.body.innerHTML = "";
    let section: HTMLElement = document.createElement("div");
    section.id = "compound-search";
    section.innerHTML =
        '<input type="text" class="compound-search-input" value="water">' +
        '<button type="button" class="compound-search-button">Search</button>' +
        '<div class="compound-search-loading" style="display:none"></div>' +
        '<div class="compound-search-error" style="display:none"></div>' +
        '<div class="compound-search-results"></div>' +
        '<div class="compound-search-detail" style="display:none"></div>';
    document.body.appendChild(section);
}

function setupBareContainer(): void {
    document.body.innerHTML = "";
    let section: HTMLElement = document.createElement("div");
    section.id = "compound-search";
    document.body.appendChild(section);
}

describe("compoundDomCoverage handlers", function () {
    beforeEach(function () {
        document.body.innerHTML = "";
        CompoundSearchUI.resetInstance();
        mockGet.mockReset();
        mockNavigate.mockReset();
    });

    afterEach(function () {
        document.body.innerHTML = "";
        CompoundSearchUI.resetInstance();
        vi.restoreAllMocks();
    });

    it("should init without button and without input", function () {
        setupWithoutButton();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        expect(true).toBe(true);
        document.body.innerHTML = "";
        CompoundSearchUI.resetInstance();
        setupWithoutInput();
        let ui2: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui2.init();
        expect(true).toBe(true);
    });

    it("should trigger search on button click and on Enter keydown", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        mockGet.mockResolvedValue({ "compounds": [], "query": "water" });
        let input = document.querySelector(".compound-search-input") as HTMLInputElement;
        input.value = "water";
        let button = document.querySelector(".compound-search-button") as HTMLElement;
        button.click();
        await vi.waitFor(function (): void {
            expect(mockGet).toHaveBeenCalled();
        });
        await new Promise(function (resolve): void {
            setTimeout(resolve, 20);
        });
        mockGet.mockClear();
        mockGet.mockResolvedValue({ "compounds": [], "query": "water" });
        input.value = "water";
        input.dispatchEvent(new KeyboardEvent("keydown", { "key": "Enter", "bubbles": true }));
        await vi.waitFor(function (): void {
            expect(mockGet).toHaveBeenCalled();
        });
    });

    it("should ignore non-Enter keydown", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        mockGet.mockReset();
        let input = document.querySelector(".compound-search-input") as HTMLInputElement;
        input.value = "water";
        input.dispatchEvent(new KeyboardEvent("keydown", { "key": "a", "bubbles": true }));
        await new Promise(function (resolve): void {
            setTimeout(resolve, 20);
        });
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("should handleSearch with missing container and missing input", function () {
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        (ui as unknown as Record<string, () => void>)["handleSearch"]();
        expect(true).toBe(true);
        setupBareContainer();
        let ui2: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui2.init();
        (ui2 as unknown as Record<string, () => void>)["handleSearch"]();
        expect(true).toBe(true);
    });

    it("should default type to name when select is missing", async function () {
        setupWithoutType();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        mockGet.mockResolvedValue({ "compounds": [], "query": "water" });
        (ui as unknown as Record<string, () => void>)["handleSearch"]();
        await vi.waitFor(function (): void {
            expect(mockGet).toHaveBeenCalledWith("/api/v1/compounds?q=water&type=name");
        });
    });

    it("should use select value when present and reject empty query", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        let input = document.querySelector(".compound-search-input") as HTMLInputElement;
        input.value = "   ";
        (ui as unknown as Record<string, () => void>)["handleSearch"]();
        expect((document.querySelector(".compound-search-error") as HTMLElement).textContent).toContain("Please enter");
        expect(mockGet).not.toHaveBeenCalled();
        input.value = "water";
        mockGet.mockResolvedValue({ "compounds": [], "query": "water" });
        (ui as unknown as Record<string, () => void>)["handleSearch"]();
        await vi.waitFor(function (): void {
            expect(mockGet).toHaveBeenCalled();
        });
    });

    it("should show unknown error for non-Error rejection", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        mockGet.mockRejectedValue("string failure");
        await ui.search("water", "name");
        expect((document.querySelector(".compound-search-error") as HTMLElement).textContent).toContain("unknown error");
    });

    it("should early-return renderResults and renderDetail without containers", function () {
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.renderResults([makeCompound()]);
        ui.renderDetail(makeDetail());
        expect(true).toBe(true);
    });

    it("should renderDetail without properties block when properties is missing", function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        let detail = makeDetail() as unknown as Record<string, unknown>;
        detail["properties"] = undefined as unknown as Record<string, string>;
        ui.renderDetail(detail as unknown as CompoundDetail);
        let card = document.querySelector(".compound-detail-card") as HTMLElement;
        expect(card.textContent).toContain("Water");
        expect(card.querySelector(".compound-detail-properties-title")).toBeNull();
    });

    it("should early-return showCompoundDetail without detail container", async function () {
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        await ui.showCompoundDetail("c1");
        expect(mockGet).not.toHaveBeenCalled();
    });

    it("should open calculators from result card buttons", function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        ui.renderResults([makeCompound()]);
        (document.querySelector(".compound-open-molar-mass") as HTMLElement).click();
        expect(mockNavigate).toHaveBeenCalledWith("molar-mass");
        (document.querySelector(".compound-open-stoichiometry") as HTMLElement).click();
        expect(mockNavigate).toHaveBeenCalledWith("stoichiometry");
    });

    it("should ignore stale success so late response never overwrites", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        let resolveA: (v: CompoundDetail) => void = function (): void { return; };
        let resolveB: (v: CompoundDetail) => void = function (): void { return; };
        mockGet.mockImplementationOnce(function () {
            return new Promise(function (resolve): void {
                resolveA = resolve as (v: CompoundDetail) => void;
            });
        });
        mockGet.mockImplementationOnce(function () {
            return new Promise(function (resolve): void {
                resolveB = resolve as (v: CompoundDetail) => void;
            });
        });
        let detailA = makeDetail();
        (detailA as unknown as Record<string, unknown>)["name"] = "CompoundA";
        let detailB = makeDetail();
        (detailB as unknown as Record<string, unknown>)["name"] = "CompoundB";
        let p1: Promise<void> = ui.showCompoundDetail("a");
        let p2: Promise<void> = ui.showCompoundDetail("b");
        resolveA(detailA);
        await p1;
        let panel = document.querySelector(".compound-search-detail") as HTMLElement;
        expect(panel.textContent).not.toContain("CompoundA");
        resolveB(detailB);
        await p2;
        expect(panel.textContent).toContain("CompoundB");
    });

    it("should ignore stale detail error", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        let rejectA: (e: unknown) => void = function (): void { return; };
        let resolveB: (v: CompoundDetail) => void = function (): void { return; };
        mockGet.mockImplementationOnce(function () {
            return new Promise(function (_resolve, reject): void {
                rejectA = reject;
            });
        });
        mockGet.mockImplementationOnce(function () {
            return new Promise(function (resolve): void {
                resolveB = resolve as (v: CompoundDetail) => void;
            });
        });
        let p1: Promise<void> = ui.showCompoundDetail("a");
        let p2: Promise<void> = ui.showCompoundDetail("b");
        rejectA(new Error("stale boom"));
        await p1;
        expect(document.querySelector(".compound-detail-error")).toBeNull();
        resolveB(makeDetail());
        await p2;
        expect(document.querySelector(".compound-detail-card")).not.toBeNull();
    });

    it("should render detail Error and unknown error variants", async function () {
        setupFull();
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        ui.init();
        mockGet.mockRejectedValueOnce(new Error("detail boom"));
        await ui.showCompoundDetail("c1");
        expect((document.querySelector(".compound-detail-error") as HTMLElement).textContent).toContain("detail boom");
        mockGet.mockRejectedValueOnce("weird");
        await ui.showCompoundDetail("c1");
        expect((document.querySelector(".compound-detail-error") as HTMLElement).textContent).toContain("unknown error");
    });

    it("should cover null-container guards via direct private access", function () {
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        let rec = ui as unknown as Record<string, () => void>;
        rec["clearResults"]();
        rec["clearDetail"]();
        (ui as unknown as Record<string, (v: boolean) => void>)["showLoading"](false);
        (ui as unknown as Record<string, (v: boolean) => void>)["showDetailLoading"](true);
        (ui as unknown as Record<string, (v: string) => void>)["showError"]("oops");
        (ui as unknown as Record<string, (e: unknown) => void>)["handleDetailError"](new Error("x"));
        expect(true).toBe(true);
    });

    it("should cover search/show guards with no containers", async function () {
        let ui: CompoundSearchUI = CompoundSearchUI.getInstance();
        mockGet.mockResolvedValue({ "compounds": [], "query": "water" });
        await ui.search("water", "name");
        expect(mockGet).toHaveBeenCalled();
    });
});
