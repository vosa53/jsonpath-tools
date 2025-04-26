import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "../../helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";

/**
 * Name selector.
 */
export class NameSelector extends Selector {
    constructor(
        /**
         * Name token.
         */
        readonly nameToken: SyntaxTreeToken,

        /**
         * Name.
         */
        readonly name: string
    ) {
        super([nameToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.nameSelector; }

    /**
     * @inheritdoc
     */
    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void {
        const isObject = typeof input.value === "object" && !Array.isArray(input.value) && input.value !== null;
        if (isObject && Object.hasOwn(input.value, this.name))
            output.push(new Node(input.value[this.name], this.name, input));
    }
}
