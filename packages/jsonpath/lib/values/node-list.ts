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
    toNormalizedPaths(): NormalizedPath[] {
        return this.nodes.map(n => n.toNormalizedPath());
    }

    /**
     * Extracts JSON values from the nodes.
     */
    toValues(): JSONValue[] {
        return this.nodes.map(n => n.value);
    }
}
