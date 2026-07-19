import {render} from "@solidjs/testing-library";
import {describe, it, expect} from "vitest";
import {App} from "./App";

describe("App", function (): void {
    it("renders without crashing", function (): void {
        let result = render(function () { return <App />; });
        expect(result.getByText("Chemistry Utility")).toBeTruthy();
    });
});
