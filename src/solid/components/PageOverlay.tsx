import type {JSX} from "solid-js";
import {createSignal, onMount, Show} from "solid-js";
import styles from "./PageOverlay.module.css";
function PageOverlay(): JSX.Element {
    let [loaded, setLoaded] = createSignal(false);
    let [removed, setRemoved] = createSignal(false);
    onMount(function (): void {
        setTimeout(function (): void {
            setLoaded(true);
        }, 300);
        setTimeout(function (): void {
            setRemoved(true);
        }, 800);
    });
    function getOverlayClass(): string {
        if (loaded()) {
            return styles.pageOverlay + " " + styles.loaded;
        }
        return styles.pageOverlay;
    }
    return (
        <Show when={!removed()} fallback={null}>
            <div class={getOverlayClass()}>
                <div class={styles.loader} />
            </div>
        </Show>
    );
}
export {PageOverlay};
