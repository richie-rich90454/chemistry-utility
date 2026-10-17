import type {JSX} from "solid-js";
import {createSignal, onCleanup, onMount} from "solid-js";
import {
    ASSUMED_VIEWPORT_WIDTH,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_WIDTH_STEP,
    sidebarMaxWidth
} from "../../modules/sidebarResize.js";
import {
    setSidebarWidth,
    resetSidebarWidth,
    maxSidebarWidth,
    setSidebarResizing,
    isResizingSidebar
} from "../stores/sidebarWidth";
import styles from "./SidebarResizer.module.css";

/** Two presses within this window count as a reset gesture, in ms. */
const DOUBLE_PRESS_MS = 350;

/**
 * Drag handle that resizes the sidebar.
 *
 * The handle lives in its own grid column beside the sidebar, so it never
 * overlaps the sidebar's scrollbar. Dragging and the arrow keys both route
 * through the sidebar-width store, which clamps to the viewport and persists
 * the choice.
 */
function SidebarResizer(): JSX.Element {
    // Assigned by the render-time function ref, before any handler can run.
    let element!: HTMLDivElement;
    let dragging = false;
    let pointerStartX = 0;
    let widthStart = 0;
    let lastPointerDown = Number.NEGATIVE_INFINITY;
    // Server-rendered defaults keep hydration stable; measure() runs onMount.
    let [current, setCurrent] = createSignal(0);
    let [max, setMax] = createSignal(sidebarMaxWidth(ASSUMED_VIEWPORT_WIDTH));

    function measure(): void {
        setCurrent(Math.round(element.getBoundingClientRect().left));
        setMax(maxSidebarWidth());
    }

    onMount(function (): void {
        measure();
        window.addEventListener("resize", measure);
        onCleanup(function (): void {
            window.removeEventListener("resize", measure);
        });
    });

    function handlePointerDown(e: PointerEvent): void {
        if (e.button !== 0) {
            return;
        }
        // Two presses in quick succession reset to the default width. Folding
        // it into pointerdown keeps the gesture working even though the drag
        // suppresses the compatibility mouse events (and so the dblclick).
        let isDoublePress = e.timeStamp - lastPointerDown < DOUBLE_PRESS_MS;
        lastPointerDown = e.timeStamp;
        if (isDoublePress) {
            resetSidebarWidth();
            measure();
            return;
        }
        dragging = true;
        pointerStartX = e.clientX;
        widthStart = element.getBoundingClientRect().left;
        element.setPointerCapture(e.pointerId);
        setSidebarResizing(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    }

    function handlePointerMove(e: PointerEvent): void {
        if (!dragging) {
            return;
        }
        setSidebarWidth(widthStart + (e.clientX - pointerStartX));
        measure();
    }

    function handlePointerUp(e: PointerEvent): void {
        if (!dragging) {
            return;
        }
        dragging = false;
        element.releasePointerCapture(e.pointerId);
        setSidebarResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        measure();
    }

    function handleKeyDown(e: KeyboardEvent): void {
        let next: number;
        if (e.key === "ArrowLeft") {
            next = current() - SIDEBAR_WIDTH_STEP;
        }
        else if (e.key === "ArrowRight") {
            next = current() + SIDEBAR_WIDTH_STEP;
        }
        else if (e.key === "Home") {
            next = SIDEBAR_MIN_WIDTH;
        }
        else if (e.key === "End") {
            next = maxSidebarWidth();
        }
        else {
            return;
        }
        e.preventDefault();
        setSidebarWidth(next);
        measure();
    }

    return (
        <div
            ref={function (el: HTMLDivElement): void { element = el; }}
            class={"app-resizer " + styles.resizer}
            role="separator"
            tabIndex={0}
            aria-label="Resize sidebar"
            aria-orientation="vertical"
            aria-valuenow={current()}
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={max()}
            data-resizing={isResizingSidebar() ? "" : undefined}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
        />
    );
}

export {SidebarResizer};
