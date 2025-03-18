import { JSONPathQueryContext, PushOnlyArray } from "../evaluation";
import { LocatedNode } from "../located-node";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathSelector } from "./selector";


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
