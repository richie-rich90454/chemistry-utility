import {render, cleanup} from "@solidjs/testing-library";
import type {JSX} from "solid-js";
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import gsap from "gsap";
import {MemoryRouter, Route, useNavigate} from "@solidjs/router";
import {prefersReducedMotion} from "../lib/motion";
import {RouteTransition} from "./RouteTransition";

vi.mock("../lib/motion", async function (importOriginal) {
    let actual = await importOriginal() as typeof import("../lib/motion");
    return Object.assign({}, actual, {
        "prefersReducedMotion": vi.fn(function (): boolean {
            return false;
        })
    });
});

function nextTick(): Promise<void> {
    return new Promise<void>(function (resolve: (value: void) => void): void {
        setTimeout(function (): void {
            resolve();
        }, 0);
    });
}

/** Lets the router's navigation settle without waiting on tween timers. */
async function settle(): Promise<void> {
    let i: number;
    for (i = 0; i < 6; i = i + 1) {
        await Promise.resolve();
    }
    await nextTick();
}

/** Mirrors the App.tsx layout: a shell route whose children change per path. */
function mountRouter(): {goTo: (path: string) => void; text: () => string; container: () => HTMLElement} {
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
    function MarkedPanel(): JSX.Element {
        return (
            <div>
                <section data-motion="enter">first block</section>
                <section data-motion="enter">second block</section>
                <Links />
            </div>
        );
    }
    function Empty(): JSX.Element {
        return <>{null}</>;
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
                    <Route path="/marked" component={() => <MarkedPanel />} />
                    <Route path="/empty" component={() => <Empty />} />
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
        },
        "container": function (): HTMLElement {
            return rendered.container;
        }
    };
}

beforeEach(function (): void {
    vi.mocked(prefersReducedMotion).mockReturnValue(false);
});

afterEach(function (): void {
    cleanup();
    vi.restoreAllMocks();
});

describe("RouteTransition", function (): void {
    it("leaves the first paint untouched", function (): void {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        expect(router.text()).toContain("home view");
        expect(fromToSpy).not.toHaveBeenCalled();
    });

    it("rises the new content in when the route changes", async function (): Promise<void> {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/away");
        await settle();
        expect(fromToSpy).toHaveBeenCalledTimes(1);
        let fromVars = fromToSpy.mock.calls[0][1] as unknown as {"opacity": number; "y": number};
        expect(fromVars.opacity).toBe(0);
        expect(fromVars.y).toBe(14);
        let toVars = fromToSpy.mock.calls[0][2] as {"opacity": number; "y": number; "duration": number; "ease": string; "stagger": number};
        expect(toVars.opacity).toBe(1);
        expect(toVars.y).toBe(0);
        expect(toVars.duration).toBe(0.36);
        expect(toVars.ease).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
        expect(toVars.stagger).toBe(0.045);
    });

    it("swaps the route content immediately with no held outgoing node", async function (): Promise<void> {
        let router = mountRouter();
        router.goTo("/away");
        await settle();
        expect(router.text()).toContain("away view");
        expect(router.text()).not.toContain("home view");
    });

    it("staggers the blocks marked data-motion in document order", async function (): Promise<void> {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/marked");
        await settle();
        let targets = fromToSpy.mock.calls[0][0] as Element[];
        expect(targets.length).toBe(2);
        expect(targets[0].textContent).toBe("first block");
        expect(targets[1].textContent).toBe("second block");
    });

    it("falls back to the direct children when nothing is marked", async function (): Promise<void> {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/away");
        await settle();
        let targets = fromToSpy.mock.calls[0][0] as Element[];
        expect(targets.length).toBe(1);
        expect(targets[0].tagName).toBe("DIV");
        expect(targets[0].textContent).toContain("away view");
    });

    it("does nothing when the route renders no blocks", async function (): Promise<void> {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/empty");
        await settle();
        expect(fromToSpy).not.toHaveBeenCalled();
    });

    it("kills the previous entrance tween when navigating again", async function (): Promise<void> {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/away");
        await settle();
        router.goTo("/");
        await settle();
        expect(fromToSpy).toHaveBeenCalledTimes(2);
        let firstTween = fromToSpy.mock.results[0].value as {"kill": () => void};
        expect(firstTween.kill).toHaveBeenCalled();
    });

    it("ignores mutations that leave the entering blocks unchanged", async function (): Promise<void> {
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let router = mountRouter();
        router.goTo("/marked");
        await settle();
        expect(fromToSpy).toHaveBeenCalledTimes(1);
        let section = router.container().querySelector("[data-motion='enter']") as HTMLElement;
        section.appendChild(document.createElement("span"));
        await settle();
        expect(fromToSpy).toHaveBeenCalledTimes(1);
    });

    it("snaps to the final state under reduced motion", async function (): Promise<void> {
        vi.mocked(prefersReducedMotion).mockReturnValue(true);
        let fromToSpy = vi.mocked(gsap.fromTo);
        fromToSpy.mockClear();
        let setSpy = vi.mocked(gsap.set);
        setSpy.mockClear();
        let router = mountRouter();
        router.goTo("/away");
        await settle();
        expect(fromToSpy).not.toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalled();
        let vars = setSpy.mock.calls[0][1] as {"clearProps": string};
        expect(vars.clearProps).toBe("opacity,transform");
    });
});
