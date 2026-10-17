import {createEffect, onCleanup} from "solid-js";
import {useLocation} from "@solidjs/router";
import {UrlStateManager} from "../../modules/urlStateManager.js";

/**
 * Route paths are calculator ids ("/dilution" -> "dilution"), so the query
 * string is the whole shareable state: one mounted instance covers every
 * calculator route.
 */
function calculatorIdFromPath(path: string): string {
    return path.replace(/^\/+|\/+$/g, "");
}

/**
 * Keeps every calculator's inputs in the query string so a link
 * reproduces the calculation exactly.
 *
 * Values are read from and written to the DOM by element id, which is what
 * both the plain inputs and the Solid-rendered CalculatorForm render, so no
 * route has to know this exists. Called once from the app shell.
 */
function useUrlState(): void {
    let manager = UrlStateManager.getInstance();
    // Server rendering has no document; the hook is a no-op there.
    if (typeof document === "undefined") {
        return;
    }
    let location = useLocation();
    createEffect(function (): void {
        let id = calculatorIdFromPath(location.pathname);
        if (id === "") {
            return;
        }
        let restored = manager.restoreState(id);
        if (restored !== null) {
            manager.fillInputs(id, restored);
            manager.updateUrlImmediate(id, manager.readInputsFromDom(id));
        }
    });
    function handleInput(): void {
        let id = calculatorIdFromPath(location.pathname);
        if (id === "") {
            return;
        }
        manager.updateUrl(id, manager.readInputsFromDom(id));
    }
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleInput);
    onCleanup(function (): void {
        document.removeEventListener("input", handleInput);
        document.removeEventListener("change", handleInput);
    });
}
export {useUrlState};
