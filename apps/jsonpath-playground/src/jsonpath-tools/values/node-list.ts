import { Node } from "./node";
import { NormalizedPath } from "../normalized-path";
import { JSONValue } from "../json/json-types";

/**
 * List of {@link Node}s.
 */
export class NodeList {
    constructor(
        /**
         * {@link Node}s in the list.
         */
        readonly nodes: readonly Node[]
    ) { }

    /**
     * Empty {@link NodeList}.
     */
    static readonly empty = new NodeList([]);

    /**
     * Creates normalized paths from the nodes locations.
     */
    createNormalizedPaths(): NormalizedPath[] {
        return this.nodes.map(n => n.createNormalizedPath());
    }

    /**
     * Extracts JSON values from the nodes.
     */
    createValues(): JSONValue[] {
        return this.nodes.map(n => n.value);
    }
}
