import type {JSX} from "solid-js";
import {onMount, Show} from "solid-js";
import {useOnboarding} from "../stores/onboarding";
import styles from "./OnboardingTour.module.css";
function OnboardingTour(): JSX.Element {
    let store = useOnboarding();
    onMount(function (): void {
        if (store.isFirstRun()) {
            store.startTour();
        }
    });
    return (
        <Show when={store.tourActive()} fallback={null}>
            <div class={styles.onboardingOverlay} role="dialog" aria-modal="true" aria-label="Welcome tour">
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
