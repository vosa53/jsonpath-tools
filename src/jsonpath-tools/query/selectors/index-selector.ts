import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathIndexSelector extends JSONPathSelector {
    constructor(
        readonly indexToken: JSONPathToken,

        readonly index: number
    ) {
        super([indexToken]);
    }

    get type() { return JSONPathSyntaxTreeType.indexSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isArray = Array.isArray(input);
        if (isArray) {
            const index = this.index < 0 ? input.length + this.index : this.index;
            if (index >= 0 && index < input.length)
                output.push(input[index]);
        }
    }
}
