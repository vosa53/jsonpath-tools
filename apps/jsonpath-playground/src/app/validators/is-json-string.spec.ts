import { describe, expect, it } from "vitest";
import { isJSONString } from "./is-json-string";

describe("Is JSON string validator", () => {
    it("isJSONString - Returns null for a valid JSON", () => {
        expect(isJSONString(`"test"`)).toBeNull();
        expect(isJSONString(`123`)).toBeNull();
        expect(isJSONString(`{ "abc": "def" }`)).toBeNull();
    });

    it("isJSONString - Returns a string with an error for an invalid JSON", () => {
        expect(isJSONString(`abc`)).toBeTypeOf("string");
        expect(isJSONString(`"test`)).toBeTypeOf("string");
        expect(isJSONString(`123..2`)).toBeTypeOf("string");
        expect(isJSONString(`{ "abc": "def }`)).toBeTypeOf("string");
    });

    it("isJSONString - Returns null for a valid JSON with a valid data", () => {
        expect(isJSONString(`123`, d => d === 123 ? null : "Lorem impsum")).toBeNull();
    });

    it("isJSONString - Returns a string with an error for a valid JSON with an invalid data", () => {
        expect(isJSONString(`123`, d => d === "123" ? null : "Lorem impsum")).toBe("Lorem impsum");
    });
});
