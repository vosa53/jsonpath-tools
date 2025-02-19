import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";
import { LocatedNode } from "../located-node";


export class JSONPathNameSelector extends JSONPathSelector {
    constructor(
        readonly nameToken: JSONPathToken,

        readonly name: string
    ) {
        super([nameToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nameSelector; }

    select(input: LocatedNode, output: PushOnlyArray<LocatedNode>, queryContext: JSONPathQueryContext): void {
        const isObject = typeof input.value === "object" && !Array.isArray(input.value) && input.value !== null;
        if (isObject && input.value.hasOwnProperty(this.name))
            output.push(new LocatedNode(input.value[this.name], this.name, input));
    }
}
