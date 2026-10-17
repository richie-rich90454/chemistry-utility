import {createSignal} from "solid-js";

/**
 * First-run tour.
 *
 * The tour is a short, ordered set of steps. Step one is the welcome card and
 * the rest spotlight a piece of the shell. The tour is the only thing that
 * decides when it is showing, so the welcome and the spotlight steps share one
 * flow instead of two overlays competing for the screen.
 */

const ONBOARDING_KEY = "onboarding-complete";

interface TourStep {
    /** CSS selector to spotlight, or null for the centered welcome card. */
    selector: string | null;
    title: string;
    text: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        "selector": null,
        "title": "Welcome to Chemistry Utility",
        "text": "This is a two-minute tour of the workspace: the calculator list, search, the theme control, and how to open a calculator. You can leave at any point."
    },
    {
        "selector": "[data-tour='sidebar']",
        "title": "Every calculator in one list",
        "text": "The sidebar groups every calculator by topic. Each one keeps its inputs in the URL, so a link reproduces a calculation exactly."
    },
    {
        "selector": "[data-tour='sidebar-search'] input",
        "title": "Find a calculator quickly",
        "text": "Type a name, a topic, or a keyword and the list filters as you type."
    },
    {
        "selector": "#theme-toggle",
        "title": "Light or dark",
        "text": "Switch between the light, dark, and AMOLED themes here. Your choice is remembered on this device."
    },
    {
        "selector": "[data-tour='sidebar-nav'] a",
        "title": "You are ready",
        "text": "Open any calculator to begin. Results update as you type, and everything stays on your machine."
    }
];

let [tourActive, setTourActive] = createSignal(false);
let [tourStep, setTourStep] = createSignal(0);

interface OnboardingStore {
    steps: TourStep[];
    tourActive: () => boolean;
    tourStep: () => number;
    isFirstRun: () => boolean;
    startTour: () => void;
    nextStep: () => void;
    previousStep: () => void;
    completeTour: () => void;
}

/** True when the visitor has never finished or skipped the tour. */
function isFirstRun(): boolean {
    try {
        return localStorage.getItem(ONBOARDING_KEY) === null;
    }
    catch {
        return true;
    }
}

function rememberCompletion(): void {
    try {
        localStorage.setItem(ONBOARDING_KEY, "true");
    }
    catch {
        // Storage can be unavailable; the tour simply offers itself again.
    }
}

function startTour(): void {
    setTourStep(0);
    setTourActive(true);
}

function nextStep(): void {
    if (tourStep() >= TOUR_STEPS.length - 1) {
        completeTour();
        return;
    }
    setTourStep(tourStep() + 1);
}

function previousStep(): void {
    if (tourStep() > 0) {
        setTourStep(tourStep() - 1);
    }
}

function completeTour(): void {
    setTourActive(false);
    setTourStep(0);
    rememberCompletion();
}

function useOnboarding(): OnboardingStore {
    return {
        "steps": TOUR_STEPS,
        "tourActive": tourActive,
        "tourStep": tourStep,
        "isFirstRun": isFirstRun,
        "startTour": startTour,
        "nextStep": nextStep,
        "previousStep": previousStep,
        "completeTour": completeTour
    };
}

export {useOnboarding, TOUR_STEPS};
export type {TourStep};
