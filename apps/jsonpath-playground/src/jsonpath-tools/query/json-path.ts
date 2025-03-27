import { Diagnostics } from "../diagnostics";
import { NodeList } from "../types";
import { QueryContext } from "./evaluation";
import { SyntaxTreeNode } from "./node";
import { SubQuery } from "./query";
import { SyntaxTreeType } from "./syntax-tree-type";
import { SyntaxTreeToken } from "./token";


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

