import { render, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, afterEach } from "vitest";
import { SeeAlsoLink } from "./SeeAlsoLink";

afterEach(() => {
    cleanup();
});

describe("SeeAlsoLink", () => {
    it("renders a link with href and children", () => {
        const rendered = render(() => (
            <SeeAlsoLink href="/gas-laws">Gas Laws</SeeAlsoLink>
        ));
        const link = rendered.getByText("Gas Laws") as HTMLAnchorElement;
        expect(link).toBeTruthy();
        expect(link.getAttribute("href")).toBe("/gas-laws");
    });
});
