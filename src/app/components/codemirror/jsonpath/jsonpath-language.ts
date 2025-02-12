import { JSONPath } from "@/jsonpath-tools/query/json-path";
import { JSONPathNode } from "@/jsonpath-tools/query/node";
import { JSONPathSyntaxTree } from "@/jsonpath-tools/query/syntax-tree";
import { JSONPathSyntaxTreeType } from "@/jsonpath-tools/query/syntax-tree-type";
import { JSONPathToken } from "@/jsonpath-tools/query/token";
import { defineLanguageFacet, Language, languageDataProp } from "@codemirror/language";
import { Input, NodeProp, NodeSet, NodeType, Parser, PartialParse, Tree, TreeFragment } from "@lezer/common";
import { styleTags, tags as t } from "@lezer/highlight";
import { JSONPathParser } from "../../../../jsonpath-tools/syntax-analysis/parser";
import { jsonPathCompletionSource } from "./jsonpath-completion-source";

const treeToJSONPath = new WeakMap<Tree, JSONPath>();

export function getJSONPath(tree: Tree): JSONPath {
    const jsonPath = treeToJSONPath.get(tree);
    if (jsonPath === undefined) 
        throw new Error("The given Lezer tree does not have a corresponding JSONPath.");
    return jsonPath;
}

function createNodeSet(types: JSONPathSyntaxTreeType[]): { nodeSet: NodeSet, treeTypeToNodeId: Map<JSONPathSyntaxTreeType, number> } {
    const treeTypeToNodeId = new Map<JSONPathSyntaxTreeType, number>();
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
    JSONPathSyntaxTreeType.root,  
    JSONPathSyntaxTreeType.query,  
    JSONPathSyntaxTreeType.segment,  
    JSONPathSyntaxTreeType.nameSelector,  
    JSONPathSyntaxTreeType.wildcardSelector,  
    JSONPathSyntaxTreeType.sliceSelector,  
    JSONPathSyntaxTreeType.indexSelector,  
    JSONPathSyntaxTreeType.filterSelector,  
    JSONPathSyntaxTreeType.orExpression,  
    JSONPathSyntaxTreeType.andExpression,  
    JSONPathSyntaxTreeType.notExpression,  
    JSONPathSyntaxTreeType.paranthesisExpression,  
    JSONPathSyntaxTreeType.comparisonExpression,  
    JSONPathSyntaxTreeType.filterQueryExpression,  
    JSONPathSyntaxTreeType.functionExpression,  
    JSONPathSyntaxTreeType.numberLiteral,  
    JSONPathSyntaxTreeType.stringLiteral,  
    JSONPathSyntaxTreeType.booleanLiteral,  
    JSONPathSyntaxTreeType.nullLiteral,
    JSONPathSyntaxTreeType.dollarToken,  
    JSONPathSyntaxTreeType.atToken,  
    JSONPathSyntaxTreeType.starToken,  
    JSONPathSyntaxTreeType.questionMarkToken,  
    JSONPathSyntaxTreeType.dotToken,  
    JSONPathSyntaxTreeType.doubleDotToken,  
    JSONPathSyntaxTreeType.commaToken,  
    JSONPathSyntaxTreeType.colonToken,  
    JSONPathSyntaxTreeType.doubleAmpersandToken,  
    JSONPathSyntaxTreeType.doubleBarToken,  
    JSONPathSyntaxTreeType.exclamationMarkToken,  
    JSONPathSyntaxTreeType.doubleEqualsToken,  
    JSONPathSyntaxTreeType.exclamationMarkEqualsToken,  
    JSONPathSyntaxTreeType.lessThanEqualsToken,  
    JSONPathSyntaxTreeType.greaterThanEqualsToken,  
    JSONPathSyntaxTreeType.lessThanToken,  
    JSONPathSyntaxTreeType.greaterThanToken,  
    JSONPathSyntaxTreeType.trueToken,  
    JSONPathSyntaxTreeType.falseToken,  
    JSONPathSyntaxTreeType.nullToken,  
    JSONPathSyntaxTreeType.stringToken,  
    JSONPathSyntaxTreeType.numberToken,  
    JSONPathSyntaxTreeType.nameToken,  
    JSONPathSyntaxTreeType.openingParanthesisToken,  
    JSONPathSyntaxTreeType.closingParanthesisToken,  
    JSONPathSyntaxTreeType.openingBracketToken,  
    JSONPathSyntaxTreeType.closingBracketToken,  
    JSONPathSyntaxTreeType.endOfFileToken
]);

