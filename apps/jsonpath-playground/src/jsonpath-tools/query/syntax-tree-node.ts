import { SyntaxTree } from "./syntax-tree";

/**
 * Nonterminal symbols of the grammar.
 */
export abstract class SyntaxTreeNode extends SyntaxTree {
    /**
     * Children.
     */
    readonly children: SyntaxTree[];

    /**
     * @param children Children.
     */
    constructor(
        children: (SyntaxTree | null)[]
    ) {
        const notNullChildren = children.filter(c => c !== null);
        if (notNullChildren.length === 0)
            throw new Error("Expected at least one non null child.");
        super(notNullChildren[0].position, notNullChildren.reduce((p, c) => p + c.length, 0));
        this.children = notNullChildren;
        for (const child of this.children) {
            if (child.parent !== null)
                throw new Error("Child has already assigned a parent.");
            child._parent = this;
        }
    }

    /**
     * @inheritdoc
     */
    get skippedTextBefore(): string {
        // @ts-ignore
        return this.children[0].skippedTextBefore;
    }

    /**
     * @inheritdoc
     */
    forEach(action: (tree: SyntaxTree) => void | boolean): void {
        const shouldContinue = action(this);
        if (shouldContinue !== false) {
            for (const child of this.children)
                child.forEach(action);
        }
    }
}
