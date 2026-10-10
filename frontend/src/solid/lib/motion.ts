const DURATION = {
    micro: 0.12,
    standard: 0.24,
    emphasis: 0.38,
    reveal: 0.52
};

const EASE = {
    enter: "cubic-bezier(0.32, 0.72, 0, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)"
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let reducedMotionCache: boolean | null = null;

function prefersReducedMotion(): boolean {
    if (reducedMotionCache === null) {
        try {
            reducedMotionCache = window.matchMedia(REDUCED_MOTION_QUERY).matches === true;
        } catch {
            reducedMotionCache = false;
        }
    }
    return reducedMotionCache;
}

export {DURATION, EASE, prefersReducedMotion};
