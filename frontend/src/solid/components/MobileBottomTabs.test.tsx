import {render, fireEvent} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {MobileBottomTabs} from "./MobileBottomTabs";
import {useNavSheet, reset as resetNavSheet} from "../stores/navSheet";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";
function Host(): JSX.Element {
    return <MobileBottomTabs />;
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
describe("MobileBottomTabs", function (): void {
    beforeEach(function (): void {
        resetNavSheet();
    });
    afterEach(function (): void {
        vi.restoreAllMocks();
    });
    it("renders the top banner with a navigation landmark", function (): void {
        let result = renderHost();
        let banner = result.getByRole("banner");
        expect(banner).toBeTruthy();
    });
    it("renders a menu button that opens the nav sheet", function (): void {
        let result = renderHost();
        let menuButton = result.getByRole("button", {name: "Open navigation menu"});
        expect(menuButton).toBeTruthy();
    });
    it("opens the nav sheet when menu button is clicked", function (): void {
        let result = renderHost();
        let menuButton = result.getByRole("button", {name: "Open navigation menu"});
        fireEvent.click(menuButton);
        let sheet = useNavSheet();
        expect(sheet.isOpen()).toBe(true);
    });
    it("shows the dashboard title for the root path on desktop", function (): void {
        let result = renderHost();
        expect(result.getByText("Dashboard")).toBeTruthy();
    });
    it("falls back to the app title for desktop-only paths in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        let result = renderHost();
        expect(result.queryByText("Dashboard")).toBeNull();
        expect(result.getByText("Chemistry Utility")).toBeTruthy();
    });
});
