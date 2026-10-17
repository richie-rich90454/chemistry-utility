import {createSignal} from "solid-js";
import {
    ASSUMED_VIEWPORT_WIDTH,
    clampSidebarWidth,
    sidebarMaxWidth
} from "../../modules/sidebarResize.js";

/**
 * Sidebar width preference.
 *
 * `null` means "use the stylesheet default"; a number pins the width in
 * pixels. The value is applied to the :root CSS variable that drives the
 * shell grid, so changing it moves the sidebar and the content together.
 */

const STORAGE_KEY = "chemutil:sidebar-width";
const CSS_VARIABLE = "--app-nav-width";

let [width, setWidthSignal] = createSignal<number | null>(null);
let [resizing, setResizingSignal] = createSignal(false);

/** The pinned width in pixels, or null for the stylesheet default. */
function sidebarWidth(): number | null {
    return width();
}

/** True while the user is dragging the resize handle. */
function isResizingSidebar(): boolean {
    return resizing();
}

function viewportWidth(): number {
    if (typeof window === "undefined") {
        return ASSUMED_VIEWPORT_WIDTH;
    }
    return window.innerWidth;
}

/** The largest allowed width for the current viewport. */
function maxSidebarWidth(): number {
    return sidebarMaxWidth(viewportWidth());
}

function applyWidth(value: number | null): void {
    let root = document.documentElement;
    if (value === null) {
        root.style.removeProperty(CSS_VARIABLE);
        return;
    }
    root.style.setProperty(CSS_VARIABLE, value + "px");
}

function readStoredWidth(): number | null {
    try {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) {
            return null;
        }
        let parsed = Number.parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}

function persist(value: number | null): void {
    try {
        if (value === null) {
            localStorage.removeItem(STORAGE_KEY);
        }
        else {
            localStorage.setItem(STORAGE_KEY, String(value));
        }
    }
    catch {
        // Storage can be unavailable (private mode, disabled cookies); the
        // width still applies for this session.
    }
}

/** Pins the sidebar width, clamped to the viewport, and remembers it. */
function setSidebarWidth(px: number): void {
    let clamped = clampSidebarWidth(px, viewportWidth());
    setWidthSignal(clamped);
    applyWidth(clamped);
    persist(clamped);
}

/** Returns to the stylesheet default width. */
function resetSidebarWidth(): void {
    setWidthSignal(null);
    applyWidth(null);
    persist(null);
}

/** Marks the drag state so the shell can disable its width transition. */
function setSidebarResizing(value: boolean): void {
    setResizingSignal(value);
}

/** Re-clamps a pinned width after the viewport changes. */
function clampSidebarWidthToViewport(): void {
    let current = width();
    if (current === null) {
        return;
    }
    let clamped = clampSidebarWidth(current, viewportWidth());
    if (clamped !== current) {
        setWidthSignal(clamped);
        applyWidth(clamped);
    }
}

/**
 * Applies the stored width and keeps it clamped on window resize. Returns a
 * disposer that removes the resize listener. Call from a client lifecycle.
 */
function initSidebarWidth(): () => void {
    let stored = readStoredWidth();
    if (stored !== null) {
        let clamped = clampSidebarWidth(stored, viewportWidth());
        setWidthSignal(clamped);
        applyWidth(clamped);
    }
    if (typeof window === "undefined") {
        return function (): void { return; };
    }
    window.addEventListener("resize", clampSidebarWidthToViewport);
    return function (): void {
        window.removeEventListener("resize", clampSidebarWidthToViewport);
    };
}

export {
    sidebarWidth,
    isResizingSidebar,
    maxSidebarWidth,
    setSidebarWidth,
    resetSidebarWidth,
    setSidebarResizing,
    clampSidebarWidthToViewport,
    initSidebarWidth
};
