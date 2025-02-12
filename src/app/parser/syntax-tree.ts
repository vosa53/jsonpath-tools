import { JSONPathDiagnostics } from "./diagnostics";
import { TextRange } from "./text-range";
import { JSONPathOptions, JSONPathType } from "./options";
import { isLogicalType, isNodesType, isValueType, JSONPathFilterValue, JSONPathJSONValue, JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathLogicalType, JSONPathNodeList, JSONPathNodesType, JSONPathNothing, JSONPathValueType } from "./types";

export enum JSONPathSyntaxTreeType {
    dollarToken = "DollarToken",
    atToken = "AtToken",
    starToken = "StarToken",
    questionMarkToken = "QuestionMarkToken",
    dotToken = "DotToken",
    doubleDotToken = "DoubleDotToken",
    commaToken = "CommaToken",
    colonToken = "ColonToken",
    doubleAmpersandToken = "DoubleAmpersandToken",
    doubleBarToken = "DoubleBarToken",
    exclamationMarkToken = "ExclamationMarkToken",
    doubleEqualsToken = "DoubleEqualsToken",
    exclamationMarkEqualsToken = "ExclamationMarkEqualsToken",
    lessThanEqualsToken = "LessThanEqualsToken",
    greaterThanEqualsToken = "GreaterThanEqualsToken",
    lessThanToken = "LessThanToken",
    greaterThanToken = "GreaterThanToken",
    trueToken = "TrueToken",
    falseToken = "FalseToken",
    nullToken = "NullToken",
    stringToken = "StringToken",
    numberToken = "NumberToken",
    nameToken = "NameToken",
    openingParanthesisToken = "OpeningParanthesisToken",
    closingParanthesisToken = "ClosingParanthesisToken",
    openingBracketToken = "OpeningBracketToken",
    closingBracketToken = "ClosingBracketToken",
    endOfFileToken = "EndOfFileToken",
    root = "Root",
    query = "Query",
    segment = "Segment",
    nameSelector = "NameSelector",
    wildcardSelector = "WildcardSelector",
    sliceSelector = "SliceSelector",
    indexSelector = "IndexSelector",
    filterSelector = "FilterSelector",
    orExpression = "OrExpression",
    andExpression = "AndExpression",
    notExpression = "NotExpression",
    paranthesisExpression = "ParanthesisExpression",
    comparisonExpression = "ComparisonExpression",
    filterQueryExpression = "FilterQueryExpression",
    functionExpression = "FunctionExpression",
    numberLiteral = "NumberLiteral",
    stringLiteral = "StringLiteral",
    booleanLiteral = "BooleanLiteral",
    nullLiteral = "NullLiteral"
}

export abstract class JSONPathSyntaxTree {
    constructor(
        readonly position: number,
        readonly length: number
    ) { }

    abstract readonly type: JSONPathSyntaxTreeType;

    get textRange(): TextRange {
        return new TextRange(this.position, this.length);
    }

    getAtPosition(position: number): JSONPathSyntaxTree[] {
        if (position < this.position)
            return [];
        if (position >= this.position + this.length)
            return [];

        const path: JSONPathSyntaxTree[] = [this];
        while (path[path.length - 1] instanceof JSONPathNode) {
            const currentNode = path[path.length - 1] as JSONPathNode;
            for (const child of currentNode.children) {
                if (child.position + child.length > position) {
                    path.push(child);
                    break;
                }
            }
            if (currentNode === path[path.length - 1])
                throw new Error("Children are not fully covering their parent.");
        }
        return path;
    }
}

export abstract class JSONPathNode extends JSONPathSyntaxTree {
    readonly children: JSONPathSyntaxTree[];

    constructor(
        children: (JSONPathSyntaxTree | null)[]
    ) {
        const notNullChildren = children.filter(c => c !== null);
        if (notNullChildren.length === 0)
            throw new Error("Expected at least one non null child.");
        super(notNullChildren[0].position, notNullChildren.reduce((p, c) => p + c.length, 0));
        this.children = notNullChildren;
    }
}

export class JSONPathToken extends JSONPathSyntaxTree {
    constructor(
        readonly type: JSONPathSyntaxTreeType,
        readonly position: number,
        readonly text: string,
        readonly skippedTextBefore: string
    ) {
        super(position, skippedTextBefore.length + text.length);
    }
}

export class JSONPath extends JSONPathNode {
    constructor(
        readonly query: JSONPathQuery,
        readonly endOfFileToken: JSONPathToken | null,

        readonly syntaxDiagnostics: readonly JSONPathDiagnostics[]
    ) {
        super([query, endOfFileToken]);
    }

