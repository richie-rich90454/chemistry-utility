import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {onMount} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import gsap from "gsap";
import {useSlideDown, useSlideUp} from "./animationUtils";
function SlideDownHost(props: {duration: number}): JSX.Element {
    let divRef: HTMLDivElement | undefined;
    onMount(function (): void {
        if (divRef !== undefined) {
            useSlideDown(divRef, props.duration);
        }
    });
    return <div ref={divRef} />;
}
function SlideUpHost(props: {duration: number}): JSX.Element {
    let divRef: HTMLDivElement | undefined;
    onMount(function (): void {
        if (divRef !== undefined) {
            useSlideUp(divRef, props.duration);
        }
    });
    return <div ref={divRef} />;
}
describe("animationUtils useSlideDown", function (): void {
    let fromToSpy: ReturnType<typeof vi.spyOn>;
    let killSpy: ReturnType<typeof vi.fn>;
    beforeEach(function (): void {
        killSpy = vi.fn();
        let mockTween = {kill: killSpy} as unknown as gsap.core.Tween;
        fromToSpy = vi.spyOn(gsap, "fromTo").mockReturnValue(mockTween);
        fromToSpy.mockClear();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("calls gsap.fromTo with slide-down from/to vars and converted duration", function (): void {
        render(function (): JSX.Element { return <SlideDownHost duration={300} />; });
        expect(fromToSpy).toHaveBeenCalledTimes(1);
        expect(fromToSpy.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
        expect(fromToSpy.mock.calls[0][1]).toEqual({height: 0, opacity: 0, overflow: "hidden"});
        expect(fromToSpy.mock.calls[0][2]).toEqual({height: "auto", opacity: 1, duration: 0.3, ease: "power2.out"});
    });
    it("kills the recorded tween on cleanup", function (): void {
        render(function (): JSX.Element { return <SlideDownHost duration={300} />; });
        expect(killSpy).not.toHaveBeenCalled();
        cleanup();
        expect(killSpy).toHaveBeenCalledTimes(1);
    });
});
describe("animationUtils useSlideUp", function (): void {
    let fromToSpy: ReturnType<typeof vi.spyOn>;
    let killSpy: ReturnType<typeof vi.fn>;
    beforeEach(function (): void {
        killSpy = vi.fn();
        let mockTween = {kill: killSpy} as unknown as gsap.core.Tween;
        fromToSpy = vi.spyOn(gsap, "fromTo").mockReturnValue(mockTween);
        fromToSpy.mockClear();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("calls gsap.fromTo with slide-up from/to vars and converted duration", function (): void {
        render(function (): JSX.Element { return <SlideUpHost duration={200} />; });
        expect(fromToSpy).toHaveBeenCalledTimes(1);
        expect(fromToSpy.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
        expect(fromToSpy.mock.calls[0][1]).toEqual({height: "auto", opacity: 1, overflow: "hidden"});
        expect(fromToSpy.mock.calls[0][2]).toEqual({height: 0, opacity: 0, duration: 0.2, ease: "power2.in"});
    });
});
