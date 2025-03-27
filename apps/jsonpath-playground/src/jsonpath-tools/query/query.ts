import { Diagnostics } from "../diagnostics";
import { NodeList } from "../values/node-list";
import { QueryContext } from "./evaluation";
import { SyntaxTreeNode } from "./syntax-tree-node";
import { SubQuery } from "./sub-query";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./syntax-tree-token";


export class Query extends SyntaxTreeNode {
    constructor(
        readonly query: SubQuery,
        readonly endOfFileToken: SyntaxTreeToken,

        readonly syntaxDiagnostics: readonly Diagnostics[]
    ) {
        super([query, endOfFileToken]);
    }

    get type() { return SyntaxTreeType.root; }

    select(queryContext: QueryContext): NodeList {
        return this.query.select(queryContext, null);
    }
}