    get type() { return JSONPathSyntaxTreeType.root; }

    select(queryContext: JSONPathQueryContext): JSONPathNodeList {
        return this.query.select(queryContext, null);
    }
}

export class JSONPathQuery extends JSONPathNode {
    constructor(
        readonly identifierToken: JSONPathToken | null,
        readonly segments: readonly JSONPathSegment[],

        readonly isRelative: boolean
    ) {
        super([identifierToken, ...segments]);
    }

    get type() { return JSONPathSyntaxTreeType.query; }

    get isSingular() {
        // TODO: Disallow spaces 
        return this.segments.every(s => s.selectors.length === 1 && (s.selectors[0].selector instanceof JSONPathNameSelector || s.selectors[0].selector instanceof JSONPathIndexSelector));
    }

    select(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext | null): JSONPathNodeList {
        let inputNodes = [this.isRelative && filterExpressionContext !== null ? filterExpressionContext.currentNode : queryContext.rootNode];
        let outputNodes: JSONPathJSONValue[] = [];
        for (const segment of this.segments) {
            for (const inputNode of inputNodes)
                segment.select(inputNode, outputNodes, queryContext);
            [inputNodes, outputNodes] = [outputNodes, inputNodes];
            outputNodes.length = 0;
        }
        return new JSONPathNodeList(inputNodes);
    }
}

export class JSONPathSegment extends JSONPathNode {
    constructor(
        readonly dotToken: JSONPathToken | null,
        readonly openingBracketToken: JSONPathToken | null,
        readonly selectors: readonly { selector: JSONPathSelector | null, commaToken: JSONPathToken | null }[],
        readonly closingBracketToken: JSONPathToken | null,

        readonly isRecursive: boolean
    ) {
        super([dotToken, openingBracketToken, ...selectors.flatMap(s => [s.selector, s.commaToken]), closingBracketToken]);
    }

    get type() { return JSONPathSyntaxTreeType.segment; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext) {
        queryContext.segmentInstrumentationCallback?.(this, input);
        
        for (const selector of this.selectors) {
            if (selector.selector != null)
                selector.selector.select(input, output, queryContext);
        }

        if (this.isRecursive) {
            const isObjectOrArray = typeof input === "object" && input !== null;
            if (isObjectOrArray) {
                for (const value of Object.values(input)) {
                    this.select(value, output, queryContext);
                }
            }
        }
    }
}

export abstract class JSONPathSelector extends JSONPathNode {
    abstract select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void;
}

export class JSONPathNameSelector extends JSONPathSelector {
    constructor(
        readonly nameToken: JSONPathToken,

        readonly name: string
    ) {
        super([nameToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nameSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isObject = typeof input === "object" && !Array.isArray(input) && input !== null;
        if (isObject && input.hasOwnProperty(this.name))
            output.push(input[this.name]);
    }
}

export class JSONPathWildcardSelector extends JSONPathSelector {
    constructor(
        readonly starToken: JSONPathToken
    ) {
        super([starToken]);
    }

    get type() { return JSONPathSyntaxTreeType.wildcardSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isObjectOrArray = typeof input === "object" && input !== null;
        if (isObjectOrArray)
            output.push(...Object.values(input));
    }
}

export class JSONPathSliceSelector extends JSONPathSelector {
    constructor(
        readonly startToken: JSONPathToken | null,
        readonly firstColonToken: JSONPathToken,
        readonly endToken: JSONPathToken | null,
        readonly secondColonToken: JSONPathToken | null,
        readonly stepToken: JSONPathToken | null,

        readonly start: number | null,
        readonly end: number | null,
        readonly step: number | null
    ) {
        super([startToken, firstColonToken, endToken, secondColonToken, stepToken]);
    }

    get type() { return JSONPathSyntaxTreeType.sliceSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isArray = Array.isArray(input);
        if (!isArray)
            return;
        if (this.step === 0)
            return;

        let step = this.step ?? 1;
        let start = this.start ?? (step > 0 ? 0 : input.length - 1);
        let end = this.end ?? (step > 0 ? input.length : -input.length - 1);
        if (start < 0) start = input.length + start;
        if (end < 0) end = input.length + end;
        const lower = step >= 0 ? Math.min(Math.max(start, 0), input.length) : Math.min(Math.max(end, -1), input.length - 1);
        const upper = step >= 0 ? Math.min(Math.max(end, 0), input.length) : Math.min(Math.max(start, -1), input.length - 1);

        if (step > 0) {
            for (let i = lower; i < upper; i += step)
                output.push(input[i]);
        }
        else {
            for (let i = upper; i > lower; i += step)
                output.push(input[i]);
        }
    }
}

export class JSONPathIndexSelector extends JSONPathSelector {
    constructor(
        readonly indexToken: JSONPathToken,

        readonly index: number
    ) {
        super([indexToken]);
    }

    get type() { return JSONPathSyntaxTreeType.indexSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isArray = Array.isArray(input);
        if (isArray) {
            const index = this.index < 0 ? input.length + this.index : this.index;
            if (index >= 0 && index < input.length)
                output.push(input[index]);
        }
    }
}

export class JSONPathFilterSelector extends JSONPathSelector {
    constructor(
        readonly questionMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression | null
    ) {
        super([questionMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.filterSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isObjectOrArray = typeof input === "object" && input !== null;
        if (!isObjectOrArray)
            return;

        const values = Object.values(input);
        for (const value of values) {
            const filterExpressionContext: JSONPathFilterExpressionContext = { currentNode: value };
            const filterResult = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
            if (filterResult === JSONPathLogicalTrue)
                output.push(value);
        }
    }
}

export abstract class JSONPathFilterExpression extends JSONPathNode {
    abstract evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue;
}

export class JSONPathOrExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression | null, orToken: JSONPathToken | null }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.orToken]));
    }

    get type() { return JSONPathSyntaxTreeType.orExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === JSONPathLogicalTrue)
                return JSONPathLogicalTrue;
        }
        return JSONPathLogicalFalse;
    }
}

