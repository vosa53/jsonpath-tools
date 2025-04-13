import { IRegexpParser } from "./syntax-analysis/iregexp-parser";

/**
 * I-Regexp checker compliant with standard [RFC 9485](https://datatracker.ietf.org/doc/rfc9485/).
 */
export class IRegexp {
    private static readonly iRegexpParser = new IRegexpParser();

    /**
     * Converts the given I-Regexp expression to the native ECMAScript (JavaScript) regular expression.
     * @param iRegexpText Text of the I-Regexp expression.
     * @param fullMatch Whether the resulting regular expression must match the text as a whole. Effectively means wrapping the expression with `^` and `$`.
     * @returns ECMAScript (JavaScript) regular expression.
     * @throws When the given I-Regexp expression is syntactically invalid.
     */
    static convertToECMAScriptRegExp(iRegexpText: string, fullMatch: boolean): RegExp {
        const parseResult = this.iRegexpParser.parse(iRegexpText);
        if (!parseResult.isSuccess) throw new Error("Invalid I-Regexp.");
        
        const iRegexpCharacters = iRegexpText.split("");
        for (const dotIndex of parseResult.dotIndices)
            iRegexpCharacters[dotIndex] = "[^\n\r]";
        let transformedIRegexp = iRegexpCharacters.join("");
        transformedIRegexp = fullMatch ? `^(?:${transformedIRegexp})$` : transformedIRegexp;
        
        try {
            return new RegExp(transformedIRegexp, "u");
        }
        catch {
            throw new Error("Invalid I-Regexp.");
        }
    }

    private constructor() { }
}