import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "../../helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";

/**
 * Wildcard selector.
 */
export class WildcardSelector extends Selector {
    constructor(
        /**
         * Star token.
         */
        readonly starToken: SyntaxTreeToken
    ) {
        super([starToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.wildcardSelector; }

    /**
     * @inheritdoc
     */
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
