import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {createRoot} from "solid-js";
import {OnboardingManager} from "../../modules/onboardingManager.js";
import {useOnboarding} from "./onboarding";

describe("useOnboarding", function (): void {
    let startTourSpy: ReturnType<typeof vi.spyOn>;
    let completeTourSpy: ReturnType<typeof vi.spyOn>;
    let isFirstRunSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(function (): void {
        OnboardingManager.resetInstance();
        localStorage.clear();
        let manager = OnboardingManager.getInstance();
        startTourSpy = vi.spyOn(Object.getPrototypeOf(manager), "startTour").mockImplementation(function (): void {});
        completeTourSpy = vi.spyOn(Object.getPrototypeOf(manager), "completeTour").mockImplementation(function (): void {});
        isFirstRunSpy = vi.spyOn(Object.getPrototypeOf(manager), "isFirstRun").mockReturnValue(false);
        useOnboarding().completeTour();
    });

    afterEach(function (): void {
        OnboardingManager.resetInstance();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("initial tourActive is false", function (): void {
        createRoot(function (): void {
            let store = useOnboarding();
            expect(store.tourActive()).toBe(false);
        });
    });

    it("startTour sets tourActive to true and calls manager.startTour", function (): void {
        createRoot(function (): void {
            let store = useOnboarding();
            store.startTour();
            expect(store.tourActive()).toBe(true);
            expect(startTourSpy).toHaveBeenCalled();
        });
    });

    it("completeTour sets tourActive to false and calls manager.completeTour", function (): void {
        createRoot(function (): void {
            let store = useOnboarding();
            store.startTour();
            store.completeTour();
            expect(store.tourActive()).toBe(false);
            expect(completeTourSpy).toHaveBeenCalled();
        });
    });

    it("isFirstRun delegates to manager.isFirstRun", function (): void {
        isFirstRunSpy.mockReturnValue(true);
        createRoot(function (): void {
            let store = useOnboarding();
            expect(store.isFirstRun()).toBe(true);
            expect(isFirstRunSpy).toHaveBeenCalled();
        });
    });

    it("isFirstRun returns false when manager returns false", function (): void {
        isFirstRunSpy.mockReturnValue(false);
        createRoot(function (): void {
            let store = useOnboarding();
            expect(store.isFirstRun()).toBe(false);
        });
    });

    it("store signals are shared across multiple useOnboarding calls", function (): void {
        createRoot(function (): void {
            let storeA = useOnboarding();
            let storeB = useOnboarding();
            storeA.startTour();
            expect(storeB.tourActive()).toBe(true);
        });
    });
});
