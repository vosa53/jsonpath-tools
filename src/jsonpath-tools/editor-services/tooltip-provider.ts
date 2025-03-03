import { JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPath } from "../query/json-path";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text-range";
import { DescriptionProvider } from "./description-provider";

export class TooltipProvider {
    private readonly descriptionProvider: DescriptionProvider;

    constructor(
        private readonly options: JSONPathOptions
    ) {
        this.descriptionProvider = new DescriptionProvider(options);
    }

    provideTooltip(jsonPath: JSONPath, position: number): Tooltip | null {
        const nodePath = jsonPath.getAtPosition(position);
        if (nodePath.length === 0)
            return null;

        const lastNode = nodePath[nodePath.length - 1];
        const lastButOneNode = nodePath[nodePath.length - 2];
        if (lastNode.type === JSONPathSyntaxTreeType.questionMarkToken)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.dollarToken)
            return this.createTooltip(lastNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.atToken)
            return this.createTooltip(lastNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.starToken)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.doubleAmpersandToken && lastButOneNode.type === JSONPathSyntaxTreeType.andExpression)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.doubleBarToken && lastButOneNode.type === JSONPathSyntaxTreeType.orExpression)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.exclamationMarkToken && lastButOneNode.type === JSONPathSyntaxTreeType.notExpression)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.nameSelector)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.stringToken && lastButOneNode.type === JSONPathSyntaxTreeType.nameSelector)
            return this.createTooltip(lastButOneNode);
        else if ((lastNode.type === JSONPathSyntaxTreeType.numberToken || lastNode.type === JSONPathSyntaxTreeType.colonToken) && lastButOneNode.type === JSONPathSyntaxTreeType.sliceSelector)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.numberToken && lastButOneNode.type === JSONPathSyntaxTreeType.indexSelector)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.dotToken && lastButOneNode.type === JSONPathSyntaxTreeType.segment)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.doubleDotToken && lastButOneNode.type === JSONPathSyntaxTreeType.segment)
            return this.createTooltip(lastButOneNode);
        else if ((
            lastNode.type === JSONPathSyntaxTreeType.lessThanToken ||
            lastNode.type === JSONPathSyntaxTreeType.lessThanEqualsToken ||
            lastNode.type === JSONPathSyntaxTreeType.greaterThanToken ||
            lastNode.type === JSONPathSyntaxTreeType.greaterThanEqualsToken ||
            lastNode.type === JSONPathSyntaxTreeType.doubleEqualsToken ||
            lastNode.type === JSONPathSyntaxTreeType.exclamationMarkEqualsToken
        ) && lastButOneNode.type === JSONPathSyntaxTreeType.comparisonExpression)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.stringToken && lastButOneNode.type === JSONPathSyntaxTreeType.stringLiteral)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.numberToken && lastButOneNode.type === JSONPathSyntaxTreeType.numberLiteral)
            return this.createTooltip(lastButOneNode);
        else if ((lastNode.type === JSONPathSyntaxTreeType.trueToken || lastNode.type === JSONPathSyntaxTreeType.falseToken) && lastButOneNode.type === JSONPathSyntaxTreeType.booleanLiteral)
            return this.createTooltip(lastButOneNode);
        else if (lastNode.type === JSONPathSyntaxTreeType.nullToken && lastButOneNode.type === JSONPathSyntaxTreeType.nullLiteral)
            return this.createTooltip(lastButOneNode);
        else
            return null;
    }

    private createTooltip(node: JSONPathSyntaxTree): Tooltip | null {
        const description = this.descriptionProvider.provideDescription(node);
        if (description === null)
            return null;
        return new Tooltip(description.toMarkdown(), node.textRangeWithoutSkipped);
    }
}

export class Tooltip {
    constructor(
        readonly text: string,
        readonly range: TextRange
    ) { }
}