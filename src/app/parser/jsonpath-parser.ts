import { Diagnostics } from "next/dist/build/swc/types";
import { JSONPath, JSONPathAndExpression, JSONPathBooleanLiteral, JSONPathComparisonExpression, JSONPathFilterExpression, JSONPathFilterQueryExpression, JSONPathFilterSelector, JSONPathFunctionExpression, JSONPathIndexSelector, JSONPathNameSelector, JSONPathNotExpression, JSONPathNullLiteral, JSONPathNumberLiteral, JSONPathOrExpression, JSONPathParanthesisExpression, JSONPathQuery, JSONPathSegment, JSONPathSelector, JSONPathSliceSelector, JSONPathStringLiteral, JSONPathSyntaxTreeType, JSONPathToken, JSONPathWildcardSelector } from "./expression";
import { TextRange } from "./text-range";
import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "./jsonpath-diagnostics";

export class JSONPathParser {
    parse(input: string): JSONPath {
        const context = new ParserContext(input);
        const query = this.parseQuery(context, false);
        const endOfFileToken = context.collect(JSONPathSyntaxTreeType.endOfFileToken);

        return new JSONPath(query, endOfFileToken, context.diagnostics);
    }

    private parseQuery(context: ParserContext, allowedRelative: boolean): JSONPathQuery {
        this.skipWhitespace(context, false);

        let identifier: JSONPathToken | null = null;
        const isRelative = context.current === "@";
        if (context.current === "$" || context.current === "@") {
            context.goNext();
            identifier = context.collect(isRelative ? JSONPathSyntaxTreeType.atToken : JSONPathSyntaxTreeType.dollarToken);
        }
        else
            context.addError(`Expected $ ${allowedRelative ? "or @" : ""}.`);
        if (isRelative && !allowedRelative)
            context.addError("Relative queries are not allowed here.", identifier!.textRange);
        
        const segments: JSONPathSegment[] = [];
        while (context.current !== null) {
            this.skipWhitespace(context);

            // If not global, look whether it is . or [.
            if (allowedRelative && context.current !== "." && context.current !== "[")
                break;
            while (context.current !== "." && context.current !== "[" && !this.isNameFirstCharacter(context.current) && context.current !== null) 
                context.skip();
            if (context.current !== null) {
                const segment = this.parseSegment(context);
                segments.push(segment);
            }
        }

        // TODO: Disallow space.
        return new JSONPathQuery(identifier, segments, isRelative);
    }

    private parseSegment(context: ParserContext): JSONPathSegment {
        const hasDot = context.current === ".";
        if (hasDot) context.goNext();
        const isRecursive = context.current === ".";
        if (isRecursive) context.goNext();
        const dotToken = hasDot ? context.collect(isRecursive ? JSONPathSyntaxTreeType.doubleDotToken : JSONPathSyntaxTreeType.dotToken) : null;

        this.skipWhitespace(context, false);

        if (!hasDot && context.current !== "[") {
            context.addError("Expected '.' or '..' or '['.");
        }

        if (context.current === "[") {
            if (hasDot && !isRecursive) context.addError("'.' is not allowed before '['.", dotToken!.textRange);
            return this.parseBracketedSelection(context, dotToken, isRecursive);
        }
        else if (context.current === "*") {
            const wildcardSelector = this.parseWildcardSelector(context);
            return new JSONPathSegment(dotToken, null, [{ selector: wildcardSelector, commaToken: null }], null, isRecursive);
        }
        else if (context.current !== null && this.isNameFirstCharacter(context.current)) {
            const nameSelector = this.parseMemberNameShorthand(context);
            return new JSONPathSegment(dotToken, null, [{ selector: nameSelector, commaToken: null }], null, isRecursive);
        }
        else {
            context.addError("Expected a selector/selectors.");
            return new JSONPathSegment(dotToken, null, [], null, isRecursive);
        }
    }

    private parseMemberNameShorthand(context: ParserContext): JSONPathNameSelector {
        const name = this.parseName(context);
        return new JSONPathNameSelector(name.token, name.value);
    }

