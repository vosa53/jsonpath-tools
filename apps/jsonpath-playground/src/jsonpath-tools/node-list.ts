import { Node } from "./node";

export class NodeList {
    constructor(
        readonly nodes: readonly Node[]
    ) { }

    static readonly empty = new NodeList([]);
}
