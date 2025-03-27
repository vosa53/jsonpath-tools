import { QueryContext, PushOnlyArray } from "../evaluation";
import { Node } from "../../node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";


export class NameSelector extends Selector {
    constructor(
        readonly nameToken: SyntaxTreeToken,

        readonly name: string
    ) {
        super([nameToken]);
    }

    get type() { return SyntaxTreeType.nameSelector; }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        const isObject = typeof input.value === "object" && !Array.isArray(input.value) && input.value !== null;
        if (isObject && input.value.hasOwnProperty(this.name))
            output.push(new Node(input.value[this.name], this.name, input));
    }
}
