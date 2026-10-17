import type {JSX} from "solid-js";
import {createEffect, createMemo, createSignal, onCleanup, onMount, For, Show} from "solid-js";
import {useOnboarding} from "../stores/onboarding";
import styles from "./OnboardingTour.module.css";

interface TargetBox {
    top: number;
    left: number;
    width: number;
    height: number;
}

const CARD_WIDTH = 340;
const CARD_ESTIMATED_HEIGHT = 210;
const CARD_GAP = 14;
const VIEWPORT_MARGIN = 16;

/**
 * First-run tour.
 *
 * Step one is the welcome card; the rest spotlight one piece of the shell at a
 * time. The highlighted element is left uncovered, so it stays readable and
 * interactive, and the scrim only dims the four regions around it. Leaving the
 * tour at any step marks it finished, so nobody is pushed into skipping it.
 */
function OnboardingTour(): JSX.Element {
    let store = useOnboarding();
    let dialogRef: HTMLDivElement | undefined;
    let previousFocus: HTMLElement | null = null;
    let [box, setBox] = createSignal<TargetBox | null>(null);

    let step = createMemo(function () {
        return store.steps[store.tourStep()];
    });

    onMount(function (): void {
        if (store.isFirstRun()) {
            store.startTour();
        }
    });

    /** Locates the step's target, or reports that the card should be centered. */
    function measure(): void {
        let selector = step().selector;
        if (selector === null) {
            setBox(null);
            return;
        }
        let target = document.querySelector(selector) as HTMLElement | null;
        if (target === null) {
            setBox(null);
            return;
        }
        let rect = target.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            setBox(null);
            return;
        }
        setBox({"top": rect.top, "left": rect.left, "width": rect.width, "height": rect.height});
    }

    // Re-measure when the step changes or the viewport moves under the tour.
    createEffect(function (): void {
        let active = store.tourActive();
        store.tourStep();
        if (!active) {
            return;
        }
        queueMicrotask(measure);
    });

    onMount(function (): void {
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        onCleanup(function (): void {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        });
    });

    // Move focus into the tour, keep Tab inside it, close on Escape, and
    // restore focus on close so keyboard users are never stranded.
    createEffect(function (): void {
        if (!store.tourActive()) {
            return;
        }
        previousFocus = document.activeElement as HTMLElement | null;
        function handleKey(e: KeyboardEvent): void {
            if (e.key === "Escape") {
                store.completeTour();
            }
            if (e.key === "Tab" && dialogRef !== undefined) {
                let focusables: NodeListOf<HTMLElement> = dialogRef.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
                /* v8 ignore next -- the tour always renders the Skip tour button, so focusables is never empty */
                if (focusables.length === 0) {
                    return;
                }
                let first: HTMLElement = focusables[0];
                let last: HTMLElement = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        document.addEventListener("keydown", handleKey);
        onCleanup(function (): void {
            document.removeEventListener("keydown", handleKey);
            if (previousFocus !== null && document.contains(previousFocus)) {
                previousFocus.focus();
            }
        });
    });

    /** The four scrim panels that leave the highlighted element uncovered. */
    function scrimPanels(): Array<{style: string}> {
        let target = box();
        if (target === null) {
            return [{"style": "inset: 0;"}];
        }
        let right = target.left + target.width;
        let bottom = target.top + target.height;
        return [
            {"style": "top: 0; left: 0; right: 0; height: " + target.top + "px;"},
            {"style": "top: " + bottom + "px; left: 0; right: 0; bottom: 0;"},
            {"style": "top: " + target.top + "px; left: 0; width: " + target.left + "px; height: " + target.height + "px;"},
            {"style": "top: " + target.top + "px; left: " + right + "px; right: 0; height: " + target.height + "px;"}
        ];
    }

    /** Places the card beside the target, flipping above it when there is no room. */
    function cardStyle(): string {
        let target = box();
        if (target === null) {
            return "";
        }
        let maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN);
        let left = Math.min(Math.max(VIEWPORT_MARGIN, target.left), maxLeft);
        let top = target.top + target.height + CARD_GAP;
        if (top + CARD_ESTIMATED_HEIGHT > window.innerHeight - VIEWPORT_MARGIN) {
            top = Math.max(VIEWPORT_MARGIN, target.top - CARD_ESTIMATED_HEIGHT - CARD_GAP);
        }
        return "top: " + top + "px; left: " + left + "px; width: " + CARD_WIDTH + "px;";
    }

    return (
        <Show when={store.tourActive()} fallback={null}>
            <div class={styles.tour} role="dialog" aria-modal="true" aria-label="Welcome tour" tabindex="-1" ref={function (el: HTMLDivElement): void {
                dialogRef = el;
                queueMicrotask(function (): void {
                    let focusTarget: HTMLElement | null = el.querySelector("button");
                    /* v8 ignore next -- the tour always renders the Skip tour button, so a button is always found */
                    if (focusTarget !== null) {
                        focusTarget.focus();
                    }
                    else {
                        el.focus();
                    }
                });
            }}>
                <div class={styles.scrim} aria-hidden="true">
                    <For each={scrimPanels()}>
                        {(panel) => <div class={styles.panel} style={panel.style} />}
                    </For>
                </div>
                <Show when={box()}>
                    {(target) => (
                        <div
                            class={styles.spotlight}
                            data-tour-spotlight=""
                            aria-hidden="true"
                            style={"top: " + target().top + "px; left: " + target().left + "px; width: " + target().width + "px; height: " + target().height + "px;"}
                        />
                    )}
                </Show>
                <div
                    class={box() === null ? styles.cardCentered : styles.cardDocked}
                    data-tour-card={box() === null ? "centered" : "docked"}
                    style={cardStyle()}
                >
                    <span class={styles.stepIndicator}>{String(store.tourStep() + 1) + " of " + String(store.steps.length)}</span>
                    <h2 class={styles.title}>{step().title}</h2>
                    <p class={styles.text}>{step().text}</p>
                    <div class={styles.actions}>
                        <button type="button" class={styles.ghostButton} onClick={function (): void { store.completeTour(); }}>Skip tour</button>
                        <Show when={store.tourStep() > 0}>
                            <button type="button" class={styles.ghostButton} onClick={function (): void { store.previousStep(); }}>Back</button>
                        </Show>
                        <button type="button" class={styles.primaryButton} onClick={function (): void { store.nextStep(); }}>
                            {store.tourStep() === store.steps.length - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
}
export {OnboardingTour};
