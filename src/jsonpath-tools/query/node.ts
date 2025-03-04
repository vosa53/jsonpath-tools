import { TextRange } from "../text-range";
import { JSONPathSyntaxTree } from "./syntax-tree";


export abstract class JSONPathNode extends JSONPathSyntaxTree {
    readonly children: JSONPathSyntaxTree[];

    constructor(
        children: (JSONPathSyntaxTree | null)[]
    ) {
        const notNullChildren = children.filter(c => c !== null);
        if (notNullChildren.length === 0)
            throw new Error("Expected at least one non null child.");
        super(notNullChildren[0].position, notNullChildren.reduce((p, c) => p + c.length, 0));
        this.children = notNullChildren;
    }

    protected get skippedLength(): number {
        // @ts-ignore
        return this.children[0].skippedLength;
    }

    forEach(action: (tree: JSONPathSyntaxTree) => void | boolean): void {
        const shouldContinue = action(this);
        if (shouldContinue !== false) {
            for (const child of this.children)
                child.forEach(action);
        }
    }
}
