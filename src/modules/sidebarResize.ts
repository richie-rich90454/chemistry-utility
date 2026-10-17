/**
 * Sidebar width constraints.
 *
 * Kept free of the DOM so the clamping rules can be unit tested directly and
 * reused by the store, the drag handle, and the keyboard controls.
 */

/** Smallest sidebar width, in pixels. */
const SIDEBAR_MIN_WIDTH = 200;
/** Largest sidebar width, in pixels. */
const SIDEBAR_MAX_WIDTH = 480;
/** Keyboard resize step, in pixels. */
const SIDEBAR_WIDTH_STEP = 16;
/** Most of the viewport the sidebar may take, as a fraction. */
const SIDEBAR_MAX_VIEWPORT_FRACTION = 0.4;
/** Viewport width assumed before the first client measurement. */
const ASSUMED_VIEWPORT_WIDTH = 1280;

/**
 * The upper bound for a given viewport: never below the minimum, never above
 * the absolute maximum, and never more than the viewport share.
 */
function sidebarMaxWidth(viewportWidth: number): number {
    let viewportLimit = Math.floor(viewportWidth * SIDEBAR_MAX_VIEWPORT_FRACTION);
    return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, viewportLimit));
}

/** Clamps a width into the allowed range for the viewport. */
function clampSidebarWidth(width: number, viewportWidth: number): number {
    if (!Number.isFinite(width)) {
        return SIDEBAR_MIN_WIDTH;
    }
    return Math.max(SIDEBAR_MIN_WIDTH, Math.min(sidebarMaxWidth(viewportWidth), Math.round(width)));
}

export {
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_MAX_WIDTH,
    SIDEBAR_WIDTH_STEP,
    SIDEBAR_MAX_VIEWPORT_FRACTION,
    ASSUMED_VIEWPORT_WIDTH,
    sidebarMaxWidth,
    clampSidebarWidth
};
