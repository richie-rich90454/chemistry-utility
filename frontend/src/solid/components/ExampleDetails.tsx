import type {JSX} from "solid-js";
import styles from "./ExampleDetails.module.css";
interface ExampleDetailsProps {
    children: JSX.Element;
}
function ExampleDetails(props: ExampleDetailsProps): JSX.Element {
    return (
        <details class={styles.exampleDetails}>
            <summary>Show Example</summary>
            {props.children}
        </details>
    );
}
export {ExampleDetails};
