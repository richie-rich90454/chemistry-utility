import type {JSX} from "solid-js";
import {createEffect} from "solid-js";
import {useLocation} from "@solidjs/router";
import gsap from "gsap";
import {DURATION, EASE, prefersReducedMotion} from "../lib/motion";
const ROUTE_OFFSET = 12;
function RouteTransition(props: {children?: JSX.Element}): JSX.Element {
    let location = useLocation();
    let box: HTMLDivElement | undefined;
    // Every route change claims the next token so a superseded exit tween can
    // never swap stale content back in.
    let token = 0;
    let outTween: gsap.core.Tween | undefined;
    let inTween: gsap.core.Tween | undefined;
    /**
     * Animates the wrapper in. Children are never copied into a signal:
     * holding them would detach the hydrated DOM and break every delegated
     * event handler inside the route.
     */
    function reveal(): void {
        if (inTween !== undefined) {
            inTween.kill();
        }
        let node = box;
        if (node === undefined) {
            return;
        }
        if (prefersReducedMotion()) {
            gsap.set(node, {clearProps: "opacity,transform"});
            return;
        }
        inTween = gsap.fromTo(node,
            {opacity: 0, y: ROUTE_OFFSET},
            {opacity: 1, y: 0, duration: DURATION.emphasis, ease: EASE.enter, clearProps: "opacity,transform"});
    }
    let mounted = false;
    createEffect(function (): void {
        location.pathname;
        if (!mounted) {
            mounted = true;
            return;
        }
        let node = box;
        if (node === undefined || prefersReducedMotion()) {
            reveal();
            return;
        }
        token = token + 1;
        let mine = token;
        if (outTween !== undefined) {
            outTween.kill();
        }
        outTween = gsap.to(node, {
            opacity: 0,
            y: ROUTE_OFFSET,
            duration: DURATION.standard,
            ease: EASE.exit,
            onComplete: function (): void {
                if (mine !== token) {
                    return;
                }
                reveal();
            }
        });
    });
    return (
        <div class="route-transition" ref={box}>
            {props.children}
        </div>
    );
}
export {RouteTransition};
