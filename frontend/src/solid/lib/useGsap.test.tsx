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
describe("useGsap cleanup", function (): void {
    let killSpy: ReturnType<typeof vi.fn>;
    let fromSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        killSpy = vi.fn();
        let mockTween = {kill: killSpy} as unknown as gsap.core.Tween;
        fromSpy = vi.spyOn(gsap, "from").mockReturnValue(mockTween);
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
