import { QueryContext, PushOnlyArray } from "../evaluation";
import { Node } from "../located-node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../token";
import { Selector } from "./selector";


export class IndexSelector extends Selector {
    constructor(
        readonly indexToken: SyntaxTreeToken,

        readonly index: number
    ) {
        super([indexToken]);
    }

    get type() { return SyntaxTreeType.indexSelector; }

    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        const isArray = Array.isArray(input.value);
        if (isArray) {
            const index = this.index < 0 ? input.value.length + this.index : this.index;
            if (index >= 0 && index < input.value.length)
                output.push(new Node(input.value[index], index, input));
        }
    }
}
