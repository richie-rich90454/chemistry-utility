import {describe, it, expect} from "vitest";
import {InputValidator} from "./validation.js";

describe("validationCoverage: ids and elements", () => {
    it("covers missing ids and elements", () => {
        expect(() => InputValidator.validateValues([NaN], [])).toThrow();
        expect(() => InputValidator.validateValues([NaN], ["missing-el-xyz"])).toThrow();
        expect(() => InputValidator.validateValues([1, 2], [])).not.toThrow();
    });
});
