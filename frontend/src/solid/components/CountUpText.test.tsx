import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {createSignal} from "solid-js";
import {describe, it, expect, afterEach, vi} from "vitest";
import gsap from "gsap";
import {CountUpText} from "./CountUpText";
function mountCountUp(initial: string): {"set": (value: string) => void; "text": () => string} {
    let [value, setValue] = createSignal<string>(initial);
    let rendered = render(function (): JSX.Element {
        return <CountUpText value={value} />;
    });
    return {
        "set": setValue,
        "text": function (): string {
            return rendered.container.textContent ?? "";
        }
    };
}
afterEach(function (): void {
    cleanup();
    vi.restoreAllMocks();
});
describe("CountUpText", function (): void {
    it("writes the initial value on first render without animating", function (): void {
        let toSpy = vi.mocked(gsap.to);
        toSpy.mockClear();
        let mounted = mountCountUp("ΔG = -159.6000 kJ/mol");
        expect(mounted.text()).toBe("ΔG = -159.6000 kJ/mol");
        expect(toSpy).not.toHaveBeenCalled();
    });
    it("tweens the last number when the value changes", function (): void {
        let toSpy = vi.mocked(gsap.to);
        toSpy.mockClear();
        let mounted = mountCountUp("Total = 1");
        mounted.set("Total = 2.50");
        expect(toSpy).toHaveBeenCalledTimes(1);
        let proxy = toSpy.mock.calls[0][0] as {"value": number};
        let vars = toSpy.mock.calls[0][1] as {"value": number; "duration": number; "onUpdate": () => void};
        expect(proxy.value).toBe(1);
        expect(vars.value).toBe(2.5);
        expect(vars.duration).toBe(0.3);
    });
    it("keeps the surrounding text while the number is written", function (): void {
        let toSpy = vi.mocked(gsap.to);
        toSpy.mockClear();
        let mounted = mountCountUp("ΔG = 1 kJ/mol");
        mounted.set("ΔG = 2.5 kJ/mol");
        let proxy = toSpy.mock.calls[0][0] as {"value": number};
        proxy.value = 2.2;
        let vars = toSpy.mock.calls[0][1] as {"onUpdate": () => void};
        vars.onUpdate();
        expect(mounted.text()).toBe("ΔG = 2.2 kJ/mol");
    });
    it("swaps the text directly when either value has no number", function (): void {
        let toSpy = vi.mocked(gsap.to);
        toSpy.mockClear();
        let mounted = mountCountUp("Enter values to calculate");
        mounted.set("Temperature must be positive");
        expect(mounted.text()).toBe("Temperature must be positive");
        expect(toSpy).not.toHaveBeenCalled();
    });
    it("does nothing when the value is unchanged", function (): void {
        let toSpy = vi.mocked(gsap.to);
        toSpy.mockClear();
        let mounted = mountCountUp("k = 1.5 s⁻¹");
        mounted.set("k = 1.5 s⁻¹");
        expect(mounted.text()).toBe("k = 1.5 s⁻¹");
        expect(toSpy).not.toHaveBeenCalled();
    });
});
