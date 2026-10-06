import { render, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, afterEach } from "vitest";
import { ExampleDetails } from "./ExampleDetails";

afterEach(() => {
    cleanup();
});

describe("ExampleDetails", () => {
    it("renders a details element with summary and children", () => {
        const rendered = render(() => (
            <ExampleDetails>
                <span data-testid="inner">worked example</span>
            </ExampleDetails>
        ));
        expect(rendered.getByText("Show Example")).toBeTruthy();
        expect(rendered.getByTestId("inner").textContent).toBe("worked example");
        const details = rendered.container.querySelector("details");
        expect(details).toBeTruthy();
    });
});
