import type {JSX} from "solid-js";
import {createEffect} from "solid-js";
import {NumberFormatter} from "../../modules/i18n/numberFormatter.js";
import {useGsap} from "../lib/useGsap";
const COUNT_UP_DURATION = 0.3;
interface NumberSpan {
    start: number;
    end: number;
    value: number;
    decimals: number;
}
function findLastNumber(text: string): NumberSpan | null {
    let pattern = /-?\d+(?:\.\d+)?/g;
    let last: RegExpExecArray | null = null;
    let match: RegExpExecArray | null = pattern.exec(text);
    while (match !== null) {
        last = match;
        match = pattern.exec(text);
    }
    if (last === null) {
        return null;
    }
    let raw: string = last[0];
    let value: number = parseFloat(raw);
    if (!isFinite(value)) {
        return null;
    }
    let dot: number = raw.indexOf(".");
    return {
        start: last.index,
        end: last.index + raw.length,
        value: value,
        decimals: dot === -1 ? 0 : raw.length - dot - 1
    };
}
function CountUpText(props: {value: () => string}): JSX.Element {
    let spanRef: HTMLSpanElement | undefined;
    let api = useGsap();
    let mounted = false;
    createEffect(function (): void {
        let next: string = props.value();
        let element = spanRef;
        if (element === undefined) {
            return;
        }
        if (!mounted) {
            mounted = true;
            element.textContent = next;
            return;
        }
        if (element.textContent === next) {
            return;
        }
        let target: NumberSpan | null = findLastNumber(next);
        let previous: NumberSpan | null = findLastNumber(element.textContent);
        if (target === null || previous === null) {
            element.textContent = next;
            return;
        }
        let prefix: string = next.slice(0, target.start);
        let suffix: string = next.slice(target.end);
        let formatter: NumberFormatter = NumberFormatter.createFromCurrentLocale();
        api.animateCountUp(element, previous.value, target.value, COUNT_UP_DURATION, function (value: number): string {
            return prefix + formatter.format(value, target.decimals) + suffix;
        });
    });
    return <span ref={spanRef} />;
}
export {CountUpText};
