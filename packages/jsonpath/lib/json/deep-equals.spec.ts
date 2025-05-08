import { describe, it, expect } from "vitest";
import { jsonDeepEquals } from "./deep-equals";

describe("Deep equals", () => {
    it("jsonDeepEquals - Equivalent objects shallow", () => {
        expect(jsonDeepEquals(123, 123)).toBeTruthy();
        expect(jsonDeepEquals("abc", "abc")).toBeTruthy();
        expect(jsonDeepEquals(false, false)).toBeTruthy();
        expect(jsonDeepEquals(null, null)).toBeTruthy();
    });

    it("jsonDeepEquals - NOT equivalent objects shallow", () => {
        expect(jsonDeepEquals("123", 123)).toBeFalsy();
        expect(jsonDeepEquals("null", null)).toBeFalsy();
        expect(jsonDeepEquals("abc", "abcd")).toBeFalsy();
    });

    it("jsonDeepEquals - Equivalent objects deep", () => {
        expect(jsonDeepEquals(["abc"], ["abc"])).toBeTruthy();
        expect(jsonDeepEquals({ a: "abc", b: "def" }, { b: "def", a: "abc" })).toBeTruthy();
        expect(jsonDeepEquals({ a: [1, 2, 3], b: "def" }, { b: "def", a: [1, 2, 3] })).toBeTruthy();
    });

    it("jsonDeepEquals - NOT equivalent objects deep", () => {
        expect(jsonDeepEquals(["abc", "def"], ["abc"])).toBeFalsy();
        expect(jsonDeepEquals(["abc"], ["abc", "def"])).toBeFalsy();
        expect(jsonDeepEquals({ a: "abc", b: "def", c: "ghi" }, { b: "def", a: "abc" })).toBeFalsy();
        expect(jsonDeepEquals({ a: "abc", b: "def" }, { b: "def", a: "abc", c: "ghi" })).toBeFalsy();
        expect(jsonDeepEquals({ a: [1, 2, 3], b: "def" }, { b: "def", a: [1, "2", 3] })).toBeFalsy();
    });
});
