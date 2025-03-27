import { QueryContext, PushOnlyArray } from "../evaluation";
import { Node } from "../located-node";
import { SyntaxTreeNode } from "../node";


export abstract class Selector extends SyntaxTreeNode {
    abstract select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void;
}
