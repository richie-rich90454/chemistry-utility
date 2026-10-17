import type {JSX} from "solid-js";
import styles from "./SkipLink.module.css";
function SkipLink(): JSX.Element {
    return (
        <a href="#main-content" class={styles.skipLink}>
            Skip to main content
        </a>
    );
}
export {SkipLink};
