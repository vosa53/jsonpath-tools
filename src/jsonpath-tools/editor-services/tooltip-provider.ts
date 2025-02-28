import { JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPath } from "../query/json-path";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text-range";

export class TooltipProvider {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    provideTooltip(jsonPath: JSONPath, position: number): Tooltip | null {
        const nodePath = jsonPath.getAtPosition(position);
        if (nodePath.length === 0)
            return null;

        const lastNode = nodePath[nodePath.length - 1];
        const lastButOneNode = nodePath[nodePath.length - 2];
        if (lastNode.type === JSONPathSyntaxTreeType.questionMarkToken) {
            return new Tooltip("Filter Selector", "Selects particular children using a logical expression. Current child is represented with @.", lastButOneNode.textRange);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.dollarToken) {
            return new Tooltip("Root Identifier", "Identifies root object.", lastNode.textRange);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.starToken) {
            return new Tooltip("Wildcard Selector", "Selects all members from an object.", lastNode.textRange);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression) {
            const name = (lastButOneNode as JSONPathFunctionExpression).name;
            return new Tooltip(`Function ${name}`, "Function.", lastNode.textRange);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.doubleAmpersandToken && lastButOneNode.type === JSONPathSyntaxTreeType.andExpression) {
            return new Tooltip("Conjunction", "Realizes operator AND.", lastButOneNode.textRange);
        }
        return null;
    }
}

export class Tooltip {
    constructor(
        readonly title: string,
        readonly text: string,
        readonly range: TextRange
    ) { }
}