import {describe, it, expect, vi, beforeEach} from "vitest";
let mocks = vi.hoisted(function () {
    return {register: vi.fn()};
});
vi.mock("chart.js", function () {
    return {
        Chart: {register: mocks.register},
        registerables: [{id: "alpha"}, {id: "beta"}],
        LineController: {id: "line"},
        LineElement: {id: "lineElement"},
        PointElement: {id: "point"},
        LinearScale: {id: "linear"},
        CategoryScale: {id: "category"},
        BarController: {id: "bar"},
        BarElement: {id: "barElement"},
        ScatterController: {id: "scatter"},
        Title: {id: "title"},
        Legend: {id: "legend"},
        Tooltip: {id: "tooltip"},
        Filler: {id: "filler"}
    };
});
vi.mock("chartjs-plugin-zoom", function () {
    return {default: {id: "zoom"}};
});
describe("registerChartPlugins", function (): void {
    beforeEach(async function (): Promise<void> {
        mocks.register.mockClear();
        vi.resetModules();
        await import("./registerChartPlugins.js");
    });
    it("registers exactly the controllers, elements, scales, and plugins the app uses", function (): void {
        expect(mocks.register.mock.calls).toEqual([[
            {id: "line"},
            {id: "lineElement"},
            {id: "point"},
            {id: "linear"},
            {id: "category"},
            {id: "bar"},
            {id: "barElement"},
            {id: "scatter"},
            {id: "title"},
            {id: "legend"},
            {id: "tooltip"},
            {id: "filler"},
            {id: "zoom"}
        ]]);
    });
    it("does not register the full registerables set (tree-shaking)", function (): void {
        expect(mocks.register).not.toHaveBeenCalledWith({id: "alpha"});
        expect(mocks.register).not.toHaveBeenCalledWith({id: "beta"});
    });
    it("exports Chart for reuse", async function (): Promise<void> {
        let mod = await import("./registerChartPlugins.js");
        expect(mod.Chart).toBeDefined();
        expect(typeof mod.Chart).toBe("object");
    });
});
