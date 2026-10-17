import {render, fireEvent} from "@solidjs/testing-library";
import {Router, Route} from "@solidjs/router";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {Sidebar} from "./Sidebar";
import {NavigationManager} from "../../modules/navigationManager.js";
import {preloadRoute} from "../routeLoaders";

vi.mock("../routeLoaders", async function (importOriginal) {
    let actual = await importOriginal() as Record<string, unknown>;
    return Object.assign({}, actual, {
        "preloadRoute": vi.fn(function (): Promise<void> {
            return Promise.resolve();
        })
    });
});

function SidebarHost(): JSX.Element {
    return (
        <Router>
            <Route path="*" component={function (): JSX.Element { return <Sidebar />; }} />
        </Router>
    );
}

function SidebarPropsHost(props: {collapsed?: boolean; onToggle?: () => void}): JSX.Element {
    return (
        <Router>
            <Route path="*" component={function (): JSX.Element { return <Sidebar collapsed={props.collapsed} onToggle={props.onToggle} />; }} />
        </Router>
    );
}

describe("Sidebar", function (): void {
    beforeEach(function (): void {
        localStorage.clear();
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

    it("renders every calculator including the batch calculator", function (): void {
        let result = render(function () { return <SidebarHost />; });
        expect(result.getByText("Batch Calculator")).toBeTruthy();
        expect(result.getByText("Compound Search")).toBeTruthy();
    });

    it("no longer renders the removed database features", function (): void {
        let result = render(function () { return <SidebarHost />; });
        expect(result.queryByText("Dashboard")).toBeNull();
        expect(result.queryByText("Workspaces")).toBeNull();
        expect(result.queryByText("Plugins")).toBeNull();
        expect(result.queryByRole("button", {name: "Export Data"})).toBeNull();
        expect(result.queryByRole("button", {name: "Import Data"})).toBeNull();
    });

    it("filters calculators by name when searching", function (): void {
        let result = render(function () { return <SidebarHost />; });
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "molar"}});
        expect(result.getByText("Molar Mass")).toBeTruthy();
        expect(result.queryByText("Element Lookup")).toBeNull();
    });

    it("filters calculators by category when searching", function (): void {
        let result = render(function () { return <SidebarHost />; });
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "solutions"}});
        expect(result.getByText("Dilution")).toBeTruthy();
        expect(result.queryByText("Molar Mass")).toBeNull();
    });

    it("filters calculators by description when searching", function (): void {
        let result = render(function () { return <SidebarHost />; });
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "pubchem"}});
        expect(result.getByText("Compound Search")).toBeTruthy();
        expect(result.queryByText("Molar Mass")).toBeNull();
    });

    it("shows no calculators when the search matches nothing", function (): void {
        let result = render(function () { return <SidebarHost />; });
        let input = result.getByLabelText("Search calculators") as HTMLInputElement;
        fireEvent.input(input, {target: {value: "zzz-no-such-calculator"}});
        expect(result.queryByText("Molar Mass")).toBeNull();
        expect(result.queryByText("Dilution")).toBeNull();
    });

    it("calls onToggle when the sidebar toggle is clicked", function (): void {
        let onToggle = vi.fn();
        let result = render(function () { return <SidebarPropsHost onToggle={onToggle} />; });
        fireEvent.click(result.getByRole("button", {name: "Collapse sidebar"}));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("does not throw when toggling without onToggle", function (): void {
        let result = render(function () { return <SidebarHost />; });
        expect(function (): void {
            fireEvent.click(result.getByRole("button", {name: "Collapse sidebar"}));
        }).not.toThrow();
    });

    it("renders the expand control when collapsed", function (): void {
        let result = render(function () { return <SidebarPropsHost collapsed={true} />; });
        expect(result.getByRole("button", {name: "Expand sidebar"})).toBeTruthy();
    });

    it("prefetches a route when a nav link is hovered and ignores preload failures", async function (): Promise<void> {
        vi.mocked(preloadRoute).mockImplementation(function (): Promise<void> {
            return Promise.resolve();
        });
        vi.mocked(preloadRoute).mockRejectedValueOnce(new Error("chunk failed"));
        let result = render(function () { return <SidebarHost />; });
        let link = result.container.querySelector("a") as HTMLAnchorElement;
        fireEvent.pointerOver(link);
        await Promise.resolve();
        await Promise.resolve();
        expect(vi.mocked(preloadRoute)).toHaveBeenCalled();
    });

    it("renders a default icon for unknown calculator ids", function (): void {
        let nav = NavigationManager.getInstance();
        vi.spyOn(nav, "getCalculators").mockReturnValue([
            {id: "mystery-calc", name: "Mystery Calc", category: "Other", icon: "mystery", description: "An unknown calculator"}
        ]);
        let result = render(function () { return <SidebarHost />; });
        expect(result.getByText("Mystery Calc")).toBeTruthy();
    });
});