export class JSONPathAndExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression | null, andToken: JSONPathToken | null }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.andToken]));
    }

    get type() { return JSONPathSyntaxTreeType.andExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === JSONPathLogicalFalse)
                return JSONPathLogicalFalse;
        }
        return JSONPathLogicalTrue;
    }
}

export class JSONPathNotExpression extends JSONPathFilterExpression {
    constructor(
        readonly exlamationMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression | null
    ) {
        super([exlamationMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.notExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const result = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
        return result === JSONPathLogicalTrue ? JSONPathLogicalFalse : JSONPathLogicalTrue;
    }
}

export class JSONPathParanthesisExpression extends JSONPathFilterExpression {
    constructor(
        readonly openingParanthesisToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression | null,
        readonly closingParanthesisToken: JSONPathToken | null
    ) {
        super([openingParanthesisToken, expression, closingParanthesisToken]);
    }

    get type() { return JSONPathSyntaxTreeType.paranthesisExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        if (this.expression === null)
            return JSONPathLogicalFalse;
        return this.expression.evaluate(queryContext, filterExpressionContext);
    }
}

export class JSONPathComparisonExpression extends JSONPathFilterExpression {
    constructor(
        readonly left: JSONPathFilterExpression | null,
        readonly operatorToken: JSONPathToken,
        readonly right: JSONPathFilterExpression | null,

        readonly operator: string
    ) {
        super([left, operatorToken, right]);
    }

    get type() { return JSONPathSyntaxTreeType.comparisonExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const leftValue = evaluateAsValueType(this.left, queryContext, filterExpressionContext);
        const rightValue = evaluateAsValueType(this.right, queryContext, filterExpressionContext);

        let result: boolean;
        if (this.operatorToken.type === JSONPathSyntaxTreeType.doubleEqualsToken)
            result = this.evaluateEquals(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.exclamationMarkEqualsToken)
            result = !this.evaluateEquals(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.lessThanToken)
            result = this.evaluateLower(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.greaterThanToken)
            result = this.evaluateLower(rightValue, leftValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.lessThanEqualsToken)
            result = this.evaluateLower(leftValue, rightValue) || this.evaluateEquals(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.greaterThanEqualsToken)
            result = this.evaluateLower(rightValue, leftValue) || this.evaluateEquals(leftValue, rightValue);
        else
            throw new Error("Unknown operator.");
        return result ? JSONPathLogicalTrue : JSONPathLogicalFalse;
    }

    private evaluateEquals(left: JSONPathValueType, right: JSONPathValueType): boolean {
        if (left === JSONPathNothing || right === JSONPathNothing)
            return left === JSONPathNothing && right === JSONPathNothing;

        if (typeof left === "number" && typeof right === "number")
            return left === right;
        if (typeof left === "string" && typeof right === "string")
            return left === right;
        if (typeof left === "boolean" && typeof right === "boolean")
            return left === right;
        if (left === null && right === null)
            return true;
        if (Array.isArray(left) && Array.isArray(right))
            return this.compareArrays(left, right);
        if (typeof left === "object" && left !== null && !Array.isArray(left) && typeof right === "object" && right !== null && !Array.isArray(right))
            return this.compareObjects(left, right);
        return false;
    }

    private evaluateLower(left: JSONPathValueType, right: JSONPathValueType): boolean {
        if (left === JSONPathNothing || right === JSONPathNothing)
            return false;
        if (typeof left === "number" && typeof right === "number")
            return left < right;
        if (typeof left === "string" && typeof right === "string")
            return left < right;
        return false;
    }

    private compareArrays(left: JSONPathValueType[], right: JSONPathValueType[]): boolean {
        if (left.length !== right.length)
            return false;
        for (let i = 0; i < left.length; i++) {
            if (!this.evaluateEquals(left[i], right[i]))
                return false;
        }
        return true;
    }

    private compareObjects(left: { [key: string]: JSONPathValueType }, right: { [key: string]: JSONPathValueType }): boolean {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length)
            return false;
        for (const key of leftKeys) {
            if (!right.hasOwnProperty(key) || !this.evaluateEquals(left[key], right[key]))
                return false;
        }
        return true;
    }
}

export class JSONPathFilterQueryExpression extends JSONPathFilterExpression {
    constructor(
        readonly query: JSONPathQuery
    ) {
        super([query]);
    }

