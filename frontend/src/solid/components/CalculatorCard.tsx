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
            <p class={styles.cardDescription}>{props.description}</p>
            {props.children}
            {props.exampleDetails && (
                <div class={styles.cardProse}>
                    {props.exampleDetails}
                </div>
            )}
            {props.seeAlso && (
                <div class={styles.cardSeeAlso}>
                    {props.seeAlso}
                </div>
            )}
        </section>
    );
}
export {CalculatorCard};
