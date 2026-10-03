import type {CalculatorInfo} from "../../modules/navigationManager.js";
import {RuntimeDetector} from "../../modules/runtimeDetector.js";

/**
 * IDs of navigation entries that require a local server database
 * (user history, batch inputs, plugin registry). They are hidden on the
 * anonymous web build, which ships without any database: links are
 * removed from every nav surface and the routes render DesktopOnlyNotice.
 * Compound search is intentionally NOT listed here — it stays visible on
 * the web build via the stateless PubChem lookup endpoint.
 */
const DESKTOP_ONLY_IDS: readonly string[] = ["batch-calc", "dashboard"];

const DESKTOP_ONLY_ROUTES: readonly string[] = ["/batch-calc", "/dashboard"];

/** True in the desktop app (and unit tests), false on the anonymous web build. */
function isDesktop(): boolean {
    return !RuntimeDetector.getInstance().isWebMode;
}

function isDesktopOnlyId(id: string): boolean {
    return DESKTOP_ONLY_IDS.indexOf(id) !== -1;
}

function isDesktopOnlyRoute(path: string): boolean {
    return DESKTOP_ONLY_ROUTES.indexOf(path) !== -1;
}

/**
 * Removes desktop-only entries from a calculator list. Idempotent with
 * NavigationManager.getCalculators, which already filters in web mode —
 * every nav surface applies this so none depends on a single choke point.
 */
function visibleCalculators(all: CalculatorInfo[]): CalculatorInfo[] {
    if (isDesktop()) {
        return all;
    }
    return all.filter(function (calc: CalculatorInfo): boolean {
        return !isDesktopOnlyId(calc.id);
    });
}

export {DESKTOP_ONLY_IDS, DESKTOP_ONLY_ROUTES, isDesktop, isDesktopOnlyId, isDesktopOnlyRoute, visibleCalculators};
