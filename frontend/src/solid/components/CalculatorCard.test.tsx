import { render, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, afterEach } from "vitest";
import { CalculatorCard } from "./CalculatorCard";

afterEach(() => {
    cleanup();
});

describe("CalculatorCard", () => {
    it("renders title, description and children", () => {
        const rendered = render(() => (
            <CalculatorCard title="Molar Mass" description="Compute mass">
                <div data-testid="child">body</div>
            </CalculatorCard>
        ));
        expect(rendered.getByText("Molar Mass")).toBeTruthy();
        expect(rendered.getByText("Compute mass")).toBeTruthy();
        expect(rendered.getByTestId("child").textContent).toBe("body");
    });

    it("renders exampleDetails when provided", () => {
        const rendered = render(() => (
            <CalculatorCard
                title="T"
                description="D"
                exampleDetails={<span data-testid="ex">example</span>}
            >
                <span>child</span>
            </CalculatorCard>
        ));
        expect(rendered.getByTestId("ex").textContent).toBe("example");
    });

    it("omits exampleDetails block when not provided", () => {
        const rendered = render(() => (
            <CalculatorCard title="T" description="D">
                <span>child</span>
            </CalculatorCard>
        ));
        expect(rendered.queryByTestId("ex")).toBeNull();
        expect(rendered.getByText("child")).toBeTruthy();
    });

    it("renders seeAlso when provided", () => {
        const rendered = render(() => (
            <CalculatorCard title="T" description="D" seeAlso={<span data-testid="also">see</span>}>
                <span>child</span>
            </CalculatorCard>
        ));
        expect(rendered.getByTestId("also").textContent).toBe("see");
    });

    it("omits seeAlso block when not provided", () => {
        const rendered = render(() => (
            <CalculatorCard title="T" description="D">
                <span>child</span>
            </CalculatorCard>
        ));
        expect(rendered.queryByTestId("also")).toBeNull();
    });

    it("renders both optional blocks together", () => {
        const rendered = render(() => (
            <CalculatorCard
                title="T"
                description="D"
                exampleDetails={<span data-testid="ex">example</span>}
                seeAlso={<span data-testid="also">see</span>}
            >
                <span>child</span>
            </CalculatorCard>
        ));
        expect(rendered.getByTestId("ex")).toBeTruthy();
        expect(rendered.getByTestId("also")).toBeTruthy();
    });
});
