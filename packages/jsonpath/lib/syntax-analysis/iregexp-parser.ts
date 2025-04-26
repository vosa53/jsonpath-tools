/**
 * I-Regexp expression parser.
 */
export class IRegexpParser {
    /**
     * Checks whether an expression text is valid and returns indices of dot characters.
     * 
     * Parse is fault-tolerant and does not throw any exceptions.
     * @param expressionText Text of the expression.
     */
    parse(expressionText: string): { isSuccess: boolean, dotIndices: number[] } {
        const context = new ParserContext(expressionText);
        const isSuccess = this.parseIRegexp(context) && context.current === null;
        return { isSuccess, dotIndices: context.dotIndices };
    }

    private parseIRegexp(context: ParserContext): boolean {
        if (!this.parseBranch(context)) return false;
        while (context.current === "|") {
            context.goNext();
            if (!this.parseBranch(context)) return false;
        }
        return true;
    }

    private parseBranch(context: ParserContext): boolean {
        while (context.current !== "|" && context.current !== ")" && context.current !== null) {
            if (!this.parsePiece(context)) return false;
        }
        return true;
    }

    private parsePiece(context: ParserContext): boolean {
        if (!this.parseAtom(context)) return false;
        if (context.current === "?" || context.current === "*" || context.current === "+" || context.current === "{") {
            if (!this.parseQuantifier(context)) return false;
        }
        return true;
    }

    private parseQuantifier(context: ParserContext): boolean {
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

    private parseQuantExact(context: ParserContext): boolean {
        if (this.isDigit(context.current)) {
            context.goNext();
            while (this.isDigit(context.current))
                context.goNext();
            return true;
        }
        else
            return false;
    }

    private parseAtom(context: ParserContext): boolean {
        if (context.current === ".") {
            return this.parseDot(context);
        }
        else if (context.current === "(") {
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

    private tryParseNormalChar(context: ParserContext): boolean {
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

    private parseDot(context: ParserContext): boolean {
        context.addDotIndex();
        context.goNext();
        return true;
    }

    private parseSubIRegexp(context: ParserContext): boolean {
        context.goNext();
        if (!this.parseIRegexp(context)) return false;
        if (context.current !== ")") return false;
        context.goNext();
        return true;
    }

    private parseSingleCharEsc(context: ParserContext): boolean {
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

    private parseCatEsc(context: ParserContext): boolean {
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
        context.goNext();
        
        if (!unicodeCategories.has(first)) return false;
        if (second !== null && !unicodeCategories.get(first)!.has(second)) return false;
        return true;
    }

    private parseCharClassExpr(context: ParserContext): boolean {
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

    private parseCCE1(context: ParserContext): boolean {
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

    private parseCCchar(context: ParserContext): boolean {
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
    private readonly _dotIndices: number[] = [];
    private _currentIndex = 0;

    constructor(private readonly expressionText: string) {

    }

    get currentIndex(): number {
        return this._currentIndex;
    }

    get current(): string | null {
        return this._currentIndex < this.expressionText.length 
            ? this.expressionText[this._currentIndex] 
            : null;
    }

    get next(): string | null {
        return this._currentIndex + 1 < this.expressionText.length 
            ? this.expressionText[this._currentIndex + 1] 
            : null;
    }

    get dotIndices(): number[] {
        return this._dotIndices;
    }

    goNext() {
        this._currentIndex++;
    }

    addDotIndex() {
        this._dotIndices.push(this._currentIndex);
    }
}

const unicodeCategories = new Map<string, Set<string>>([
    ["L", new Set(["l", "m", "o", "t", "u"])],
    ["M", new Set(["c", "e", "n"])],
    ["N", new Set(["d", "l", "o"])],
    ["P", new Set(["c", "d", "e", "f", "i", "o", "s"])],
    ["Z", new Set(["l", "p", "s"])],
    ["S", new Set(["c", "k", "m", "o"])],
    ["C", new Set(["c", "f", "n", "o"])],
]);
