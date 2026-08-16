import {Chart, registerables} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
let i: number;
for (i = 0; i < registerables.length; i++) {
    Chart.register(registerables[i]);
}
Chart.register(zoomPlugin);
export {Chart};
