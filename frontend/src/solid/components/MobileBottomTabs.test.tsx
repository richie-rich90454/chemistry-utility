import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {MobileBottomTabs} from "./MobileBottomTabs";
import {useNavSheet, reset as resetNavSheet} from "../stores/navSheet";
import {NavigationManager} from "../../modules/navigationManager.js";
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
        NavigationManager.resetInstance();
        window.history.replaceState({}, "", "/");
    });
    afterEach(function (): void {
        cleanup();
        NavigationManager.resetInstance();
        window.history.replaceState({}, "", "/");
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
    it("updates the title when the path changes via popstate", async function (): Promise<void> {
        let result = renderHost();
        expect(result.getByText("Dashboard")).toBeTruthy();
        window.history.replaceState({}, "", "/molar-mass");
        window.dispatchEvent(new Event("popstate"));
        await waitFor(function (): void {
            expect(result.getByText("Molar Mass")).toBeTruthy();
        });
    });
    it("falls back to the app title for unknown paths", function (): void {
        window.history.replaceState({}, "", "/no-such-calculator");
        let result = renderHost();
        expect(result.getByText("Chemistry Utility")).toBeTruthy();
    });
    it("updates the title when navigation notifies a calculator id", async function (): Promise<void> {
        let result = renderHost();
        NavigationManager.getInstance().setActiveViewId("molar-mass");
        await waitFor(function (): void {
            expect(result.getByText("Molar Mass")).toBeTruthy();
        });
    });
    it("clears the title when navigation notifies an unknown id", async function (): Promise<void> {
        let result = renderHost();
        expect(result.getByText("Dashboard")).toBeTruthy();
        NavigationManager.getInstance().setActiveViewId("mystery-xyz");
        await waitFor(function (): void {
            expect(result.queryByText("Dashboard")).toBeNull();
        });
    });
});
