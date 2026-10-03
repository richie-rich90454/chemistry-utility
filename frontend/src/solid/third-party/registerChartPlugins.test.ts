import {describe, it, expect, vi, beforeEach} from "vitest";
let mocks = vi.hoisted(function () {
    return {register: vi.fn()};
});
vi.mock("chart.js", function () {
    return {
        Chart: {register: mocks.register},
        registerables: [{id: "alpha"}, {id: "beta"}]
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
    it("registers each registerable item with Chart.register", function (): void {
        expect(mocks.register).toHaveBeenCalledWith({id: "alpha"});
        expect(mocks.register).toHaveBeenCalledWith({id: "beta"});
    });
    it("registers the zoom plugin with Chart.register", function (): void {
        expect(mocks.register).toHaveBeenCalledWith({id: "zoom"});
    });
    it("exports Chart for reuse", async function (): Promise<void> {
        let mod = await import("./registerChartPlugins.js");
        expect(mod.Chart).toBeDefined();
        expect(typeof mod.Chart).toBe("object");
    });
});
