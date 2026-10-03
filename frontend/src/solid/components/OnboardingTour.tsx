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
    createEffect(function (): void {
        if (!store.tourActive()) {
            return;
        }
        previousFocus = document.activeElement as HTMLElement | null;
        let dialog: HTMLDivElement | undefined = dialogRef;
        if (dialog !== undefined) {
            let focusTarget: HTMLElement | null = dialog.querySelector("button");
            if (focusTarget !== null) {
                focusTarget.focus();
            } else {
                dialog.focus();
            }
        }
        function handleKey(e: KeyboardEvent): void {
            if (e.key === "Escape") {
                store.completeTour();
            }
            if (e.key === "Tab" && dialogRef !== undefined) {
                let focusables: NodeListOf<HTMLElement> = dialogRef.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
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
            <div class={styles.onboardingOverlay} role="dialog" aria-modal="true" aria-label="Welcome tour" ref={dialogRef} tabindex="-1">
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
