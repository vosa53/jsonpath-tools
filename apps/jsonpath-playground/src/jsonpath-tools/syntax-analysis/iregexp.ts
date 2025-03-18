import { IRegexpParser } from "./iregexp-parser";

export class IRegexp {
    private static readonly iRegexpParser = new IRegexpParser();

    static convertToECMAScriptRegExp(iRegexp: string, fullMatch: boolean): RegExp {
        const parseResult = this.iRegexpParser.parse(iRegexp);
        if (!parseResult.isSuccess) throw new Error("Invalid IRegexp.");
        
        let iRegexpCharacters = iRegexp.split("");
        for (const dotIndex of parseResult.dotIndices)
            iRegexpCharacters[dotIndex] = "[^\n\r]";
        let transformedIRegexp = iRegexpCharacters.join("");
        transformedIRegexp = fullMatch ? `^(?:${transformedIRegexp})$` : transformedIRegexp;
        
        try {
            return new RegExp(transformedIRegexp, "u");
        }
        catch {
            throw new Error("Invalid IRegexp.");
        }
    }
}