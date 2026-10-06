import type {JSX} from "solid-js";
import type {KatexOptions} from "katex";
import {onMount, onCleanup, createEffect} from "solid-js";
import katex from "katex";
import styles from "./KaTeX.module.css";
export interface KaTeXProps {
    expr: string;
    displayMode?: boolean;
    throwOnError?: boolean;
}
function KaTeX(props: KaTeXProps): JSX.Element {
    let containerRef: HTMLSpanElement | undefined;
    let firstEffectRun: boolean = true;
    function getOptions(): KatexOptions {
        let displayMode: boolean = props.displayMode !== undefined ? props.displayMode : false;
        let throwOnError: boolean = props.throwOnError !== undefined ? props.throwOnError : false;
        return {displayMode: displayMode, throwOnError: throwOnError};
    }
    function renderInto(expr: string): void {
        /* v8 ignore next -- Solid assigns the ref before onMount so containerRef is always set here; every mount test finds the span */
        if (containerRef === undefined) {
            return;
        }
        katex.render(expr, containerRef, getOptions());
    }
    onMount(function (): void {
        renderInto(props.expr);
    });
    createEffect(function (): void {
        let expr: string = props.expr;
        if (firstEffectRun) {
            firstEffectRun = false;
            return;
        }
        renderInto(expr);
    });
    onCleanup(function (): void {
        /* v8 ignore next -- the ref stays assigned for the component lifetime so containerRef is always set at cleanup */
        if (containerRef !== undefined) {
            containerRef.innerHTML = "";
        }
    });
    function getContainerClass(): string {
        if (props.displayMode) {
            return styles.katexContainer + " " + styles.katexDisplay;
        }
        return styles.katexContainer;
    }
    return (
        <span ref={function (el: HTMLSpanElement): void { containerRef = el; }} class={getContainerClass()} aria-label={"Math: " + props.expr} />
    );
}
export {KaTeX};
