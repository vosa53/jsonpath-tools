import { Node } from "./node";
import { NormalizedPath } from "../normalized-path";

export class NodeList {
    constructor(
        readonly nodes: readonly Node[]
    ) { }

    static readonly empty = new NodeList([]);

    buildPaths(): NormalizedPath[] {
        return this.nodes.map(n => n.buildPath());
    }
}