    get type() { return JSONPathSyntaxTreeType.filterQueryExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.query.select(queryContext, filterExpressionContext);
    }
}

export class JSONPathFunctionExpression extends JSONPathFilterExpression {
    constructor(
        readonly nameToken: JSONPathToken,
        readonly openingParanthesisToken: JSONPathToken | null,
        readonly args: readonly { arg: JSONPathFilterExpression | null, commaToken: JSONPathToken | null }[],
        readonly closingParanthesisToken: JSONPathToken | null,

        readonly name: string
    ) {
        super([nameToken, openingParanthesisToken, ...args.flatMap(a => [a.arg, a.commaToken]), closingParanthesisToken]);
    }

    get type() { return JSONPathSyntaxTreeType.functionExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const functionDefinition = queryContext.options.functions[this.name];
        if (functionDefinition === undefined) return JSONPathNothing;

        const argValues = [];
        for (let i = 0; i < functionDefinition.parameterTypes.length; i++) {
            const arg = this.args[i]?.arg ?? null;
            const argValue = evaluateAs(arg, functionDefinition.parameterTypes[i], queryContext, filterExpressionContext);
            argValues.push(argValue);
        }
        const result = functionDefinition.handler(...argValues);
        return result;
    }
}

export class JSONPathNumberLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: number
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.numberLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.value;
    }
}

export class JSONPathStringLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: string
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.stringLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.value;
    }
}

export class JSONPathBooleanLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: boolean
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.booleanLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.value;
    }
}

export class JSONPathNullLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nullLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return null;
    }
}

function evaluateAsLogicalType(expression: JSONPathFilterExpression | null, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathLogicalType {
    const value = expression?.evaluate(queryContext, filterExpressionContext);
    if (value === undefined) return JSONPathLogicalFalse;
    if (isLogicalType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? JSONPathLogicalTrue : JSONPathLogicalFalse;

    return JSONPathLogicalFalse;
}

function evaluateAsValueType(expression: JSONPathFilterExpression | null, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathValueType {
    const value = expression?.evaluate(queryContext, filterExpressionContext);
    if (value === undefined) return JSONPathNothing;
    if (isValueType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? value.nodes[0] : JSONPathNothing;

    return JSONPathNothing;
}

function evaluateAsNodesType(expression: JSONPathFilterExpression | null, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathNodesType {
    const value = expression?.evaluate(queryContext, filterExpressionContext);
    if (value === undefined) return JSONPathNodeList.empty;
    if (isNodesType(value)) return value;

    return JSONPathNodeList.empty;
}

function evaluateAs(expression: JSONPathFilterExpression | null, type: JSONPathType, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
    if (type === JSONPathType.logicalType)
        return evaluateAsLogicalType(expression, queryContext, filterExpressionContext);
    else if (type === JSONPathType.valueType)
        return evaluateAsValueType(expression, queryContext, filterExpressionContext);
    else
        return evaluateAsNodesType(expression, queryContext, filterExpressionContext);
}

export interface JSONPathQueryContext {
    readonly rootNode: JSONPathJSONValue;
    readonly options: JSONPathOptions;
    readonly segmentInstrumentationCallback?: (segment: JSONPathSegment, input: JSONPathJSONValue) => void;
}

export interface JSONPathFilterExpressionContext {
    readonly currentNode: JSONPathJSONValue;
}

interface PushOnlyArray<T> {
    push(...value: T[]): void;
}