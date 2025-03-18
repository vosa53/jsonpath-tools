import { TextRange } from "../text-range";
import { JSONPathSyntaxTree } from "./syntax-tree";
import { JSONPathSyntaxTreeType } from "./syntax-tree-type";


export class JSONPathToken extends JSONPathSyntaxTree {
    constructor(
        readonly type: JSONPathSyntaxTreeType,
        readonly position: number,
        readonly text: string,
        readonly skippedTextBefore: string
    ) {
        super(position, skippedTextBefore.length + text.length);
    }
    
    forEach(action: (tree: JSONPathSyntaxTree) => void | boolean): void {
        action(this);
    }
}
