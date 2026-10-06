import type {JSX} from "solid-js";
import {createEffect, onCleanup, onMount, Show} from "solid-js";
import {useOnboarding} from "../stores/onboarding";
import styles from "./OnboardingTour.module.css";
function OnboardingTour(): JSX.Element {
    let store = useOnboarding();
    let dialogRef: HTMLDivElement | undefined;
    let previousFocus: HTMLElement | null = null;
    onMount(function (): void {
        if (store.isFirstRun()) {
            store.startTour();
        }
    });
    // Move focus into the dialog when it opens, close on Escape, and
    // restore focus on close so keyboard users are never stranded.
    // Focus happens in the dialog ref callback (which fires at DOM commit)
    // rather than the effect below: the effect re-runs before <Show> commits
    // the dialog, so focusing there never lands (verified by test probes).
    // The ref callback itself defers a microtask because the ref fires while
    // the dialog subtree is still detached, when focus() is a no-op.
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
                /* v8 ignore next -- the tour dialog always renders the Skip tour button, so focusables is never empty */
                if (focusables.length === 0) {
                    return;
                }
                let first: HTMLElement = focusables[0];
                let last: HTMLElement = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
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
    return (
        <Show when={store.tourActive()} fallback={null}>
            <div class={styles.onboardingOverlay} role="dialog" aria-modal="true" aria-label="Welcome tour" ref={function (el: HTMLDivElement): void {
                dialogRef = el;
                queueMicrotask(function (): void {
                    let focusTarget: HTMLElement | null = el.querySelector("button");
                    /* v8 ignore next -- the tour dialog always renders the Skip tour button, so a button is always found */
                    if (focusTarget !== null) {
                        focusTarget.focus();
                    } else {
                        el.focus();
                    }
                });
            }} tabindex="-1">
                <div class={styles.welcomeCard}>
                    <h2 class={styles.welcomeTitle}>Welcome to Chemistry Utility</h2>
                    <p class={styles.welcomeText}>A guided tour is now showing key features. Follow the prompts to learn how to use the calculator sidebar, search, theme toggle, and navigation.</p>
                    <div class={styles.welcomeActions}>
                        <button type="button" class={styles.skipButton} onClick={function (): void { store.completeTour(); }}>Skip tour</button>
                    </div>
                </div>
            </div>
        </Show>
    );
}
export {OnboardingTour};
