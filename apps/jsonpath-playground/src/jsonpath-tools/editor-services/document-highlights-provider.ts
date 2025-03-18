import { JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPath } from "../query/json-path";
import { JSONPathQuery } from "../query/query";
import { JSONPathFilterSelector } from "../query/selectors/filter-selector";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text-range";

export class DocumentHighlightsProvider {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    provideHighlights(query: JSONPath, position: number): DocumentHighlight[] {
        const documentHighlights: DocumentHighlight[] = [];
        const nodePaths = query.getTouchingAtPosition(position);
        for (const nodePath of nodePaths)
            this.provideHighlightsForNodePath(query, nodePath, documentHighlights);
        documentHighlights.sort((a, b) => a.range.position - b.range.position);
        return documentHighlights;
    }

    private provideHighlightsForNodePath(query: JSONPath, nodePath: JSONPathSyntaxTree[], documentHighlights: DocumentHighlight[]) {
        const lastNode = nodePath[nodePath.length - 1];
        const lastButOneNode = nodePath[nodePath.length - 2];

        if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode instanceof JSONPathFunctionExpression) {
            if (Object.hasOwn(this.options.functions, lastButOneNode.name))
                this.highlightFunctions(query, lastButOneNode.name, documentHighlights);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.dollarToken && lastButOneNode.type === JSONPathSyntaxTreeType.query) {
            this.highlightRootIdentifier(query, documentHighlights);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.questionMarkToken && lastButOneNode.type === JSONPathSyntaxTreeType.filterSelector ||
            lastNode.type === JSONPathSyntaxTreeType.atToken && lastButOneNode.type === JSONPathSyntaxTreeType.query) {
                const path = [...nodePath];
                while (path.length > 0 && !(path[path.length - 1] instanceof JSONPathFilterSelector))
                    path.pop();
                if (path.length > 0) {
                    const filterSelector = path[path.length - 1] as JSONPathFilterSelector;
                    documentHighlights.push(new DocumentHighlight(filterSelector.questionMarkToken.textRangeWithoutSkipped));
                    this.highlightCurrentIdentifier(filterSelector.expression, documentHighlights);
                }
        }
    }

    private highlightFunctions(tree: JSONPathSyntaxTree, functionName: string, documentHighlights: DocumentHighlight[]) {
        tree.forEach(n => {
            if (n instanceof JSONPathFunctionExpression && n.name === functionName)
                documentHighlights.push(new DocumentHighlight(n.nameToken.textRangeWithoutSkipped));
        })
    }

    private highlightRootIdentifier(tree: JSONPathSyntaxTree, documentHighlights: DocumentHighlight[]) {
        tree.forEach(n => {
            if (n instanceof JSONPathQuery && n.identifierToken.type === JSONPathSyntaxTreeType.dollarToken)
                documentHighlights.push(new DocumentHighlight(n.identifierToken.textRangeWithoutSkipped));
        })
    }

    private highlightCurrentIdentifier(tree: JSONPathSyntaxTree, documentHighlights: DocumentHighlight[]) {
        tree.forEach(n => {
            if (n instanceof JSONPathQuery && n.identifierToken.type === JSONPathSyntaxTreeType.atToken)
                documentHighlights.push(new DocumentHighlight(n.identifierToken.textRangeWithoutSkipped));
            if (n.type === JSONPathSyntaxTreeType.filterSelector)
                return false;
        })
    }
}

export class DocumentHighlight {
    constructor(
        readonly range: TextRange,
    ) { }
}