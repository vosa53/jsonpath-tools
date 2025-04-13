import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { AndExpression } from "../query/filter-expression/and-expression";
import { BooleanLiteralExpression } from "../query/filter-expression/boolean-literal-expression";
import { ComparisonExpression, ComparisonOperator } from "../query/filter-expression/comparison-expression";
import { FilterExpression } from "../query/filter-expression/filter-expression";
import { FilterQueryExpression } from "../query/filter-expression/filter-query-expression";
import { FunctionExpression } from "../query/filter-expression/function-expression";
import { MissingExpression } from "../query/filter-expression/missing-expression";
import { NotExpression } from "../query/filter-expression/not-expression";
import { NullLiteralExpression } from "../query/filter-expression/null-literal-expression";
import { NumberLiteralExpression } from "../query/filter-expression/number-literal-expression";
import { OrExpression } from "../query/filter-expression/or-expression";
import { ParanthesisExpression } from "../query/filter-expression/paranthesis-expression";
import { StringLiteralExpression } from "../query/filter-expression/string-literal-expression";
import { Query } from "../query/query";
import { QueryType, SubQuery } from "../query/sub-query";
import { Segment, SegmentType } from "../query/segment";
import { FilterSelector } from "../query/selectors/filter-selector";
import { IndexSelector } from "../query/selectors/index-selector";
import { MissingSelector } from "../query/selectors/missing-selector";
import { NameSelector } from "../query/selectors/name-selector";
import { Selector } from "../query/selectors/selector";
import { SliceSelector } from "../query/selectors/slice-selector";
import { WildcardSelector } from "../query/selectors/wildcard-selector";
import { SyntaxTreeType } from "../query/syntax-tree-type";
import { SyntaxTreeToken } from "../query/syntax-tree-token";
import { TextRange } from "../text/text-range";
import { CharacterCategorizer } from "./character-categorizer";

/**
 * JSONPath query parser.
 */
export class Parser {
    /**
     * Parses a query text to syntax tree. 
     * 
     * Parse is fault-tolerant and does not throw any exceptions. Errors are returned in {@link Query.syntaxDiagnostics}.
     * @param queryText Text of the query.
     */
    parse(queryText: string): Query {
        const context = new ParserContext(queryText);
        const query = this.parseQuery(context, false);
        const endOfFileToken = context.collectToken(SyntaxTreeType.endOfFileToken);

        if (endOfFileToken.skippedTextBefore.length !== 0) context.addError("Whitespace is not allowed here", endOfFileToken.textRange);
        return new Query(query, endOfFileToken, context.diagnostics);
    }

    private parseQuery(context: ParserContext, allowedRelative: boolean): SubQuery {
        this.skipWhitespace(context, false);

        const type = context.current === "@" ? QueryType.relative : QueryType.absolute;
        if (context.current === "$" || context.current === "@")
            context.goNext();
        else
            context.addError(`Expected $ ${allowedRelative ? "or @" : ""}.`);
        const identifier = context.collectToken(type === QueryType.absolute ? SyntaxTreeType.dollarToken : SyntaxTreeType.atToken);
        if (type === QueryType.relative && !allowedRelative)
            context.addError("Relative queries are not allowed here.", identifier.textRangeWithoutSkipped);
        
        const segments: Segment[] = [];
        while (context.current !== null) {
            this.skipWhitespace(context);

            // If not global, look whether it is . or [.
            if (allowedRelative && context.current !== "." && context.current !== "[")
                break;
            context.skipWhile(c => c !== "." && c !== "[" && !CharacterCategorizer.isNameFirst(c), "Invalid characters.");
            if (context.current !== null) {
                const segment = this.parseSegment(context);
                segments.push(segment);
            }
        }

        return new SubQuery(identifier, segments, type);
    }

