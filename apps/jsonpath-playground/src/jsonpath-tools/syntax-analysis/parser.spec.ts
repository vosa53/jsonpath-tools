import { describe, expect, it } from 'vitest';
import { createSyntaxTree } from '../utils';
import { JSONPathParser } from './parser';

describe("parser", () => {
    it("should parse", () => {
        const parser = new JSONPathParser();
        const result = parser.parse("$.pes.les[0, ?@.les >= 5]");
        console.log(createSyntaxTree(result.query, true));
        expect(5).toBe(5);
    });
});
