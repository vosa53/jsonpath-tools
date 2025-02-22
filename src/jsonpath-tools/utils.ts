import { JSONPathNode } from "./query/node";
import { JSONPathSyntaxTree } from "./query/syntax-tree";
import { JSONPathToken } from "./query/token";

export function createSyntaxTree(syntaxTree: JSONPathSyntaxTree, colored = false, indentationLevel = 0): string {
    let text = ' '.repeat(indentationLevel * 4);
    if (syntaxTree instanceof JSONPathToken) {
        if (colored) text += "\x1b[90m";
        text += "token: ";
        if (colored) text += "\x1b[0m";
        text += syntaxTree.text + "\n";
    }
    else if (syntaxTree instanceof JSONPathNode) {
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
    console.log(`'${label}' took ${elapsedMilliseconds.toFixed(4)} "ms`);
    return result;
}