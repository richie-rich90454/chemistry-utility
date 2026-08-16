import { describe, it, expect } from "vitest";
import {
    CalculatorEvent,
    CalculationStartedEvent,
    CalculationCompletedEvent,
    CalculationErrorEvent,
} from "./calculatorEvent.js";
import type { Calculator } from "./calculator.js";

function createMockCalculator(): Calculator {
    return { id: "mock" } as unknown as Calculator;
}

describe("CalculatorEvent", () => {
    it("stores the source calculator", () => {
        const source = createMockCalculator();
        const event = new CalculatorEvent(source);
        expect(event.getSource()).toBe(source);
    });

    it("stores a timestamp that is an instance of Date", () => {
        const event = new CalculatorEvent(createMockCalculator());
        expect(event.getTimestamp()).toBeInstanceOf(Date);
    });

    it("captures a timestamp close to now", () => {
        const before = Date.now();
        const event = new CalculatorEvent(createMockCalculator());
        const after = Date.now();
        const ts = event.getTimestamp().getTime();
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
    });

    it("keeps a stable reference to the source", () => {
        const source = createMockCalculator();
        const event = new CalculatorEvent(source);
        expect(event.getSource()).toBe(source);
        expect(event.getSource()).toBe(source);
    });
});

describe("CalculationStartedEvent", () => {
    it("is an instance of CalculatorEvent", () => {
        const event = new CalculationStartedEvent(createMockCalculator());
        expect(event).toBeInstanceOf(CalculatorEvent);
    });

    it("exposes the source calculator via getSource", () => {
        const source = createMockCalculator();
        const event = new CalculationStartedEvent(source);
        expect(event.getSource()).toBe(source);
    });

    it("exposes a timestamp via getTimestamp", () => {
        const event = new CalculationStartedEvent(createMockCalculator());
        expect(event.getTimestamp()).toBeInstanceOf(Date);
    });
});

describe("CalculationCompletedEvent", () => {
    it("is an instance of CalculatorEvent", () => {
        const event = new CalculationCompletedEvent(createMockCalculator(), "<p>42</p>");
        expect(event).toBeInstanceOf(CalculatorEvent);
    });

    it("stores and returns the result HTML", () => {
        const html = "<p>Result: 18.015 g/mol</p>";
        const event = new CalculationCompletedEvent(createMockCalculator(), html);
        expect(event.getResultHtml()).toBe(html);
    });

    it("preserves the source calculator", () => {
        const source = createMockCalculator();
        const event = new CalculationCompletedEvent(source, "ok");
        expect(event.getSource()).toBe(source);
    });

    it("handles empty string result HTML", () => {
        const event = new CalculationCompletedEvent(createMockCalculator(), "");
        expect(event.getResultHtml()).toBe("");
    });

    it("handles complex HTML result", () => {
        const html = "<div><span class='value'>100</span><sub>2</sub></div>";
        const event = new CalculationCompletedEvent(createMockCalculator(), html);
        expect(event.getResultHtml()).toBe(html);
    });
});

describe("CalculationErrorEvent", () => {
    it("is an instance of CalculatorEvent", () => {
        const event = new CalculationErrorEvent(createMockCalculator(), "boom");
        expect(event).toBeInstanceOf(CalculatorEvent);
    });

    it("stores and returns the error message", () => {
        const message = "Initial molarity must be positive";
        const event = new CalculationErrorEvent(createMockCalculator(), message);
        expect(event.getErrorMessage()).toBe(message);
    });

    it("preserves the source calculator", () => {
        const source = createMockCalculator();
        const event = new CalculationErrorEvent(source, "err");
        expect(event.getSource()).toBe(source);
    });

    it("handles empty string error message", () => {
        const event = new CalculationErrorEvent(createMockCalculator(), "");
        expect(event.getErrorMessage()).toBe("");
    });

    it("handles multi-line error messages", () => {
        const message = "Line 1\nLine 2\nLine 3";
        const event = new CalculationErrorEvent(createMockCalculator(), message);
        expect(event.getErrorMessage()).toBe(message);
    });
});
