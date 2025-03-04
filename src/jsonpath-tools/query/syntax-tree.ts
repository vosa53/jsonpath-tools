import { TextRange } from "../text-range";
import { JSONPathNode } from "./node";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";

export abstract class JSONPathSyntaxTree {
    constructor(
        readonly position: number,
        readonly length: number
    ) { }

    abstract readonly type: JSONPathSyntaxTreeType;
    abstract readonly skippedTextBefore: string;

    get textRange(): TextRange {
        return new TextRange(this.position, this.length);
    }

    get textRangeWithoutSkipped(): TextRange {
        return new TextRange(this.position + this.skippedTextBefore.length, this.length - this.skippedTextBefore.length);
    }

    abstract forEach(action: (tree: JSONPathSyntaxTree) => void | boolean): void;

    getAtPosition(position: number): JSONPathSyntaxTree[] {
        if (position < this.position)
            return [];
        if (position >= this.position + this.length)
            return [];

        const path: JSONPathSyntaxTree[] = [this];
        // @ts-ignore
        while (path[path.length - 1].children !== undefined) {
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

    getTouchingAtPosition(position: number): JSONPathSyntaxTree[][] {
        const results: JSONPathSyntaxTree[][] = [];
        this.getTouchingAtPositionRecursive(position, [], results);
        return results;
    }

    getContainingAtPosition(position: number): JSONPathSyntaxTree[] {
        if (position <= this.position)
            return [];
        if (position >= this.position + this.length)
            return [];

        const path: JSONPathSyntaxTree[] = [this];
        // @ts-ignore
        while (path[path.length - 1].children !== undefined) {
            const currentNode = path[path.length - 1] as JSONPathNode;
            for (const child of currentNode.children) {
                if (position > child.position && position < child.position + child.length) {
                    path.push(child);
                    break;
                }
            }
            if (currentNode === path[path.length - 1])
                break;
        }
        return path;
    }

    private getTouchingAtPositionRecursive(position: number, currentPath: JSONPathSyntaxTree[], results: JSONPathSyntaxTree[][]): void {
        if (this.position > position || this.position + this.length < position)
            return;

        currentPath.push(this);
        // @ts-ignore
        if (this.children !== undefined) {
            // @ts-ignore
            for (const child of (this as JSONPathNode).children)
                child.getTouchingAtPositionRecursive(position, currentPath, results);
        }
        else
            results.push([...currentPath]);
        currentPath.pop();
    }
}
