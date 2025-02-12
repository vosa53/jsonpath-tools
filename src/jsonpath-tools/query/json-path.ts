import { JSONPathDiagnostics } from "../diagnostics";
import { JSONPathNodeList } from "../types";
import { JSONPathNode } from "./node";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";
import { JSONPathToken } from "./token";
import { JSONPathQuery } from "./query";
import { JSONPathQueryContext } from "./evaluation";


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

