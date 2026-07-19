import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
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
describe("KaTeX onMount", function (): void {
    let renderSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        renderSpy = vi.spyOn(katex, "render");
    });
    afterEach(function (): void {
        cleanup();
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
