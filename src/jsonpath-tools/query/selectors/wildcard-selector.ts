import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathWildcardSelector extends JSONPathSelector {
    constructor(
        readonly starToken: JSONPathToken
    ) {
        super([starToken]);
    }

    get type() { return JSONPathSyntaxTreeType.wildcardSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isObjectOrArray = typeof input === "object" && input !== null;
        if (isObjectOrArray)
            output.push(...Object.values(input));
    }
}
