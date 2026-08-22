import type {JSX} from "solid-js";
import {Show} from "solid-js";
import {NavigationManager} from "../../modules/navigationManager.js";
import styles from "./ViewHeader.module.css";
interface ViewHeaderProps {
    title: string;
    category?: string;
    onBack?: () => void;
}
function ViewHeader(props: ViewHeaderProps): JSX.Element {
    function handleBack(): void {
        if (props.onBack !== undefined) {
            props.onBack();
        }
        else {
            NavigationManager.getInstance().navigateBack();
        }
    }
    return (
        <div class={styles.viewHeader}>
            <button class={styles.backButton} aria-label="Go back" onClick={handleBack}>
                <svg width="18" height="18" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
            <span class={styles.viewTitle}>{props.title}</span>
            <Show when={props.category !== undefined} fallback={null}>
                <span class={styles.viewCategory}>{props.category}</span>
            </Show>
        </div>
    );
}
export {ViewHeader};
