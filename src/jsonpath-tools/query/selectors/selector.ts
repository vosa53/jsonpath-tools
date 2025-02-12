import { JSONPathJSONValue } from "../../types";
import { JSONPathNode } from "../node";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export abstract class JSONPathSelector extends JSONPathNode {
    abstract select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void;
}
