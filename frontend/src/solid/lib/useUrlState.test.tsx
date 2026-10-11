import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent, waitFor } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { useUrlState } from "./useUrlState";
import { UrlStateManager } from "../../modules/urlStateManager.js";

/**
 * Renders the same element ids the dilution route uses, so the hook exercises
 * the real calculator param map rather than a stub that cannot round-trip.
 */
function Shell(): JSX.Element {
    useUrlState();
    return (
        <>
            <input id="dilution-M1" type="text" value="" />
            <input id="dilution-V1" type="text" value="" />
            <input id="dilution-M2" type="text" value="" />
            <input id="dilution-V2" type="text" value="" />
            <select id="dilution-solve-for">
                <option value="M1">M1</option>
                <option value="V2" selected>V2</option>
            </select>
        </>
    );
}

function renderShell(): ReturnType<typeof render> {
    return render(function (): JSX.Element {
        return (
            <Router>
                <Route path="*" component={Shell} />
            </Router>
        );
    });
}

describe("useUrlState", function (): void {
    let replaceStateSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(function (): void {
        UrlStateManager.resetInstance();
        document.body.innerHTML = "";
        replaceStateSpy = vi.spyOn(window.history, "replaceState");
    });
    afterEach(function (): void {
        cleanup();
        UrlStateManager.resetInstance();
        window.history.replaceState({}, "", "/");
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });
    it("writes each mapped input into the query string", async function (): Promise<void> {
        window.history.replaceState({}, "", "/dilution");
        let result = renderShell();

        let m1 = result.container.querySelector("#dilution-M1") as HTMLInputElement;
        let solve = result.container.querySelector("#dilution-solve-for") as HTMLSelectElement;

        expect(solve.value).toBe("V2");

        m1.value = "6";
        fireEvent.input(m1);
        solve.value = "V2";
        fireEvent.change(solve);

        await waitFor(function (): void {
            let last = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
            expect(last[2]).toBe("/dilution?solve=V2&M1=6");
        });
    });
    it("restores inputs from the query string on load", async function (): Promise<void> {
        window.history.replaceState({}, "", "/dilution?M1=6&V1=1&M2=3&solve=V2");
        let result = renderShell();

        await waitFor(function (): void {
            let m1 = result.container.querySelector("#dilution-M1") as HTMLInputElement;
            expect(m1.value).toBe("6");
        });

        let v1 = result.container.querySelector("#dilution-V1") as HTMLInputElement;
        let m2 = result.container.querySelector("#dilution-M2") as HTMLInputElement;
        let solve = result.container.querySelector("#dilution-solve-for") as HTMLSelectElement;
        expect(v1.value).toBe("1");
        expect(m2.value).toBe("3");
        expect(solve.value).toBe("V2");
    });
    it("stops listening after the shell unmounts", async function (): Promise<void> {
        window.history.replaceState({}, "", "/dilution");
        let result = renderShell();
        // Detached nodes keep firing the document-level listener check; grab
        // one before cleanup so we can still dispatch against it.
        let input = result.container.querySelector("#dilution-M1") as HTMLInputElement;
        cleanup();

        replaceStateSpy.mockClear();
        input.value = "NaCl";
        fireEvent.input(input, {target: input});
        await new Promise<void>(function (resolve: (value: void) => void): void {
            setTimeout(resolve, 20);
        });
        expect(replaceStateSpy).not.toHaveBeenCalled();
    });
});
