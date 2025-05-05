import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeNode } from "../query/syntax-tree-node";
import { SyntaxTreeToken } from "../query/syntax-tree-token";

/**
 * Converts the given syntax tree to a text representation.
 * @param syntaxTree Syntax tree.
 * @param colored Whether to use color console escape codes.
 * @param indentationLevel Current indentation level.
 */
export function stringifySyntaxTree(syntaxTree: SyntaxTree, colored = false, indentationLevel = 0): string {
    let text = " ".repeat(indentationLevel * 4);
    if (colored) text += "\x1b[33m";
    text += syntaxTree.type;
    if (colored) text += "\x1b[0m";
    if (syntaxTree instanceof SyntaxTreeToken) {
        if (colored) text += "\x1b[90m";
        text += " " + JSON.stringify(syntaxTree.text) + "\n";
        if (colored) text += "\x1b[0m";
    }
    else if (syntaxTree instanceof SyntaxTreeNode) {
        text += "\n";
        for (const child of syntaxTree.children)
            text += stringifySyntaxTree(child, colored, indentationLevel + 1);
    }
    return text;
}
