import { JSONPathJSONValue } from "../../types";
import { JSONPathQueryContext, PushOnlyArray } from "../evaluation";
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

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void { }
}
