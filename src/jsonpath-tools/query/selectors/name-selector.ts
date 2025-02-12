import { JSONPathJSONValue } from "../../types";
import { JSONPathSelector } from "./selector";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { PushOnlyArray } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathNameSelector extends JSONPathSelector {
    constructor(
        readonly nameToken: JSONPathToken,

        readonly name: string
    ) {
        super([nameToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nameSelector; }

    select(input: JSONPathJSONValue, output: PushOnlyArray<JSONPathJSONValue>, queryContext: JSONPathQueryContext): void {
        const isObject = typeof input === "object" && !Array.isArray(input) && input !== null;
        if (isObject && input.hasOwnProperty(this.name))
            output.push(input[this.name]);
    }
}
