import { describe, it, expect } from "vitest";
import { IRegexpParser } from "./iregexp-parser";

describe("Parser", () => {
    it("Parses an empty expression", () => {
        expect(parse(``)).toBeTruthy();
    });

    it("Parses a normal character", () => {
        expect(parse(`a`)).toBeTruthy();
    });

    it("Parses an optional quantifier", () => {
        expect(parse(`a?`)).toBeTruthy();
    });

    it("Parses a zero or more quantifier", () => {
        expect(parse(`a*`)).toBeTruthy();
    });

    it("Parses a one or more quantifier", () => {
        expect(parse(`a+`)).toBeTruthy();
    });

    it("Parses a range quantifier", () => {
        expect(parse(`a{2,5}`)).toBeTruthy();
    });

    it("Parses a range quantifier with only a minimal amount", () => {
        expect(parse(`a{2}`)).toBeTruthy();
    });

    it("Parses OR", () => {
        expect(parse(`a|b`)).toBeTruthy();
    });

    it("Parses a single character escape", () => {
        expect(parse(`\\+`)).toBeTruthy();
    });

    it("Parses a character class escape", () => {
        expect(parse(`\\p{L}`)).toBeTruthy();
    });

    it("Parses a not character class escape", () => {
        expect(parse(`\\P{L}`)).toBeTruthy();
    });

    it("Parses a character class expression", () => {
        expect(parse(`[abc]`)).toBeTruthy();
    });

    it("Parses a character class expression with range", () => {
        expect(parse(`[a-d]`)).toBeTruthy();
    });

    it("Parses a character class expression with range unbounded from right", () => {
        expect(parse(`[a-]`)).toBeTruthy();
    });

    it("Parses a character class expression with range unbounded from left", () => {
        expect(parse(`[-a]`)).toBeTruthy();
    });

    it("Parses a negated character class expression", () => {
        expect(parse(`[^abc]`)).toBeTruthy();
    });

    it("Parses a subexpression", () => {
        expect(parse(`a(bc)d`)).toBeTruthy();
    });

    it("Not parses an isolated optional quantifier", () => {
        expect(parse(`?`)).toBeFalsy();
    });

    it("Not parses an isolated zero or more quantifier", () => {
        expect(parse(`*`)).toBeFalsy();
    });

    it("Not parses an isolated one or more quantifier", () => {
        expect(parse(`+`)).toBeFalsy();
    });

    it("Not parses an unterminated range quantifier", () => {
        expect(parse(`a{2,5`)).toBeFalsy();
    });

    it("Not parses an unterminated character class expression", () => {
        expect(parse(`[abc`)).toBeFalsy();
    });

    it("Not parses an unterminated subexpression", () => {
        expect(parse(`a(bcd`)).toBeFalsy();
    });
});

function parse(iRegexpText: string): boolean {
    const parser = new IRegexpParser();
    return parser.parse(iRegexpText).isSuccess;
}