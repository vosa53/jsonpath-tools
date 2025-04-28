import { Query } from "@jsonpath-tools/jsonpath";
import { SyntaxTreeNode } from "@jsonpath-tools/jsonpath";
import { SyntaxTree } from "@jsonpath-tools/jsonpath";
import { SyntaxTreeType } from "@jsonpath-tools/jsonpath";
import { SyntaxTreeToken } from "@jsonpath-tools/jsonpath";
import { Parser as JSONPathParser } from "@jsonpath-tools/jsonpath";
import { continuedIndent, defineLanguageFacet, delimitedIndent, foldInside, foldNodeProp, indentNodeProp, languageDataProp } from "@codemirror/language";
import { Input, NodeProp, NodeSet, NodeType, Parser, PartialParse, Tree, TreeFragment } from "@lezer/common";
import { styleTags, tags as t } from "@lezer/highlight";

/**
 * Returns a JSONPath query associated with the given Lezer tree.
 * @param tree Lezer tree. 
 * @throws When the given Lezer tree does not have any associated JSONPath query.
 */
export function getQueryForTree(tree: Tree): Query {
    const jsonPath = treeToQuery.get(tree);
    if (jsonPath === undefined)
        throw new Error("The given Lezer tree does not have a corresponding JSONPath query.");
    return jsonPath;
}

const treeToQuery = new WeakMap<Tree, Query>();

function createNodeSet(types: SyntaxTreeType[]): { nodeSet: NodeSet, treeTypeToNodeId: Map<SyntaxTreeType, number> } {
    const treeTypeToNodeId = new Map<SyntaxTreeType, number>();
    const nodeTypes: NodeType[] = [];
    let idCounter = 0;
    for (const type of types) {
        const id = idCounter++;
        const nodeType = NodeType.define({ id, name: type });
        treeTypeToNodeId.set(type, id);
        nodeTypes.push(nodeType);
    }
    const nodeSet = new NodeSet(nodeTypes);
    return { nodeSet, treeTypeToNodeId };
}

const { nodeSet, treeTypeToNodeId } = createNodeSet([
    SyntaxTreeType.query,
    SyntaxTreeType.subQuery,
    SyntaxTreeType.segment,
    SyntaxTreeType.nameSelector,
    SyntaxTreeType.wildcardSelector,
    SyntaxTreeType.sliceSelector,
    SyntaxTreeType.indexSelector,
    SyntaxTreeType.filterSelector,
    SyntaxTreeType.missingSelector,
    SyntaxTreeType.orExpression,
    SyntaxTreeType.andExpression,
    SyntaxTreeType.notExpression,
    SyntaxTreeType.paranthesisExpression,
    SyntaxTreeType.comparisonExpression,
    SyntaxTreeType.filterQueryExpression,
    SyntaxTreeType.functionExpression,
    SyntaxTreeType.numberLiteralExpression,
    SyntaxTreeType.stringLiteralExpression,
    SyntaxTreeType.booleanLiteralExpression,
    SyntaxTreeType.nullLiteralExpression,
    SyntaxTreeType.missingExpression,
    SyntaxTreeType.dollarToken,
    SyntaxTreeType.atToken,
    SyntaxTreeType.starToken,
    SyntaxTreeType.questionMarkToken,
    SyntaxTreeType.dotToken,
    SyntaxTreeType.doubleDotToken,
    SyntaxTreeType.commaToken,
    SyntaxTreeType.colonToken,
    SyntaxTreeType.doubleAmpersandToken,
    SyntaxTreeType.doubleBarToken,
    SyntaxTreeType.exclamationMarkToken,
    SyntaxTreeType.doubleEqualsToken,
    SyntaxTreeType.exclamationMarkEqualsToken,
    SyntaxTreeType.lessThanEqualsToken,
    SyntaxTreeType.greaterThanEqualsToken,
    SyntaxTreeType.lessThanToken,
    SyntaxTreeType.greaterThanToken,
    SyntaxTreeType.trueToken,
    SyntaxTreeType.falseToken,
    SyntaxTreeType.nullToken,
    SyntaxTreeType.stringToken,
    SyntaxTreeType.numberToken,
    SyntaxTreeType.nameToken,
    SyntaxTreeType.openingParanthesisToken,
    SyntaxTreeType.closingParanthesisToken,
    SyntaxTreeType.openingBracketToken,
    SyntaxTreeType.closingBracketToken,
    SyntaxTreeType.endOfFileToken,
    SyntaxTreeType.missingToken
]);

class CodeMirrorJSONPathParser extends Parser {
    private readonly nodeSet: NodeSet;

