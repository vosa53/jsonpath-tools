import { JSONPathQueryContext, PushOnlyArray } from "../evaluation";
import { LocatedNode } from "../located-node";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathSelector } from "./selector";


export class JSONPathMissingSelector extends JSONPathSelector {
    constructor(
            readonly missingToken: JSONPathToken
        ) {
            super([missingToken]);
        }

    get type() { return JSONPathSyntaxTreeType.missingSelector; }

    select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void { }
}
