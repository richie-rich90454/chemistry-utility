/**
 * Motion vocabulary.
 *
 * One scale for every animation in the app. Durations are seconds (GSAP's
 * unit); the CSS in styles/motion.css mirrors them as `--app-motion-*`
 * variables, so a JS tween and a CSS transition that fire together share the
 * same timing rather than each inventing its own.
 */

/** Durations, in seconds. */
const DURATION = {
    instant: 0.1,
    fast: 0.16,
    standard: 0.24,
    slow: 0.36,
    reveal: 0.52
};

/** Easing curves, mirrored by the CSS motion variables. */
const EASE = {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    enter: "cubic-bezier(0.32, 0.72, 0, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    spring: "cubic-bezier(0.34, 1.4, 0.64, 1)"
};

/** Delay between siblings that enter as a group, in seconds. */
const STAGGER = 0.045;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let reducedMotionCache: boolean | null = null;

/** True when the user asked for reduced motion. Read once and cached. */
function prefersReducedMotion(): boolean {
    if (reducedMotionCache === null) {
        try {
            reducedMotionCache = window.matchMedia(REDUCED_MOTION_QUERY).matches === true;
        }
        catch {
            reducedMotionCache = false;
        }
    }
    return reducedMotionCache;
}

export {DURATION, EASE, STAGGER, prefersReducedMotion};
