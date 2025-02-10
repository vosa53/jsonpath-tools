import { Diagnostics } from "next/dist/build/swc/types";
import { JSONPathDiagnostics } from "./jsonpath-diagnostics";
import { TextRange } from "./text-range";

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
}

export abstract class JSONPathSelector extends JSONPathNode {
}

export class JSONPathNameSelector extends JSONPathSelector {
    constructor(
        readonly nameToken: JSONPathToken,

        readonly name: string
    ) { 
        super([nameToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nameSelector; }
}

export class JSONPathWildcardSelector extends JSONPathSelector {
    constructor(
        readonly starToken: JSONPathToken
    ) { 
        super([starToken]);
    }

    get type() { return JSONPathSyntaxTreeType.wildcardSelector; }
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
}

export class JSONPathIndexSelector extends JSONPathSelector {
    constructor(
        readonly indexToken: JSONPathToken,

        readonly index: number
    ) { 
        super([indexToken]);
    }

    get type() { return JSONPathSyntaxTreeType.indexSelector; }
}

export class JSONPathFilterSelector extends JSONPathSelector {
    constructor(
        readonly questionMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression | null
    ) { 
        super([questionMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.filterSelector; }
}

export abstract class JSONPathFilterExpression extends JSONPathNode {
}

export class JSONPathOrExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression | null, orToken: JSONPathToken | null }[]
    ) { 
        super(expressions.flatMap(e => [e.expression, e.orToken]));
    }

    get type() { return JSONPathSyntaxTreeType.orExpression; }
}

export class JSONPathAndExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression | null, andToken: JSONPathToken | null }[]
    ) { 
        super(expressions.flatMap(e => [e.expression, e.andToken]));
    }

    get type() { return JSONPathSyntaxTreeType.andExpression; }
}

export class JSONPathNotExpression extends JSONPathFilterExpression {
    constructor(
        readonly exlamationMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression | null
    ) { 
        super([exlamationMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.notExpression; }
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
}

export class JSONPathFilterQueryExpression extends JSONPathFilterExpression {
    constructor(
        readonly query: JSONPathQuery
    ) { 
        super([query]);
    }

    get type() { return JSONPathSyntaxTreeType.filterQueryExpression; }
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
}

export class JSONPathNumberLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: Number
    ) { 
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.numberLiteral; }
}

export class JSONPathStringLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: String
    ) { 
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.stringLiteral; }
}

export class JSONPathBooleanLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: Boolean
    ) { 
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.booleanLiteral; }
}

export class JSONPathNullLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken
    ) { 
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nullLiteral; }
}