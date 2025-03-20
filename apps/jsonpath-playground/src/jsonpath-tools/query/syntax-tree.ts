import { TextRange } from "../text-range";
import type { JSONPathNode } from "./node";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";

export abstract class JSONPathSyntaxTree {
    constructor(
        readonly position: number,
        readonly length: number
    ) { }

    // TODO
    parent: JSONPathNode | null = null;

    abstract readonly type: JSONPathSyntaxTreeType;
    abstract readonly skippedTextBefore: string;

    get textRange(): TextRange {
        return new TextRange(this.position, this.length);
    }

    get textRangeWithoutSkipped(): TextRange {
        return new TextRange(this.position + this.skippedTextBefore.length, this.length - this.skippedTextBefore.length);
    }

    abstract forEach(action: (tree: JSONPathSyntaxTree) => void | boolean): void;

    getAtPosition(position: number): JSONPathSyntaxTree | null {
        if (position < this.position)
            return null;
        if (position >= this.position + this.length)
            return null;

        let current: JSONPathSyntaxTree = this;
        // @ts-ignore
        while (current.children !== undefined) {
            for (const child of (current as JSONPathNode).children) {
                if (child.position + child.length > position) {
                    current = child;
                    break;
                }
            }
        }
        return current;
    }

    getTouchingAtPosition(position: number): JSONPathSyntaxTree[] {
        const results: JSONPathSyntaxTree[] = [];
        this.getTouchingAtPositionRecursive(position, results);
        return results;
    }

    getContainingAtPosition(position: number): JSONPathSyntaxTree | null {
        if (position <= this.position)
            return null;
        if (position >= this.position + this.length)
            return null;

        let current: JSONPathSyntaxTree = this;
        // @ts-ignore
        while (current.children !== undefined) {
            let changed = false;
            for (const child of (current as JSONPathNode).children) {
                if (position > child.position && position < child.position + child.length) {
                    current = child;
                    changed = true;
                    break;
                }
            }
            if (!changed)
                break;
        }
        return current;
    }

    private getTouchingAtPositionRecursive(position: number, results: JSONPathSyntaxTree[]): void {
        if (this.position > position || this.position + this.length < position)
            return;

        // @ts-ignore
        if (this.children !== undefined) {
            // @ts-ignore
            for (const child of (this as JSONPathNode).children)
                child.getTouchingAtPositionRecursive(position, results);
        }
        else
            results.push(this);
    }
}
