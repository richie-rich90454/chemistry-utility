import type {JSX} from "solid-js";
import {createSignal, onMount, onCleanup, Show} from "solid-js";
import styles from "./ScrollTopButton.module.css";
function ScrollTopButton(): JSX.Element {
    let [visible, setVisible] = createSignal(false);
    function handleScroll(): void {
        if (window.scrollY > 200) {
            setVisible(true);
        }
        else {
            setVisible(false);
        }
    }
    function handleClick(): void {
        window.scrollTo({top: 0, behavior: "smooth"});
    }
    onMount(function (): void {
        window.addEventListener("scroll", handleScroll, {passive: true});
        handleScroll();
    });
    onCleanup(function (): void {
        window.removeEventListener("scroll", handleScroll);
    });
    return (
        <Show when={visible()} fallback={null}>
            <button class={styles.scrollTop} aria-label="Scroll to top" onClick={handleClick}>
                <svg width="20" height="20" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                </svg>
            </button>
        </Show>
    );
}
export {ScrollTopButton};
