import { describe, expect, it } from "vitest";
import { applyJSONPatch, validateJSONPatch } from "./json-patch";

describe("JSON Patch", () => {
    it("applyJSONPatch - Applies an empty JSON Patch", () => {
        expect(applyJSONPatch(testData, [])).toEqual(testData);
    });

    it("applyJSONPatch - Applies a JSON Patch", () => {
        expect(applyJSONPatch(testData, [
            { op: "add", path: "/abc/-", value: 456 }
        ])).toEqual({
            abc: [
                "def",
                123,
                456
            ],
        });
    });

    it("applyJSONPatch - Invalid patch returns the input object", () => {
        expect(applyJSONPatch(testData, [
            { op: "replace", path: "/abc", value: 456 },
            { op: "replace", path: "//", value: null }
        ])).toEqual(testData);
    });

    it("applyJSONPatch - Does not mutate the input data", () => {
        const data = { abc: 123 };
        applyJSONPatch(data, [
            { op: "replace", path: "/abc", value: 456 }
        ]);
        expect(data).toEqual({ abc: 123 });
    });

    it("validateJSONPatch - Valid patch returns null", () => {
        expect(validateJSONPatch([
            { op: "add", path: "/abc/-", value: 456 }
        ])).toBeNull();
    });

    it("validateJSONPatch - Patch that is not an array returns a string with an error", () => {
        expect(validateJSONPatch("abc")).toBeTypeOf("string");
    });

    it("validateJSONPatch - Patch with an invalid operation returns a string with an error", () => {
        expect(validateJSONPatch([
            { op: "abc", path: "/", value: 456 }
        ])).toBeTypeOf("string");
    });
});

const testData = {
    abc: [
        "def",
        123,
    ]
};