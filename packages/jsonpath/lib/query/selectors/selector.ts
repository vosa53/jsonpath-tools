import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "../../helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeNode } from "../syntax-tree-node";

/**
 * Selector.
 */
export abstract class Selector extends SyntaxTreeNode {
    /**
     * Selects nodes from the input node to the output array.
     * @param input Input node.
     * @param output Output nodes.
     * @param queryContext Query context.
     */
    abstract select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void;
}
