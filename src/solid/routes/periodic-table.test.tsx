import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {PeriodicTable} from "./periodic-table";
import {ChemicalElement} from "../../types.js";
import styles from "./periodic-table.module.css";
const TEST_ELEMENTS: ChemicalElement[] = [
    {atomicNumber: 1, symbol: "H", name: "Hydrogen", atomicMass: 1.008, type: "non-metal", period: 1, group: 1, electronegativity: 2.20, electronAffinity: 72.8, atomicRadius: 53, ionizationEnergy: 1312, valenceElectrons: 1, totalElectrons: 1},
    {atomicNumber: 2, symbol: "He", name: "Helium", atomicMass: 4.003, type: "noble gas", period: 1, group: 18, electronegativity: null, electronAffinity: 0, atomicRadius: 31, ionizationEnergy: 2372, valenceElectrons: 2, totalElectrons: 2},
    {atomicNumber: 3, symbol: "Li", name: "Lithium", atomicMass: 6.94, type: "alkali metal", period: 2, group: 1, electronegativity: 0.98, electronAffinity: 59.6, atomicRadius: 167, ionizationEnergy: 520, valenceElectrons: 1, totalElectrons: 3},
    {atomicNumber: 4, symbol: "Be", name: "Beryllium", atomicMass: 9.012, type: "alkaline earth metal", period: 2, group: 2, electronegativity: 1.57, electronAffinity: 0, atomicRadius: 112, ionizationEnergy: 899, valenceElectrons: 2, totalElectrons: 4},
    {atomicNumber: 6, symbol: "C", name: "Carbon", atomicMass: 12.011, type: "non-metal", period: 2, group: 14, electronegativity: 2.55, electronAffinity: 121.8, atomicRadius: 77, ionizationEnergy: 1086, valenceElectrons: 4, totalElectrons: 6},
    {atomicNumber: 7, symbol: "N", name: "Nitrogen", atomicMass: 14.007, type: "non-metal", period: 2, group: 15, electronegativity: 3.04, electronAffinity: 7, atomicRadius: 75, ionizationEnergy: 1402, valenceElectrons: 5, totalElectrons: 7},
    {atomicNumber: 8, symbol: "O", name: "Oxygen", atomicMass: 15.999, type: "non-metal", period: 2, group: 16, electronegativity: 3.44, electronAffinity: 141.0, atomicRadius: 60, ionizationEnergy: 1314, valenceElectrons: 6, totalElectrons: 8},
    {atomicNumber: 17, symbol: "Cl", name: "Chlorine", atomicMass: 35.45, type: "halogen", period: 3, group: 17, electronegativity: 3.16, electronAffinity: 349.0, atomicRadius: 99, ionizationEnergy: 1251, valenceElectrons: 7, totalElectrons: 17}
];
describe("PeriodicTable", function (): void {
    let fetchSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        localStorage.clear();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: function () { return Promise.resolve(TEST_ELEMENTS); },
        } as Response);
    });
    afterEach(function (): void {
        fetchSpy.mockRestore();
    });
    it("renders without crashing", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(result.getByRole("grid")).toBeTruthy();
    });
    it("shows loading message before elements are fetched", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        expect(result.queryByText(/Loading elements/)).toBeTruthy();
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
    });
    it("renders all elements as tiles", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let hydrogenButton = result.getByLabelText("Hydrogen, atomic number 1");
        expect(hydrogenButton).toBeTruthy();
        let heliumButton = result.getByLabelText("Helium, atomic number 2");
        expect(heliumButton).toBeTruthy();
        let lithiumButton = result.getByLabelText("Lithium, atomic number 3");
        expect(lithiumButton).toBeTruthy();
        let chlorineButton = result.getByLabelText("Chlorine, atomic number 17");
        expect(chlorineButton).toBeTruthy();
    });
    it("renders element symbols and atomic numbers on tiles", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(result.getByText("H")).toBeTruthy();
        expect(result.getByText("He")).toBeTruthy();
        expect(result.getByText("Li")).toBeTruthy();
        expect(result.getByText("Cl")).toBeTruthy();
    });
    it("opens detail panel with element info on tile click", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let hydrogenButton = result.getByLabelText("Hydrogen, atomic number 1") as HTMLButtonElement;
        fireEvent.click(hydrogenButton);
        let detailPanel = await result.findByRole("dialog");
        expect(detailPanel).toBeTruthy();
        expect(result.container.textContent).toMatch(/Hydrogen/);
        expect(result.container.textContent).toMatch(/Atomic Number/);
        expect(result.container.textContent).toMatch(/1s1/);
        expect(result.container.textContent).toMatch(/Non-metal/);
        expect(result.container.textContent).toMatch(/Electron Configuration/);
    });
    it("shows oxidation states in detail panel", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let heliumButton = result.getByLabelText("Helium, atomic number 2") as HTMLButtonElement;
        fireEvent.click(heliumButton);
        let detailPanel = await result.findByRole("dialog");
        expect(detailPanel).toBeTruthy();
        expect(result.container.textContent).toMatch(/Common Oxidation States/);
        expect(result.container.textContent).toMatch(/0/);
    });
    it("closes detail panel on close button click", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let hydrogenButton = result.getByLabelText("Hydrogen, atomic number 1") as HTMLButtonElement;
        fireEvent.click(hydrogenButton);
        let closeButton = await result.findByLabelText("Close detail panel");
        expect(closeButton).toBeTruthy();
        fireEvent.click(closeButton);
        await waitFor(function (): void {
            expect(result.queryByLabelText("Close detail panel")).toBeNull();
        });
        expect(result.queryByRole("dialog")).toBeNull();
    });
    it("renders category legend with all categories", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let legend = result.getByRole("group", {name: "Filter elements by category"});
        expect(legend).toBeTruthy();
        expect(legend.textContent).toMatch(/Alkali metal/);
        expect(legend.textContent).toMatch(/Alkaline earth/);
        expect(legend.textContent).toMatch(/Transition metal/);
        expect(legend.textContent).toMatch(/Noble gas/);
        expect(legend.textContent).toMatch(/Halogen/);
        expect(legend.textContent).toMatch(/Lanthanide/);
        expect(legend.textContent).toMatch(/Actinide/);
    });
    it("dims non-matching tiles when category filter is active", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let nobleGasChip = result.getByText("Noble gas").closest("button") as HTMLButtonElement;
        let hydrogenButton = result.getByLabelText("Hydrogen, atomic number 1") as HTMLButtonElement;
        let heliumButton = result.getByLabelText("Helium, atomic number 2") as HTMLButtonElement;
        expect(hydrogenButton.classList.contains(styles.cellDimmed)).toBe(false);
        expect(heliumButton.classList.contains(styles.cellDimmed)).toBe(false);
        fireEvent.click(nobleGasChip);
        expect(heliumButton.classList.contains(styles.cellDimmed)).toBe(false);
        expect(hydrogenButton.classList.contains(styles.cellDimmed)).toBe(true);
        expect(nobleGasChip.getAttribute("aria-pressed")).toBe("true");
    });
    it("clears filter when active chip is clicked again", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let nobleGasChip = result.getByText("Noble gas").closest("button") as HTMLButtonElement;
        let hydrogenButton = result.getByLabelText("Hydrogen, atomic number 1") as HTMLButtonElement;
        fireEvent.click(nobleGasChip);
        expect(hydrogenButton.classList.contains(styles.cellDimmed)).toBe(true);
        expect(nobleGasChip.getAttribute("aria-pressed")).toBe("true");
        fireEvent.click(nobleGasChip);
        expect(hydrogenButton.classList.contains(styles.cellDimmed)).toBe(false);
        expect(nobleGasChip.getAttribute("aria-pressed")).toBe("false");
    });
    it("switches filter when a different chip is clicked", async function (): Promise<void> {
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let nobleGasChip = result.getByText("Noble gas").closest("button") as HTMLButtonElement;
        let alkaliMetalChip = result.getByText("Alkali metal").closest("button") as HTMLButtonElement;
        let hydrogenButton = result.getByLabelText("Hydrogen, atomic number 1") as HTMLButtonElement;
        let heliumButton = result.getByLabelText("Helium, atomic number 2") as HTMLButtonElement;
        let lithiumButton = result.getByLabelText("Lithium, atomic number 3") as HTMLButtonElement;
        fireEvent.click(nobleGasChip);
        expect(heliumButton.classList.contains(styles.cellDimmed)).toBe(false);
        expect(hydrogenButton.classList.contains(styles.cellDimmed)).toBe(true);
        expect(lithiumButton.classList.contains(styles.cellDimmed)).toBe(true);
        fireEvent.click(alkaliMetalChip);
        expect(lithiumButton.classList.contains(styles.cellDimmed)).toBe(false);
        expect(heliumButton.classList.contains(styles.cellDimmed)).toBe(true);
        expect(hydrogenButton.classList.contains(styles.cellDimmed)).toBe(true);
        expect(nobleGasChip.getAttribute("aria-pressed")).toBe("false");
        expect(alkaliMetalChip.getAttribute("aria-pressed")).toBe("true");
    });
    it("shows error message when fetch fails", async function (): Promise<void> {
        fetchSpy.mockRestore();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Error loading elements/);
        });
        expect(result.container.textContent).toMatch(/Network error/);
    });
    it("loads elements from cache without fetching when valid JSON is cached", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", JSON.stringify(TEST_ELEMENTS));
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(result.getByRole("grid")).toBeTruthy();
        expect(result.getByLabelText("Hydrogen, atomic number 1")).toBeTruthy();
        expect(fetchSpy).not.toHaveBeenCalled();
    });
    it("falls through to fetch when cached JSON is corrupt", async function (): Promise<void> {
        localStorage.setItem("chem-cache-ptable", "not valid json{{{");
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        expect(fetchSpy).toHaveBeenCalled();
        expect(result.getByLabelText("Hydrogen, atomic number 1")).toBeTruthy();
    });
    it("shows an error when the ptable response is not ok", async function (): Promise<void> {
        fetchSpy.mockRestore();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ok: false, status: 500} as Response);
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Error loading elements/);
        });
        expect(result.container.textContent).toMatch(/HTTP error! status: 500/);
    });
    it("shows a string rejection reason when fetch rejects with a non-Error", async function (): Promise<void> {
        fetchSpy.mockRestore();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue("cable-cut");
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.container.textContent).toMatch(/Error loading elements/);
        });
        expect(result.container.textContent).toMatch(/cable-cut/);
    });
    it("positions lanthanides/actinides, falls back for unknown types and missing groups", async function (): Promise<void> {
        let exotic: ChemicalElement[] = [
            {atomicNumber: 57, symbol: "La", name: "Lanthanum", atomicMass: 138.91, type: "lanthanide", period: 6, group: null, electronegativity: 1.1, electronAffinity: 48, atomicRadius: 195, ionizationEnergy: 538, valenceElectrons: 2, totalElectrons: 57},
            {atomicNumber: 89, symbol: "Ac", name: "Actinium", atomicMass: 227.03, type: "actinide", period: 7, group: null, electronegativity: 1.1, electronAffinity: 0, atomicRadius: 195, ionizationEnergy: 499, valenceElectrons: 2, totalElectrons: 89},
            {atomicNumber: 119, symbol: "Xx", name: "Mysterium", atomicMass: 300, type: "mystery", period: 8, group: 19, electronegativity: null, electronAffinity: null, atomicRadius: null, ionizationEnergy: null, valenceElectrons: 1, totalElectrons: 119}
        ];
        fetchSpy.mockRestore();
        fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: function () { return Promise.resolve(exotic); },
        } as Response);
        let result = render(function () { return <PeriodicTable />; });
        await waitFor(function (): void {
            expect(result.queryByText(/Loading elements/)).toBeNull();
        });
        let lanthanumButton = result.getByLabelText("Lanthanum, atomic number 57") as HTMLButtonElement;
        expect(lanthanumButton.style.gridRow).toBe("9");
        let actiniumButton = result.getByLabelText("Actinium, atomic number 89") as HTMLButtonElement;
        expect(actiniumButton.style.gridRow).toBe("10");
        let mysteryButton = result.getByLabelText("Mysterium, atomic number 119") as HTMLButtonElement;
        expect(mysteryButton.classList.contains(styles.catUnknown)).toBe(true);
        fireEvent.click(lanthanumButton);
        let detailPanel = await result.findByRole("dialog");
        expect(detailPanel).toBeTruthy();
        expect(result.container.textContent).toMatch(/n\/a/);
    });
});
