import { NormalizedPath, NormalizedPathSegment } from "../normalized-path";
import { JSONValue } from "../json/json-types";

export class Node {
    constructor(
        readonly value: JSONValue,
        readonly pathSegment: NormalizedPathSegment,
        readonly parent: Node | null
    ) { }

    createNormalizedPath(): NormalizedPath {
        return this.createNormalizedPathRecursive();
    }

    private createNormalizedPathRecursive(depth = 0): NormalizedPathSegment[] {
        if (this.parent === null) {
            return new Array(depth);
        }
        else {
            const path = this.parent.createNormalizedPathRecursive(depth + 1);
            path[path.length - depth - 1] = this.pathSegment;
            return path;
        }
    }
}