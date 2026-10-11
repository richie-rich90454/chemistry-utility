import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    BarController,
    BarElement,
    ScatterController,
    Title,
    Legend,
    Tooltip,
    Filler
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
// Targeted registration instead of Chart.register(registerables): only the
// controllers, elements, scales, and plugins the app renders are pulled into
// the bundle (line/bar/scatter charts with tooltips, legend, title, fill).
Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    BarController,
    BarElement,
    ScatterController,
    Title,
    Legend,
    Tooltip,
    Filler,
    zoomPlugin
);
export {Chart};
