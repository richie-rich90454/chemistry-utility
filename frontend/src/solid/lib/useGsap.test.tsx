import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {onMount} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import gsap from "gsap";
import {useGsap} from "./useGsap";
function HostComponent(): JSX.Element {
    let divRef: HTMLDivElement | undefined;
    let api = useGsap();
    onMount(function (): void {
        if (divRef !== undefined) {
            api.animateIn(divRef);
        }
    });
    return <div ref={divRef} />;
}
function AnimateInHost(props: {vars?: gsap.TweenVars}): JSX.Element {
    let divRef: HTMLDivElement | undefined;
    let api = useGsap();
    onMount(function (): void {
        if (divRef !== undefined) {
            api.animateIn(divRef, props.vars);
        }
    });
    return <div ref={divRef} />;
}
function AnimateOutHost(props: {vars?: gsap.TweenVars}): JSX.Element {
    let divRef: HTMLDivElement | undefined;
    let api = useGsap();
    onMount(function (): void {
        if (divRef !== undefined) {
            api.animateOut(divRef, props.vars);
        }
    });
    return <div ref={divRef} />;
}
function FromToHost(props: {fromVars: gsap.TweenVars; toVars: gsap.TweenVars}): JSX.Element {
    let divRef: HTMLDivElement | undefined;
    let api = useGsap();
    onMount(function (): void {
        if (divRef !== undefined) {
            api.fromTo(divRef, props.fromVars, props.toVars);
        }
    });
    return <div ref={divRef} />;
}
describe("useGsap cleanup", function (): void {
    let killSpy: ReturnType<typeof vi.fn>;
    let fromSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        killSpy = vi.fn();
        let mockTween = {kill: killSpy} as unknown as gsap.core.Tween;
        fromSpy = vi.spyOn(gsap, "from").mockReturnValue(mockTween);
        fromSpy.mockClear();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("kills recorded tweens on cleanup", function (): void {
        render(function (): JSX.Element { return <HostComponent />; });
        expect(fromSpy).toHaveBeenCalledTimes(1);
        expect(killSpy).not.toHaveBeenCalled();
        cleanup();
        expect(killSpy).toHaveBeenCalledTimes(1);
    });
});
describe("useGsap animateIn", function (): void {
    let fromSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        fromSpy = vi.spyOn(gsap, "from").mockReturnValue({kill: vi.fn()} as unknown as gsap.core.Tween);
        fromSpy.mockClear();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("calls gsap.from with default vars when no vars provided", function (): void {
        render(function (): JSX.Element { return <AnimateInHost />; });
        expect(fromSpy).toHaveBeenCalledTimes(1);
        expect(fromSpy.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
        expect(fromSpy.mock.calls[0][1]).toEqual({opacity: 0, y: 12, duration: 0.3, ease: "power2.out"});
    });
    it("merges user vars with defaults", function (): void {
        render(function (): JSX.Element { return <AnimateInHost vars={{duration: 0.5, y: 20}} />; });
        expect(fromSpy.mock.calls[0][1]).toEqual({opacity: 0, y: 20, duration: 0.5, ease: "power2.out"});
    });
});
describe("useGsap animateOut", function (): void {
    let toSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        toSpy = vi.spyOn(gsap, "to").mockReturnValue({kill: vi.fn()} as unknown as gsap.core.Tween);
        toSpy.mockClear();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("calls gsap.to with default vars when no vars provided", function (): void {
        render(function (): JSX.Element { return <AnimateOutHost />; });
        expect(toSpy).toHaveBeenCalledTimes(1);
        expect(toSpy.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
        expect(toSpy.mock.calls[0][1]).toEqual({opacity: 0, y: -12, duration: 0.2, ease: "power2.in"});
    });
    it("merges user vars with defaults", function (): void {
        render(function (): JSX.Element { return <AnimateOutHost vars={{duration: 0.4, y: -5}} />; });
        expect(toSpy.mock.calls[0][1]).toEqual({opacity: 0, y: -5, duration: 0.4, ease: "power2.in"});
    });
});
describe("useGsap fromTo", function (): void {
    let fromToSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        fromToSpy = vi.spyOn(gsap, "fromTo").mockReturnValue({kill: vi.fn()} as unknown as gsap.core.Tween);
        fromToSpy.mockClear();
    });
    afterEach(function (): void {
        cleanup();
        vi.restoreAllMocks();
    });
    it("calls gsap.fromTo with from and to vars unchanged", function (): void {
        let fromVars: gsap.TweenVars = {opacity: 0, scale: 0.8};
        let toVars: gsap.TweenVars = {opacity: 1, scale: 1, duration: 0.5, ease: "back.out"};
        render(function (): JSX.Element { return <FromToHost fromVars={fromVars} toVars={toVars} />; });
        expect(fromToSpy).toHaveBeenCalledTimes(1);
        expect(fromToSpy.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
        expect(fromToSpy.mock.calls[0][1]).toEqual(fromVars);
        expect(fromToSpy.mock.calls[0][2]).toEqual(toVars);
    });
});
