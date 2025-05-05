import { describe, it, expect } from "vitest";
import { applyTextChanges } from "./operations";
import { TextChange } from "./text-change";
import { TextRange } from "./text-range";

describe("Text operations", () => {
    it("applyTextChanges - Empty changes returns the same text", () => {
        const resultText = applyTextChanges("abc", []);
        expect(resultText).toBe("abc");
    });

    it("applyTextChanges - One change", () => {
        const resultText = applyTextChanges("abcdef", [
            new TextChange(new TextRange(2, 3), "123")
        ]);
        expect(resultText).toBe("ab123f");
    });

    it("applyTextChanges - Two changes", () => {
        const resultText = applyTextChanges("abcdefghi", [
            new TextChange(new TextRange(2, 3), "123"),
            new TextChange(new TextRange(6, 2), "456")
        ]);
        expect(resultText).toBe("ab123f456i");
    });

    it("applyTextChanges - Empty change returns the same text", () => {
        const resultText = applyTextChanges("abc", [
            new TextChange(new TextRange(1, 0), "")
        ]);
        expect(resultText).toBe("abc");
    });

    it("applyTextChanges - Zero length change at end", () => {
        const resultText = applyTextChanges("abc", [
            new TextChange(new TextRange(3, 0), "def")
        ]);
        expect(resultText).toBe("abcdef");
    });

    it("applyTextChanges - Multiple changes with the same position are applied in the input order", () => {
        const resultText = applyTextChanges("abc", [
            new TextChange(new TextRange(3, 0), ""),
            new TextChange(new TextRange(1, 0), "12"),
            new TextChange(new TextRange(1, 0), "34"),
            new TextChange(new TextRange(1, 1), "56")
        ]);
        expect(resultText).toBe("a123456c");
    });

    it("applyTextChanges - Overlapping changes throw an error", () => {
        expect(() => {
            applyTextChanges("abc", [
                new TextChange(new TextRange(0, 2), ""),
                new TextChange(new TextRange(1, 2), "")
            ]);
        }).toThrow();
    });

    it("applyTextChanges - Change out of the text range throws an error", () => {
        expect(() => {
            applyTextChanges("abc", [
                new TextChange(new TextRange(1, 3), "")
            ]);
        }).toThrow();
    });
});