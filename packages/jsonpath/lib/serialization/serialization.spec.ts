import { describe, it, expect } from "vitest";
import { serializeBoolean, serializedNormalizedPath, serializeLiteral, serializeNull, serializeNumber, serializeString, StringQuotes } from "./serialization";

describe("Serialization", () => {
    it("serializeString - Simple string without escaping (single quotes)", () => {
        expect(serializeString(`Lorem "impsum"`, StringQuotes.single)).toBe(`'Lorem "impsum"'`);
    });

    it("serializeString - Simple string without escaping (double quotes)", () => {
        expect(serializeString(`Lorem 'impsum'`, StringQuotes.double)).toBe(`"Lorem 'impsum'"`);
    });

    it("serializeString - Escapes quote (single quotes)", () => {
        expect(serializeString(`Lorem 'impsum'`, StringQuotes.single)).toBe(`'Lorem \\'impsum\\''`);
    });

    it("serializeString - Escapes quote (double quotes)", () => {
        expect(serializeString(`Lorem "impsum"`, StringQuotes.double)).toBe(`"Lorem \\"impsum\\""`);
    });

    it("serializeString - Escapes \\", () => {
        expect(serializeString(`abc\\ def \\\\'`, StringQuotes.double)).toBe(`"abc\\\\ def \\\\\\\\'"`);
    });

    it("serializeString - Characters lower than \\u0020 are escaped using \\uXXXX", () => {
        expect(serializeString(`\u0000\u0010aa b c\u001f`, StringQuotes.double)).toBe(`"\\u0000\\u0010aa b c\\u001f"`);
    });

    it("serializeString - Characters \\b \\f \\n \\r \\t are escaped using \\b \\f \\n \\r \\t", () => {
        expect(serializeString(`\b \f \n \r \t`, StringQuotes.double)).toBe(`"\\b \\f \\n \\r \\t"`);
    });

    it("serializeNumber - Serializes an integer", () => {
        expect(serializeNumber(25.0)).toBe("25");
    });

    it("serializeNumber - Serializes a decimal number", () => {
        expect(serializeNumber(3.1415927)).toBe("3.1415927");
    });

    it("serializeBoolean - Serializes false", () => {
        expect(serializeBoolean(false)).toBe("false");
    });

    it("serializeBoolean - Serializes true", () => {
        expect(serializeBoolean(true)).toBe("true");
    });

    it("serializeNull - Serializes null", () => {
        expect(serializeNull()).toBe("null");
    });

    it("serializeLiteral - Serializes literals", () => {
        expect(serializeLiteral(`Lorem\n'impsum'`, StringQuotes.single)).toBe(`'Lorem\\n\\'impsum\\''`);
        expect(serializeLiteral(`Lorem\n"impsum"`, StringQuotes.double)).toBe(`"Lorem\\n\\"impsum\\""`);
        expect(serializeLiteral(3.1415927)).toBe("3.1415927");
        expect(serializeLiteral(true)).toBe("true");
        expect(serializeLiteral(null)).toBe("null");
    });

    it("serializedNormalizedPath - Serializes an empty path", () => {
        expect(serializedNormalizedPath([])).toBe(`$`);
    });

    it("serializedNormalizedPath - Serializes a non empty empty path", () => {
        expect(serializedNormalizedPath(["abc", 123, "def"])).toBe(`$['abc'][123]['def']`);
    });
});
