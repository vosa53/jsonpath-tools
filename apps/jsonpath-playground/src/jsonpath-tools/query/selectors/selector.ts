import { QueryContext } from "../evaluation";
import { PushOnlyArray } from "@/jsonpath-tools/helpers/array";
import { Node } from "../../values/node";
import { SyntaxTreeNode } from "../syntax-tree-node";


export abstract class Selector extends SyntaxTreeNode {
    abstract select(input: Node, output: PushOnlyArray<Node>, queryContext: QueryContext): void;
}
