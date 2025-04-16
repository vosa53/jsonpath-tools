import { NormalizedPath, NormalizedPathSegment } from "../normalized-path";
import { JSONValue } from "../json/json-types";

/**
 * JSON value with its location.
 */
export class Node {
    constructor(
        /**
         * JSON value.
         */
        readonly value: JSONValue,

        /**
         * Property name or index that can be used to extract this value from a {@link parent} node value.
         */
        readonly pathSegment: NormalizedPathSegment,

        /**
         * Node of a value from which this {@link value} was extracted. `null` when the current value is a root.
         */
        readonly parent: Node | null
    ) { }

    /**
     * Creates a normalized path from the location.
     */
    toNormalizedPath(): NormalizedPath {
        return this.toNormalizedPathRecursive();
    }

    private toNormalizedPathRecursive(depth = 0): NormalizedPathSegment[] {
        if (this.parent === null) {
            return new Array(depth);
        }
        else {
            const path = this.parent.toNormalizedPathRecursive(depth + 1);
            path[path.length - depth - 1] = this.pathSegment;
            return path;
        }
    }
}