    private parseBracketedSelection(context: ParserContext, dotToken: JSONPathToken | null, isRecursive: boolean): JSONPathSegment {
        context.goNext();
        const openingToken = context.collect(JSONPathSyntaxTreeType.openingBracketToken);

        const selectors: { selector: JSONPathSelector | null, commaToken: JSONPathToken | null }[] = [];
        this.skipWhitespace(context);
        selectors.push({ selector: this.parseSelector(context), commaToken: null });
        this.skipWhitespace(context);
        this.skipToSelector(context);
        while (context.current === ",") {
            context.goNext();
            const commaToken = context.collect(JSONPathSyntaxTreeType.commaToken);
            selectors[selectors.length - 1].commaToken = commaToken;
            this.skipWhitespace(context);
            selectors.push({ selector: this.parseSelector(context), commaToken: null });
            this.skipWhitespace(context);
            this.skipToSelector(context);
        }

        let closingToken: JSONPathToken | null = null;
        if (context.current === "]") {
            context.goNext();
            closingToken = context.collect(JSONPathSyntaxTreeType.closingBracketToken);
        }
        else
            context.addError("Expected ']'.");
        return new JSONPathSegment(dotToken, openingToken, selectors, closingToken, isRecursive);
    }

    private skipToSelector(context: ParserContext) {
        while (context.current !== null && context.current !== "[" && context.current !== "." && context.current !== "]" && context.current !== ",")
            context.skip();
    }

    private parseSelector(context: ParserContext): JSONPathSelector | null {
        if (context.current === "\"" || context.current === "'") {
            return this.parseNameSelector(context);
        }
        else if (context.current === "*") {
            return this.parseWildcardSelector(context);
        }
        else if (context.current === "-" || (context.current !== null && this.isDigit(context.current)) || context.current === ":") {
            return this.parseSliceOrIndexSelector(context);
        }
        else if (context.current === "?") {
            return this.parseFilterSelector(context);
        }
        else {
            context.addError("Expected selector.");
            return null;
        }
    }

    private parseNameSelector(context: ParserContext): JSONPathNameSelector {
        const string = this.parseString(context);
        return new JSONPathNameSelector(string.token, string.value);
    }

    private parseWildcardSelector(context: ParserContext) {
        context.goNext();
        const starToken = context.collect(JSONPathSyntaxTreeType.starToken);
        return new JSONPathWildcardSelector(starToken);
    }

    private parseSliceOrIndexSelector(context: ParserContext): JSONPathIndexSelector | JSONPathSliceSelector {
        const indexOrStart = context.current !== ":" ? this.parseInteger(context) : null;
        this.skipWhitespace(context);
        let firstColonToken: JSONPathToken | null = null;
        if (context.current === ":") {
            context.goNext();
            firstColonToken = context.collect(JSONPathSyntaxTreeType.colonToken);
        }
        else 
            return new JSONPathIndexSelector(indexOrStart!.token, indexOrStart!.value);
        this.skipWhitespace(context);
        // @ts-ignore
        const end = context.current !== null && (this.isDigit(context.current) || context.current === "-") ? this.parseInteger(context) : null;
        this.skipWhitespace(context);
        let secondColonToken: JSONPathToken | null = null;
        let step: { token: JSONPathToken, value: number } | null = null;
        if (context.current === ":") {
            context.goNext();
            secondColonToken = context.collect(JSONPathSyntaxTreeType.colonToken);
            this.skipWhitespace(context);
            step = this.parseInteger(context);
        }

        return new JSONPathSliceSelector(
            indexOrStart?.token ?? null, 
            firstColonToken, 
            end?.token ?? null, 
            secondColonToken, 
            step?.token ?? null, 
            indexOrStart?.value ?? null, 
            end?.value ?? null, 
            step?.value ?? null
        );
    }

    private parseFilterSelector(context: ParserContext): JSONPathFilterSelector {
        context.goNext();
        const questionMarkToken = context.collect(JSONPathSyntaxTreeType.questionMarkToken);
        this.skipWhitespace(context);
        const filter = this.parseFilterExpression(context);
        if (filter !== null) this.checkFilterExpression(filter, context);
        // TODO: If null, skip to '[', ']', '.', ',', '(', ')'
        return new JSONPathFilterSelector(questionMarkToken, filter);
    }

    private parseFilterExpression(context: ParserContext): JSONPathFilterExpression | null {
        // TODO: Validate it is according to the grammar.
        return this.parseOrExpression(context);
    }

    private parseOrExpression(context: ParserContext): JSONPathFilterExpression | null {
        const andExpressions: { expression: JSONPathFilterExpression | null, orToken: JSONPathToken | null }[] = [];
        andExpressions.push({ expression: this.parseAndExpression(context), orToken: null });
        this.skipWhitespace(context);
        while (context.current === "|" && context.next === "|") {
            context.goNext();
            context.goNext();
            const orToken = context.collect(JSONPathSyntaxTreeType.doubleBarToken);
            andExpressions[andExpressions.length - 1].orToken = orToken;
            this.skipWhitespace(context);
            andExpressions.push({ expression: this.parseAndExpression(context), orToken: null });
            this.skipWhitespace(context);
        }
        return andExpressions.length === 1 ? andExpressions[0].expression : new JSONPathOrExpression(andExpressions);
    }

