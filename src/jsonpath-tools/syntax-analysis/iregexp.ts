import { IRegexpParser } from "./iregexp-parser";

export class IRegexp {
    private static readonly iRegexpParser = new IRegexpParser();

    static convertToECMAScriptRegExp(iRegexp: string, fullMatch: boolean): RegExp {
        const isValidIRegexp = this.iRegexpParser.parse(iRegexp);
        if (!isValidIRegexp) throw new Error("Invalid IRegexp.");
        
        // TODO: Replace unescaped dots with [^\n\r]?
        const transformedIRegexp = fullMatch ? `^(?:${iRegexp})$` : iRegexp;
        try {
            return new RegExp(transformedIRegexp, "u");
        }
        catch {
            throw new Error("Invalid IRegexp.");
        }
    }
}