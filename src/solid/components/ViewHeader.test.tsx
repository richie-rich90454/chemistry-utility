import {render, fireEvent} from "@solidjs/testing-library";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {ViewHeader} from "./ViewHeader";
import {NavigationManager} from "../../modules/navigationManager.js";

describe("ViewHeader", function (): void {
    beforeEach(function (): void {
        NavigationManager.resetInstance();
    });

    afterEach(function (): void {
        NavigationManager.resetInstance();
        vi.restoreAllMocks();
    });

    it("renders the provided title", function (): void {
        let result = render(function () { return <ViewHeader title="Molar Mass" />; });
        expect(result.getByText("Molar Mass")).toBeTruthy();
    });

    it("renders the provided category badge", function (): void {
        let result = render(function () { return <ViewHeader title="Molar Mass" category="Reference" />; });
        expect(result.getByText("Reference")).toBeTruthy();
    });

    it("does not render a category badge when category is undefined", function (): void {
        let result = render(function () { return <ViewHeader title="Molar Mass" />; });
        let title = result.getByText("Molar Mass");
        let header = title.parentElement as HTMLElement;
        let badges = header.querySelectorAll("span:not(.view-title), span:not([class*='viewTitle'])");
        let categoryCount = 0;
        let spans = header.querySelectorAll("span");
        let i: number;
        for (i = 0; i < spans.length; i++) {
            if (spans[i].textContent !== "Molar Mass") {
                categoryCount++;
            }
        }
        expect(categoryCount).toBe(0);
        void badges;
    });

    it("renders a back button with aria-label Go back", function (): void {
        let result = render(function () { return <ViewHeader title="Molar Mass" />; });
        expect(result.getByRole("button", {name: "Go back"})).toBeTruthy();
    });

    it("calls onBack when provided and the back button is clicked", function (): void {
        let called = false;
        let onBack = function (): void {
            called = true;
        };
        let result = render(function () { return <ViewHeader title="Molar Mass" onBack={onBack} />; });
        let button = result.getByRole("button", {name: "Go back"});
        fireEvent.click(button);
        expect(called).toBe(true);
    });

    it("falls back to NavigationManager.navigateBack when onBack is not provided", function (): void {
        let manager = NavigationManager.getInstance();
        let navigateBackSpy = vi.spyOn(Object.getPrototypeOf(manager), "navigateBack").mockImplementation(function (): void {});
        let result = render(function () { return <ViewHeader title="Molar Mass" />; });
        let button = result.getByRole("button", {name: "Go back"});
        fireEvent.click(button);
        expect(navigateBackSpy).toHaveBeenCalled();
    });
});
