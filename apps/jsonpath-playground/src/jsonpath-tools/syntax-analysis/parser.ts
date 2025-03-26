import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "../diagnostics";
import { JSONPathAndExpression } from "../query/filter-expression/and-expression";
import { JSONPathBooleanLiteral } from "../query/filter-expression/boolean-literal";
import { JSONPathComparisonExpression, JSONPathComparisonOperator } from "../query/filter-expression/comparison-expression";
import { JSONPathFilterExpression } from "../query/filter-expression/filter-expression";
import { JSONPathFilterQueryExpression } from "../query/filter-expression/filter-query-expression";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathMissingExpression } from "../query/filter-expression/missing-expression";
import { JSONPathNotExpression } from "../query/filter-expression/not-expression";
import { JSONPathNullLiteral } from "../query/filter-expression/null-literal";
import { JSONPathNumberLiteral } from "../query/filter-expression/number-literal";
import { JSONPathOrExpression } from "../query/filter-expression/or-expression";
import { JSONPathParanthesisExpression } from "../query/filter-expression/paranthesis-expression";
import { JSONPathStringLiteral } from "../query/filter-expression/string-literal";
import { JSONPath } from "../query/json-path";
import { JSONPathQuery } from "../query/query";
import { JSONPathSegment } from "../query/segment";
import { JSONPathFilterSelector } from "../query/selectors/filter-selector";
import { JSONPathIndexSelector } from "../query/selectors/index-selector";
import { JSONPathMissingSelector } from "../query/selectors/missing-selector";
import { JSONPathNameSelector } from "../query/selectors/name-selector";
import { JSONPathSelector } from "../query/selectors/selector";
import { JSONPathSliceSelector } from "../query/selectors/slice-selector";
import { JSONPathWildcardSelector } from "../query/selectors/wildcard-selector";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathToken } from "../query/token";
import { TextRange } from "../text-range";

export class JSONPathParser {
    parse(input: string): JSONPath {
        const context = new ParserContext(input);
        const query = this.parseQuery(context, false);
        const endOfFileToken = context.collectToken(JSONPathSyntaxTreeType.endOfFileToken);

        if (endOfFileToken.skippedTextBefore.length !== 0) context.addError("Whitespace is not allowed here", endOfFileToken.textRange);
        return new JSONPath(query, endOfFileToken, context.diagnostics);
    }

    private parseQuery(context: ParserContext, allowedRelative: boolean): JSONPathQuery {
        this.skipWhitespace(context, false);

        const isRelative = context.current === "@";
        if (context.current === "$" || context.current === "@")
            context.goNext();
        else
            context.addError(`Expected $ ${allowedRelative ? "or @" : ""}.`);
        const identifier = context.collectToken(isRelative ? JSONPathSyntaxTreeType.atToken : JSONPathSyntaxTreeType.dollarToken);
        if (isRelative && !allowedRelative)
            context.addError("Relative queries are not allowed here.", identifier.textRangeWithoutSkipped);
        
        const segments: JSONPathSegment[] = [];
        while (context.current !== null) {
            this.skipWhitespace(context);

            // If not global, look whether it is . or [.
            if (allowedRelative && context.current !== "." && context.current !== "[")
                break;
            context.skipWhile(c => c !== "." && c !== "[" && !JSONPathCharacters.isNameFirst(c), "Invalid characters.");
            if (context.current !== null) {
                const segment = this.parseSegment(context);
                segments.push(segment);
            }
        }

        return new JSONPathQuery(identifier, segments, isRelative);
    }

