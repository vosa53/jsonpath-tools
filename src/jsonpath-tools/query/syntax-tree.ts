import { TextRange } from "../text-range";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";
import { JSONPathNode } from "./node";


export abstract class JSONPathSyntaxTree {
    constructor(
        readonly position: number,
        readonly length: number
    ) { }

    abstract readonly type: JSONPathSyntaxTreeType;

    get textRange(): TextRange {
        return new TextRange(this.position, this.length);
    }

    getAtPosition(position: number): JSONPathSyntaxTree[] {
        if (position < this.position)
            return [];
        if (position >= this.position + this.length)
            return [];

        const path: JSONPathSyntaxTree[] = [this];
        while (path[path.length - 1] instanceof JSONPathNode) {
            const currentNode = path[path.length - 1] as JSONPathNode;
            for (const child of currentNode.children) {
                if (child.position + child.length > position) {
                    path.push(child);
                    break;
                }
            }
            if (currentNode === path[path.length - 1])
                throw new Error("Children are not fully covering their parent.");
        }
        return path;
    }
}
