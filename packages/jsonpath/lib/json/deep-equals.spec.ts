import { describe, it, expect } from "vitest";
import { jsonDeepEquals } from "./deep-equals";

// TODO
describe("Deep equals", () => {
    it("jsonDeepEquals - Equivalent objects shallow", () => {
        expect(jsonDeepEquals("abc", "abc")).toBeTruthy();
        expect(jsonDeepEquals(123, 123)).toBeTruthy();
    });

    it("jsonDeepEquals - NOT equivalent objects shallow", () => {
        expect(jsonDeepEquals("123", 123)).toBeFalsy();
    });
});
