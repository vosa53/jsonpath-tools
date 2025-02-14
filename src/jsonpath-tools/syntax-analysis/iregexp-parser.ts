const unicodeCategories = new Map<string, Set<string>>([
    ["L", new Set(["l", "m", "o", "t", "u"])],
    ["M", new Set(["c", "e", "n"])],
    ["N", new Set(["d", "l", "o"])],
    ["P", new Set(["c", "d", "e", "f", "i", "o", "s"])],
    ["Z", new Set(["l", "p", "s"])],
    ["S", new Set(["c", "k", "m", "o"])],
    ["C", new Set(["c", "f", "n", "o"])],
]);

export class IRegexpParser {
    parse(iregexp: string): boolean {
        const context = new ParserContext(iregexp);
        return this.parseIRegexp(context);
    }

    parseIRegexp(context: ParserContext): boolean {
        if (!this.parseBranch(context)) return false;
        while (context.current === "|") {
            context.goNext();
            if (!this.parseBranch(context)) return false;
        }
        return true;
    }

    parseBranch(context: ParserContext): boolean {
        while (context.current !== "|" && context.current !== null) {
            if (!this.parsePiece(context)) return false;
        }
        return true;
    }

    parsePiece(context: ParserContext): boolean {
        if (!this.parseAtom(context)) return false;
        if (context.current === "?" || context.current === "*" || context.current === "+" || context.current === "{") {
            if (!this.parseQuantifier(context)) return false;
        }
        return true;
    }

    parseQuantifier(context: ParserContext): boolean {
        if (context.current !== "{") {
            context.goNext();
            return true;
        }
        else {
            context.goNext();
            if (!this.parseQuantExact(context)) return false;
            // @ts-ignore
            if (context.current === ",") {
                context.goNext();
                if (this.isDigit(context.current)) {
                    if (!this.parseQuantExact(context)) return false;
                }
            }
            // @ts-ignore
            if (context.current !== "}") return false;
            context.goNext();
            return true;
        }
    }

    parseQuantExact(context: ParserContext): boolean {
        if (this.isDigit(context.current)) {
            context.goNext();
            while (this.isDigit(context.current))
                context.goNext();
            return true;
        }
        else
            return false;
    }

    parseAtom(context: ParserContext): boolean {
        if (context.current === ".") {
            return this.parseDot(context);
        }
        if (context.current === "(") {
            return this.parseSubIRegexp(context);
        }
        else if (context.current === "[") {
            return this.parseCharClassExpr(context);
        }
        else if (context.current === "\\") {
            if (context.next === "p" || context.next === "P") {
                return this.parseCatEsc(context);
            }
            else {
                return this.parseSingleCharEsc(context);
            }
        }

        return this.tryParseNormalChar(context);
    }

    tryParseNormalChar(context: ParserContext): boolean {
        if (context.current === null) return false;

        if (context.current >= "\u0000" && context.current <= "\u0027" ||
            context.current === "," || context.current === "-" ||
            context.current >= "\u002F" && context.current <= "\u003E" ||
            context.current >= "\u0040" && context.current <= "\u005A" ||
            context.current >= "\u005E" && context.current <= "\u007A" ||
            context.current >= "\u007E" && context.current <= "\uD7FF" ||
            context.current >= "\uE000" && context.current <= "\uFFFF"
        ) {
            context.goNext();
            return true;
        }

        if (context.current >= "\uD800" && context.current <= "\uDBFF" && 
            context.next !== null && context.next >= "\uDC00" && context.next <= "\uDFFF"
        ) {
            context.goNext();
            context.goNext();
            return true;
        }

        return false;
    }

    parseDot(context: ParserContext): boolean {
        context.goNext();
        return true;
    }

    parseSubIRegexp(context: ParserContext): boolean {
        context.goNext();
        if (!this.parseIRegexp(context)) return false;
        if (context.current !== ")") return false;
        context.goNext();
        return true;
    }

    parseSingleCharEsc(context: ParserContext): boolean {
        context.goNext();
        if (context.current === null) return false;

        if (
            context.current >= "\u0028" && context.current <= "\u002B" || 
            context.current === "-" || context.current === "." || context.current === "?" ||
            context.current >= "\u005B" && context.current <= "\u005E" || 
            context.current === "n" || context.current === "r" || context.current === "t" ||
            context.current >= "\u007B" && context.current <= "\u007D" 
        ) {
            context.goNext();
            return true;
        }

        return false;
    }

    parseCatEsc(context: ParserContext): boolean {
        context.goNext();
        context.goNext();
        if (context.current !== "{") return false;
        context.goNext();
        const first = context.current;
        context.goNext();
        // @ts-ignore
        const second = context.current !== "}" ? context.current : null;
        // @ts-ignore
        if (context.current !== "}") context.goNext();

        // @ts-ignore
        if (context.current !== "}") return false;
        if (!unicodeCategories.has(first)) return false;
        if (second !== null && !unicodeCategories.get(first)!.has(second)) return false;
        return true;
    }

    parseCharClassExpr(context: ParserContext): boolean {
        context.goNext();
        if (context.current === "^") context.goNext();
        if (context.current === "-") context.goNext();
        else {
            if (!this.parseCCE1(context)) return false;
        }

        while (context.current !== "]" && context.current !== "-" && context.current !== null) {
            if (!this.parseCCE1(context)) return false;
        }

        if (context.current === "-") context.goNext();
        if (context.current !== "]") return false;
        context.goNext();
        return true;
    } 

    parseCCE1(context: ParserContext): boolean {
        if (context.current === "\\" && (context.next === "p" || context.next === "P")) {
            return this.parseCatEsc(context);
        }
        else {
            if (!this.parseCCchar(context)) return false;
            if (context.current === "-" && context.next !== "]") {
                context.goNext();
                if (!this.parseCCchar(context)) return false;
            }
            return true;
        }
    }

    parseCCchar(context: ParserContext): boolean {
        if (context.current === null) return false;

        if (context.current >= "\u0000" && context.current <= "\u002C" ||
            context.current === "," || context.current === "-" ||
            context.current >= "\u002E" && context.current <= "\u005A" ||
            context.current >= "\u005E" && context.current <= "\uD7FF" ||
            context.current >= "\uE000" && context.current <= "\uFFFF"
        ) {
            context.goNext();
            return true;
        }

        if (context.current >= "\uD800" && context.current <= "\uDBFF" && 
            context.next !== null && context.next >= "\uDC00" && context.next <= "\uDFFF"
        ) {
            context.goNext();
            context.goNext();
            return true;
        }

        if (context.current === "\\")
            return this.parseSingleCharEsc(context);
        else
            return false;
    }

    private isDigit(character: string | null) {
        return character !== null && character >= "0" && character <= "9";
    }
}

class ParserContext {
    private _currentIndex = 0;

    constructor(readonly input: string) {

    }

    get currentIndex(): number {
        return this._currentIndex;
    }

    get current(): string | null {
        return this._currentIndex < this.input.length 
            ? this.input[this._currentIndex] 
            : null;
    }

    get next(): string | null {
        return this._currentIndex + 1 < this.input.length 
            ? this.input[this._currentIndex + 1] 
            : null;
    }

    goNext() {
        this._currentIndex++;
    }
}