    private parseSegment(context: ParserContext): JSONPathSegment {
        const hasDot = context.current === ".";
        if (hasDot) context.goNext();
        const isRecursive = context.current === ".";
        if (isRecursive) context.goNext();
        const dotToken = hasDot ? context.collectToken(isRecursive ? JSONPathSyntaxTreeType.doubleDotToken : JSONPathSyntaxTreeType.dotToken) : null;

        this.skipWhitespace(context, false);

        if (!hasDot && context.current !== "[")
            context.addError("Expected '.' or '..' or '['.");

        if (context.current === "[") {
            if (hasDot && !isRecursive) context.addError("'.' is not allowed before '['.", dotToken!.textRangeWithoutSkipped);
            return this.parseBracketedSelection(context, dotToken, isRecursive);
        }
        else if (context.current === "*") {
            const wildcardSelector = this.parseWildcardSelector(context);
            return new JSONPathSegment(dotToken, null, [{ selector: wildcardSelector, commaToken: null }], null, isRecursive);
        }
        else if (context.current !== null && JSONPathCharacters.isNameFirst(context.current)) {
            const nameSelector = this.parseMemberNameShorthand(context);
            return new JSONPathSegment(dotToken, null, [{ selector: nameSelector, commaToken: null }], null, isRecursive);
        }
        else {
            context.addError("Expected a selector/selectors.");
            const missingSelector = new JSONPathMissingSelector(context.collectToken(JSONPathSyntaxTreeType.missingToken));
            return new JSONPathSegment(dotToken, null, [{ selector: missingSelector, commaToken: null }], null, isRecursive);
        }
    }

    private parseMemberNameShorthand(context: ParserContext): JSONPathNameSelector {
        const name = this.parseName(context);
        return new JSONPathNameSelector(name.token, name.value);
    }

    private parseBracketedSelection(context: ParserContext, dotToken: JSONPathToken | null, isRecursive: boolean): JSONPathSegment {
        context.goNext();
        const openingToken = context.collectToken(JSONPathSyntaxTreeType.openingBracketToken);

        const selectors: { selector: JSONPathSelector, commaToken: JSONPathToken | null }[] = [];
        this.skipWhitespace(context);
        selectors.push({ selector: this.parseSelector(context), commaToken: null });
        this.skipWhitespace(context);
        this.skipToSelector(context);
        while (context.current === ",") {
            context.goNext();
            const commaToken = context.collectToken(JSONPathSyntaxTreeType.commaToken);
            selectors[selectors.length - 1].commaToken = commaToken;
            this.skipWhitespace(context);
            selectors.push({ selector: this.parseSelector(context), commaToken: null });
            this.skipWhitespace(context);
            this.skipToSelector(context);
        }

        if (context.current === "]")
            context.goNext();
        else
            context.addError("Expected ']'.");
        const closingToken = context.collectToken(JSONPathSyntaxTreeType.closingBracketToken);
        return new JSONPathSegment(dotToken, openingToken, selectors, closingToken, isRecursive);
    }

    private skipToSelector(context: ParserContext) {
        context.skipWhile(c => c !== "[" && c !== "." && c !== "]" && c !== ",", "Invalid characters");
    }

    private parseSelector(context: ParserContext): JSONPathSelector {
        if (context.current === "\"" || context.current === "'")
            return this.parseNameSelector(context);
        else if (context.current === "*")
            return this.parseWildcardSelector(context);
        else if (context.current === "-" || (context.current !== null && JSONPathCharacters.isDigit(context.current)) || context.current === ":")
            return this.parseSliceOrIndexSelector(context);
        else if (context.current === "?")
            return this.parseFilterSelector(context);
        else {
            context.addError("Expected selector.");
            return new JSONPathMissingSelector(context.collectToken(JSONPathSyntaxTreeType.missingToken));
        }
    }

    private parseNameSelector(context: ParserContext): JSONPathNameSelector {
        const string = this.parseString(context);
        return new JSONPathNameSelector(string.token, string.value);
    }

    private parseWildcardSelector(context: ParserContext) {
        context.goNext();
        const starToken = context.collectToken(JSONPathSyntaxTreeType.starToken);
        return new JSONPathWildcardSelector(starToken);
    }

