import { getJSONType } from "../json/json-types";
import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";
import { DataType, DataTypeAnnotation } from "../data-types/data-types";
import { QueryOptions } from "../options";
import { Query } from "../query/query";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text/text-range";
import { JSONValue } from "../json/json-types";
import { AnalysisDescriptionService } from "./analysis-description-service";
import { SyntaxDescriptionService } from "./syntax-description-service";

export class TooltipService {
    private readonly syntaxDescriptionProvider: SyntaxDescriptionService;
    private readonly analysisDescriptionProvider: AnalysisDescriptionService;

    constructor(
        private readonly options: QueryOptions
    ) {
        this.syntaxDescriptionProvider = new SyntaxDescriptionService(options);
        this.analysisDescriptionProvider = new AnalysisDescriptionService();
    }

    provideTooltip(query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType, position: number): Tooltip | null {
        const node = query.getAtPosition(position);
        if (node === null)
            return null;

        const lastNode = node;
        const lastButOneNode = node.parent!;
        if ((lastNode.type === SyntaxTreeType.dotToken || lastNode.type === SyntaxTreeType.doubleDotToken) && lastButOneNode.type === SyntaxTreeType.segment)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === SyntaxTreeType.openingBracketToken || lastNode.type === SyntaxTreeType.closingBracketToken) && lastButOneNode.type === SyntaxTreeType.segment)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.questionMarkToken)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.starToken)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === SyntaxTreeType.nameToken || lastNode.type === SyntaxTreeType.stringToken) && lastButOneNode.type === SyntaxTreeType.nameSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === SyntaxTreeType.numberToken || lastNode.type === SyntaxTreeType.colonToken) && lastButOneNode.type === SyntaxTreeType.sliceSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.numberToken && lastButOneNode.type === SyntaxTreeType.indexSelector)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.nameToken && lastButOneNode.type === SyntaxTreeType.functionExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.doubleAmpersandToken && lastButOneNode.type === SyntaxTreeType.andExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.doubleBarToken && lastButOneNode.type === SyntaxTreeType.orExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.exclamationMarkToken && lastButOneNode.type === SyntaxTreeType.notExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === SyntaxTreeType.openingParanthesisToken || lastNode.type === SyntaxTreeType.closingParanthesisToken) && lastButOneNode.type === SyntaxTreeType.paranthesisExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((
            lastNode.type === SyntaxTreeType.lessThanToken ||
            lastNode.type === SyntaxTreeType.lessThanEqualsToken ||
            lastNode.type === SyntaxTreeType.greaterThanToken ||
            lastNode.type === SyntaxTreeType.greaterThanEqualsToken ||
            lastNode.type === SyntaxTreeType.doubleEqualsToken ||
            lastNode.type === SyntaxTreeType.exclamationMarkEqualsToken
        ) && lastButOneNode.type === SyntaxTreeType.comparisonExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.stringToken && lastButOneNode.type === SyntaxTreeType.stringLiteralExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.numberToken && lastButOneNode.type === SyntaxTreeType.numberLiteralExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if ((lastNode.type === SyntaxTreeType.trueToken || lastNode.type === SyntaxTreeType.falseToken) && lastButOneNode.type === SyntaxTreeType.booleanLiteralExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.nullToken && lastButOneNode.type === SyntaxTreeType.nullLiteralExpression)
            return this.createTooltip(lastButOneNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.dollarToken)
            return this.createTooltip(lastNode, query, queryArgument, queryArgumentType);
        else if (lastNode.type === SyntaxTreeType.atToken)
            return this.createTooltip(lastNode, query, queryArgument, queryArgumentType);
        else
            return null;
    }

    private createTooltip(node: SyntaxTree, query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType): Tooltip | null {
        const description = this.syntaxDescriptionProvider.provideDescription(node);
        if (description === null)
            return null;

        let text = description.toMarkdown();
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        const type = typeAnalyzer.getType(node);

        const typeAnnotations = type.collectAnnotations();
        let typeName: string | undefined;
        if (queryArgument !== undefined) {
            const { typeNames, example } = this.findTypeNamesAndExample(node, query, queryArgument);
            typeName = typeNames.size === 0 ? undefined : Array.from(typeNames).join(" | ");
            if (example !== undefined)
                typeAnnotations.add(new DataTypeAnnotation("", "", false, false, false, undefined, [example]));
        }
        else
            typeName = type.toString(false, true);

        text += this.analysisDescriptionProvider.provideDescription(typeName, Array.from(typeAnnotations));

        return new Tooltip(text, node.textRangeWithoutSkipped);
    }

    private findTypeNamesAndExample(node: SyntaxTree, query: Query, queryArgument: JSONValue): { typeNames: Set<string>, example: JSONValue | undefined } {
        const typeNames = new Set<string>();
        let example: string | number | undefined = undefined;
        function processValue(value: JSONValue) {
            if (example === undefined && (typeof value === "string" || typeof value === "number"))
                example = value;
            const typeName = getJSONType(value);
            typeNames.add(typeName);
        }

        query.select({
            argument: queryArgument,
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