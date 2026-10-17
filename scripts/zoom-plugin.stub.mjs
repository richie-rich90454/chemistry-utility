/**
 * Inert stand-in for chartjs-plugin-zoom, used only by the prerender build
 * (scripts/prerender.mjs aliases the real package to this file). The zoom
 * plugin pulls in hammerjs, which needs a real window at import time, and no
 * chart is ever instantiated while prerendering. The client bundle keeps the
 * real plugin.
 */
export default {};
