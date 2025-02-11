import { describe, it, expect } from 'vitest';
import { JSONPathParser } from './parser';
import { JSONPathNode, JSONPathSyntaxTree, JSONPathToken } from './syntax-tree';
import { createSyntaxTree } from './utils';

describe("parser", () => {
    it("should parse", () => {
        const parser = new JSONPathParser();
        const result = parser.parse("$.pes.les[0, ?@.les >= 5]");
        console.log(createSyntaxTree(result.query, true));
        expect(5).toBe(5);
    });
});
