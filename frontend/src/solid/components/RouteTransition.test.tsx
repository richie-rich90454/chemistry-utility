import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, afterEach, vi} from "vitest";
import gsap from "gsap";
import {MemoryRouter, Route, useNavigate} from "@solidjs/router";
import {RouteTransition} from "./RouteTransition";

function nextTick(): Promise<void> {
    return new Promise<void>(function (resolve: (value: void) => void): void {
        setTimeout(function (): void {
            resolve();
        }, 0);
    });
}

function flushTweens(): Promise<void> {
    return new Promise<void>(function (resolve: (value: void) => void): void {
        setTimeout(function (): void {
            resolve();
        }, 30);
    });
}

/** Mirrors the App.tsx layout: a shell route whose children change per path. */
function mountRouter(): {goTo: (path: string) => void; text: () => string} {
    let navigate: (path: string) => void = function (): void { return; };
    function Links(): JSX.Element {
        navigate = useNavigate();
        return <div />;
    }
    function Panel(props: {label: string}): JSX.Element {
        return (
            <div>
                <p>{props.label}</p>
                <Links />
            </div>
        );
    }
    function Shell(props: {children?: JSX.Element}): JSX.Element {
        return (
            <main class="app-content">
                <RouteTransition>{props.children}</RouteTransition>
            </main>
        );
    }
    let rendered = render(function (): JSX.Element {
        return (
            <MemoryRouter>
                <Route path="/" component={Shell}>
                    <Route path="/" component={() => <Panel label="home view" />} />
                    <Route path="/away" component={() => <Panel label="away view" />} />
                </Route>
            </MemoryRouter>
        );
    });
    return {
        "goTo": function (path: string): void {
            navigate(path);
        },
        "text": function (): string {
            return rendered.container.textContent ?? "";
        }
    };
}

afterEach(function (): void {
    cleanup();
    vi.restoreAllMocks();
});

describe("RouteTransition", function (): void {
    it("renders the first route without animating", function (): void {
        let toSpy = vi.mocked(gsap.to);
        toSpy.mockClear();
        let router = mountRouter();
        expect(router.text()).toContain("home view");
        expect(toSpy).not.toHaveBeenCalled();
    });
    it("fades the outgoing route out before revealing the incoming one", async function (): Promise<void> {
        let toSpy = vi.mocked(gsap.to);
        let fromToSpy = vi.mocked(gsap.fromTo);
        toSpy.mockClear();
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/away");
        await flushTweens();
        expect(router.text()).toContain("away view");
        expect(router.text()).not.toContain("home view");
        expect(toSpy).toHaveBeenCalledTimes(1);
        let exitVars = toSpy.mock.calls[0][1] as {"opacity": number; "y": number; "duration": number; "ease": string};
        expect(exitVars.opacity).toBe(0);
        expect(exitVars.y).toBe(12);
        expect(exitVars.duration).toBe(0.24);
        expect(exitVars.ease).toBe("cubic-bezier(0.4, 0, 1, 1)");
        expect(fromToSpy).toHaveBeenCalledTimes(1);
        let enterVars = fromToSpy.mock.calls[0][2] as {"opacity": number; "y": number; "duration": number; "ease": string};
        expect(enterVars.opacity).toBe(1);
        expect(enterVars.y).toBe(0);
        expect(enterVars.duration).toBe(0.38);
        expect(enterVars.ease).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
    });
    it("keeps the incoming route out of the DOM until the exit tween completes", async function (): Promise<void> {
        let router = mountRouter();
        router.goTo("/away");
        expect(router.text()).toContain("home view");
        expect(router.text()).not.toContain("away view");
        await flushTweens();
        expect(router.text()).toContain("away view");
        expect(router.text()).not.toContain("home view");
    });
    it("swaps content immediately when reduced motion is preferred", async function (): Promise<void> {
        let matchSpy = vi.spyOn(window, "matchMedia").mockImplementation(function (query: string): MediaQueryList {
            return {"matches": true, "media": query} as MediaQueryList;
        });
        let router = mountRouter();
        router.goTo("/away");
        await nextTick();
        expect(router.text()).toContain("away view");
        matchSpy.mockRestore();
    });
});
