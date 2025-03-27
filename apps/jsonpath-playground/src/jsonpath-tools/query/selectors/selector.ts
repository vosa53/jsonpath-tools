import { QueryContext, PushOnlyArray } from "../evaluation";
import { Node } from "../../node";
import { SyntaxTreeNode } from "../syntax-tree-node";


export abstract class Selector extends SyntaxTreeNode {
    abstract select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void;
}
