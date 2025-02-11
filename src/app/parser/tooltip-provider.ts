import { JSONPath, JSONPathSyntaxTreeType, JSONPathToken } from "./syntax-tree";
import { TextRange } from "./text-range";

export class TooltipProvider {
    static provideTooltip(jsonPath: JSONPath, position: number): Tooltip | null {
        const nodePath = jsonPath.getAtPosition(position);
        if (nodePath.length === 0)
            return null;

        const lastNode = nodePath[nodePath.length - 1];
        if (lastNode.type === JSONPathSyntaxTreeType.questionMarkToken) {
            return new Tooltip("Filter Selector", "Selects particular children using a logical expression. Current child is represented with @.", nodePath[nodePath.length - 2].textRange);
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