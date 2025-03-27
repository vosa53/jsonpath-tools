import { QueryContext, PushOnlyArray } from "../evaluation";
import { Node } from "../../node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";


export class MissingSelector extends Selector {
    constructor(
            readonly missingToken: SyntaxTreeToken
        ) {
            super([missingToken]);
        }

    get type() { return SyntaxTreeType.missingSelector; }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void { }
}
