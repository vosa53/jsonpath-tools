import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "../../helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { Selector } from "./selector";

/**
 * Missing selector.
 */
export class MissingSelector extends Selector {
    constructor(
        /**
         * Missing token.
         */
        readonly missingToken: SyntaxTreeToken
    ) {
        super([missingToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.missingSelector; }

    /**
     * @inheritdoc
     */
    select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void { }
}
