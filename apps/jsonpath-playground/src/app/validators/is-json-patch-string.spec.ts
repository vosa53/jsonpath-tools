import { describe, expect, it } from "vitest";
import { isJSONPatchString } from "./is-json-patch-string";

describe("Is JSON Patch string validator", () => {
    it("isJSONPatchString - Returns null for a valid JSON Patch", () => {
        expect(isJSONPatchString(`[{ "op": "add", "path": "/abc/-", "value": 456 }]`)).toBeNull();
    });

    it("isJSONString - Returns a string with an error for an invalid JSON Patch", () => {
        expect(isJSONPatchString(`[{ "op": "abc", "path": "/", "value": 456 }]`)).toBeTypeOf("string");
    });
});
