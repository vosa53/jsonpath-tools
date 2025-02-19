import { JSONPathJSONValue } from "../../types";
import { JSONPathNode } from "../node";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";
import { LocatedNode } from "../located-node";


export abstract class JSONPathSelector extends JSONPathNode {
    abstract select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void;
}
