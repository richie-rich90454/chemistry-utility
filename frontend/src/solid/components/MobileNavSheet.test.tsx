import {render} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {MobileNavSheet} from "./MobileNavSheet";
import {useNavSheet, reset as resetNavSheet} from "../stores/navSheet";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";
function Host(): JSX.Element {
    return <MobileNavSheet />;
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
describe("MobileNavSheet", function (): void {
    beforeEach(function (): void {
        resetNavSheet();
    });
    afterEach(function (): void {
        vi.restoreAllMocks();
    });
    it("does not render the sheet when closed", function (): void {
        let result = renderHost();
        expect(result.queryByRole("dialog", {name: "Navigation menu"})).toBeNull();
    });
    it("renders the sheet with calculator list when opened", function (): void {
        let sheet = useNavSheet();
        let result = renderHost();
        sheet.open();
        expect(result.getByRole("dialog", {name: "Navigation menu"})).toBeTruthy();
        expect(result.getByText("Molar Mass")).toBeTruthy();
    });
    it("renders all calculators in the list when opened", function (): void {
        let sheet = useNavSheet();
        let result = renderHost();
        sheet.open();
        expect(result.getByText("Element Lookup")).toBeTruthy();
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.getByText("Equation Balancer")).toBeTruthy();
        expect(result.getByText("Dilution")).toBeTruthy();
    });
    it("sheet disappears when closed after being opened", function (): void {
        let sheet = useNavSheet();
        let result = renderHost();
        sheet.open();
        expect(result.queryByRole("dialog", {name: "Navigation menu"})).toBeTruthy();
        sheet.close();
        expect(result.queryByRole("dialog", {name: "Navigation menu"})).toBeNull();
    });
    it("renders calculators grouped by category", function (): void {
        let sheet = useNavSheet();
        let result = renderHost();
        sheet.open();
        expect(result.getByText("General")).toBeTruthy();
        expect(result.getByText("Solutions")).toBeTruthy();
    });
    it("shows desktop-only entries on desktop", function (): void {
        let sheet = useNavSheet();
        let result = renderHost();
        sheet.open();
        expect(result.getByText("Batch Calculator")).toBeTruthy();
        expect(result.getByText("Dashboard")).toBeTruthy();
        expect(result.getByText("Compound Search")).toBeTruthy();
    });
    it("hides desktop-only entries in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        let sheet = useNavSheet();
        let result = renderHost();
        sheet.open();
        expect(result.queryByText("Batch Calculator")).toBeNull();
        expect(result.queryByText("Dashboard")).toBeNull();
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.getByText("Compound Search")).toBeTruthy();
    });
});
