import {renderToString, HydrationScript} from "solid-js/web";
import type {JSX} from "solid-js";
import {App} from "../solid/App.js";

/**
 * Renders one route to an HTML string for scripts/prerender.mjs. This renders
 * <App> exactly like the browser entry does — <Router> degrades to StaticRouter
 * on the server — so the SSR output and the client's first render are the same
 * tree and every hydration key matches. HydrationScript installs the event
 * registry hydrate() needs.
 */
function renderRoute(path: string): string {
    return renderToString(function (): JSX.Element {
        return (
            <>
                <App url={path} />
                <HydrationScript />
            </>
        );
    });
}

export {renderRoute};
