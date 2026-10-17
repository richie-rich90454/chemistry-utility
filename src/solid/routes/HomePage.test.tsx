import { render, cleanup } from "@solidjs/testing-library";
import { Router, Route } from "@solidjs/router";
import type { JSX } from "solid-js";
import { describe, it, expect, vi, afterEach } from "vitest";
import { HomePage } from "./HomePage";
import { NavigationManager } from "../../modules/navigationManager.js";
import { RuntimeDetector } from "../../modules/runtimeDetector.js";

function HomeHost(): JSX.Element {
    return (
        <Router>
            <Route path="*" component={() => <HomePage />} />
        </Router>
    );
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("HomePage", () => {
    it("renders hero title and subtitle", () => {
        const rendered = render(() => <HomeHost />);
        expect(rendered.getByText("Chemistry Utility")).toBeTruthy();
        expect(rendered.getByLabelText("Chemistry Utility home")).toBeTruthy();
    });

    it("renders calculator groups from the navigation manager", () => {
        const rendered = render(() => <HomeHost />);
        expect(rendered.getByText("Molar Mass")).toBeTruthy();
        expect(rendered.getByText("General")).toBeTruthy();
    });

    it("links calculators to their routes", () => {
        const rendered = render(() => <HomeHost />);
        const link = rendered.getByText("Molar Mass").closest("a") as HTMLAnchorElement;
        expect(link.getAttribute("href")).toBe("/molar-mass");
    });

    it("mentions batch processing on desktop", () => {
        const rendered = render(() => <HomeHost />);
        expect(rendered.getByText(/Batch Calculator can process/)).toBeTruthy();
    });

    it("hides the batch note on web builds", () => {
        vi.spyOn(RuntimeDetector, "getInstance").mockReturnValue({ isWebMode: true } as RuntimeDetector);
        const rendered = render(() => <HomeHost />);
        expect(rendered.queryByText(/Batch Calculator can process/)).toBeNull();
        expect(rendered.getByText("Chemistry Utility")).toBeTruthy();
    });

    it("renders no groups when no calculators are visible", () => {
        const manager = NavigationManager.getInstance();
        vi.spyOn(NavigationManager, "getInstance").mockReturnValue(manager);
        vi.spyOn(manager, "getCalculators").mockReturnValue([]);
        const rendered = render(() => <HomeHost />);
        expect(rendered.getByText("Chemistry Utility")).toBeTruthy();
        expect(rendered.queryByText("Molar Mass")).toBeNull();
    });
});