    private parseSegment(context: ParserContext): Segment {
        const hasDot = context.current === ".";
        if (hasDot) context.goNext();
        const type = context.current === "." ? SegmentType.descendant : SegmentType.child;
        if (type === SegmentType.descendant) context.goNext();
        const dotToken = hasDot ? context.collectToken(type === SegmentType.child ? SyntaxTreeType.dotToken : SyntaxTreeType.doubleDotToken) : null;

        this.skipWhitespace(context, false);

        if (!hasDot && context.current !== "[")
            context.addError("Expected '.' or '..' or '['.");

        if (context.current === "[") {
            if (hasDot && type === SegmentType.child) context.addError("'.' is not allowed before '['.", dotToken!.textRangeWithoutSkipped);
            return this.parseBracketedSelection(context, dotToken, type);
        }
        else if (context.current === "*") {
            const wildcardSelector = this.parseWildcardSelector(context);
            return new Segment(dotToken, null, [{ selector: wildcardSelector, commaToken: null }], null, type);
        }
        else if (context.current !== null && CharacterCategorizer.isNameFirst(context.current)) {
            const nameSelector = this.parseMemberNameShorthand(context);
            return new Segment(dotToken, null, [{ selector: nameSelector, commaToken: null }], null, type);
        }
        else {
            context.addError("Expected a selector/selectors.");
            const missingSelector = new MissingSelector(context.collectToken(SyntaxTreeType.missingToken));
            return new Segment(dotToken, null, [{ selector: missingSelector, commaToken: null }], null, type);
        }
    }

    private parseMemberNameShorthand(context: ParserContext): NameSelector {
        const name = this.parseName(context);
        return new NameSelector(name.token, name.value);
    }

