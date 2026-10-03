import {render} from "@solidjs/testing-library";
import {describe, it, expect, afterEach, vi} from "vitest";
import {App} from "./App";
import {RuntimeDetector} from "../modules/runtimeDetector.js";

describe("App", function (): void {
    it("renders without crashing", function (): void {
        let result = render(function () { return <App />; });
        expect(result.container.querySelector(".app-shell")).toBeTruthy();
    });
});

describe("desktop-only routes", function (): void {
    afterEach(function (): void {
        vi.restoreAllMocks();
        // pushState is mocked out in test setup; replaceState is real.
        window.history.replaceState({}, "", "/");
    });

    it("shows desktop-only nav links on desktop", function (): void {
        let result = render(function () { return <App />; });
        expect(result.getAllByText("Batch Calculator").length).toBeGreaterThan(0);
        expect(result.getAllByText("Dashboard").length).toBeGreaterThan(0);
        expect(result.getAllByText("Compound Search").length).toBeGreaterThan(0);
    });

    it("hides desktop-only nav links in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        let result = render(function () { return <App />; });
        expect(result.queryAllByText("Batch Calculator").length).toBe(0);
        expect(result.queryAllByText("Dashboard").length).toBe(0);
        expect(result.getAllByText("Compound Search").length).toBeGreaterThan(0);
        expect(result.getAllByText("Molar Mass").length).toBeGreaterThan(0);
    });

    it("shows the desktop notice for /dashboard in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        window.history.replaceState({}, "", "/dashboard");
        let result = render(function () { return <App />; });
        expect(result.getByRole("heading", {level: 1, name: "Desktop app only"})).toBeTruthy();
    });

    it("shows the desktop notice for /batch-calc in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        window.history.replaceState({}, "", "/batch-calc");
        let result = render(function () { return <App />; });
        expect(result.getByRole("heading", {level: 1, name: "Desktop app only"})).toBeTruthy();
    });

    it("keeps compound search reachable in web mode", function (): void {
        vi.spyOn(RuntimeDetector.prototype, "isWebMode", "get").mockReturnValue(true);
        window.history.replaceState({}, "", "/compound-search");
        let result = render(function () { return <App />; });
        expect(result.queryByRole("heading", {name: "Desktop app only"})).toBeNull();
    });

    it("does not show the desktop notice for /dashboard on desktop", function (): void {
        window.history.replaceState({}, "", "/dashboard");
        let result = render(function () { return <App />; });
        expect(result.queryByRole("heading", {name: "Desktop app only"})).toBeNull();
    });
});
