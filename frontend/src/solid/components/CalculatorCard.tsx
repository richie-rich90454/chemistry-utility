import type {JSX} from "solid-js";
import styles from "./CalculatorCard.module.css";
interface CalculatorCardProps {
    title: string;
    description: string;
    children: JSX.Element;
    exampleDetails?: JSX.Element;
    seeAlso?: JSX.Element;
}
function CalculatorCard(props: CalculatorCardProps): JSX.Element {
    return (
        <section class={styles.card}>
            <h2>{props.title}</h2>
            <div class={styles.toolContainer}>
                <p class={styles.toolDescription}>{props.description}</p>
            </div>
            {props.children}
            {props.exampleDetails}
            {props.seeAlso}
        </section>
    );
}
export {CalculatorCard};
