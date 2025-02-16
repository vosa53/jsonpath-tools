import { JSONPathJSONValue } from "../../types";
import { JSONPathQueryContext, PushOnlyArray } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathSelector } from "./selector";


export class JSONPathMissingSelector extends JSONPathSelector {
    constructor(position: number) {
        super([], position);
    }

    get type() { return JSONPathSyntaxTreeType.indexSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void { }
}
