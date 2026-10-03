import {render, fireEvent} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {Sidebar} from "./Sidebar";
import {DataPortabilityManager} from "../../modules/dataPortabilityManager.js";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";

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

    it("shows desktop-only links, workspaces, and plugins on desktop", function (): void {
        let result = render(function () { return <SidebarHost />; });
        expect(result.getByText("Batch Calculator")).toBeTruthy();
        expect(result.getByText("Dashboard")).toBeTruthy();
        expect(result.getByText("Compound Search")).toBeTruthy();
        expect(result.getByText("Workspaces")).toBeTruthy();
        expect(result.queryByRole("button", {name: "Export Data"})).not.toBeNull();
        expect(result.getByText("Plugins")).toBeTruthy();
    });

    it("hides desktop-only links in web mode but keeps calculators and compound search", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        let result = render(function () { return <SidebarHost />; });
        expect(result.queryByText("Batch Calculator")).toBeNull();
        expect(result.queryByText("Dashboard")).toBeNull();
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.getByText("Compound Search")).toBeTruthy();
    });

    it("hides workspaces, export/import, and plugins in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        let result = render(function () { return <SidebarHost />; });
        expect(result.queryByText("Workspaces")).toBeNull();
        expect(result.queryByRole("button", {name: "Export Data"})).toBeNull();
        expect(result.queryByRole("button", {name: "Import Data"})).toBeNull();
        expect(result.queryByText("Plugins")).toBeNull();
    });
});
