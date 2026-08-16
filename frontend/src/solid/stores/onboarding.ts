import {createSignal} from "solid-js";
import {OnboardingManager} from "../../modules/onboardingManager.js";
interface OnboardingStore {
    tourActive: () => boolean;
    startTour: () => void;
    completeTour: () => void;
    isFirstRun: () => boolean;
}
let [tourActive, setTourActive] = createSignal(false);
function startTour(): void {
    setTourActive(true);
    OnboardingManager.getInstance().startTour();
}
function completeTour(): void {
    setTourActive(false);
    OnboardingManager.getInstance().completeTour();
}
function isFirstRun(): boolean {
    return OnboardingManager.getInstance().isFirstRun();
}
function useOnboarding(): OnboardingStore {
    return {
        tourActive: tourActive,
        startTour: startTour,
        completeTour: completeTour,
        isFirstRun: isFirstRun
    };
}
export {useOnboarding};
