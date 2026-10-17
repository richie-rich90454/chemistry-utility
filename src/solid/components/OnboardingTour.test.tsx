import {render, fireEvent, cleanup, waitFor} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import {OnboardingTour} from "./OnboardingTour";
import {useOnboarding} from "../stores/onboarding";
import styles from "./OnboardingTour.module.css";

/** The tour's first spotlight step targets the sidebar. */
function TourHost(): JSX.Element {
    return (
        <>
            <div data-tour="sidebar" id="tour-target" />
            <OnboardingTour />
        </>
    );
}

/** Lets a test open the tour by hand, mirroring the real "show me the tour" entry. */
function ManualHost(): JSX.Element {
    let store = useOnboarding();
    return (
        <>
            <div data-tour="sidebar" id="tour-target" />
            <button id="outside" type="button" onClick={function (): void { store.startTour(); }}>Show the tour</button>
            <OnboardingTour />
        </>
    );
}

const Q = (name: string): string => "." + styles[name as keyof typeof styles];

function stubRect(top: number, left: number, width: number, height: number): void {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        "top": top, "left": left, "width": width, "height": height,
        "bottom": top + height, "right": left + width, "x": left, "y": top,
        "toJSON": function (): Record<string, number> { return {}; }
    } as DOMRect);
}

async function openTour(): Promise<ReturnType<typeof render>> {
    let result = render(function (): JSX.Element { return <TourHost />; });
    await waitFor(function (): void {
        expect(result.queryByRole("dialog")).not.toBeNull();
    });
    return result;
}

async function advanceTo(result: ReturnType<typeof render>, target: number): Promise<void> {
    let guard = 0;
    while (useOnboarding().tourStep() < target && guard < 10) {
        fireEvent.click(result.getByRole("button", {"name": "Next"}));
        guard++;
    }
}

