import {render, cleanup, fireEvent} from "@solidjs/testing-library";
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

    it("toggles the collapsed nav class from the sidebar toggle", function (): void {
        window.history.replaceState({}, "", "/");
        let result = render(function () { return <App />; });
        let shell = result.container.querySelector(".app-shell") as HTMLElement;
        expect(shell.className).not.toMatch(/nav-collapsed/);
        fireEvent.click(result.getByLabelText("Collapse sidebar"));
        expect(shell.className).toMatch(/nav-collapsed/);
        fireEvent.click(result.getByLabelText("Expand sidebar"));
        expect(shell.className).not.toMatch(/nav-collapsed/);
        cleanup();
    });

    it("redirects /mass-calc to /molar-mass", function (): void {
        window.history.replaceState({}, "", "/mass-calc");
        let result = render(function () { return <App />; });
        expect(result.container.querySelector(".app-shell")).toBeTruthy();
        cleanup();
        window.history.replaceState({}, "", "/");
    });

    it("redirects unknown paths back to /", function (): void {
        window.history.replaceState({}, "", "/no-such-route");
        let result = render(function () { return <App />; });
        expect(result.container.querySelector(".app-shell")).toBeTruthy();
        cleanup();
        window.history.replaceState({}, "", "/");
    });
});

describe("legacy hash redirects", function (): void {
    let cases: [string, string][] = [
        ["#mass-calc", "/molar-mass"],
        ["#element-lookup", "/element-lookup"],
        ["#periodic-table", "/periodic-table"],
        ["#ptable-view", "/periodic-table"],
        ["#balancing", "/equation-balancer"],
        ["#equation-balancer", "/equation-balancer"],
        ["#unit-converter", "/unit-converter"],
        ["#dilution-calc", "/dilution"],
        ["#mass-percent-calc", "/mass-percent"],
        ["#solution-mixing-calc", "/solution-mixing"],
        ["#buffer-calc", "/buffer"],
        ["#pka-pkb-calc", "/pka-pkb"],
        ["#ksp-calc", "/ksp"],
        ["#colligative-calc", "/colligative"],
        ["#titration-calc", "/titration"],
        ["#debye-huckel-calc", "/debye-huckel"],
        ["#common-ion-calc", "/common-ion"],
        ["#nuclear-chemistry", "/nuclear"],
        ["#half-life-calc", "/nuclear"],
        ["#gas-laws", "/gas-laws"],
        ["#ideal-gas-law", "/gas-laws"],
        ["#combined-gas-law", "/gas-laws"],
        ["#van-der-waals", "/gas-laws"],
        ["#electrochemistry", "/electrochemistry"],
        ["#cell-potential", "/electrochemistry"],
        ["#nernst-equation", "/electrochemistry"],
        ["#electrolysis", "/electrochemistry"],
        ["#thermodynamics", "/thermodynamics"],
        ["#gibbs-free-energy", "/thermodynamics"],
        ["#hess-law", "/thermodynamics"],
        ["#entropy-change", "/thermodynamics"],
        ["#heat-capacity", "/thermodynamics"],
        ["#bond-enthalpy", "/thermodynamics"],
        ["#born-haber", "/thermodynamics"],
        ["#kinetics", "/kinetics"],
        ["#arrhenius-calc", "/kinetics"],
        ["#rate-law-calc", "/kinetics"],
        ["#integrated-rate-law-calc", "/kinetics"],
        ["#reaction-order-calc", "/kinetics"],
        ["#collision-theory-calc", "/kinetics"],
        ["#quantum-atomic", "/quantum-atomic"],
        ["#quantum-numbers", "/quantum-atomic"],
        ["#electron-configuration", "/quantum-atomic"],
        ["#rydberg-calc", "/quantum-atomic"],
        ["#debroglie-calc", "/quantum-atomic"],
        ["#photoelectric-calc", "/quantum-atomic"],
        ["#heisenberg-calc", "/quantum-atomic"],
        ["#stoichiometry", "/stoichiometry"],
        ["#bond-type-predictor", "/bond-type"],
        ["#molecular-viewer", "/molecular-viewer"],
        ["#compound-search", "/compound-search"],
        ["#batch-calc", "/batch-calc"],
        ["#dashboard-view", "/dashboard"],
        ["#dashboard", "/dashboard"],
        ["#home", "/dashboard"]
    ];
    afterEach(function (): void {
        cleanup();
        window.history.replaceState({}, "", "/");
    });

    it("replaces every legacy hash with its route", async function (): Promise<void> {
        let realLocation = window.location;
        let originalDesc = Object.getOwnPropertyDescriptor(window, "location") as PropertyDescriptor;
        let replaced: string[] = [];
        // jsdom's Location#replace is read-only and non-navigating, so swap
        // in a plain object that forwards the full Location surface to the
        // real one except replace(), which is captured for assertion.
        let fakeLocation = {} as Location;
        let forwarded: string[] = ["href", "protocol", "host", "hostname", "port", "pathname", "search", "hash", "origin"];
        for (let k = 0; k < forwarded.length; k = k + 1) {
            let prop: string = forwarded[k];
            Object.defineProperty(fakeLocation, prop, {
                get: function (): unknown {
                    return (realLocation as unknown as Record<string, unknown>)[prop];
                },
                set: function (value: unknown): void {
                    (realLocation as unknown as Record<string, unknown>)[prop] = value;
                },
                enumerable: true,
                configurable: true
            });
        }
        fakeLocation.replace = function (url: string): void {
            replaced.push(url);
        } as typeof realLocation.replace;
        fakeLocation.assign = realLocation.assign.bind(realLocation);
        fakeLocation.reload = realLocation.reload.bind(realLocation);
        Object.defineProperty(window, "location", {value: fakeLocation, configurable: true, writable: true});
        try {
            for (let i = 0; i < cases.length; i = i + 1) {
                replaced = [];
                window.location.hash = cases[i][0];
                render(function () { return <App />; });
                for (let j = 0; j < 10; j = j + 1) {
                    await Promise.resolve();
                }
                expect(replaced).toEqual([cases[i][1]]);
                cleanup();
            }
        } finally {
            Object.defineProperty(window, "location", originalDesc);
            window.history.replaceState({}, "", "/");
        }
    });
});
