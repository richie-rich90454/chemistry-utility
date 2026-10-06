import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {Router, Route, useLocation} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {CommandPalette} from "./CommandPalette";
import {reset as resetPalette} from "../stores/palette";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";
function PathLabel(): JSX.Element {
    let location = useLocation();
    return <div data-testid="path-label">{location.pathname}</div>;
}
function Host(): JSX.Element {
    return (
        <>
            <PathLabel />
            <CommandPalette />
        </>
    );
}
function renderHost() {
    return render(function () {
        return (
            <Router>
                <Route path="*" component={Host} />
            </Router>
        );
    });
}
function dispatchCtrlK(): void {
    window.dispatchEvent(new KeyboardEvent("keydown", {key: "k", ctrlKey: true, bubbles: true}));
}
function dispatchCtrlShiftK(): void {
    window.dispatchEvent(new KeyboardEvent("keydown", {key: "K", ctrlKey: true, bubbles: true}));
}
describe("CommandPalette", function (): void {
    beforeEach(function (): void {
        resetPalette();
    });
    afterEach(function (): void {
        resetPalette();
        vi.restoreAllMocks();
    });
    it("is not visible initially", function (): void {
        let result = renderHost();
        expect(result.queryByRole("dialog", {name: "Calculator search"})).toBeNull();
    });
    it("opens on Ctrl+K and shows the search input", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        expect(result.getByRole("dialog", {name: "Calculator search"})).toBeTruthy();
        expect(result.getByPlaceholderText("Search calculators...")).toBeTruthy();
    });
    it("shows the full calculator list when opened with empty query", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.getByText("Element Lookup")).toBeTruthy();
    });
    it("filters calculators when typing molar so only Molar Mass remains", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "molar"}});
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.queryByText("Element Lookup")).toBeNull();
    });
    it("navigates to /molar-mass when Molar Mass item is clicked", async function (): Promise<void> {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "molar"}});
        let item = result.getByText("Molar Mass");
        let button = item.closest("button");
        if (button === null) {
            throw new Error("button not found for Molar Mass item");
        }
        fireEvent.click(button);
        await waitFor(function (): void {
            expect(result.getByTestId("path-label")).toHaveTextContent("/molar-mass");
        });
    });
    it("closes the palette after clicking an item", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "molar"}});
        let item = result.getByText("Molar Mass");
        let button = item.closest("button");
        if (button === null) {
            throw new Error("button not found");
        }
        fireEvent.click(button);
        expect(result.queryByRole("dialog", {name: "Calculator search"})).toBeNull();
    });
    it("closes on Escape", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        expect(result.queryByRole("dialog", {name: "Calculator search"})).toBeTruthy();
        let input = result.getByLabelText("Search calculators");
        fireEvent.keyDown(input, {key: "Escape"});
        expect(result.queryByRole("dialog", {name: "Calculator search"})).toBeNull();
    });
    it("shows desktop-only calculators on desktop", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        expect(result.getByText("Dashboard")).toBeTruthy();
        expect(result.getByText("Batch Calculator")).toBeTruthy();
    });
    it("hides desktop-only calculators in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        let result = renderHost();
        dispatchCtrlK();
        expect(result.queryByText("Dashboard")).toBeNull();
        expect(result.queryByText("Batch Calculator")).toBeNull();
        expect(result.getByText("Molar Mass")).toBeTruthy();
    });
    it("opens on Ctrl+Shift+K with uppercase K", function (): void {
        let result = renderHost();
        dispatchCtrlShiftK();
        expect(result.getByRole("dialog", {name: "Calculator search"})).toBeTruthy();
    });
    it("moves selection down on ArrowDown", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        expect(input.getAttribute("aria-activedescendant")).toBe("palette-option-0");
        fireEvent.keyDown(input, {key: "ArrowDown"});
        expect(input.getAttribute("aria-activedescendant")).toBe("palette-option-1");
    });
    it("moves selection up on ArrowUp", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.keyDown(input, {key: "ArrowDown"});
        expect(input.getAttribute("aria-activedescendant")).toBe("palette-option-1");
        fireEvent.keyDown(input, {key: "ArrowUp"});
        expect(input.getAttribute("aria-activedescendant")).toBe("palette-option-0");
    });
    it("navigates to the selected calculator on Enter", async function (): Promise<void> {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "molar"}});
        fireEvent.keyDown(input, {key: "Enter"});
        await waitFor(function (): void {
            expect(result.getByTestId("path-label")).toHaveTextContent("/molar-mass");
        });
    });
    it("ignores unhandled keys", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.keyDown(input, {key: "a"});
        expect(result.queryByRole("dialog", {name: "Calculator search"})).toBeTruthy();
    });
    it("does nothing on Enter when nothing matches", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "zzz-no-such-calculator"}});
        fireEvent.keyDown(input, {key: "Enter"});
        expect(result.queryByRole("dialog", {name: "Calculator search"})).toBeTruthy();
        expect(result.getByTestId("path-label")).toHaveTextContent("/");
    });
    it("shows an empty list when nothing matches", function (): void {
        let result = renderHost();
        dispatchCtrlK();
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "zzz-no-such-calculator"}});
        let listbox = result.getByRole("listbox", {name: "Matching calculators"});
        expect(listbox.querySelectorAll("li").length).toBe(0);
        expect(input.getAttribute("aria-activedescendant")).toBeNull();
    });
});