    private parseAndExpression(context: ParserContext): JSONPathFilterExpression | null {
        const basicExpressions: { expression: JSONPathFilterExpression | null, andToken: JSONPathToken | null }[] = [];
        basicExpressions.push({ expression: this.parseComparisonExpression(context), andToken: null });
        this.skipWhitespace(context);
        while (context.current === "&" && context.next === "&") {
            context.goNext();
            context.goNext();
            const andToken = context.collect(JSONPathSyntaxTreeType.doubleAmpersandToken);
            basicExpressions[basicExpressions.length - 1].andToken = andToken;
            this.skipWhitespace(context);
            basicExpressions.push({ expression: this.parseComparisonExpression(context), andToken: null });
            this.skipWhitespace(context);
        }
        return basicExpressions.length === 1 ? basicExpressions[0].expression : new JSONPathAndExpression(basicExpressions);
    }

    private parseComparisonExpression(context: ParserContext): JSONPathFilterExpression | null {
        const left = this.parseNotExpression(context);
        this.skipWhitespace(context);

        let operator = "";
        let operatorTokenType: JSONPathSyntaxTreeType;
        if (context.current === "=" && context.next === "=") { operator = "=="; operatorTokenType = JSONPathSyntaxTreeType.doubleEqualsToken; }
        else if (context.current === "!" && context.next === "=") { operator = "!="; operatorTokenType = JSONPathSyntaxTreeType.exclamationMarkEqualsToken; }
        else if (context.current === "<" && context.next === "=") { operator = "<="; operatorTokenType = JSONPathSyntaxTreeType.lessThanEqualsToken; }
        else if (context.current === ">" && context.next === "=") { operator = ">="; operatorTokenType = JSONPathSyntaxTreeType.greaterThanEqualsToken; }
        else if (context.current === "<") { operator = "<"; operatorTokenType = JSONPathSyntaxTreeType.lessThanToken; }
        else if (context.current === ">") { operator = ">"; operatorTokenType = JSONPathSyntaxTreeType.greaterThanToken; }
        else return left;
        for (let i = 0; i < operator.length; i++) context.goNext();
        const operatorToken = context.collect(operatorTokenType);

        this.skipWhitespace(context);
        const right = this.parseNotExpression(context);
        return new JSONPathComparisonExpression(left, operatorToken, right, operator);
    }

    private parseNotExpression(context: ParserContext): JSONPathFilterExpression | null {
        if (context.current === "!") {
            context.goNext();
            const exlamationMarkToken = context.collect(JSONPathSyntaxTreeType.exclamationMarkToken);
            this.skipWhitespace(context);
            const basicExpression = this.parseNotExpression(context);
            return new JSONPathNotExpression(exlamationMarkToken, basicExpression);
        }
        else
            return this.parseBasicExpression(context);
    }

    private parseBasicExpression(context: ParserContext): JSONPathFilterExpression | null {
        if (context.current === "$" || context.current === "@") {
            return this.parseFilterQueryExpression(context);
        }
        else if (context.current === "(") {
            return this.parseParanthesisExpression(context);
        }
        else if (context.current === "\"" || context.current === "'") {
            return this.parseStringLiteral(context);
        }
        else if (this.isDigit(context.current) || context.current === "-") {
            return this.parseNumberLiteral(context);
        }
        else if (this.isNameFirstCharacter(context.current)) {
            return this.parseFunctionOrLiteral(context);
        }
        else {
            context.addError("Expected expression.");
            return null;
        }
    }

    private parseFilterQueryExpression(context: ParserContext): JSONPathFilterQueryExpression {
        const query = this.parseQuery(context, true);
        return new JSONPathFilterQueryExpression(query);
    }

    private parseParanthesisExpression(context: ParserContext) {
        context.goNext();
        const openingParanthesisToken = context.collect(JSONPathSyntaxTreeType.openingParanthesisToken);
        this.skipWhitespace(context);
        const expression = this.parseFilterExpression(context);
        this.skipWhitespace(context);
        let closingParanthesisToken: JSONPathToken | null = null;
        if (context.current === ")") {
            context.goNext();
            closingParanthesisToken = context.collect(JSONPathSyntaxTreeType.closingParanthesisToken);
        }
        else
            context.addError("Expected ')'.");
        return new JSONPathParanthesisExpression(openingParanthesisToken, expression, closingParanthesisToken);
    }

