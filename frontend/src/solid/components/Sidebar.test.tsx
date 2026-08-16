import {render, fireEvent} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {Sidebar} from "./Sidebar";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";

function SidebarHost(): JSX.Element {
    return (
        <Router>
            <Route path="*" component={function (): JSX.Element { return <Sidebar />; }} />
        </Router>
    );
}

describe("Sidebar", function (): void {
    let exportSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(function (): void {
        localStorage.clear();
        let manager = DataPortabilityManager.getInstance();
        exportSpy = vi.spyOn(Object.getPrototypeOf(manager), "exportToFile");
    });

    afterEach(function (): void {
        vi.restoreAllMocks();
    });

    it("renders the app title heading", function (): void {
        let result = render(function () { return <SidebarHost />; });
        let heading = result.getByRole("heading", {level: 1, name: "Chemistry Utility"});
        expect(heading).toBeTruthy();
    });

    it("renders a Molar Mass nav link", function (): void {
        let result = render(function () { return <SidebarHost />; });
        expect(result.getByText("Molar Mass")).toBeTruthy();
    });

    it("renders Export and Import buttons", function (): void {
        let result = render(function () { return <SidebarHost />; });
        expect(result.getByRole("button", {name: "Export Data"})).toBeTruthy();
        expect(result.getByRole("button", {name: "Import Data"})).toBeTruthy();
    });

    it("calls DataPortabilityManager.exportToFile when Export is clicked", function (): void {
        let result = render(function () { return <SidebarHost />; });
        let exportButton = result.getByRole("button", {name: "Export Data"});
        fireEvent.click(exportButton);
        expect(exportSpy).toHaveBeenCalled();
    });
});