    private parseSliceOrIndexSelector(context: ParserContext): JSONPathIndexSelector | JSONPathSliceSelector {
        const indexOrStart = context.current !== ":" ? this.parseNumber(context) : null;
        this.skipWhitespace(context);
        if (context.current !== ":") {
            this.checkIsInteger(indexOrStart!.token, context);
            return new JSONPathIndexSelector(indexOrStart!.token, indexOrStart!.value);
        }
        context.goNext();
        const firstColonToken = context.collectToken(JSONPathSyntaxTreeType.colonToken);
        this.skipWhitespace(context);
        // @ts-ignore
        const end = this.isDigit(context.current) || context.current === "-" ? this.parseNumber(context) : null;
        this.skipWhitespace(context);
        let secondColonToken: JSONPathToken | null = null;
        let step: { token: JSONPathToken, value: number } | null = null;
        if (context.current === ":") {
            context.goNext();
            secondColonToken = context.collectToken(JSONPathSyntaxTreeType.colonToken);
            this.skipWhitespace(context);
            // @ts-ignore
            step = this.isDigit(context.current) || context.current === "-" ? this.parseNumber(context) : null
        }

        if (indexOrStart !== null) this.checkIsInteger(indexOrStart.token, context);
        if (end !== null) this.checkIsInteger(end.token, context);
        if (step !== null) this.checkIsInteger(step.token, context);

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
        const questionMarkToken = context.collectToken(JSONPathSyntaxTreeType.questionMarkToken);
        this.skipWhitespace(context);
        const filterExpression = this.parseFilterExpression(context);
        this.checkLogicalExpressionOperand(filterExpression, context);
        // TODO: If null, skip to '[', ']', '.', ',', '(', ')'
        return new JSONPathFilterSelector(questionMarkToken, filterExpression);
    }

    private parseFilterExpression(context: ParserContext): JSONPathFilterExpression {
        return this.parseOrExpression(context);
    }

    private parseOrExpression(context: ParserContext): JSONPathFilterExpression {
        const andExpressions: { expression: JSONPathFilterExpression, orToken: JSONPathToken | null }[] = [];
        andExpressions.push({ expression: this.parseAndExpression(context), orToken: null });
        this.skipWhitespace(context);
        while (context.current === "|" && context.next === "|") {
            context.goNext();
            context.goNext();
            const orToken = context.collectToken(JSONPathSyntaxTreeType.doubleBarToken);
            andExpressions[andExpressions.length - 1].orToken = orToken;
            this.skipWhitespace(context);
            andExpressions.push({ expression: this.parseAndExpression(context), orToken: null });
            this.skipWhitespace(context);
        }

        if (andExpressions.length === 1) return andExpressions[0].expression;

        andExpressions.forEach(e => { if (e.expression !== null) this.checkLogicalExpressionOperand(e.expression, context); });
        return new JSONPathOrExpression(andExpressions);
    }

    private parseAndExpression(context: ParserContext): JSONPathFilterExpression {
        const basicExpressions: { expression: JSONPathFilterExpression, andToken: JSONPathToken | null }[] = [];
        basicExpressions.push({ expression: this.parseComparisonExpression(context), andToken: null });
        this.skipWhitespace(context);
        while (context.current === "&" && context.next === "&") {
            context.goNext();
            context.goNext();
            const andToken = context.collectToken(JSONPathSyntaxTreeType.doubleAmpersandToken);
            basicExpressions[basicExpressions.length - 1].andToken = andToken;
            this.skipWhitespace(context);
            basicExpressions.push({ expression: this.parseComparisonExpression(context), andToken: null });
            this.skipWhitespace(context);
        }

        if (basicExpressions.length === 1) return basicExpressions[0].expression;

        basicExpressions.forEach(e => { if (e.expression !== null) this.checkLogicalExpressionOperand(e.expression, context); });
        return new JSONPathAndExpression(basicExpressions);
    }

