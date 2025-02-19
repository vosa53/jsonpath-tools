import { JSONPathJSONValue } from "../types";

export class LocatedNode {
    constructor(
        readonly value: JSONPathJSONValue,
        readonly pathSegment: string | number,
        readonly parent: LocatedNode | null
    ) { }

    buildPath(): (string | number)[] {
        return this.buildPathRecursive();
    }

    private buildPathRecursive(depth = 0): (string | number)[] {
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