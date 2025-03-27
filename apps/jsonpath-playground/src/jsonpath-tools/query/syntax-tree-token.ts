import { TextRange } from "../text-range";
import { SyntaxTree } from "./syntax-tree";
import { SyntaxTreeType } from "./syntax-tree-type";


export class SyntaxTreeToken extends SyntaxTree {
    constructor(
        readonly type: SyntaxTreeType,
        readonly position: number,
        readonly text: string,
        readonly skippedTextBefore: string
    ) {
        super(position, skippedTextBefore.length + text.length);
    }
    
    forEach(action: (tree: SyntaxTree) => void | boolean): void {
        action(this);
    }
}