    constructor() {
        super();
        this.nodeSet = nodeSet.extend(
            styleTags({
                [SyntaxTreeType.openingBracketToken]: t.squareBracket,
                [SyntaxTreeType.closingBracketToken]: t.squareBracket,
                [SyntaxTreeType.openingParanthesisToken]: t.paren,
                [SyntaxTreeType.closingParanthesisToken]: t.paren,
                [SyntaxTreeType.dollarToken]: t.variableName,
                [SyntaxTreeType.atToken]: t.variableName,
                [SyntaxTreeType.starToken]: t.controlOperator,
                [SyntaxTreeType.questionMarkToken]: t.controlOperator,
                [SyntaxTreeType.colonToken]: t.controlOperator,
                [SyntaxTreeType.numberToken]: t.number,
                [SyntaxTreeType.stringToken]: t.string,
                [SyntaxTreeType.greaterThanToken]: t.compareOperator,
                [SyntaxTreeType.greaterThanEqualsToken]: t.compareOperator,
                [SyntaxTreeType.lessThanToken]: t.compareOperator,
                [SyntaxTreeType.lessThanEqualsToken]: t.compareOperator,
                [SyntaxTreeType.doubleEqualsToken]: t.compareOperator,
                [SyntaxTreeType.exclamationMarkEqualsToken]: t.compareOperator,
                [SyntaxTreeType.exclamationMarkToken]: t.logicOperator,
                [SyntaxTreeType.doubleAmpersandToken]: t.logicOperator,
                [SyntaxTreeType.doubleBarToken]: t.logicOperator,
                [SyntaxTreeType.trueToken]: t.bool,
                [SyntaxTreeType.falseToken]: t.bool,
                [SyntaxTreeType.nullToken]: t.null,
                [SyntaxTreeType.nameToken]: t.propertyName,
                [SyntaxTreeType.functionExpression + "/" + SyntaxTreeType.nameToken]: t.function(t.variableName)
            }),
            NodeProp.closedBy.add(NodeType.match({
                [SyntaxTreeType.openingParanthesisToken]: [SyntaxTreeType.closingParanthesisToken],
                [SyntaxTreeType.openingBracketToken]: [SyntaxTreeType.closingBracketToken]
            })),
            NodeProp.openedBy.add(NodeType.match({
                [SyntaxTreeType.closingParanthesisToken]: [SyntaxTreeType.openingParanthesisToken],
                [SyntaxTreeType.closingBracketToken]: [SyntaxTreeType.openingBracketToken]
            })),
            foldNodeProp.add({
                [SyntaxTreeType.paranthesisExpression]: foldInside,
                [SyntaxTreeType.segment]: n => {
                    if (n.lastChild!.name === SyntaxTreeType.closingBracketToken)
                        return { from: n.getChild(SyntaxTreeType.openingBracketToken)!.to, to: n.lastChild!.from };
                    else
                        return null;
                },
                [SyntaxTreeType.functionExpression]: n => ({ from: n.getChild(SyntaxTreeType.openingParanthesisToken)!.to, to: n.lastChild!.from }),
                [SyntaxTreeType.stringToken]: (n, s) => {
                    const hasEndingQuote = s.doc.sliceString(n.to - 1, n.to) === "\""; // Could be escaped, but we probably don't care for this purpose.
                    return { from: n.from + 1, to: hasEndingQuote ? n.to - 1 : n.to };
                }
            }),
            indentNodeProp.add({
                [SyntaxTreeType.subQuery]: continuedIndent(),
                [SyntaxTreeType.segment]: delimitedIndent({ closing: "]", align: false }),
                [SyntaxTreeType.paranthesisExpression]: delimitedIndent({ closing: ")", align: false }),
                [SyntaxTreeType.functionExpression]: delimitedIndent({ closing: ")", align: false }),
                [SyntaxTreeType.stringToken]: c => 0,
            }),
            languageDataProp.add(NodeType.match({
                [SyntaxTreeType.query]: languageFacet
            }))
        );
    }

    createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly { from: number; to: number; }[]): PartialParse {
        const text = input.read(0, input.length);
        const parser = new JSONPathParser();

        const start = performance.now();
        const result = parser.parse(text);
        const parseTime = performance.now() - start;

        const buffer: number[] = [];
        this.convertToTree(result, buffer);
        const tree = Tree.build({
            buffer: buffer,
            nodeSet: this.nodeSet,
            topID: treeTypeToNodeId.get(SyntaxTreeType.query)!,
        });
        const treeBuildTime = performance.now() - start - parseTime;
        console.log("PARSE TIME:", parseTime, "ms", "TREE BUILD TIME", treeBuildTime, "ms");
        treeToQuery.set(tree, result);
        return new CodeMirrorJSONPathPartialParse(tree);
    }

    private convertToTree(syntaxTree: SyntaxTree, buffer: number[]) {
        const startBufferLength = buffer.length;
        if (syntaxTree instanceof SyntaxTreeNode) {
            for (const child of syntaxTree.children)
                this.convertToTree(child, buffer);
        }
        const nodeId = treeTypeToNodeId.get(syntaxTree.type);
        if (nodeId === undefined)
            throw new Error("Unknown node type: " + syntaxTree.type);
        const position = syntaxTree instanceof SyntaxTreeToken ? syntaxTree.position + syntaxTree.skippedTextBefore.length : syntaxTree.position;
        buffer.push(nodeId);
        buffer.push(position);
        buffer.push(syntaxTree.position + syntaxTree.length);
        buffer.push(buffer.length - startBufferLength + 1);
    }
}

class CodeMirrorJSONPathPartialParse implements PartialParse {
    readonly parsedPos: number;
    readonly stoppedAt: number;

    constructor(private readonly tree: Tree) { 
        this.parsedPos = this.tree.length;
        this.stoppedAt = this.tree.length;
    }

    advance(): Tree | null {
        return this.tree;
    }

    stopAt(pos: number): void { }
}

/**
 * CodeMirror JSONPath language facet.
 */
export const languageFacet = defineLanguageFacet();

/**
 * CodeMirror JSONPath language parser.
 */
export const parser: Parser = new CodeMirrorJSONPathParser();