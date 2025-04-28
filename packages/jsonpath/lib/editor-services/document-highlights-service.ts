import { QueryOptions } from "../query-options";
import { FunctionExpression } from "../query/filter-expressions/function-expression";
import { Query } from "../query/query";
import { SubQuery } from "../query/sub-query";
import { FilterSelector } from "../query/selectors/filter-selector";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text/text-range";

/**
 * Provides highlights of related symbols.
 */
export class DocumentHighlightsService {
    constructor(
        /**
         * Query options.
         */
        private readonly queryOptions: QueryOptions
    ) { }

    /**
     * Provides document highlights at the given caret position in the query text.
     * @param query Query.
     * @param position Caret position in the query text (starts with 0).
     */
    provideHighlights(query: Query, position: number): DocumentHighlight[] {
        const documentHighlights: DocumentHighlight[] = [];
        const touchingNodes = query.getTouchingAtPosition(position);
        for (const node of touchingNodes)
            this.provideHighlightsForNode(query, node, documentHighlights);
        documentHighlights.sort((a, b) => a.range.position - b.range.position);
        return documentHighlights.filter(h => h.range.length !== 0);
    }

    private provideHighlightsForNode(query: Query, node: SyntaxTree, documentHighlights: DocumentHighlight[]) {
        const lastNode = node;
        const lastButOneNode = node.parent!;

        if (lastNode.type === SyntaxTreeType.nameToken && lastButOneNode instanceof FunctionExpression) {
            if (Object.hasOwn(this.queryOptions.functions, lastButOneNode.name))
                this.highlightFunctions(query, lastButOneNode.name, documentHighlights);
        }
        if (lastNode.type === SyntaxTreeType.dollarToken && lastButOneNode.type === SyntaxTreeType.subQuery) {
            this.highlightRootIdentifier(query, documentHighlights);
        }
        if (lastNode.type === SyntaxTreeType.questionMarkToken && lastButOneNode.type === SyntaxTreeType.filterSelector ||
            lastNode.type === SyntaxTreeType.atToken && lastButOneNode.type === SyntaxTreeType.subQuery) {
                let current: SyntaxTree | null = node;
                while (current !== null && !(current instanceof FilterSelector))
                    current = current.parent;
                if (current !== null) {
                    documentHighlights.push(new DocumentHighlight(current.questionMarkToken.textRangeWithoutSkipped));
                    this.highlightCurrentIdentifier(current.expression, documentHighlights);
                }
        }
    }

    private highlightFunctions(tree: SyntaxTree, functionName: string, documentHighlights: DocumentHighlight[]) {
        tree.forEach(n => {
            if (n instanceof FunctionExpression && n.name === functionName)
                documentHighlights.push(new DocumentHighlight(n.nameToken.textRangeWithoutSkipped));
        })
    }

    private highlightRootIdentifier(tree: SyntaxTree, documentHighlights: DocumentHighlight[]) {
        tree.forEach(n => {
            if (n instanceof SubQuery && n.identifierToken.type === SyntaxTreeType.dollarToken)
                documentHighlights.push(new DocumentHighlight(n.identifierToken.textRangeWithoutSkipped));
        })
    }

    private highlightCurrentIdentifier(tree: SyntaxTree, documentHighlights: DocumentHighlight[]) {
        tree.forEach(n => {
            if (n instanceof SubQuery && n.identifierToken.type === SyntaxTreeType.atToken)
                documentHighlights.push(new DocumentHighlight(n.identifierToken.textRangeWithoutSkipped));
            if (n.type === SyntaxTreeType.filterSelector)
                return false;
        })
    }
}

/**
 * One document highlight.
 */
export class DocumentHighlight {
    constructor(
        /**
         * Text range to be highlighted.
         */
        readonly range: TextRange
    ) { }
}