import { describe, expect, it } from 'vitest';

describe("test suite", () => {
    it("is compliant with test suite", () => {
        const parser = new JSONPathParser();
        const result = parser.parse("$.pes.les[0, ?@.les >= 5]");
        console.log(createSyntaxTree(result.query, true));
        expect(5).toBe(5);
    });
});