    private parseComparisonExpression(context: ParserContext): JSONPathFilterExpression {
        const left = this.parseNotExpression(context);
        this.skipWhitespace(context);

        let operator: JSONPathComparisonOperator;
        let operatorTokenType: JSONPathSyntaxTreeType;
        if (context.current === "=" && context.next === "=") { operator = JSONPathComparisonOperator.equals; operatorTokenType = JSONPathSyntaxTreeType.doubleEqualsToken; }
        else if (context.current === "!" && context.next === "=") { operator = JSONPathComparisonOperator.notEquals; operatorTokenType = JSONPathSyntaxTreeType.exclamationMarkEqualsToken; }
        else if (context.current === "<" && context.next === "=") { operator = JSONPathComparisonOperator.lessThanEquals; operatorTokenType = JSONPathSyntaxTreeType.lessThanEqualsToken; }
        else if (context.current === ">" && context.next === "=") { operator = JSONPathComparisonOperator.greaterThanEquals; operatorTokenType = JSONPathSyntaxTreeType.greaterThanEqualsToken; }
        else if (context.current === "<") { operator = JSONPathComparisonOperator.lessThan; operatorTokenType = JSONPathSyntaxTreeType.lessThanToken; }
        else if (context.current === ">") { operator = JSONPathComparisonOperator.greaterThan; operatorTokenType = JSONPathSyntaxTreeType.greaterThanToken; }
        else return left;
        for (let i = 0; i < operator.length; i++) context.goNext();
        const operatorToken = context.collectToken(operatorTokenType);

        this.skipWhitespace(context);
        const right = this.parseNotExpression(context);

        this.checkComparisionExpressionOperand(left, context);
        this.checkComparisionExpressionOperand(right, context);
        return new JSONPathComparisonExpression(left, operatorToken, right, operator);
    }

    private parseNotExpression(context: ParserContext): JSONPathFilterExpression {
        if (context.current !== "!")
            return this.parseBasicExpression(context);

        context.goNext();
        const exlamationMarkToken = context.collectToken(JSONPathSyntaxTreeType.exclamationMarkToken);
        this.skipWhitespace(context);
        const basicExpression = this.parseNotExpression(context);

        this.checkLogicalExpressionOperand(basicExpression, context);
        if (basicExpression instanceof JSONPathNotExpression)
            context.addError("Multiple negation is not allowed.", basicExpression.exlamationMarkToken.textRangeWithoutSkipped);
        return new JSONPathNotExpression(exlamationMarkToken, basicExpression);
    }

    private parseBasicExpression(context: ParserContext): JSONPathFilterExpression {
        if (context.current === "$" || context.current === "@")
            return this.parseFilterQueryExpression(context);
        else if (context.current === "(")
            return this.parseParanthesisExpression(context);
        else if (context.current === "\"" || context.current === "'")
            return this.parseStringLiteral(context);
        else if (JSONPathCharacters.isDigit(context.current) || context.current === "-")
            return this.parseNumberLiteral(context);
        else if (JSONPathCharacters.isNameFirst(context.current))
            return this.parseFunctionOrLiteral(context);
        else {
            context.addError("Expected expression.");
            return new JSONPathMissingExpression(context.collectToken(JSONPathSyntaxTreeType.missingToken));
        }
    }

    private parseFilterQueryExpression(context: ParserContext): JSONPathFilterQueryExpression {
        const query = this.parseQuery(context, true);
        return new JSONPathFilterQueryExpression(query);
    }

    private parseParanthesisExpression(context: ParserContext): JSONPathParanthesisExpression {
        context.goNext();
        const openingParanthesisToken = context.collectToken(JSONPathSyntaxTreeType.openingParanthesisToken);
        this.skipWhitespace(context);
        const expression = this.parseFilterExpression(context);
        this.skipWhitespace(context);
        if (context.current === ")")
            context.goNext();
        else
            context.addError("Expected ')'.");
        const closingParanthesisToken = context.collectToken(JSONPathSyntaxTreeType.closingParanthesisToken);

        this.checkLogicalExpressionOperand(expression, context);
        return new JSONPathParanthesisExpression(openingParanthesisToken, expression, closingParanthesisToken);
    }

    private parseStringLiteral(context: ParserContext): JSONPathStringLiteral {
        const string = this.parseString(context);
        return new JSONPathStringLiteral(string.token, string.value);
    }

