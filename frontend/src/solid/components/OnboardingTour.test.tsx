import {render, fireEvent, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {OnboardingManager} from "../../modules/onboardingManager.js";
import {OnboardingTour} from "./OnboardingTour";
import {useOnboarding} from "../stores/onboarding";

function ManualStartHost(): JSX.Element {
    let store = useOnboarding();
    return (
        <>
            <OnboardingTour />
            <button type="button" onClick={function (): void { store.startTour(); }}>Start tour</button>
        </>
    );
}

describe("OnboardingTour", function (): void {
    let startTourSpy: ReturnType<typeof vi.spyOn>;
    let completeTourSpy: ReturnType<typeof vi.spyOn>;
    let isFirstRunSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(function (): void {
        OnboardingManager.resetInstance();
        localStorage.clear();
        document.body.innerHTML = "";
        let manager = OnboardingManager.getInstance();
        isFirstRunSpy = vi.spyOn(Object.getPrototypeOf(manager), "isFirstRun").mockReturnValue(false);
        startTourSpy = vi.spyOn(Object.getPrototypeOf(manager), "startTour").mockImplementation(function (): void {});
        completeTourSpy = vi.spyOn(Object.getPrototypeOf(manager), "completeTour").mockImplementation(function (): void {});
        useOnboarding().completeTour();
    });

    afterEach(function (): void {
        cleanup();
        OnboardingManager.resetInstance();
        localStorage.clear();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("calls startTour on mount when isFirstRun returns true", function (): void {
        isFirstRunSpy.mockReturnValue(true);
        render(function () { return <OnboardingTour />; });
        expect(startTourSpy).toHaveBeenCalled();
    });

    it("does not call startTour on mount when isFirstRun returns false", function (): void {
        isFirstRunSpy.mockReturnValue(false);
        render(function () { return <OnboardingTour />; });
        expect(startTourSpy).not.toHaveBeenCalled();
    });

    it("renders the welcome overlay when tour is active", function (): void {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        expect(result.getByRole("dialog")).toBeTruthy();
        expect(result.getByText("Welcome to Chemistry Utility")).toBeTruthy();
    });

    it("does not render the overlay when tour is inactive", function (): void {
        isFirstRunSpy.mockReturnValue(false);
        let result = render(function () { return <OnboardingTour />; });
        expect(result.queryByRole("dialog")).toBeNull();
    });

    it("calls completeTour when the Skip tour button is clicked", function (): void {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        let skipButton = result.getByRole("button", {name: "Skip tour"});
        fireEvent.click(skipButton);
        expect(completeTourSpy).toHaveBeenCalled();
    });

    it("hides the overlay after Skip tour is clicked", function (): void {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        let skipButton = result.getByRole("button", {name: "Skip tour"});
        fireEvent.click(skipButton);
        expect(result.queryByRole("dialog")).toBeNull();
    });

    it("can be manually triggered via the store startTour function", function (): void {
        isFirstRunSpy.mockReturnValue(false);
        let result = render(function () { return <ManualStartHost />; });
        expect(startTourSpy).not.toHaveBeenCalled();
        let startButton = result.getByRole("button", {name: "Start tour"});
        fireEvent.click(startButton);
        expect(startTourSpy).toHaveBeenCalled();
        expect(result.getByRole("dialog")).toBeTruthy();
    });
});