describe("OnboardingTour", function (): void {
    beforeEach(function (): void {
        useOnboarding().completeTour();
        localStorage.clear();
        document.body.innerHTML = "";
    });

    afterEach(function (): void {
        cleanup();
        useOnboarding().completeTour();
        localStorage.clear();
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    it("opens on the welcome step for a first-time visitor and settles focus inside", async function (): Promise<void> {
        let result = await openTour();
        expect(result.getByText("Welcome to Chemistry Utility")).toBeTruthy();
        expect(result.getByText("1 of 5")).toBeTruthy();
        await waitFor(function (): void {
            expect(document.activeElement).toBe(result.getByRole("button", {"name": "Skip tour"}));
        });
    });

    it("stays closed for a returning visitor", function (): void {
        localStorage.setItem("onboarding-complete", "true");
        let result = render(function (): JSX.Element { return <TourHost />; });
        expect(result.queryByRole("dialog")).toBeNull();
    });

    it("can be opened by hand even on a repeat visit", function (): void {
        localStorage.setItem("onboarding-complete", "true");
        let result = render(function (): JSX.Element { return <ManualHost />; });
        expect(result.queryByRole("dialog")).toBeNull();
        fireEvent.click(result.getByRole("button", {"name": "Show the tour"}));
        expect(result.getByText("Welcome to Chemistry Utility")).toBeTruthy();
    });

    it("dims the whole viewport on the welcome step, with no spotlight", async function (): Promise<void> {
        let result = await openTour();
        expect(result.container.querySelectorAll(Q("panel")).length).toBe(1);
        expect(result.container.querySelector(Q("spotlight"))).toBeNull();
        expect(result.container.querySelector(Q("cardCentered"))).not.toBeNull();
    });

    it("advances from the welcome card into the spotlight steps", async function (): Promise<void> {
        let result = await openTour();
        stubRect(100, 20, 200, 40);
        fireEvent.click(result.getByRole("button", {"name": "Next"}));
        await waitFor(function (): void {
            expect(result.getByText("2 of 5")).toBeTruthy();
        });
        expect(result.getByText("Every calculator in one list")).toBeTruthy();
        // Four panels carve the highlighted element out of the scrim.
        expect(result.container.querySelectorAll(Q("panel")).length).toBe(4);
        let spotlight = result.container.querySelector(Q("spotlight")) as HTMLElement | null;
        expect(spotlight).not.toBeNull();
        expect((spotlight as HTMLElement).getAttribute("style")).toContain("top: 100px");
        expect(result.container.querySelector(Q("cardDocked"))).not.toBeNull();
    });

    it("docks the card below the target when there is room", async function (): Promise<void> {
        let result = await openTour();
        stubRect(100, 20, 200, 40);
        fireEvent.click(result.getByRole("button", {"name": "Next"}));
        await waitFor(function (): void {
            expect(result.container.querySelector(Q("cardDocked"))).not.toBeNull();
        });
        let card = result.container.querySelector(Q("cardDocked")) as HTMLElement;
        expect(card.getAttribute("style")).toContain("top: 154px");
    });

    it("flips the card above a target near the bottom edge and clamps it to the viewport", async function (): Promise<void> {
        let result = await openTour();
        stubRect(700, 900, 120, 60);
        fireEvent.click(result.getByRole("button", {"name": "Next"}));
        await waitFor(function (): void {
            expect(result.container.querySelector(Q("cardDocked"))).not.toBeNull();
        });
        let card = result.container.querySelector(Q("cardDocked")) as HTMLElement;
        let style = card.getAttribute("style") ?? "";
        expect(style).toContain("top: 476px");
        expect(style).toContain("left: 668px");
    });

    it("centers the card when the step's target is missing", async function (): Promise<void> {
        let result = await openTour();
        stubRect(0, 0, 0, 0);
        fireEvent.click(result.getByRole("button", {"name": "Next"}));
        await waitFor(function (): void {
            expect(result.getByText("2 of 5")).toBeTruthy();
        });
        expect(result.container.querySelector(Q("spotlight"))).toBeNull();
        expect(result.container.querySelector(Q("cardCentered"))).not.toBeNull();
    });

    it("re-measures when the viewport moves", async function (): Promise<void> {
        let result = await openTour();
        stubRect(100, 20, 200, 40);
        await advanceTo(result, 1);
        await waitFor(function (): void {
            expect(result.container.querySelector(Q("spotlight"))).not.toBeNull();
        });
        stubRect(300, 30, 200, 40);
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("scroll"));
        await waitFor(function (): void {
            let spotlight = result.container.querySelector(Q("spotlight")) as HTMLElement | null;
            expect((spotlight as HTMLElement).getAttribute("style")).toContain("top: 300px");
        });
    });

    it("goes back to the welcome card", async function (): Promise<void> {
        let result = await openTour();
        stubRect(100, 20, 200, 40);
        await advanceTo(result, 1);
        await waitFor(function (): void {
            expect(result.getByRole("button", {"name": "Back"})).toBeTruthy();
        });
        fireEvent.click(result.getByRole("button", {"name": "Back"}));
        await waitFor(function (): void {
            expect(result.getByText("1 of 5")).toBeTruthy();
        });
    });

    it("finishes from the last step and remembers the choice", async function (): Promise<void> {
        let result = await openTour();
        await advanceTo(result, 4);
        await waitFor(function (): void {
            expect(result.getByText("5 of 5")).toBeTruthy();
        });
        fireEvent.click(result.getByRole("button", {"name": "Finish"}));
        await waitFor(function (): void {
            expect(result.queryByRole("dialog")).toBeNull();
        });
        expect(localStorage.getItem("onboarding-complete")).toBe("true");
    });

    it("leaves the tour from any step with Skip tour", async function (): Promise<void> {
        let result = await openTour();
        stubRect(100, 20, 200, 40);
        await advanceTo(result, 2);
        await waitFor(function (): void {
            expect(result.getByText("3 of 5")).toBeTruthy();
        });
        fireEvent.click(result.getByRole("button", {"name": "Skip tour"}));
        await waitFor(function (): void {
            expect(result.queryByRole("dialog")).toBeNull();
        });
        expect(localStorage.getItem("onboarding-complete")).toBe("true");
    });

    it("closes on Escape", async function (): Promise<void> {
        let result = await openTour();
        document.dispatchEvent(new KeyboardEvent("keydown", {"key": "Escape", "bubbles": true}));
        await waitFor(function (): void {
            expect(result.queryByRole("dialog")).toBeNull();
        });
    });

    it("ignores keys that are neither Escape nor Tab", async function (): Promise<void> {
        let result = await openTour();
        document.dispatchEvent(new KeyboardEvent("keydown", {"key": "a", "bubbles": true}));
        expect(result.queryByRole("dialog")).not.toBeNull();
    });

    it("keeps Tab inside the tour", async function (): Promise<void> {
        let result = await openTour();
        let next = result.getByRole("button", {"name": "Next"});
        await waitFor(function (): void {
            expect(document.activeElement).toBe(result.getByRole("button", {"name": "Skip tour"}));
        });
        next.focus();
        let wrapEvent = new KeyboardEvent("keydown", {"key": "Tab", "bubbles": true, "cancelable": true});
        document.dispatchEvent(wrapEvent);
        expect(wrapEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(result.getByRole("button", {"name": "Skip tour"}));

        let skip = result.getByRole("button", {"name": "Skip tour"});
        skip.focus();
        let shiftEvent = new KeyboardEvent("keydown", {"key": "Tab", "shiftKey": true, "bubbles": true, "cancelable": true});
        document.dispatchEvent(shiftEvent);
        expect(shiftEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(next);
    });

    it("does not wrap when focus is outside the ends of the tour", async function (): Promise<void> {
        let result = await openTour();
        let dialog = result.getByRole("dialog") as HTMLElement;
        dialog.focus();
        let plainTab = new KeyboardEvent("keydown", {"key": "Tab", "bubbles": true, "cancelable": true});
        document.dispatchEvent(plainTab);
        expect(plainTab.defaultPrevented).toBe(false);
        let shiftTab = new KeyboardEvent("keydown", {"key": "Tab", "shiftKey": true, "bubbles": true, "cancelable": true});
        document.dispatchEvent(shiftTab);
        expect(shiftTab.defaultPrevented).toBe(false);
    });

    it("restores focus to the control that opened the tour", async function (): Promise<void> {
        localStorage.setItem("onboarding-complete", "true");
        let result = render(function (): JSX.Element { return <ManualHost />; });
        let opener = result.getByRole("button", {"name": "Show the tour"}) as HTMLElement;
        opener.focus();
        fireEvent.click(opener);
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).not.toBeNull();
        });
        fireEvent.click(result.getByRole("button", {"name": "Skip tour"}));
        await waitFor(function (): void {
            expect(result.queryByRole("dialog")).toBeNull();
        });
        expect(document.activeElement).toBe(opener);
    });

    it("skips focus restore when the opener is gone", async function (): Promise<void> {
        localStorage.setItem("onboarding-complete", "true");
        let result = render(function (): JSX.Element { return <ManualHost />; });
        let opener = result.getByRole("button", {"name": "Show the tour"}) as HTMLElement;
        opener.focus();
        fireEvent.click(opener);
        await waitFor(function (): void {
            expect(result.getByRole("dialog")).not.toBeNull();
        });
        opener.remove();
        expect(function (): void {
            fireEvent.click(result.getByRole("button", {"name": "Skip tour"}));
        }).not.toThrow();
    });
});
