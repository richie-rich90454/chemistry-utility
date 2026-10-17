import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {useOnboarding, TOUR_STEPS} from "./onboarding";

describe("onboarding store", function (): void {
    beforeEach(function (): void {
        useOnboarding().completeTour();
        localStorage.clear();
    });

    afterEach(function (): void {
        vi.restoreAllMocks();
    });

    it("starts hidden on the welcome step", function (): void {
        expect(useOnboarding().tourActive()).toBe(false);
        expect(useOnboarding().tourStep()).toBe(0);
    });

    it("exposes a five-step tour that opens with the welcome card", function (): void {
        expect(TOUR_STEPS.length).toBe(5);
        expect(TOUR_STEPS[0].title).toBe("Welcome to Chemistry Utility");
        expect(TOUR_STEPS[0].selector).toBeNull();
        expect(TOUR_STEPS[4].selector).not.toBeNull();
    });

    it("treats a visitor with no stored completion as a first run", function (): void {
        expect(useOnboarding().isFirstRun()).toBe(true);
    });

    it("treats a stored completion as a repeat visit", function (): void {
        localStorage.setItem("onboarding-complete", "true");
        expect(useOnboarding().isFirstRun()).toBe(false);
    });

    it("treats an unreadable store as a first run", function (): void {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (): never {
            throw new Error("blocked");
        });
        expect(useOnboarding().isFirstRun()).toBe(true);
    });

    it("opens the tour on the welcome step", function (): void {
        let store = useOnboarding();
        store.startTour();
        expect(store.tourActive()).toBe(true);
        expect(store.tourStep()).toBe(0);
    });

    it("advances one step at a time", function (): void {
        let store = useOnboarding();
        store.startTour();
        store.nextStep();
        expect(store.tourStep()).toBe(1);
        store.nextStep();
        expect(store.tourStep()).toBe(2);
    });

    it("finishes the tour from the last step", function (): void {
        let store = useOnboarding();
        store.startTour();
        let i: number;
        for (i = 0; i < TOUR_STEPS.length - 1; i++) {
            store.nextStep();
        }
        expect(store.tourStep()).toBe(TOUR_STEPS.length - 1);
        store.nextStep();
        expect(store.tourActive()).toBe(false);
        expect(store.tourStep()).toBe(0);
        expect(localStorage.getItem("onboarding-complete")).toBe("true");
    });

    it("steps back and stops at the welcome step", function (): void {
        let store = useOnboarding();
        store.startTour();
        store.nextStep();
        store.previousStep();
        expect(store.tourStep()).toBe(0);
        store.previousStep();
        expect(store.tourStep()).toBe(0);
    });

    it("restarts from the welcome step after finishing", function (): void {
        let store = useOnboarding();
        store.startTour();
        store.nextStep();
        store.completeTour();
        store.startTour();
        expect(store.tourStep()).toBe(0);
        expect(store.tourActive()).toBe(true);
    });

    it("records completion and hides the tour", function (): void {
        let store = useOnboarding();
        store.startTour();
        store.completeTour();
        expect(store.tourActive()).toBe(false);
        expect(store.tourStep()).toBe(0);
        expect(localStorage.getItem("onboarding-complete")).toBe("true");
    });

    it("survives a store that refuses writes", function (): void {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (): never {
            throw new Error("quota");
        });
        let store = useOnboarding();
        store.startTour();
        expect(function (): void { store.completeTour(); }).not.toThrow();
        expect(store.tourActive()).toBe(false);
    });
});