    private parseStringLiteral(context: ParserContext): JSONPathFilterExpression {
        const string = this.parseString(context);
        return new JSONPathStringLiteral(string.token, string.value);
    }

    private parseNumberLiteral(context: ParserContext): JSONPathFilterExpression {
        // TODO: parse number, not integer
        const integer = this.parseInteger(context);
        return new JSONPathNumberLiteral(integer.token, integer.value);
    }

    private parseFunctionOrLiteral(context: ParserContext): JSONPathFilterExpression {
        const name = this.parseName(context);
        this.skipWhitespace(context);

        let openingParanthesisToken: JSONPathToken | null = null;
        let args: { arg: JSONPathFilterExpression | null, commaToken: JSONPathToken | null }[] = [];
        let closingParanthesisToken: JSONPathToken | null = null;
        if (context.current !== "(") {
            if (name.value === "true") return new JSONPathBooleanLiteral(this.changeTokenType(name.token, JSONPathSyntaxTreeType.trueToken), true);
            else if (name.value === "false") return new JSONPathBooleanLiteral(this.changeTokenType(name.token, JSONPathSyntaxTreeType.falseToken), false);
            else if (name.value === "null") return new JSONPathNullLiteral(this.changeTokenType(name.token, JSONPathSyntaxTreeType.nullToken));
            else context.addError("Expected '('.");
        }
        else {
            context.goNext();
            openingParanthesisToken = context.collect(JSONPathSyntaxTreeType.openingParanthesisToken);
            this.skipWhitespace(context);
            args = this.parseFunctionArguments(context);
            // @ts-ignore
            if (context.current === ")") {
                context.goNext();
                closingParanthesisToken = context.collect(JSONPathSyntaxTreeType.closingParanthesisToken);
            }
            else
                context.addError("Expected ')'.");
        }
        return new JSONPathFunctionExpression(name.token, openingParanthesisToken, args, closingParanthesisToken, name.value);
    }

    private parseFunctionArguments(context: ParserContext): { arg: JSONPathFilterExpression | null, commaToken: JSONPathToken | null }[] {
        const args: { arg: JSONPathFilterExpression | null, commaToken: JSONPathToken | null }[] = [];
        if (context.current === ")") return args;

        args.push({ arg: this.parseFilterExpression(context), commaToken: null });
        this.skipWhitespace(context);
        while (context.current === ",") {
            context.goNext();
            const commaToken = context.collect(JSONPathSyntaxTreeType.commaToken);
            args[args.length - 1].commaToken = commaToken;
            this.skipWhitespace(context);
            args.push({ arg: this.parseFilterExpression(context), commaToken: null });
            this.skipWhitespace(context);
        }

        return args;
    }

    private parseName(context: ParserContext): { token: JSONPathToken, value: string } {
        context.goNext();
        while (context.current !== null && (this.isNameCharacter(context.current)))
            context.goNext();
        const token = context.collect(JSONPathSyntaxTreeType.nameToken);
        return { token, value: token.text };
    }

    private parseString(context: ParserContext): { token: JSONPathToken, value: string } {
        const quote = context.current;
        context.goNext();
        let escaped = false;
        while (context.current !== quote && context.current !== null || escaped) {
            escaped = context.current === "\\" && !escaped;
            context.goNext();
        }
        context.goNext();
        const token = context.collect(JSONPathSyntaxTreeType.stringToken);
        return { token, value: token.text.substring(1) }; // TODO: Remove last quote.
    }

    private parseInteger(context: ParserContext): { token: JSONPathToken, value: number } {
        if (context.current === "0") {
            context.goNext();
            return { token: context.collect(JSONPathSyntaxTreeType.numberToken), value: 0};
        }

        if (context.current === "-")
            context.goNext();

        if (!this.isDigit(context.current)) {
            context.addError("Expected digit.");
            return { token: context.collect(JSONPathSyntaxTreeType.numberToken), value: 0 };
        }
        if (context.current === "0")
            context.addError("Leading zeros are not allowed.");
        context.goNext();
        while (this.isDigit(context.current))
            context.goNext();

        const token = context.collect(JSONPathSyntaxTreeType.numberToken);
        return { token, value: parseInt(token.text) };
    }

    private skipWhitespace(context: ParserContext, allowed = true) {
        const startPosition = context.currentIndex;
        while (this.isBlank(context.current))
            context.skip();
        if (!allowed && context.currentIndex !== startPosition)
            context.addError("Whitespace is not allowed here.", new TextRange(startPosition, context.currentIndex - startPosition));
    }