    private parseBracketedSelection(context: ParserContext, dotToken: SyntaxTreeToken | null, type: SegmentType): Segment {
        context.goNext();
        const openingToken = context.collectToken(SyntaxTreeType.openingBracketToken);

        const selectors: { selector: Selector, commaToken: SyntaxTreeToken | null }[] = [];
        this.skipWhitespace(context);
        selectors.push({ selector: this.parseSelector(context), commaToken: null });
        this.skipWhitespace(context);
        this.skipToSelector(context);
        while (context.current === ",") {
            context.goNext();
            const commaToken = context.collectToken(SyntaxTreeType.commaToken);
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
        const closingToken = context.collectToken(SyntaxTreeType.closingBracketToken);
        return new Segment(dotToken, openingToken, selectors, closingToken, type);
    }

    private skipToSelector(context: ParserContext) {
        context.skipWhile(c => c !== "[" && c !== "." && c !== "]" && c !== ",", "Invalid characters");
    }

    private parseSelector(context: ParserContext): Selector {
        if (context.current === "\"" || context.current === "'")
            return this.parseNameSelector(context);
        else if (context.current === "*")
            return this.parseWildcardSelector(context);
        else if (context.current === "-" || (context.current !== null && CharacterCategorizer.isDigit(context.current)) || context.current === ":")
            return this.parseSliceOrIndexSelector(context);
        else if (context.current === "?")
            return this.parseFilterSelector(context);
        else {
            context.addError("Expected selector.");
            return new MissingSelector(context.collectToken(SyntaxTreeType.missingToken));
        }
    }

    private parseNameSelector(context: ParserContext): NameSelector {
        const string = this.parseString(context);
        return new NameSelector(string.token, string.value);
    }

    private parseWildcardSelector(context: ParserContext) {
        context.goNext();
        const starToken = context.collectToken(SyntaxTreeType.starToken);
        return new WildcardSelector(starToken);
    }

    private parseSliceOrIndexSelector(context: ParserContext): IndexSelector | SliceSelector {
        const indexOrStart = context.current !== ":" ? this.parseNumber(context) : null;
        this.skipWhitespace(context);
        if (context.current !== ":") {
            this.checkIsInteger(indexOrStart!.token, context);
            return new IndexSelector(indexOrStart!.token, indexOrStart!.value);
        }
        context.goNext();
        const firstColonToken = context.collectToken(SyntaxTreeType.colonToken);
        this.skipWhitespace(context);
        // @ts-ignore
        const end = CharacterCategorizer.isDigit(context.current) || context.current === "-" ? this.parseNumber(context) : null;
        this.skipWhitespace(context);
        let secondColonToken: SyntaxTreeToken | null = null;
        let step: { token: SyntaxTreeToken, value: number } | null = null;
        if (context.current === ":") {
            context.goNext();
            secondColonToken = context.collectToken(SyntaxTreeType.colonToken);
            this.skipWhitespace(context);
            // @ts-ignore
            step = CharacterCategorizer.isDigit(context.current) || context.current === "-" ? this.parseNumber(context) : null
        }

        if (indexOrStart !== null) this.checkIsInteger(indexOrStart.token, context);
        if (end !== null) this.checkIsInteger(end.token, context);
        if (step !== null) this.checkIsInteger(step.token, context);

        return new SliceSelector(
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

    private parseFilterSelector(context: ParserContext): FilterSelector {
        context.goNext();
        const questionMarkToken = context.collectToken(SyntaxTreeType.questionMarkToken);
        this.skipWhitespace(context);
        const filterExpression = this.parseFilterExpression(context);
        this.checkLogicalExpressionOperand(filterExpression, context);
        // TODO: If null, skip to '[', ']', '.', ',', '(', ')'
        return new FilterSelector(questionMarkToken, filterExpression);
    }

    private parseFilterExpression(context: ParserContext): FilterExpression {
        return this.parseOrExpression(context);
    }

    private parseOrExpression(context: ParserContext): FilterExpression {
        const andExpressions: { expression: FilterExpression, orToken: SyntaxTreeToken | null }[] = [];
        andExpressions.push({ expression: this.parseAndExpression(context), orToken: null });
        this.skipWhitespace(context);
        while (context.current === "|" && context.next === "|") {
            context.goNext();
            context.goNext();
            const orToken = context.collectToken(SyntaxTreeType.doubleBarToken);
            andExpressions[andExpressions.length - 1].orToken = orToken;
            this.skipWhitespace(context);
            andExpressions.push({ expression: this.parseAndExpression(context), orToken: null });
            this.skipWhitespace(context);
        }

        if (andExpressions.length === 1) return andExpressions[0].expression;

        andExpressions.forEach(e => { if (e.expression !== null) this.checkLogicalExpressionOperand(e.expression, context); });
        return new OrExpression(andExpressions);
    }

    private parseAndExpression(context: ParserContext): FilterExpression {
        const basicExpressions: { expression: FilterExpression, andToken: SyntaxTreeToken | null }[] = [];
        basicExpressions.push({ expression: this.parseComparisonExpression(context), andToken: null });
        this.skipWhitespace(context);
        while (context.current === "&" && context.next === "&") {
            context.goNext();
            context.goNext();
            const andToken = context.collectToken(SyntaxTreeType.doubleAmpersandToken);
            basicExpressions[basicExpressions.length - 1].andToken = andToken;
            this.skipWhitespace(context);
            basicExpressions.push({ expression: this.parseComparisonExpression(context), andToken: null });
            this.skipWhitespace(context);
        }

        if (basicExpressions.length === 1) return basicExpressions[0].expression;

        basicExpressions.forEach(e => { if (e.expression !== null) this.checkLogicalExpressionOperand(e.expression, context); });
        return new AndExpression(basicExpressions);
    }

    private parseComparisonExpression(context: ParserContext): FilterExpression {
        const left = this.parseNotExpression(context);
        this.skipWhitespace(context);

        let operator: ComparisonOperator;
        let operatorTokenType: SyntaxTreeType;
        if (context.current === "=" && context.next === "=") { operator = ComparisonOperator.equals; operatorTokenType = SyntaxTreeType.doubleEqualsToken; }
        else if (context.current === "!" && context.next === "=") { operator = ComparisonOperator.notEquals; operatorTokenType = SyntaxTreeType.exclamationMarkEqualsToken; }
        else if (context.current === "<" && context.next === "=") { operator = ComparisonOperator.lessThanEquals; operatorTokenType = SyntaxTreeType.lessThanEqualsToken; }
        else if (context.current === ">" && context.next === "=") { operator = ComparisonOperator.greaterThanEquals; operatorTokenType = SyntaxTreeType.greaterThanEqualsToken; }
        else if (context.current === "<") { operator = ComparisonOperator.lessThan; operatorTokenType = SyntaxTreeType.lessThanToken; }
        else if (context.current === ">") { operator = ComparisonOperator.greaterThan; operatorTokenType = SyntaxTreeType.greaterThanToken; }
        else return left;
        for (let i = 0; i < operator.length; i++) context.goNext();
        const operatorToken = context.collectToken(operatorTokenType);

        this.skipWhitespace(context);
        const right = this.parseNotExpression(context);

        this.checkComparisionExpressionOperand(left, context);
        this.checkComparisionExpressionOperand(right, context);
        return new ComparisonExpression(left, operatorToken, right, operator);
    }

    private parseNotExpression(context: ParserContext): FilterExpression {
        if (context.current !== "!")
            return this.parseBasicExpression(context);

        context.goNext();
        const exlamationMarkToken = context.collectToken(SyntaxTreeType.exclamationMarkToken);
        this.skipWhitespace(context);
        const basicExpression = this.parseNotExpression(context);

        this.checkLogicalExpressionOperand(basicExpression, context);
        if (basicExpression instanceof NotExpression)
            context.addError("Multiple negation is not allowed.", basicExpression.exlamationMarkToken.textRangeWithoutSkipped);
        return new NotExpression(exlamationMarkToken, basicExpression);
    }

    private parseBasicExpression(context: ParserContext): FilterExpression {
        if (context.current === "$" || context.current === "@")
            return this.parseFilterQueryExpression(context);
        else if (context.current === "(")
            return this.parseParanthesisExpression(context);
        else if (context.current === "\"" || context.current === "'")
            return this.parseStringLiteral(context);
        else if (CharacterCategorizer.isDigit(context.current) || context.current === "-")
            return this.parseNumberLiteral(context);
        else if (CharacterCategorizer.isNameFirst(context.current))
            return this.parseFunctionOrLiteral(context);
        else {
            context.addError("Expected expression.");
            return new MissingExpression(context.collectToken(SyntaxTreeType.missingToken));
        }
    }

    private parseFilterQueryExpression(context: ParserContext): FilterQueryExpression {
        const query = this.parseQuery(context, true);
        return new FilterQueryExpression(query);
    }

    private parseParanthesisExpression(context: ParserContext): ParanthesisExpression {
        context.goNext();
        const openingParanthesisToken = context.collectToken(SyntaxTreeType.openingParanthesisToken);
        this.skipWhitespace(context);
        const expression = this.parseFilterExpression(context);
        this.skipWhitespace(context);
        if (context.current === ")")
            context.goNext();
        else
            context.addError("Expected ')'.");
        const closingParanthesisToken = context.collectToken(SyntaxTreeType.closingParanthesisToken);

        this.checkLogicalExpressionOperand(expression, context);
        return new ParanthesisExpression(openingParanthesisToken, expression, closingParanthesisToken);
    }

    private parseStringLiteral(context: ParserContext): StringLiteralExpression {
        const string = this.parseString(context);
        return new StringLiteralExpression(string.token, string.value);
    }

    private parseNumberLiteral(context: ParserContext): NumberLiteralExpression {
        const integer = this.parseNumber(context);
        return new NumberLiteralExpression(integer.token, integer.value);
    }

    private parseFunctionOrLiteral(context: ParserContext): FilterExpression {
        const name = this.parseName(context);
        this.skipWhitespace(context, false);

        const hasOpeningParanthesis = context.current === "(";
        if (!hasOpeningParanthesis) {
            if (name.value === "true") return new BooleanLiteralExpression(this.changeTokenType(name.token, SyntaxTreeType.trueToken), true);
            else if (name.value === "false") return new BooleanLiteralExpression(this.changeTokenType(name.token, SyntaxTreeType.falseToken), false);
            else if (name.value === "null") return new NullLiteralExpression(this.changeTokenType(name.token, SyntaxTreeType.nullToken));
            else context.addError("Expected '('.");
        }
        else
            context.goNext();

        const openingParanthesisToken = context.collectToken(SyntaxTreeType.openingParanthesisToken);
        this.skipWhitespace(context);
        const args = hasOpeningParanthesis ? this.parseFunctionArguments(context) : [];
        if (context.current === ")")
            context.goNext();
        else
            context.addError("Expected ')'.");
        const closingParanthesisToken = context.collectToken(SyntaxTreeType.closingParanthesisToken);

        this.checkFunctionName(name.token, context);
        return new FunctionExpression(name.token, openingParanthesisToken, args, closingParanthesisToken, name.value);
    }

    private parseFunctionArguments(context: ParserContext): { arg: FilterExpression, commaToken: SyntaxTreeToken | null }[] {
        const args: { arg: FilterExpression, commaToken: SyntaxTreeToken | null }[] = [];
        if (context.current === ")") return args;

        args.push({ arg: this.parseFilterExpression(context), commaToken: null });
        this.skipWhitespace(context);
        while (context.current === ",") {
            context.goNext();
            const commaToken = context.collectToken(SyntaxTreeType.commaToken);
            args[args.length - 1].commaToken = commaToken;
            this.skipWhitespace(context);
            args.push({ arg: this.parseFilterExpression(context), commaToken: null });
            this.skipWhitespace(context);
        }

        return args;
    }

    private parseName(context: ParserContext): { token: SyntaxTreeToken, value: string } {
        context.goNext();
        while (CharacterCategorizer.isName(context.current))
            context.goNext();
        const token = context.collectToken(SyntaxTreeType.nameToken);
        return { token, value: token.text };
    }

    private parseString(context: ParserContext): { token: SyntaxTreeToken, value: string } {
        type HexCharacterLiteral = { range: TextRange, value: string };
        const checkSurrogates = (previous: HexCharacterLiteral | null, current: HexCharacterLiteral | null) => {
            const errorMessage = "Unpaired surrogate.";
            if (current !== null && CharacterCategorizer.isLowSurrogate(current.value) && (previous === null || !CharacterCategorizer.isHighSurrogate(previous.value)))
                context.addError(errorMessage, current.range);
            if (previous !== null && CharacterCategorizer.isHighSurrogate(previous.value) && (current === null || !CharacterCategorizer.isLowSurrogate(current.value)))
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
                        if (context.next === null || !CharacterCategorizer.isDigit(context.next) && !(context.next >= "a" && context.next <= "f") && !(context.next >= "A" && context.next <= "F")) {
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
            else if (CharacterCategorizer.isString(context.current))
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
        const token = context.collectToken(SyntaxTreeType.stringToken);
        return { token, value };
    }

    private parseNumber(context: ParserContext): { token: SyntaxTreeToken, value: number } {
        if (context.current === "-")
            context.goNext();

        if (!CharacterCategorizer.isDigit(context.current)) {
            context.addError("Expected a digit.");
            return { token: context.collectToken(SyntaxTreeType.numberToken), value: 0 };
        }
        if (context.current === "0" && CharacterCategorizer.isDigit(context.next))
            context.addError("Leading zeros are not allowed.");

        while (CharacterCategorizer.isDigit(context.current))
            context.goNext();

        if (context.current === ".") {
            context.goNext();
            if (CharacterCategorizer.isDigit(context.current)) {
                while (CharacterCategorizer.isDigit(context.current))
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
            if (CharacterCategorizer.isDigit(context.current)) {
                while (CharacterCategorizer.isDigit(context.current))
                    context.goNext();
            }
            else
                context.addError("Expected a digit.");
        }

        const token = context.collectToken(SyntaxTreeType.numberToken);
        const value = parseFloat(token.text);
        return { token, value };
    }

    private skipWhitespace(context: ParserContext, allowed = true) {
        context.skipWhile(c => CharacterCategorizer.isBlank(c), allowed ? null : "Whitespace is not allowed here.");
    }

    private changeTokenType(token: SyntaxTreeToken, newType: SyntaxTreeType): SyntaxTreeToken {
        return new SyntaxTreeToken(newType, token.position, token.text, token.skippedTextBefore);
    }

    private checkComparisionExpressionOperand(operand: FilterExpression, context: ParserContext) {
        if (operand instanceof FilterQueryExpression) {
            if (!operand.query.isSingular)
                context.addError("Query in comparison expression must be singular.", operand.textRangeWithoutSkipped);
        }
        else if (operand instanceof ParanthesisExpression)
            context.addError("Comparison expression operand can not be in paranthesis.", operand.textRangeWithoutSkipped);
        else if (operand instanceof NotExpression)
            context.addError("Comparison expression operand can not be negated.", operand.exlamationMarkToken.textRangeWithoutSkipped);
    }

    private checkLogicalExpressionOperand(operand: FilterExpression, context: ParserContext) {
        if (operand instanceof BooleanLiteralExpression || operand instanceof NullLiteralExpression || operand instanceof StringLiteralExpression || operand instanceof NumberLiteralExpression)
            context.addError("Only logical expression is allowed here.", operand.textRangeWithoutSkipped);
    }

    private checkIsInteger(numberToken: SyntaxTreeToken, context: ParserContext) {
        if (numberToken.text === "-0")
            context.addError("Negative zero is not allowed", numberToken.textRangeWithoutSkipped);
        if (numberToken.text.includes("."))
            context.addError("Only integers are allowed here.", numberToken.textRangeWithoutSkipped);
        if (numberToken.text.includes("e") || numberToken.text.includes("E"))
            context.addError("Exponential notation (e/E) is not allowed here.", numberToken.textRangeWithoutSkipped);
    }

    private checkFunctionName(nameToken: SyntaxTreeToken, context: ParserContext) {
        if (!CharacterCategorizer.isFunctionNameFirst(nameToken.text[0]))
            context.addError("Function name must start with a lowercase ASCII letter.", nameToken.textRangeWithoutSkipped);
        if (!nameToken.text.substring(1).split("").every(c => CharacterCategorizer.isFunctionName(c)))
            context.addError("Function name can contain only lowercase ASCII letters, digits or '_'.", nameToken.textRangeWithoutSkipped);
    }
}

class ParserContext {
    private readonly _diagnostics: Diagnostics[] = [];
    private _currentIndex = 0;
    private _skippedCount = 0;
    private _collectedCount = 0;

    constructor(private readonly queryText: string) {

    }

    get currentIndex(): number {
        return this._currentIndex;
    }

    get current(): string | null {
        return this._currentIndex < this.queryText.length 
            ? this.queryText[this._currentIndex] 
            : null;
    }

    get next(): string | null {
        return this._currentIndex + 1 < this.queryText.length 
            ? this.queryText[this._currentIndex + 1] 
            : null;
    }

    get diagnostics(): readonly Diagnostics[] {
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
        textRange ??= new TextRange(this._currentIndex, this.currentIndex < this.queryText.length ? 1 : 0);
        const diagnostics = new Diagnostics(DiagnosticsSeverity.error, message, textRange);
        this._diagnostics.push(diagnostics);
    }

    collectToken(type: SyntaxTreeType): SyntaxTreeToken {
        const position = this._currentIndex - this._collectedCount - this._skippedCount;
        const skippedText = this.queryText.substring(this._currentIndex - this._collectedCount - this._skippedCount, this._currentIndex - this._collectedCount);
        const collectedText = this.queryText.substring(this._currentIndex - this._collectedCount, this._currentIndex);
        this._skippedCount = 0;
        this._collectedCount = 0;
        return new SyntaxTreeToken(type, position, collectedText, skippedText);
    }
}
