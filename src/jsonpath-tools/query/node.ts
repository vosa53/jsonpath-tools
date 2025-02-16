import { JSONPathSyntaxTree } from "./syntax-tree";


export abstract class JSONPathNode extends JSONPathSyntaxTree {
    readonly children: JSONPathSyntaxTree[];

    constructor(
        children: (JSONPathSyntaxTree | null)[],
        position: number | null = null
    ) {
        const notNullChildren = children.filter(c => c !== null);
        if (position === null && notNullChildren.length === 0)
            throw new Error("Expected at least one non null child when position is null.");
        super(notNullChildren[0]?.position ?? position, notNullChildren.reduce((p, c) => p + c.length, 0));
        this.children = notNullChildren;
    }
}
