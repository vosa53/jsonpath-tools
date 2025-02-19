import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";
import { LocatedNode } from "../located-node";


export class JSONPathWildcardSelector extends JSONPathSelector {
    constructor(
        readonly starToken: JSONPathToken
    ) {
        super([starToken]);
    }

    get type() { return JSONPathSyntaxTreeType.wildcardSelector; }

    select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void {
        if (Array.isArray(input.value)) {
            for (let i = 0; i < input.value.length; i++)
                output.push(new LocatedNode(input.value[i], i, input));
        }
        else if (typeof input.value === "object" && input.value !== null) {
            for (const entry of Object.entries(input.value))
                output.push(new LocatedNode(entry[1], entry[0], input));
        }
    }
}
