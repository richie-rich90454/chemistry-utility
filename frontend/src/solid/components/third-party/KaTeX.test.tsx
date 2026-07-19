import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import katex from "katex";
import {KaTeX} from "./KaTeX";
vi.mock("katex", function () {
    return {
        default: {
            render: function (): void { return; }
        }
    };
});
let externalSetExpr: (expr: string) => void = function (): void { return; };
function ReactiveHost(): JSX.Element {
    let [expr, setExpr] = createSignal<string>("x^2");
    externalSetExpr = setExpr;
    return <KaTeX expr={expr()} />;
}
describe("KaTeX onMount", function (): void {
    let renderSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        renderSpy = vi.spyOn(katex, "render");
    });
    afterEach(function (): void {
        cleanup();
        externalSetExpr = function (): void { return; };
        vi.restoreAllMocks();
    });
    it("calls katex.render on mount with expr, container, and default options", function (): void {
        let result = render(function (): JSX.Element {
            return <KaTeX expr="x^2" />;
        });
        let span: HTMLElement | null = result.container.querySelector("span");
        expect(span).not.toBeNull();
        expect(renderSpy).toHaveBeenCalledTimes(1);
        expect(renderSpy).toHaveBeenCalledWith("x^2", span, {displayMode: false, throwOnError: false});
    });
});
describe("KaTeX createEffect re-render", function (): void {
    let renderSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        renderSpy = vi.spyOn(katex, "render");
    });
    afterEach(function (): void {
        cleanup();
        externalSetExpr = function (): void { return; };
        vi.restoreAllMocks();
    });
    it("re-renders with the new expr when the prop changes", async function (): Promise<void> {
        render(function (): JSX.Element {
            return <ReactiveHost />;
        });
        expect(renderSpy).toHaveBeenCalledTimes(1);
        expect(renderSpy).toHaveBeenNthCalledWith(1, "x^2", expect.any(HTMLElement), {displayMode: false, throwOnError: false});
        externalSetExpr("y^2");
        await Promise.resolve();
        expect(renderSpy).toHaveBeenCalledTimes(2);
        expect(renderSpy).toHaveBeenNthCalledWith(2, "y^2", expect.any(HTMLElement), {displayMode: false, throwOnError: false});
    });
});
