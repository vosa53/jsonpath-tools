import { TextRange } from "../text-range";
import type { SyntaxTreeNode } from "./syntax-tree-node";
import { SyntaxTreeType } from "./syntax-tree-type";

export abstract class SyntaxTree {
    constructor(
        readonly position: number,
        readonly length: number
    ) { }

    // TODO
    parent: SyntaxTreeNode | null = null;

    abstract readonly type: SyntaxTreeType;
    abstract readonly skippedTextBefore: string;

    get textRange(): TextRange {
        return new TextRange(this.position, this.length);
    }

    get textRangeWithoutSkipped(): TextRange {
        return new TextRange(this.position + this.skippedTextBefore.length, this.length - this.skippedTextBefore.length);
    }

    abstract forEach(action: (tree: SyntaxTree) => void | boolean): void;

    getAtPosition(position: number): SyntaxTree | null {
        if (position < this.position)
            return null;
        if (position >= this.position + this.length)
            return null;

        let current: SyntaxTree = this;
        // @ts-ignore
        while (current.children !== undefined) {
            for (const child of (current as SyntaxTreeNode).children) {
                if (child.position + child.length > position) {
                    current = child;
                    break;
                }
            }
        }
        return current;
    }

    getTouchingAtPosition(position: number): SyntaxTree[] {
        const results: SyntaxTree[] = [];
        this.getTouchingAtPositionRecursive(position, results);
        return results;
    }

    getContainingAtPosition(position: number): SyntaxTree | null {
        if (position <= this.position)
            return null;
        if (position >= this.position + this.length)
            return null;

        let current: SyntaxTree = this;
        // @ts-ignore
        while (current.children !== undefined) {
            let changed = false;
            for (const child of (current as SyntaxTreeNode).children) {
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

    private getTouchingAtPositionRecursive(position: number, results: SyntaxTree[]): void {
        if (this.position > position || this.position + this.length < position)
            return;

        // @ts-ignore
        if (this.children !== undefined) {
            // @ts-ignore
            for (const child of (this as SyntaxTreeNode).children)
                child.getTouchingAtPositionRecursive(position, results);
        }
        else
            results.push(this);
    }
}
