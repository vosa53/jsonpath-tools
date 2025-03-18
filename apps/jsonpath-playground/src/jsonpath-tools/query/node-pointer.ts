import { JSONPathSyntaxTree } from "./syntax-tree";

export class NodePointer<TNode extends JSONPathSyntaxTree> {
    constructor(
        readonly node: TNode,
        readonly parent: NodePointer<JSONPathSyntaxTree> | null
    ) { }

    child<TChildNode extends JSONPathSyntaxTree>(selector: (node: TNode) => TChildNode): NodePointer<TChildNode> {
        return new NodePointer(selector(this.node), this);
    }

}