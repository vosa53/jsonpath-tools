import { NormalizedPath, NormalizedPathSegment } from "../normalized-path";
import { JSONValue } from "../json/json-types";

export class Node {
    constructor(
        readonly value: JSONValue,
        readonly pathSegment: NormalizedPathSegment,
        readonly parent: Node | null
    ) { }

    buildPath(): NormalizedPath {
        return this.buildPathRecursive();
    }

    private buildPathRecursive(depth = 0): NormalizedPathSegment[] {
        if (this.parent === null) {
            return new Array(depth);
        }
        else {
            const path = this.parent.buildPathRecursive(depth + 1);
            path[path.length - depth - 1] = this.pathSegment;
            return path;
        }
    }
}