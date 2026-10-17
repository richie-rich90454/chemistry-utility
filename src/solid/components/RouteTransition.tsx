import type {JSX} from "solid-js";
import {onCleanup, onMount} from "solid-js";
import gsap from "gsap";
import {DURATION, EASE, STAGGER, prefersReducedMotion} from "../lib/motion";

const ENTER_OFFSET = 14;

/**
 * Route entrance.
 *
 * Children are never copied into a signal: holding them would detach the
 * hydrated DOM and break every delegated event handler inside the route.
 * Instead the entrance is driven by the render itself — a MutationObserver
 * waits for the route's blocks to actually mount, then rises them in DOM
 * order. Watching the DOM (rather than the location) means the animation
 * always targets the incoming content, even when a lazy route chunk resolves
 * later, and the first paint is left untouched so hydration does not
 * re-animate content the user can already see.
 */
function RouteTransition(props: {children?: JSX.Element}): JSX.Element {
    let box: HTMLDivElement | undefined;
    let enterTween: gsap.core.Tween | undefined;
    let observer: MutationObserver | undefined;
    let lastTargets: Element[] = [];

    /** The blocks that rise on entry: marked blocks, or the direct children. */
    function enterTargets(node: Element): Element[] {
        let marked = node.querySelectorAll("[data-motion='enter']");
        if (marked.length > 0) {
            return Array.from(marked);
        }
        return Array.from(node.children);
    }

    function sameTargets(next: Element[]): boolean {
        if (next.length !== lastTargets.length) {
            return false;
        }
        let i: number;
        for (i = 0; i < next.length; i++) {
            if (next[i] !== lastTargets[i]) {
                return false;
            }
        }
        return true;
    }

    function reveal(targets: Element[]): void {
        if (enterTween !== undefined) {
            enterTween.kill();
            enterTween = undefined;
        }
        if (targets.length === 0) {
            return;
        }
        if (prefersReducedMotion()) {
            gsap.set(targets, {clearProps: "opacity,transform"});
            return;
        }
        enterTween = gsap.fromTo(targets,
            {opacity: 0, y: ENTER_OFFSET},
            {opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.enter, stagger: STAGGER, clearProps: "opacity,transform"});
    }

    /** Runs after the route's blocks have mounted, once per render batch. */
    function handleMutations(): void {
        queueMicrotask(function (): void {
            /* v8 ignore next 3 -- box is assigned by the render-time function ref */
            if (box === undefined) {
                return;
            }
            let next = enterTargets(box);
            if (sameTargets(next)) {
                return;
            }
            lastTargets = next;
            reveal(next);
        });
    }

    onMount(function (): void {
        /* v8 ignore next 3 -- box is assigned by the render-time function ref */
        if (box === undefined) {
            return;
        }
        lastTargets = enterTargets(box);
        observer = new MutationObserver(handleMutations);
        observer.observe(box, {"childList": true, "subtree": true});
    });

    onCleanup(function (): void {
        /* v8 ignore next 3 -- onMount always installs the observer */
        if (observer !== undefined) {
            observer.disconnect();
        }
        if (enterTween !== undefined) {
            enterTween.kill();
        }
    });

    return (
        <div class="route-transition" ref={function (el: HTMLDivElement): void { box = el; }}>
            {props.children}
        </div>
    );
}
export {RouteTransition};
