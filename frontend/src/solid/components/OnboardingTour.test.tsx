import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
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

    it("moves focus to the dialog button when the tour opens", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        await waitFor(function (): void {
            expect(document.activeElement).toBe(result.getByRole("button", {name: "Skip tour"}));
        });
    });

    it("completes the tour when Escape is pressed", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).toBeTruthy();
        });
        document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
        await waitFor(function (): void {
            expect(completeTourSpy).toHaveBeenCalled();
        });
        expect(result.queryByRole("dialog")).toBeNull();
    });

    it("ignores keys that are neither Escape nor Tab", async function (): Promise<void> {
        completeTourSpy.mockClear();
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).toBeTruthy();
        });
        document.dispatchEvent(new KeyboardEvent("keydown", {key: "a", bubbles: true}));
        expect(completeTourSpy).not.toHaveBeenCalled();
        expect(result.getByRole("dialog")).toBeTruthy();
    });

    it("wraps focus to the first element on Tab from the last", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        let skip = await waitFor(function (): HTMLElement {
            let active = document.activeElement as HTMLElement;
            expect(active).toBe(result.getByRole("button", {name: "Skip tour"}));
            return active;
        });
        void skip;
        let tabEvent = new KeyboardEvent("keydown", {key: "Tab", bubbles: true, cancelable: true});
        document.dispatchEvent(tabEvent);
        expect(tabEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(result.getByRole("button", {name: "Skip tour"}));
        expect(result.getByRole("dialog")).toBeTruthy();
    });

    it("wraps focus to the last element on Shift+Tab from the first", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        await waitFor(function (): void {
            expect(document.activeElement).toBe(result.getByRole("button", {name: "Skip tour"}));
        });
        let shiftTabEvent = new KeyboardEvent("keydown", {key: "Tab", shiftKey: true, bubbles: true, cancelable: true});
        document.dispatchEvent(shiftTabEvent);
        expect(shiftTabEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(result.getByRole("button", {name: "Skip tour"}));
        expect(result.getByRole("dialog")).toBeTruthy();
    });

    it("restores previous focus when the tour closes", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(false);
        let result = render(function () { return <ManualStartHost />; });
        let startButton = result.getByRole("button", {name: "Start tour"}) as HTMLElement;
        startButton.focus();
        fireEvent.click(startButton);
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).toBeTruthy();
        });
        fireEvent.click(result.getByRole("button", {name: "Skip tour"}));
        await waitFor(function (): void {
            expect(result.queryByRole("dialog")).toBeNull();
        });
        expect(document.activeElement).toBe(startButton);
    });

    it("does not wrap focus on Tab when focus is not on the last element", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).toBeTruthy();
        });
        let dialog = result.getByRole("dialog") as HTMLElement;
        dialog.focus();
        expect(document.activeElement).toBe(dialog);
        let tabEvent = new KeyboardEvent("keydown", {key: "Tab", bubbles: true, cancelable: true});
        document.dispatchEvent(tabEvent);
        expect(tabEvent.defaultPrevented).toBe(false);
        expect(result.getByRole("dialog")).toBeTruthy();
    });

    it("skips focus restore when the previous element is gone", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(false);
        let result = render(function () { return <ManualStartHost />; });
        let startButton = result.getByRole("button", {name: "Start tour"}) as HTMLElement;
        startButton.focus();
        fireEvent.click(startButton);
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).toBeTruthy();
        });
        startButton.remove();
        fireEvent.click(result.getByRole("button", {name: "Skip tour"}));
        await waitFor(function (): void {
            expect(result.queryByRole("dialog")).toBeNull();
        });
    });

    it("does not wrap focus on Shift+Tab when focus is not on the first element", async function (): Promise<void> {
        isFirstRunSpy.mockReturnValue(true);
        let result = render(function () { return <OnboardingTour />; });
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).toBeTruthy();
        });
        let dialog = result.getByRole("dialog") as HTMLElement;
        dialog.focus();
        expect(document.activeElement).toBe(dialog);
        let shiftTabEvent = new KeyboardEvent("keydown", {key: "Tab", shiftKey: true, bubbles: true, cancelable: true});
        document.dispatchEvent(shiftTabEvent);
        expect(shiftTabEvent.defaultPrevented).toBe(false);
        expect(result.getByRole("dialog")).toBeTruthy();
    });
});
