import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "@/jsonpath-tools/helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";


export class WildcardSelector extends Selector {
    constructor(
        readonly starToken: SyntaxTreeToken
    ) {
        super([starToken]);
    }

    get type() { return SyntaxTreeType.wildcardSelector; }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        if (Array.isArray(input.value)) {
            for (let i = 0; i < input.value.length; i++)
                output.push(new Node(input.value[i], i, input));
        }
        else if (typeof input.value === "object" && input.value !== null) {
            for (const entry of Object.entries(input.value))
                output.push(new Node(entry[1], entry[0], input));
        }
    }
}
