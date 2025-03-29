import { describe, expect, it } from 'vitest';
import { stringifySyntaxTree } from '../helpers/utils';
import { Parser } from './parser';
import { SyntaxTree } from '../query/syntax-tree';
import { SyntaxTreeToken } from '../query/syntax-tree-token';
import { SyntaxTreeNode } from '../query/syntax-tree-node';

describe("Parser", () => {
    it("Parses an empty expression", () => {
        expect(parse(``)).toBe(`
Query
    SubQuery
        DollarToken ""
    EndOfFileToken ""
`);
    });

    it("Parses a root expression", () => {
        expect(parse(`$`)).toBe(`
Query
    SubQuery
        DollarToken "$"
    EndOfFileToken ""
`);
    });

    it("Parses a shorthand name selector", () => {
        expect(parse(`$.abc`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            DotToken "."
            NameSelector
                NameToken "abc"
    EndOfFileToken ""
`);
    });

    it("Parses a shorthand wildcard selector", () => {
        expect(parse(`$.*`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            DotToken "."
            WildcardSelector
                StarToken "*"
    EndOfFileToken ""
`);
    });

    it("Parses a name selector", () => {
        expect(parse(`$["abc"]`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            OpeningBracketToken "["
            NameSelector
                StringToken "\\"abc\\""
            ClosingBracketToken "]"
    EndOfFileToken ""
`);
    });

    it("Parses an index selector", () => {
        expect(parse(`$[123]`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            OpeningBracketToken "["
            IndexSelector
                NumberToken "123"
            ClosingBracketToken "]"
    EndOfFileToken ""
`);
    });

    it("Parses a wildcard selector", () => {
        expect(parse(`$[*]`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            OpeningBracketToken "["
            WildcardSelector
                StarToken "*"
            ClosingBracketToken "]"
    EndOfFileToken ""
`);
    });

    it("Parses a slice selector", () => {
        expect(parse(`$[12:34:56]`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            OpeningBracketToken "["
            SliceSelector
                NumberToken "12"
                ColonToken ":"
                NumberToken "34"
                ColonToken ":"
                NumberToken "56"
            ClosingBracketToken "]"
    EndOfFileToken ""
`);
    });

    it("Parses a filter selector", () => {
        expect(parse(`$[?@ > 5]`)).toBe(`
Query
    SubQuery
        DollarToken "$"
        Segment
            OpeningBracketToken "["
            FilterSelector
                QuestionMarkToken "?"
                ComparisonExpression
                    FilterQueryExpression
                        SubQuery
                            AtToken "@"
                    GreaterThanToken ">"
                    NumberLiteralExpression
                        NumberToken "5"
            ClosingBracketToken "]"
    EndOfFileToken ""
`);
    });
});

function parse(queryText: string): string {
    const parser = new Parser();
    const result = parser.parse(queryText);
    return "\n" + stringifySyntaxTree(result);
}