    private parseNumberLiteral(context: ParserContext): JSONPathNumberLiteral {
        const integer = this.parseNumber(context);
        return new JSONPathNumberLiteral(integer.token, integer.value);
    }

    private parseFunctionOrLiteral(context: ParserContext): JSONPathFilterExpression {
        const name = this.parseName(context);
        this.skipWhitespace(context, false);

        const hasOpeningParanthesis = context.current === "(";
        if (!hasOpeningParanthesis) {
            if (name.value === "true") return new JSONPathBooleanLiteral(this.changeTokenType(name.token, JSONPathSyntaxTreeType.trueToken), true);
            else if (name.value === "false") return new JSONPathBooleanLiteral(this.changeTokenType(name.token, JSONPathSyntaxTreeType.falseToken), false);
            else if (name.value === "null") return new JSONPathNullLiteral(this.changeTokenType(name.token, JSONPathSyntaxTreeType.nullToken));
            else context.addError("Expected '('.");
        }
        else
            context.goNext();

        const openingParanthesisToken = context.collectToken(JSONPathSyntaxTreeType.openingParanthesisToken);
        this.skipWhitespace(context);
        const args = hasOpeningParanthesis ? this.parseFunctionArguments(context) : [];
        if (context.current === ")")
            context.goNext();
        else
            context.addError("Expected ')'.");
        const closingParanthesisToken = context.collectToken(JSONPathSyntaxTreeType.closingParanthesisToken);

        this.checkFunctionName(name.token, context);
        return new JSONPathFunctionExpression(name.token, openingParanthesisToken, args, closingParanthesisToken, name.value);
    }

    private parseFunctionArguments(context: ParserContext): { arg: JSONPathFilterExpression, commaToken: JSONPathToken | null }[] {
        const args: { arg: JSONPathFilterExpression, commaToken: JSONPathToken | null }[] = [];
        if (context.current === ")") return args;

        args.push({ arg: this.parseFilterExpression(context), commaToken: null });
        this.skipWhitespace(context);
        while (context.current === ",") {
            context.goNext();
            const commaToken = context.collectToken(JSONPathSyntaxTreeType.commaToken);
            args[args.length - 1].commaToken = commaToken;
            this.skipWhitespace(context);
            args.push({ arg: this.parseFilterExpression(context), commaToken: null });
            this.skipWhitespace(context);
        }

        return args;
    }

    private parseName(context: ParserContext): { token: JSONPathToken, value: string } {
        context.goNext();
        while (JSONPathCharacters.isName(context.current))
            context.goNext();
        const token = context.collectToken(JSONPathSyntaxTreeType.nameToken);
        return { token, value: token.text };
    }

