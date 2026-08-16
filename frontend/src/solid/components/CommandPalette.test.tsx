import {render, fireEvent, waitFor} from "@solidjs/testing-library";
import {Router, Route, useLocation} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach} from "vitest";
import {CommandPalette} from "./CommandPalette";
import {reset as resetPalette} from "../stores/palette";
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
describe("CommandPalette", function (): void {
    beforeEach(function (): void {
        resetPalette();
    });
    afterEach(function (): void {
        resetPalette();
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
});