class CodeMirrorJSONPathParser extends Parser {
    private readonly nodeSet: NodeSet;

    constructor() {
        super();
        this.nodeSet = nodeSet.extend(
            styleTags({
                [JSONPathSyntaxTreeType.openingBracketToken]: t.bracket,
                [JSONPathSyntaxTreeType.closingBracketToken]: t.bracket,
                [JSONPathSyntaxTreeType.dollarToken]: t.lineComment,
                [JSONPathSyntaxTreeType.atToken]: t.lineComment,
                [JSONPathSyntaxTreeType.starToken]: t.annotation,
                [JSONPathSyntaxTreeType.questionMarkToken]: t.annotation,
                [JSONPathSyntaxTreeType.numberToken]: t.number,
                [JSONPathSyntaxTreeType.stringToken]: t.string,
                [JSONPathSyntaxTreeType.greaterThanToken]: t.operator,
                [JSONPathSyntaxTreeType.doubleAmpersandToken]: t.operator,
                [JSONPathSyntaxTreeType.doubleEqualsToken]: t.operator,
                [JSONPathSyntaxTreeType.trueToken]: t.keyword,
                [JSONPathSyntaxTreeType.falseToken]: t.keyword,
                [JSONPathSyntaxTreeType.nullToken]: t.keyword,
                [JSONPathSyntaxTreeType.nameToken]: t.propertyName,
                [JSONPathSyntaxTreeType.functionExpression + "/" + JSONPathSyntaxTreeType.nameToken]: t.className
            }),
            NodeProp.closedBy.add(NodeType.match({
                [JSONPathSyntaxTreeType.openingParanthesisToken]: [JSONPathSyntaxTreeType.closingParanthesisToken],
                [JSONPathSyntaxTreeType.openingBracketToken]: [JSONPathSyntaxTreeType.closingBracketToken]
            })),
            NodeProp.openedBy.add(NodeType.match({
                [JSONPathSyntaxTreeType.closingParanthesisToken]: [JSONPathSyntaxTreeType.openingParanthesisToken],
                [JSONPathSyntaxTreeType.closingBracketToken]: [JSONPathSyntaxTreeType.openingBracketToken]
            })),
            languageDataProp.add(NodeType.match({
                [JSONPathSyntaxTreeType.root]: jsonPathLanguageFacet
            }))
        );
    }

    createParse(input: Input, fragments: readonly TreeFragment[], ranges: readonly { from: number; to: number; }[]): PartialParse {
        const text = input.read(0, input.length);
        const parser = new JSONPathParser();

        const start = performance.now();
        const result = parser.parse(text);

        const buffer: number[] = [];
        this.convertToTree(result, buffer)
        const tree = Tree.build({
            buffer: buffer,
            nodeSet: this.nodeSet,
            topID: treeTypeToNodeId.get(JSONPathSyntaxTreeType.root)!,
        });
        const elapsed = performance.now() - start;
        console.log("Time: " + elapsed);
        treeToJSONPath.set(tree, result);
        return new CodeMirrorJSONPathPartialParse(tree);
    }

    private convertToTree(syntaxTree: JSONPathSyntaxTree, buffer: number[]) {
        const startBufferLength = buffer.length;
        if (syntaxTree instanceof JSONPathNode) {
            for (const child of syntaxTree.children)
                this.convertToTree(child, buffer);
        }
        const nodeId = treeTypeToNodeId.get(syntaxTree.type);
        if (nodeId === undefined)
            throw new Error("Unknown node type: " + syntaxTree.type);
        const position = syntaxTree instanceof JSONPathToken ? syntaxTree.position + syntaxTree.skippedTextBefore.length : syntaxTree.position;
        buffer.push(nodeId);
        buffer.push(position);
        buffer.push(syntaxTree.position + syntaxTree.length);
        buffer.push(buffer.length - startBufferLength + 1);
    }
}

class CodeMirrorJSONPathPartialParse implements PartialParse {
    readonly parsedPos = this.tree.length;
    readonly stoppedAt = this.tree.length;

    constructor(private readonly tree: Tree) { }

    advance(): Tree | null {
        return this.tree;
    }

    stopAt(pos: number): void { }
}

const jsonPathLanguageFacet = defineLanguageFacet({
    autocomplete: jsonPathCompletionSource
});
const jsonPathParser = new CodeMirrorJSONPathParser();
export const jsonPathLanguage = new Language(jsonPathLanguageFacet, jsonPathParser);

