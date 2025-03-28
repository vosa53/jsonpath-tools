import { describe, it, expect } from "vitest";
import { IRegexp } from "./iregexp";

describe("IRegexp", () => {
    it("convertToECMAScriptRegExp - Has the unicode flag set", () => {
        const regex = IRegexp.convertToECMAScriptRegExp("abc", false);
        expect(regex.unicode).toBe(true);
    });

    it("convertToECMAScriptRegExp - Simple expression", () => {
        const regex = IRegexp.convertToECMAScriptRegExp("a+bc[def]\\n{1,3}", false);
        expect(regex.toString()).toBe("/a+bc[def]\\n{1,3}/u");
    });

    it("convertToECMAScriptRegExp - Dot character class is converted to any character except \\n and \\r", () => {
        const regex = IRegexp.convertToECMAScriptRegExp("a.c", false);
        expect(regex.toString()).toBe("/a[^\\n\\r]c/u");
    });

    it("convertToECMAScriptRegExp - fullMatch parameter adds start and end anchor", () => {
        const regex = IRegexp.convertToECMAScriptRegExp("abc", true);
        expect(regex.toString()).toBe("/^(?:abc)$/u");
    });

    it("convertToECMAScriptRegExp - Invalid I-regexp throws an error", () => {
        expect(() => {
            IRegexp.convertToECMAScriptRegExp("(?:abc)", false);
        }).toThrow();
    });
});