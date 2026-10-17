import {describe, it, expect, beforeEach, vi} from "vitest";

function setReducedMotion(reduced: boolean): void {
    window.matchMedia = vi.fn().mockReturnValue({
        "matches": reduced,
        "media": "(prefers-reduced-motion: reduce)",
        "onchange": null,
        "addListener": vi.fn(),
        "removeListener": vi.fn(),
        "addEventListener": vi.fn(),
        "removeEventListener": vi.fn(),
        "dispatchEvent": vi.fn()
    }) as unknown as typeof window.matchMedia;
}

function throwOnMatchMedia(): void {
    window.matchMedia = vi.fn().mockImplementation(function (): never {
        throw new Error("matchMedia unavailable");
    }) as unknown as typeof window.matchMedia;
}

async function loadMotion(): Promise<{prefersReducedMotion: () => boolean; DURATION: Record<string, number>; EASE: Record<string, string>}> {
    const motion = await import("./motion");
    return {
        "prefersReducedMotion": motion.prefersReducedMotion,
        "DURATION": motion.DURATION as unknown as Record<string, number>,
        "EASE": motion.EASE as unknown as Record<string, string>
    };
}

async function loadGsapApi(): Promise<{api: ReturnType<typeof import("./useGsap").useGsap>; spy: (name: string) => ReturnType<typeof vi.fn>}> {
    const solid = await import("solid-js");
    const useGsapModule = await import("./useGsap");
    const gsapModule = await import("gsap");
    const holder: {api: ReturnType<typeof useGsapModule.useGsap> | undefined} = {"api": undefined};
    solid.createRoot(function (): void {
        holder.api = useGsapModule.useGsap();
    });
    const api = holder.api as ReturnType<typeof useGsapModule.useGsap>;
    const methods: Record<string, unknown> = gsapModule.default as unknown as Record<string, unknown>;
    return {
        "api": api,
        "spy": function (name: string): ReturnType<typeof vi.fn> {
            return methods[name] as ReturnType<typeof vi.fn>;
        }
    };
}

function makeElement(text: string): HTMLElement {
    const element = document.createElement("span");
    element.textContent = text;
    document.body.appendChild(element);
    return element;
}

beforeEach(function (): void {
    vi.resetModules();
});

describe("motion scale", function (): void {
    it("exposes durations in seconds and the two easings", async function (): Promise<void> {
        const {DURATION, EASE} = await loadMotion();
        expect(DURATION["micro"]).toBe(0.12);
        expect(DURATION["standard"]).toBe(0.24);
        expect(DURATION["emphasis"]).toBe(0.38);
        expect(DURATION["reveal"]).toBe(0.52);
        expect(EASE["enter"]).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
        expect(EASE["exit"]).toBe("cubic-bezier(0.4, 0, 1, 1)");
    });
});

describe("prefersReducedMotion", function (): void {
    it("reports false when the preference is off", async function (): Promise<void> {
        setReducedMotion(false);
        const {prefersReducedMotion} = await loadMotion();
        expect(prefersReducedMotion()).toBe(false);
    });
    it("reports true when the preference is on", async function (): Promise<void> {
        setReducedMotion(true);
        const {prefersReducedMotion} = await loadMotion();
        expect(prefersReducedMotion()).toBe(true);
    });
    it("caches the first reading so later changes are ignored", async function (): Promise<void> {
        setReducedMotion(false);
        const {prefersReducedMotion} = await loadMotion();
        expect(prefersReducedMotion()).toBe(false);
        setReducedMotion(true);
        expect(prefersReducedMotion()).toBe(false);
    });
    it("falls back to false when matchMedia throws", async function (): Promise<void> {
        throwOnMatchMedia();
        const {prefersReducedMotion} = await loadMotion();
        expect(prefersReducedMotion()).toBe(false);
    });
});

describe("animateCountUp under reduced motion", function (): void {
    it("writes the final value and skips gsap", async function (): Promise<void> {
        setReducedMotion(true);
        const {api, spy} = await loadGsapApi();
        const element = makeElement("0");
        api.animateCountUp(element, 0, 42, 0.3);
        expect(element.textContent).toBe("42");
        expect(spy("to")).not.toHaveBeenCalled();
    });
    it("uses the supplied formatter for the final value", async function (): Promise<void> {
        setReducedMotion(true);
        const {api} = await loadGsapApi();
        const element = makeElement("");
        api.animateCountUp(element, 0, -159.6, 0.3, function (value: number): string {
            return "ΔG = " + value.toFixed(4) + " kJ/mol";
        });
        expect(element.textContent).toBe("ΔG = -159.6000 kJ/mol");
    });
});

describe("animateCountUp with motion allowed", function (): void {
    it("tweens a proxy value and writes textContent on update", async function (): Promise<void> {
        setReducedMotion(false);
        const {api, spy} = await loadGsapApi();
        const element = makeElement("5");
        api.animateCountUp(element, 5, 90, 0.3);
        const toSpy = spy("to");
        expect(toSpy).toHaveBeenCalledTimes(1);
        const proxy = toSpy.mock.calls[0][0] as {"value": number};
        const vars = toSpy.mock.calls[0][1] as {"value": number; "duration": number; "onUpdate": () => void};
        expect(proxy.value).toBe(5);
        expect(vars.value).toBe(90);
        expect(vars.duration).toBe(0.3);
        proxy.value = 47.5;
        vars.onUpdate();
        expect(element.textContent).toBe("47.5");
    });
});

describe("animateStagger under reduced motion", function (): void {
    it("jumps every item to the final state without gsap tweens", async function (): Promise<void> {
        setReducedMotion(true);
        const {api, spy} = await loadGsapApi();
        const first = makeElement("a");
        const second = makeElement("b");
        api.animateStagger([first, second], {"opacity": 1, "y": 0}, 0.05);
        const setSpy = spy("set");
        expect(setSpy).toHaveBeenCalledTimes(1);
        const targets = setSpy.mock.calls[0][0] as Element[];
        expect(targets).toEqual([first, second]);
        const vars = setSpy.mock.calls[0][1] as Record<string, unknown>;
        expect(vars["opacity"]).toBe(1);
        expect(vars["y"]).toBe(0);
        expect(vars["duration"]).toBeUndefined();
        expect(vars["ease"]).toBeUndefined();
        expect(vars["delay"]).toBeUndefined();
        expect(spy("to")).not.toHaveBeenCalled();
    });
});

describe("animateStagger with motion allowed", function (): void {
    it("tweens the list with the supplied stagger step", async function (): Promise<void> {
        setReducedMotion(false);
        const {api, spy} = await loadGsapApi();
        const first = makeElement("a");
        const second = makeElement("b");
        api.animateStagger([first, second]);
        const toSpy = spy("to");
        expect(toSpy).toHaveBeenCalledTimes(1);
        const vars = toSpy.mock.calls[0][1] as {"opacity": number; "y": number; "stagger": number; "duration": number};
        expect(vars.opacity).toBe(0);
        expect(vars.y).toBe(12);
        expect(vars.duration).toBe(0.24);
        expect(vars.stagger).toBe(0.12);
        expect(spy("set")).not.toHaveBeenCalled();
    });
    it("passes a caller supplied stagger step through", async function (): Promise<void> {
        setReducedMotion(false);
        const {api, spy} = await loadGsapApi();
        api.animateStagger([makeElement("a")], {"duration": 0.4}, 0.08);
        const toSpy = spy("to");
        const vars = toSpy.mock.calls[0][1] as {"duration": number; "stagger": number};
        expect(vars.duration).toBe(0.4);
        expect(vars.stagger).toBe(0.08);
    });
});
