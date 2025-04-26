import { SyntaxTree } from "./syntax-tree";
import { SyntaxTreeType } from "./syntax-tree-type";

/**
 * Terminal symbols of the grammar.
 */
export class SyntaxTreeToken extends SyntaxTree {
    constructor(
        /**
         * @inheritdoc
         */
        readonly type: SyntaxTreeType,

        /**
         * @inheritdoc
         */
        readonly position: number,

        /**
         * @inheritdoc
         */
        readonly text: string,

        /**
         * @inheritdoc
         */
        readonly skippedTextBefore: string
    ) {
        super(position, skippedTextBefore.length + text.length);
    }

    /**
     * @inheritdoc
     */
    forEach(action: (tree: SyntaxTree) => void | boolean): void {
        action(this);
    }
}
