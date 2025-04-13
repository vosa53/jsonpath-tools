import { Diagnostics } from "../diagnostics";
import { NodeList } from "../values/node-list";
import { QueryContext } from "./evaluation";
import { SyntaxTreeNode } from "./syntax-tree-node";
import { SubQuery } from "./sub-query";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./syntax-tree-token";

/**
 * JSONPath query.
 */
export class Query extends SyntaxTreeNode {
    constructor(
        /**
         * Actual query.
         */
        readonly query: SubQuery,

        /**
         * End-of-file token. Its main purpose is to collect a skipped text after the query in its {@link SyntaxTreeToken.skippedTextBefore}.
         */
        readonly endOfFileToken: SyntaxTreeToken,

        /**
         * Diagnostics of the query related to syntax.
         */
        readonly syntaxDiagnostics: readonly Diagnostics[]
    ) {
        super([query, endOfFileToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.query; }

    /**
     * Selects nodes from the given query argument.
     * @param queryContext Query context.
     */
    select(queryContext: QueryContext): NodeList {
        return this.query.select(queryContext, null);
    }
}

