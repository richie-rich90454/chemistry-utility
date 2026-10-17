import {render} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {SkipLink} from "./SkipLink";

describe("SkipLink", function (): void {
    it("renders the skip link text", function (): void {
        let result = render(function () { return <SkipLink />; });
        expect(result.getByText("Skip to main content")).toBeTruthy();
    });

    it("has href pointing to #main-content", function (): void {
        let result = render(function () { return <SkipLink />; });
        let link = result.getByRole("link") as HTMLAnchorElement;
        expect(link.getAttribute("href")).toBe("#main-content");
    });
});
