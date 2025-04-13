import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "@/jsonpath-tools/helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";

/**
 * Index selector.
 */
export class IndexSelector extends Selector {
    constructor(
        /**
         * Index token.
         */
        readonly indexToken: SyntaxTreeToken,

        /**
         * Index.
         */
        readonly index: number
    ) {
        super([indexToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.indexSelector; }

    /**
     * @inheritdoc
     */
    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        const isArray = Array.isArray(input.value);
        if (isArray) {
            const index = this.index < 0 ? input.value.length + this.index : this.index;
            if (index >= 0 && index < input.value.length)
                output.push(new Node(input.value[index], index, input));
        }
    }
}
