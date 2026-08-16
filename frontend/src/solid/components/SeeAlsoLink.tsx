import type {JSX} from "solid-js";
import styles from "./SeeAlsoLink.module.css";
interface SeeAlsoLinkProps {
    href: string;
    children: JSX.Element;
}
function SeeAlsoLink(props: SeeAlsoLinkProps): JSX.Element {
    return (
        <p class={styles.seeAlso}>
            <a href={props.href}>{props.children}</a>
        </p>
    );
}
export {SeeAlsoLink};
