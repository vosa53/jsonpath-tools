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

    forEach(action: (tree: JSONPathSyntaxTree) => void): void {
        action(this);
        for (const child of this.children)
            child.forEach(action);
    }
}
