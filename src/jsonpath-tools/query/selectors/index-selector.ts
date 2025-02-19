import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";
import { LocatedNode } from "../located-node";


export class JSONPathIndexSelector extends JSONPathSelector {
    constructor(
        readonly indexToken: JSONPathToken,

        readonly index: number
    ) {
        super([indexToken]);
    }

    get type() { return JSONPathSyntaxTreeType.indexSelector; }

    select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void {
        const isArray = Array.isArray(input.value);
        if (isArray) {
            const index = this.index < 0 ? input.value.length + this.index : this.index;
            if (index >= 0 && index < input.value.length)
                output.push(new LocatedNode(input.value[index], index, input));
        }
    }
}
