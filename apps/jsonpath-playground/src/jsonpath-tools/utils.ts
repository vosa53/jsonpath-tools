import { SyntaxTreeNode } from "./query/syntax-tree-node";
import { SyntaxTree } from "./query/syntax-tree";
import { SyntaxTreeToken } from "./query/syntax-tree-token";

export function createSyntaxTree(syntaxTree: SyntaxTree, colored = false, indentationLevel = 0): string {
    let text = ' '.repeat(indentationLevel * 4);
    if (syntaxTree instanceof SyntaxTreeToken) {
        if (colored) text += "\x1b[90m";
        text += "token: ";
        if (colored) text += "\x1b[0m";
        text += syntaxTree.text + "\n";
    }
    else if (syntaxTree instanceof SyntaxTreeNode) {
        if (colored) text += "\x1b[33m";
        text += syntaxTree.constructor.name.replace(/^JSONPath/, "");
        if (colored) text += "\x1b[0m";
        text += "\n";
        for (const child of syntaxTree.children) {
            text += createSyntaxTree(child, colored, indentationLevel + 1);
        }
    }
    return text;
}

export function logPerformance<TResult>(label: string, action: () => TResult) {
    const startMilliseconds = performance.now();
    const result = action();
    const elapsedMilliseconds = performance.now() - startMilliseconds;
    console.log(`at ${(startMilliseconds % 10_000).toFixed(4).padStart(9, "0")} PERFORMANCE: ${elapsedMilliseconds.toFixed(4)} ms, ${label}`);
    return result;
}

export const EMPTY_ARRAY: readonly any[] = Object.freeze([]);