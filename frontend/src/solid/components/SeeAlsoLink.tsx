import type {JSX} from "solid-js";
import {Link} from "@solidjs/router";
import styles from "./SeeAlsoLink.module.css";
interface SeeAlsoLinkProps {
    href: string;
    children: JSX.Element;
}
function SeeAlsoLink(props: SeeAlsoLinkProps): JSX.Element {
    return (
        <p class={styles.seeAlso}>
            <Link href={props.href}>{props.children}</Link>
        </p>
    );
}
export {SeeAlsoLink};
