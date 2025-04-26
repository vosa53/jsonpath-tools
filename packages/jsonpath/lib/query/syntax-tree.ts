import { TextRange } from "../text/text-range";
import type { SyntaxTreeNode } from "./syntax-tree-node";
import { SyntaxTreeType } from "./syntax-tree-type";

/**
 * Part of a query syntax tree.
 */
export abstract class SyntaxTree {
    constructor(
        /**
         * Position in the text.
         */
        readonly position: number,

        /**
         * Length in the text.
         */
        readonly length: number
    ) { }

    /**
     * Parent or `null` when no parent is assigned.
     */
    get parent(): SyntaxTreeNode | null {
        return this._parent;
    }

    /**
     * @internal
     */
    _parent: SyntaxTreeNode | null = null;

    /**
     * Type.
     */
    abstract readonly type: SyntaxTreeType;

    /**
     * Text that was skipped during parsing.
     */
    abstract readonly skippedTextBefore: string;

    /**
     * Range in the text.
     */
    get textRange(): TextRange {
        return new TextRange(this.position, this.length);
    }

    /**
     * Range in the text excluding skipped text before.
     */
    get textRangeWithoutSkipped(): TextRange {
        return new TextRange(this.position + this.skippedTextBefore.length, this.length - this.skippedTextBefore.length);
    }

    /**
     * Executes the given action for this and all descendant trees in a pre-order tree traversal.
     * @param action Action.
     */
    abstract forEach(action: (tree: SyntaxTree) => void | boolean): void;

    /**
     * Returns the innermost subtree that spans the given character position or `null` when the position is outside of a range of the current tree.
     * @param characterPosition Position (character index).
     */
    getAtPosition(characterPosition: number): SyntaxTree | null {
        if (characterPosition < this.position)
            return null;
        if (characterPosition >= this.position + this.length)
            return null;

        let current: SyntaxTree = this;
        // @ts-ignore
        while (current.children !== undefined) {
            for (const child of (current as SyntaxTreeNode).children) {
                if (child.position + child.length > characterPosition) {
                    current = child;
                    break;
                }
            }
        }
        return current;
    }

    /**
     * Returns all innermost subtrees that touch the given caret position.
     * @param caretPosition Position (caret position index).
     */
    getTouchingAtPosition(caretPosition: number): SyntaxTree[] {
        const results: SyntaxTree[] = [];
        this.getTouchingAtPositionRecursive(caretPosition, results);
        return results;
    }

    /**
     * Returns the innermost subtree that fully contains the given caret position *(not just touches)* or `null` when the position is not contained in a range of the current tree.
     * @param caretPosition Position (caret position index).
     */
    getContainingAtPosition(caretPosition: number): SyntaxTree | null {
        if (caretPosition <= this.position)
            return null;
        if (caretPosition >= this.position + this.length)
            return null;

        let current: SyntaxTree = this;
        // @ts-ignore
        while (current.children !== undefined) {
            let changed = false;
            for (const child of (current as SyntaxTreeNode).children) {
                if (caretPosition > child.position && caretPosition < child.position + child.length) {
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
