import { TextRange } from "../text-range";
import { SyntaxTree } from "./syntax-tree";


export abstract class SyntaxTreeNode extends SyntaxTree {
    readonly children: SyntaxTree[];

    constructor(
        children: (SyntaxTree | null)[]
    ) {
        const notNullChildren = children.filter(c => c !== null);
        if (notNullChildren.length === 0)
            throw new Error("Expected at least one non null child.");
        super(notNullChildren[0].position, notNullChildren.reduce((p, c) => p + c.length, 0));
        this.children = notNullChildren;
        for (const child of this.children)
            child.parent = this;
    }

    get skippedTextBefore(): string {
        // @ts-ignore
        return this.children[0].skippedTextBefore;
    }

    forEach(action: (tree: SyntaxTree) => void | boolean): void {
        const shouldContinue = action(this);
        if (shouldContinue !== false) {
            for (const child of this.children)
                child.forEach(action);
        }
    }
}