    private parseString(context: ParserContext): { token: JSONPathToken, value: string } {
        type HexCharacterLiteral = { range: TextRange, value: string };
        const checkSurrogates = (previous: HexCharacterLiteral | null, current: HexCharacterLiteral | null) => {
            const errorMessage = "Unpaired surrogate.";
            if (current !== null && JSONPathCharacters.isLowSurrogate(current.value) && (previous === null || !JSONPathCharacters.isHighSurrogate(previous.value)))
                context.addError(errorMessage, current.range);
            if (previous !== null && JSONPathCharacters.isHighSurrogate(previous.value) && (current === null || !JSONPathCharacters.isLowSurrogate(current.value)))
                context.addError(errorMessage, previous.range);
        };

        const quote = context.current;
        context.goNext();
        let value = "";
        let previousHexCharacterLiteral: HexCharacterLiteral | null = null;
        while (context.current !== null && context.current !== quote) {
            let currentHexCharacterLiteral: HexCharacterLiteral | null = null;
            if (context.current === "\\") {
                context.goNext(); // @ts-ignore
                if (context.current === "b") value += "\b"; // @ts-ignore
                else if (context.current === "f") value += "\f"; // @ts-ignore
                else if (context.current === "n") value += "\n"; // @ts-ignore
                else if (context.current === "r") value += "\r"; // @ts-ignore
                else if (context.current === "t") value += "\t"; // @ts-ignore
                else if (context.current === "/" || context.current === "\\" || context.current === quote) value += context.current;
                else if (context.current === "u") {
                    let characterCodeString = "";
                    for (let i = 0; i < 4; i++) {
                        if (context.next === null || !JSONPathCharacters.isDigit(context.next) && !(context.next >= "a" && context.next <= "f") && !(context.next >= "A" && context.next <= "F")) {
                            context.addError("Expected a hexadecimal digit.");
                            break;
                        }
                        context.goNext();
                        characterCodeString += context.current;
                    }
                    if (characterCodeString.length === 4) {
                        const characterCode = parseInt(characterCodeString, 16);
                        const character = String.fromCharCode(characterCode);
                        value += character;
                        currentHexCharacterLiteral = { range: new TextRange(context.currentIndex - 4, 5), value: character };
                    }
                }
                else
                    context.addError("Invalid escape sequence.");
            }
            else if (JSONPathCharacters.isString(context.current))
                value += context.current;
            else
                context.addError("Invalid character in string.");
            context.goNext();
            checkSurrogates(previousHexCharacterLiteral, currentHexCharacterLiteral);
            previousHexCharacterLiteral = currentHexCharacterLiteral;
        }
        checkSurrogates(previousHexCharacterLiteral, null);
        const hasClosingQuote = context.current === quote;
        if (hasClosingQuote)
            context.goNext();
        else
            context.addError(`Expected '${quote}'.`);
        const token = context.collectToken(JSONPathSyntaxTreeType.stringToken);
        return { token, value };
    }

    private parseNumber(context: ParserContext): { token: JSONPathToken, value: number } {
        if (context.current === "-")
            context.goNext();

        if (!JSONPathCharacters.isDigit(context.current)) {
            context.addError("Expected a digit.");
            return { token: context.collectToken(JSONPathSyntaxTreeType.numberToken), value: 0 };
        }
        if (context.current === "0" && JSONPathCharacters.isDigit(context.next))
            context.addError("Leading zeros are not allowed.");

        while (JSONPathCharacters.isDigit(context.current))
            context.goNext();

        if (context.current === ".") {
            context.goNext();
            if (JSONPathCharacters.isDigit(context.current)) {
                while (JSONPathCharacters.isDigit(context.current))
                    context.goNext();
            }
            else
                context.addError("Expected a digit.");
        }

        if (context.current === "e" || context.current === "E") {
            context.goNext();
            // @ts-ignore
            if (context.current === "+" || context.current === "-") 
                context.goNext();
            if (JSONPathCharacters.isDigit(context.current)) {
                while (JSONPathCharacters.isDigit(context.current))
                    context.goNext();
            }
            else
                context.addError("Expected a digit.");
        }

        const token = context.collectToken(JSONPathSyntaxTreeType.numberToken);
        const value = parseFloat(token.text);
        return { token, value };
    }

    private skipWhitespace(context: ParserContext, allowed = true) {
        context.skipWhile(c => JSONPathCharacters.isBlank(c), allowed ? null : "Whitespace is not allowed here.");
    }

    private changeTokenType(token: JSONPathToken, newType: JSONPathSyntaxTreeType): JSONPathToken {
        return new JSONPathToken(newType, token.position, token.text, token.skippedTextBefore);
    }

    private checkComparisionExpressionOperand(operand: JSONPathFilterExpression, context: ParserContext) {
        if (operand instanceof JSONPathFilterQueryExpression) {
            if (!operand.query.isSingular)
                context.addError("Query in comparison expression must be singular.", operand.textRangeWithoutSkipped);
        }
        else if (operand instanceof JSONPathParanthesisExpression)
            context.addError("Comparison expression operand can not be in paranthesis.", operand.textRangeWithoutSkipped);
        else if (operand instanceof JSONPathNotExpression)
            context.addError("Comparison expression operand can not be negated.", operand.exlamationMarkToken.textRangeWithoutSkipped);
    }

