import { JSONPathQueryContext, PushOnlyArray } from "../evaluation";
import { LocatedNode } from "../located-node";
import { JSONPathNode } from "../node";


export abstract class JSONPathSelector extends JSONPathNode {
    abstract select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void;
}
