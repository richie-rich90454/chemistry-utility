import gsap from "gsap";
import {onCleanup} from "solid-js";
import {DURATION, EASE, STAGGER, prefersReducedMotion} from "./motion";
interface UseGsapReturn {
    animateIn: (element: Element, vars?: gsap.TweenVars) => gsap.core.Tween;
    animateOut: (element: Element, vars?: gsap.TweenVars) => gsap.core.Tween;
    fromTo: (element: Element, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => gsap.core.Tween;
    animateCountUp: (element: Element, from: number, to: number, duration: number, format?: (value: number) => string) => gsap.core.Tween | undefined;
    animateStagger: (elements: Element[], vars?: gsap.TweenVars, stagger?: number) => gsap.core.Tween | undefined;
    animatePop: (element: Element) => gsap.core.Tween | undefined;
}
const STAGGER_DEFAULTS: gsap.TweenVars = {opacity: 0, y: 12, duration: DURATION.standard, ease: EASE.enter};
const ENTER_DEFAULTS: gsap.TweenVars = {opacity: 0, y: 12, duration: DURATION.standard, ease: EASE.enter};
const EXIT_DEFAULTS: gsap.TweenVars = {opacity: 0, y: -12, duration: DURATION.fast, ease: EASE.exit};
const POP_DEFAULTS: gsap.TweenVars = {scale: 1.05, duration: DURATION.fast, ease: EASE.spring, clearProps: "transform"};
function rawNumber(value: number): string {
    return String(value);
}
function useGsap(): UseGsapReturn {
    let tweens: gsap.core.Tween[] = [];
    function record(tween: gsap.core.Tween): gsap.core.Tween {
        tweens.push(tween);
        return tween;
    }
    function animateIn(element: Element, vars?: gsap.TweenVars): gsap.core.Tween {
        let merged: gsap.TweenVars = vars ? Object.assign({}, ENTER_DEFAULTS, vars) : ENTER_DEFAULTS;
        return record(gsap.from(element, merged));
    }
    function animateOut(element: Element, vars?: gsap.TweenVars): gsap.core.Tween {
        let merged: gsap.TweenVars = vars ? Object.assign({}, EXIT_DEFAULTS, vars) : EXIT_DEFAULTS;
        return record(gsap.to(element, merged));
    }
    function fromTo(element: Element, fromVars: gsap.TweenVars, toVars: gsap.TweenVars): gsap.core.Tween {
        return record(gsap.fromTo(element, fromVars, toVars));
    }
    function animateCountUp(element: Element, from: number, to: number, duration: number, format?: (value: number) => string): gsap.core.Tween | undefined {
        let render: (value: number) => string = format !== undefined ? format : rawNumber;
        if (prefersReducedMotion()) {
            element.textContent = render(to);
            return undefined;
        }
        let proxy = {"value": from};
        return record(gsap.to(proxy, {
            "value": to,
            "duration": duration,
            "ease": EASE.enter,
            "onUpdate": function (): void {
                element.textContent = render(proxy.value);
            }
        }));
    }
    function animateStagger(elements: Element[], vars?: gsap.TweenVars, stagger?: number): gsap.core.Tween | undefined {
        let merged: gsap.TweenVars = vars ? Object.assign({}, STAGGER_DEFAULTS, vars) : STAGGER_DEFAULTS;
        if (prefersReducedMotion()) {
            let finalState: gsap.TweenVars = Object.assign({}, merged);
            delete finalState.duration;
            delete finalState.delay;
            delete finalState.ease;
            gsap.set(elements, finalState);
            return undefined;
        }
        let step: number = stagger !== undefined ? stagger : STAGGER;
        return record(gsap.to(elements, Object.assign({}, merged, {"stagger": step})));
    }
    function animatePop(element: Element): gsap.core.Tween | undefined {
        if (prefersReducedMotion()) {
            return undefined;
        }
        return record(gsap.from(element, POP_DEFAULTS));
    }
    onCleanup(function (): void {
        let i: number;
        for (i = 0; i < tweens.length; i++) {
            tweens[i].kill();
        }
        tweens = [];
    });
    return {animateIn: animateIn, animateOut: animateOut, fromTo: fromTo, animateCountUp: animateCountUp, animateStagger: animateStagger, animatePop: animatePop};
}
export {useGsap};
