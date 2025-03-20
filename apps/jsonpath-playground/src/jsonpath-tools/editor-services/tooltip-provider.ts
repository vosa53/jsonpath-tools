import { getJSONTypeName } from "../data-types/json-types";
import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";
import { DataType, DataTypeAnnotation } from "../data-types/data-types";
import { JSONPathOptions } from "../options";
import { JSONPath } from "../query/json-path";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text-range";
import { JSONPathJSONValue } from "../types";
import { AnalysisDescriptionProvider } from "./analysis-description-provider";
import { SyntaxDescriptionProvider } from "./syntax-description-provider";

export class TooltipProvider {
    private readonly syntaxDescriptionProvider: SyntaxDescriptionProvider;
    private readonly analysisDescriptionProvider: AnalysisDescriptionProvider;

    constructor(
        private readonly options: JSONPathOptions
    ) {
        this.syntaxDescriptionProvider = new SyntaxDescriptionProvider(options);
        this.analysisDescriptionProvider = new AnalysisDescriptionProvider();
    }

    provideTooltip(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType, position: number): Tooltip | null {
        const node = query.getAtPosition(position);
        if (node === null)
            return null;

        const lastNode = node;
        const lastButOneNode = node.parent!;
        if (lastNode.type === JSONPathSyntaxTreeType.questionMarkToken)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.dollarToken)
            return this.createTooltip(lastNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.atToken)
            return this.createTooltip(lastNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.starToken)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.doubleAmpersandToken && lastButOneNode.type === JSONPathSyntaxTreeType.andExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.doubleBarToken && lastButOneNode.type === JSONPathSyntaxTreeType.orExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.exclamationMarkToken && lastButOneNode.type === JSONPathSyntaxTreeType.notExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.nameSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.stringToken && lastButOneNode.type === JSONPathSyntaxTreeType.nameSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === JSONPathSyntaxTreeType.numberToken || lastNode.type === JSONPathSyntaxTreeType.colonToken) && lastButOneNode.type === JSONPathSyntaxTreeType.sliceSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.numberToken && lastButOneNode.type === JSONPathSyntaxTreeType.indexSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.dotToken && lastButOneNode.type === JSONPathSyntaxTreeType.segment)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.doubleDotToken && lastButOneNode.type === JSONPathSyntaxTreeType.segment)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((
            lastNode.type === JSONPathSyntaxTreeType.lessThanToken ||
            lastNode.type === JSONPathSyntaxTreeType.lessThanEqualsToken ||
            lastNode.type === JSONPathSyntaxTreeType.greaterThanToken ||
            lastNode.type === JSONPathSyntaxTreeType.greaterThanEqualsToken ||
            lastNode.type === JSONPathSyntaxTreeType.doubleEqualsToken ||
            lastNode.type === JSONPathSyntaxTreeType.exclamationMarkEqualsToken
        ) && lastButOneNode.type === JSONPathSyntaxTreeType.comparisonExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.stringToken && lastButOneNode.type === JSONPathSyntaxTreeType.stringLiteral)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.numberToken && lastButOneNode.type === JSONPathSyntaxTreeType.numberLiteral)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === JSONPathSyntaxTreeType.trueToken || lastNode.type === JSONPathSyntaxTreeType.falseToken) && lastButOneNode.type === JSONPathSyntaxTreeType.booleanLiteral)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === JSONPathSyntaxTreeType.nullToken && lastButOneNode.type === JSONPathSyntaxTreeType.nullLiteral)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else
            return null;
    }

    private createTooltip(node: JSONPathSyntaxTree, query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType): Tooltip | null {
        const description = this.syntaxDescriptionProvider.provideDescription(node);
        if (description === null)
            return null;

        let text = description.toMarkdown();
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        const type = typeAnalyzer.getType(node);

        const typeAnnotations = type.collectAnnotations();
        let typeName: string;
        if (queryArgument !== undefined) {
            const { typeNames, example } = this.findTypeNamesAndExample(node, query, queryArgument);
            typeName = Array.from(typeNames).join(" | ");
            if (example !== undefined)
                typeAnnotations.add(new DataTypeAnnotation("", "", false, false, false, undefined, [example]));
        }
        else {
            typeName = type.toString();
        }

        text += this.analysisDescriptionProvider.provideDescription(typeName, Array.from(typeAnnotations));

        return new Tooltip(text, node.textRangeWithoutSkipped);
    }

    private findTypeNamesAndExample(node: JSONPathSyntaxTree, query: JSONPath, queryArgument: JSONPathJSONValue): { typeNames: Set<string>, example: JSONPathJSONValue | undefined } {
        const typeNames = new Set<string>();
        let example: string | number | undefined = undefined;
        function processValue(value: JSONPathJSONValue) {
            if (example === undefined && (typeof value === "string" || typeof value === "number"))
                example = value;
            const typeName = getJSONTypeName(value);
            typeNames.add(typeName);
        }

        query.select({
            rootNode: queryArgument,
            options: this.options,
            queryInstrumentationCallback: (query, input, outputArray, outputStartIndex, outputLength) => {
                if (query.identifierToken !== node) return;
                processValue(input.value);
            },
            segmentInstrumentationCallback: (segment, input, outputArray, outputStartIndex, outputLength) => {
                if (segment !== node) return;
                for (let i = outputStartIndex; i < outputStartIndex + outputLength; i++) processValue(outputArray[i].value);
            },
            selectorInstrumentationCallback: (selector, input, outputArray, outputStartIndex, outputLength) => {
                if (selector !== node) return;
                for (let i = outputStartIndex; i < outputStartIndex + outputLength; i++) processValue(outputArray[i].value);
            }
        });
        return { typeNames, example };
    }
}

export class Tooltip {
    constructor(
        readonly text: string,
        readonly range: TextRange
    ) { }
}