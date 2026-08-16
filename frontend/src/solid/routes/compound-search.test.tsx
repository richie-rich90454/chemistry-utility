import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
const mocks = vi.hoisted(function () {
    return {
        "mockSearchCompounds": vi.fn(),
        "mockFetchCompoundDetail": vi.fn()
    };
});
vi.mock("../../modules/compoundSearchUI.js", function () {
    return {
        "searchCompounds": mocks.mockSearchCompounds,
        "fetchCompoundDetail": mocks.mockFetchCompoundDetail,
        "buildFormulaSegments": function (formula: string): {"text": string; "isSubscript": boolean}[] {
            let segments: {"text": string; "isSubscript": boolean}[] = [];
            let buffer: string = "";
            let i: number;
            for (i = 0; i < formula.length; i++) {
                let ch: string = formula.charAt(i);
                if (ch >= "0" && ch <= "9") {
                    if (buffer.length > 0) {
                        segments.push({"text": buffer, "isSubscript": false});
                        buffer = "";
                    }
                    segments.push({"text": ch, "isSubscript": true});
                }
                else {
                    buffer = buffer + ch;
                }
            }
            if (buffer.length > 0) {
                segments.push({"text": buffer, "isSubscript": false});
            }
            return segments;
        }
    };
});
import {CompoundSearch} from "./compound-search";
function renderWithRouter(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return (
            <Router>
                <Route path="*" component={CompoundSearch} />
            </Router>
        );
    });
}
function makeCompound(overrides?: {"id"?: string; "name"?: string; "formula"?: string; "molarMass"?: number; "casNumber"?: string; "smiles"?: string}): {"id": string; "name": string; "formula": string; "molarMass": number; "casNumber": string; "smiles": string} {
    let base: {"id": string; "name": string; "formula": string; "molarMass": number; "casNumber": string; "smiles": string} = {
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
            let value: string | number | undefined = overrides[key as "id"];
            if (value !== undefined) {
                base[key as "id"] = value as never;
            }
        }
    }
    return base;
}
describe("CompoundSearch", function (): void {
    beforeEach(function (): void {
        mocks.mockSearchCompounds.mockReset();
        mocks.mockFetchCompoundDetail.mockReset();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("renders the card with search input, type select, and search button", function (): void {
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        expect(input).toBeTruthy();
        let typeSelect = result.getByLabelText("Select compound search type") as HTMLSelectElement;
        expect(typeSelect).toBeTruthy();
        let button = result.getByText("Search Compounds");
        expect(button).toBeTruthy();
    });
    it("shows error when Search is clicked with empty query", function (): void {
        let result = renderWithRouter();
        fireEvent.click(result.getByText("Search Compounds"));
        expect(result.getByText(/Please enter a search query/)).toBeTruthy();
    });
    it("calls searchCompounds and renders results when Search is clicked with a query", async function (): Promise<void> {
        let compound = makeCompound();
        mocks.mockSearchCompounds.mockResolvedValue([compound]);
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "water";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(mocks.mockSearchCompounds).toHaveBeenCalledWith("water", "name");
        });
        expect(result.getByText("Water")).toBeTruthy();
    });
    it("renders formula with subscript digits", async function (): Promise<void> {
        let compound = makeCompound({"formula": "H2SO4"});
        mocks.mockSearchCompounds.mockResolvedValue([compound]);
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "acid";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText("Water")).toBeTruthy();
        });
        let subs: NodeListOf<HTMLElement> = result.container.querySelectorAll("sub");
        expect(subs.length).toBe(2);
        expect(subs[0].textContent).toBe("2");
        expect(subs[1].textContent).toBe("4");
    });
    it("shows empty state when search returns no compounds", async function (): Promise<void> {
        mocks.mockSearchCompounds.mockResolvedValue([]);
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "xyz";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText(/No compounds found/)).toBeTruthy();
        });
    });
    it("handles search error and displays message", async function (): Promise<void> {
        mocks.mockSearchCompounds.mockRejectedValue(new Error("Network failure"));
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "water";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText(/Search failed: Network failure/)).toBeTruthy();
        });
    });
    it("calls fetchCompoundDetail when View Details is clicked and renders detail card", async function (): Promise<void> {
        let compound = makeCompound();
        mocks.mockSearchCompounds.mockResolvedValue([compound]);
        let detail: {"id": string; "name": string; "formula": string; "molarMass": number; "casNumber": string; "smiles": string; "inchi": string; "properties": Record<string, string>; "source": string} = {
            "id": "c1",
            "name": "Water",
            "formula": "H2O",
            "molarMass": 18.015,
            "casNumber": "7732-18-5",
            "smiles": "O",
            "inchi": "InChI=1S/H2O/h1H2",
            "properties": {"density": "1.0 g/cm3"},
            "source": "pubchem"
        };
        mocks.mockFetchCompoundDetail.mockResolvedValue(detail);
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "water";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText("View Details")).toBeTruthy();
        });
        fireEvent.click(result.getByText("View Details"));
        await waitFor(function (): void {
            expect(mocks.mockFetchCompoundDetail).toHaveBeenCalledWith("c1");
        });
        await waitFor(function (): void {
            expect(result.getByText("InChI:")).toBeTruthy();
        });
        expect(result.getByText("Properties")).toBeTruthy();
        expect(result.getByText("density:")).toBeTruthy();
    });
    it("closes detail card when Close button is clicked", async function (): Promise<void> {
        let compound = makeCompound();
        mocks.mockSearchCompounds.mockResolvedValue([compound]);
        let detail: {"id": string; "name": string; "formula": string; "molarMass": number; "casNumber": string; "smiles": string; "inchi": string; "properties": Record<string, string>; "source": string} = {
            "id": "c1",
            "name": "Water",
            "formula": "H2O",
            "molarMass": 18.015,
            "casNumber": "7732-18-5",
            "smiles": "O",
            "inchi": "",
            "properties": {},
            "source": ""
        };
        mocks.mockFetchCompoundDetail.mockResolvedValue(detail);
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "water";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText("View Details")).toBeTruthy();
        });
        fireEvent.click(result.getByText("View Details"));
        await waitFor(function (): void {
            expect(result.getByText("Close")).toBeTruthy();
        });
        fireEvent.click(result.getByText("Close"));
        await waitFor(function (): void {
            expect(result.queryByText("Close")).toBeNull();
        });
    });
    it("handles detail fetch error and displays message", async function (): Promise<void> {
        let compound = makeCompound();
        mocks.mockSearchCompounds.mockResolvedValue([compound]);
        mocks.mockFetchCompoundDetail.mockRejectedValue(new Error("not found"));
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "water";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText("View Details")).toBeTruthy();
        });
        fireEvent.click(result.getByText("View Details"));
        await waitFor(function (): void {
            expect(result.getByText(/Failed to load compound: not found/)).toBeTruthy();
        });
    });
    it("renders Open in Molar Mass and Open in Stoichiometry buttons for each result", async function (): Promise<void> {
        let compound = makeCompound();
        mocks.mockSearchCompounds.mockResolvedValue([compound]);
        let result = renderWithRouter();
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "water";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(result.getByText("Open in Molar Mass Calculator")).toBeTruthy();
        });
        expect(result.getByText("Open in Stoichiometry Calculator")).toBeTruthy();
    });
    it("updates search type when select is changed", async function (): Promise<void> {
        mocks.mockSearchCompounds.mockResolvedValue([]);
        let result = renderWithRouter();
        let typeSelect = result.getByLabelText("Select compound search type") as HTMLSelectElement;
        typeSelect.value = "formula";
        fireEvent.change(typeSelect);
        let input = result.getByLabelText("Compound search query") as HTMLInputElement;
        input.value = "H2O";
        fireEvent.input(input);
        fireEvent.click(result.getByText("Search Compounds"));
        await waitFor(function (): void {
            expect(mocks.mockSearchCompounds).toHaveBeenCalledWith("H2O", "formula");
        });
    });
});