    private checkLogicalExpressionOperand(operand: JSONPathFilterExpression, context: ParserContext) {
        if (operand instanceof JSONPathBooleanLiteral || operand instanceof JSONPathNullLiteral || operand instanceof JSONPathStringLiteral || operand instanceof JSONPathNumberLiteral)
            context.addError("Only logical expression is allowed here.", operand.textRangeWithoutSkipped);
    }

    private checkIsInteger(numberToken: JSONPathToken, context: ParserContext) {
        if (numberToken.text === "-0")
            context.addError("Negative zero is not allowed"), numberToken.textRangeWithoutSkipped;
        if (numberToken.text.includes("."))
            context.addError("Only integers are allowed here.", numberToken.textRangeWithoutSkipped);
        if (numberToken.text.includes("e") || numberToken.text.includes("E"))
            context.addError("Exponential notation (e/E) is not allowed here.", numberToken.textRangeWithoutSkipped);
    }

    private checkFunctionName(nameToken: JSONPathToken, context: ParserContext) {
        if (!JSONPathCharacters.isFunctionNameFirst(nameToken.text[0]))
            context.addError("Function name must start with a lowercase ASCII letter.", nameToken.textRangeWithoutSkipped);
        if (!nameToken.text.substring(1).split("").every(c => JSONPathCharacters.isFunctionName(c)))
            context.addError("Function name can contain only lowercase ASCII letters, digits or '_'.", nameToken.textRangeWithoutSkipped);
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

    skipWhile(predicate: (character: string) => boolean, errorMessage: string | null) {
        const startPosition = this.currentIndex;
        while (this.current !== null && predicate(this.current))
            this.skip();
        if (errorMessage !== null && this.currentIndex !== startPosition)
            this.addError(errorMessage, new TextRange(startPosition, this.currentIndex - startPosition));
    }

    goNext() {
        // TODO: Check UTF-16 validity? (Unpaired surrogates)
        this._collectedCount++;
        this._currentIndex++;
    }

    addError(message: string, textRange?: TextRange) {
        textRange ??= new TextRange(this._currentIndex, this.currentIndex < this.input.length ? 1 : 0);
        const diagnostics: JSONPathDiagnostics = { type: JSONPathDiagnosticsType.error, message, textRange };
        this._diagnostics.push(diagnostics);
    }

    collectToken(type: JSONPathSyntaxTreeType): JSONPathToken {
        const position = this._currentIndex - this._collectedCount - this._skippedCount;
        const skippedText = this.input.substring(this._currentIndex - this._collectedCount - this._skippedCount, this._currentIndex - this._collectedCount);
        const collectedText = this.input.substring(this._currentIndex - this._collectedCount, this._currentIndex);
        this._skippedCount = 0;
        this._collectedCount = 0;
        return new JSONPathToken(type, position, collectedText, skippedText);
    }
}

export class JSONPathCharacters {
    static isHighSurrogate(character: string) {
        return character >= "\uD800" && character <= "\uDBFF";
    }

    static isLowSurrogate(character: string) {
        return character >= "\uDC00" && character <= "\uDFFF";
    }

    static isBlank(character: string | null) {
        return character === " " || character === "\t" || character === "\n" || character === "\r";
    }

    static isDigit(character: string | null) {
        return character !== null && character >= "0" && character <= "9";
    }

    static isAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z" || character >= "A" && character <= "Z");
    }

    static isLowercaseAlpha(character: string | null) {
        return character !== null && (character >= "a" && character <= "z");
    }

    static isNameFirst(character: string | null) {
        return this.isAlpha(character) || character === "_" || character !== null && character >= "\u0080"; // Non-ASCII characters.
    }

    static isName(character: string | null) {
        return this.isNameFirst(character) || this.isDigit(character);
    }

    static isFunctionNameFirst(character: string | null) {
        return this.isLowercaseAlpha(character);
    }

    static isFunctionName(character: string | null) {
        return this.isFunctionNameFirst(character)  || character === "_" || this.isDigit(character);
    }

    static isString(character: string | null) {
        return character !== null && character !== "\\" && character >= "\u0020";
    }
}