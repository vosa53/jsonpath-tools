import { describe, it, expect } from "vitest";
import { getJSONType, JSONType } from "./json-types";

describe("JSON types", () => {
    it("getJSONType - Returns a JSON value type", () => {
        expect(getJSONType("abc")).toBe(JSONType.string);
        expect(getJSONType(3.1415927)).toBe(JSONType.number);
        expect(getJSONType(true)).toBe(JSONType.boolean);
        expect(getJSONType(null)).toBe(JSONType.null);
        expect(getJSONType({ test: "abc" })).toBe(JSONType.object);
        expect(getJSONType(["abc"])).toBe(JSONType.array);
    });
});