    private isBlank(character: string | null) {
        return character === " " || // \u0020
            character === "\t" || // \u0009
            character === "\n" || // \u000A
            character === "\r" // \u000D
    }

    private isDigit(character: string | null) {
        return character !== null && character >= "0" && character <= "9";
    }

    private isAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z" || character >= "A" && character <= "Z");
    }

    private isNameFirstCharacter(character: string | null) {
        return this.isAlpha(character) || character === "_"; // TODO: Other unicode characters.
    }

    private isNameCharacter(character: string | null) {
        return this.isNameFirstCharacter(character) || this.isDigit(character);
    }

    private changeTokenType(token: JSONPathToken, newType: JSONPathSyntaxTreeType): JSONPathToken {
        return new JSONPathToken(newType, token.position, token.text, token.skippedTextBefore);
    }

    private checkFilterExpression(expression: JSONPathFilterExpression, parserContext: ParserContext) {
        if (expression instanceof JSONPathOrExpression)
            expression.expressions.forEach(e => { if (e.expression !== null) this.checkLogicalExpressionOperand(e.expression, parserContext); });
        if (expression instanceof JSONPathAndExpression)
            expression.expressions.forEach(e => { if (e.expression !== null) this.checkLogicalExpressionOperand(e.expression, parserContext); });
        if (expression instanceof JSONPathNotExpression) {
            if (expression.expression !== null) {
                this.checkLogicalExpressionOperand(expression.expression, parserContext);
                if (expression.expression instanceof JSONPathNotExpression) {
                    parserContext.addError("Multiple negation is not allowed.", expression.expression.exlamationMarkToken.textRange);
                }
            }
        }
        if (expression instanceof JSONPathParanthesisExpression) {
            if (expression.expression !== null) this.checkLogicalExpressionOperand(expression.expression, parserContext);
        }
        if (expression instanceof JSONPathComparisonExpression) {
            if (expression.left !== null) this.checkComparisionExpressionOperand(expression.left, parserContext);
            if (expression.right !== null) this.checkComparisionExpressionOperand(expression.right, parserContext);
        }
        for (const child of expression.children) {
            if (child instanceof JSONPathFilterExpression) this.checkFilterExpression(child, parserContext);
        }
    }

    private checkComparisionExpressionOperand(operand: JSONPathFilterExpression, parserContext: ParserContext) {
        if (operand instanceof JSONPathFilterQueryExpression) {
            if (!operand.query.isSingular) {
                parserContext.addError("Query in comparison expression must be singular.", operand.textRange);
            }
        }
        if (operand instanceof JSONPathParanthesisExpression)
            parserContext.addError("Comparison expression operand can not be in paranthesis.", operand.textRange);
        if (operand instanceof JSONPathNotExpression)
            parserContext.addError("Comparison expression operand can not be negated.", operand.exlamationMarkToken.textRange);
    }

    private checkLogicalExpressionOperand(operand: JSONPathFilterExpression, parserContext: ParserContext) {
        if (operand instanceof JSONPathBooleanLiteral || operand instanceof JSONPathNullLiteral || operand instanceof JSONPathStringLiteral || operand instanceof JSONPathNumberLiteral)
            parserContext.addError("Only logical expression is allowed here.", operand.textRange);
    }
}

class ParserContext {
    private _currentIndex = 0;
    private _skippedCount = 0;
    private _collectedCount = 0;
    private _diagnostics: JSONPathDiagnostics[] = [];

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

    get diagnostics(): readonly JSONPathDiagnostics[] {
        return this._diagnostics;
    }

    skip() {
        if (this._collectedCount !== 0)
            throw new Error("Cannot skip when collecting.");
        this._skippedCount++;
        this._currentIndex++;
    }

    goNext() {
        this._collectedCount++;
        this._currentIndex++;
    }

    addError(message: string, textRange?: TextRange) {
        textRange ??= new TextRange(this._currentIndex, 0);
        const diagnostics = new JSONPathDiagnostics(JSONPathDiagnosticsType.error, message, textRange);
        this._diagnostics.push(diagnostics);
    }

    collect(type: JSONPathSyntaxTreeType): JSONPathToken {
        const position = this._currentIndex - this._collectedCount - this._skippedCount;
        const skippedText = this.input.substring(this._currentIndex - this._collectedCount - this._skippedCount, this._currentIndex - this._collectedCount);
        const collectedText = this.input.substring(this._currentIndex - this._collectedCount, this._currentIndex);
        this._skippedCount = 0;
        this._collectedCount = 0;
        return new JSONPathToken(type, position, collectedText, skippedText);
    }
}