import {describe, it, expect, vi} from "vitest";
vi.mock("chart.js", function () {
    return {
        Chart: {register: vi.fn()},
        registerables: [{id: "alpha"}, {id: "beta"}]
    };
});
vi.mock("chartjs-plugin-zoom", function () {
    return {default: {id: "zoom"}};
});
import {Chart} from "chart.js";
import "./registerChartPlugins.js";
function getRegisterFn(): ReturnType<typeof vi.fn> {
    let chart = Chart as unknown as {register: ReturnType<typeof vi.fn>};
    return chart.register;
}
describe("registerChartPlugins", function (): void {
    it("registers each registerable item with Chart.register", function (): void {
        let register = getRegisterFn();
        expect(register).toHaveBeenCalledWith({id: "alpha"});
        expect(register).toHaveBeenCalledWith({id: "beta"});
    });
    it("registers the zoom plugin with Chart.register", function (): void {
        let register = getRegisterFn();
        expect(register).toHaveBeenCalledWith({id: "zoom"});
    });
    it("exports Chart for reuse", function (): void {
        let module = Chart;
        expect(module).toBeDefined();
        expect(typeof module).toBe("object");
    });
});
