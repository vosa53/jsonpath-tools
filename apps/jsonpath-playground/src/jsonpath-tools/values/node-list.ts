import { Node } from "./node";
import { NormalizedPath } from "../normalized-path";
import { JSONValue } from "../json/json-types";

export class NodeList {
    constructor(
        readonly nodes: readonly Node[]
    ) { }

    static readonly empty = new NodeList([]);

    createNormalizedPaths(): NormalizedPath[] {
        return this.nodes.map(n => n.createNormalizedPath());
    }

    createValues(): JSONValue[] {
        return this.nodes.map(n => n.value);
    }
}
