import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";
import { DataType, DataTypeAnnotation } from "../data-types/data-types";
import { getJSONTypeName } from "../data-types/json-types";
import { JSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPathComparisonExpression } from "../query/filter-expression/comparison-expression";
import { JSONPathFilterExpression } from "../query/filter-expression/filter-expression";
import { convertToValueType } from "../query/helpers";
import { JSONPath } from "../query/json-path";
import { LocatedNode } from "../query/located-node";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSelector } from "../query/selectors/selector";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { serializeJSONPathLiteral, serializeJSONPathString } from "../serialization";
import { JSONPathCharacters } from "../syntax-analysis/parser";
import { TextRange } from "../text-range";
import { JSONPathJSONValue } from "../types";
import { AnalysisDescriptionService } from "./analysis-description-service";
import { SyntaxDescriptionService } from "./syntax-description-service";

export class CompletionProvider {
    private readonly syntaxDescriptionProvider: SyntaxDescriptionService;
    private readonly analysisDescriptionProvider: AnalysisDescriptionService;

    constructor(
        private readonly options: JSONPathOptions
    ) {
        this.syntaxDescriptionProvider = new SyntaxDescriptionService(options);
        this.analysisDescriptionProvider = new AnalysisDescriptionService();
    }

    provideCompletions(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType, position: number): CompletionItem[] {
        const completions: CompletionItem[] = [];
        const touchingNodes = query.getTouchingAtPosition(position);
        for (const node of touchingNodes)
            this.provideCompletionsForNode(query, queryArgument, queryArgumentType, node, completions);
        return completions;
    }

    private provideCompletionsForNode(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType, node: JSONPathSyntaxTree, completions: CompletionItem[]) {
        const lastNode = node;
        const lastButOneNode = node.parent!;

        if (lastButOneNode instanceof JSONPathSelector) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            const segment = lastButOneNode.parent as JSONPathSegment;
            this.completeSelector(completions, lastButOneNode, segment, query, queryArgument, queryArgumentType);
            completions.push(new CompletionItem(CompletionItemType.syntax, "*", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForWildcardSelector().toMarkdown()));
            if (segment.usesBracketNotation) {
                completions.push(new CompletionItem(CompletionItemType.syntax, "?", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForFilterSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "::", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForSliceSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "${start}:${end}:${step}", range, "start:end:step", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForSliceSelector().toMarkdown(), CompletionItemTextType.snippet));
            }
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingExpression) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            completions.push(new CompletionItem(CompletionItemType.syntax, "@", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "$", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForDollarToken().toMarkdown()));
        }
        if (
            lastButOneNode.type === JSONPathSyntaxTreeType.missingExpression ||
            lastButOneNode.type === JSONPathSyntaxTreeType.stringLiteral ||
            lastButOneNode.type === JSONPathSyntaxTreeType.numberLiteral ||
            lastButOneNode.type === JSONPathSyntaxTreeType.booleanLiteral ||
            lastButOneNode.type === JSONPathSyntaxTreeType.nullLiteral
        ) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            if (lastButOneNode.parent instanceof JSONPathComparisonExpression) {
                const referenceExpression = lastButOneNode.parent.left === lastButOneNode
                    ? lastButOneNode.parent.right
                    : lastButOneNode.parent.left;
                this.completeValues(completions, range, referenceExpression, query, queryArgument, queryArgumentType);
            }
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingExpression ||
            lastNode.type === JSONPathSyntaxTreeType.nameToken && (
                lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression ||
                lastButOneNode.type === JSONPathSyntaxTreeType.booleanLiteral ||
                lastButOneNode.type === JSONPathSyntaxTreeType.nullLiteral
            )) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            this.completeFunctions(completions, lastNode.textRangeWithoutSkipped);
            completions.push(new CompletionItem(CompletionItemType.syntax, "true", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "false", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "null", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
        }
    }

    private completeSelector(completions: CompletionItem[], selector: JSONPathSelector, segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType) {
        if (queryArgument !== undefined)
            this.completeSelectorData(completions, selector, segment, query, queryArgument, queryArgumentType);
        else
            this.completeSelectorType(completions, selector, segment, queryArgumentType);
    }

    private completeSelectorType(completions: CompletionItem[], selector: JSONPathSelector, segment: JSONPathSegment, queryArgumentType: DataType) {
        const previousType = this.getIncomingType(segment, queryArgumentType);
        const pathsSegments = previousType.collectKnownPathSegments();
        for (const pathSegment of pathsSegments) {
            const pathSegmentType = previousType.getTypeAtPathSegment(pathSegment);
            const pathSegmentTypeStringSimplified = pathSegmentType.toString(true);
            completions.push(this.createSelectorCompletionItem(selector, segment, pathSegment, pathSegmentTypeStringSimplified, () => {
                const pathSegmentTypeString = pathSegmentType.toString(false, true);
                const annotations = pathSegmentType.collectAnnotations();
                return this.createSelectorCompletionItemDescription(pathSegment, pathSegmentTypeString, Array.from(annotations));
            }));
        }
    }

    private completeSelectorData(completions: CompletionItem[], selector: JSONPathSelector, segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue, queryArgumentType: DataType) {
        let previousType: DataType;
        const nodes = this.getAllNodesOutputtedFromSegment(queryArgument, query, segment);
        const keysAndTypes = this.getDistinctKeysAndTypes(nodes);
        for (const [key, types] of keysAndTypes) {
            const typeText = Array.from(types).join(" | ");
            completions.push(this.createSelectorCompletionItem(selector, segment, key, typeText, () => {
                previousType ??= this.getIncomingType(segment, queryArgumentType);
                const annotations = previousType.getTypeAtPathSegment(key).collectAnnotations();
                if (types.has("string") || types.has("number")) {
                    const example = this.getStringOrNumberExample(nodes, key);
                    if (example !== undefined) {
                        const exampleAnnotation = new DataTypeAnnotation("", "", false, false, false, undefined, [example]);
                        annotations.add(exampleAnnotation);
                    }
                }

                return this.createSelectorCompletionItemDescription(key, typeText, Array.from(annotations));
            }));
        }
    }

    private completeFunctions(completions: CompletionItem[], range: TextRange) {
        for (const functionDefinition of Object.entries(this.options.functions)) {
            completions.push(new CompletionItem(
                CompletionItemType.function,
                functionDefinition[0],
                range,
                undefined,
                functionDefinition[1].returnType,
                () => this.syntaxDescriptionProvider.provideDescriptionForFunctionExpression(functionDefinition[0], functionDefinition[1]).toMarkdown()
            ));
        }
    }

    private completeValues(completions: CompletionItem[], range: TextRange, reference: JSONPathFilterExpression, query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType) {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);

        const literals = queryArgument !== undefined
            ? this.getAllLiteralsOutputtedFromExpression(queryArgument, query, reference)
            : typeAnalyzer.getType(reference).collectKnownLiterals();
        for (const literal of literals) {
            const literalType = typeof literal;
            completions.push(new CompletionItem(
                CompletionItemType.literal,
                serializeJSONPathLiteral(literal),
                range,
                undefined,
                literalType,
                () => {
                    let description;
                    if (literalType === "string")
                        description = this.syntaxDescriptionProvider.provideDescriptionForStringLiteralExpression(literal as string);
                    else if (literalType === "number")
                        description = this.syntaxDescriptionProvider.provideDescriptionForNumberLiteralExpression(literal as number);
                    else if (literalType === "boolean")
                        description = this.syntaxDescriptionProvider.provideDescriptionForBooleanLiteralExpression(literal as boolean);
                    else if (literal === null)
                        description = this.syntaxDescriptionProvider.provideDescriptionForNullLiteralExpression();
                    else
                        throw new Error("Unsupported literal type.");
                    return description.toMarkdown();
                }
            ));
        }
    }

    private createSelectorCompletionItem(selector: JSONPathSelector, segment: JSONPathSegment, pathSegment: string | number, typeText: string, resolveDescription: () => string): CompletionItem {
        const isValidName = typeof pathSegment === "string" && this.isValidName(pathSegment);
        const useBracketNotation = !isValidName || segment.usesBracketNotation;
        const willUseBracketNotation = useBracketNotation && !segment.usesBracketNotation;
        const range = willUseBracketNotation && !segment.isDescendant
            ? segment.textRangeWithoutSkipped
            : selector.textRangeWithoutSkipped;
        let text = typeof pathSegment === "number"
            ? pathSegment.toString()
            : (
                useBracketNotation ? serializeJSONPathString(pathSegment) : pathSegment
            );
        if (willUseBracketNotation)
            text = `[${text}]`;
        const label = !segment.usesBracketNotation && typeof pathSegment === "string" ? pathSegment : text;
        return new CompletionItem(CompletionItemType.name, text, range, label, typeText, resolveDescription);
    }

    private createSelectorCompletionItemDescription(pathSegment: string | number, type: string, annotations: DataTypeAnnotation[]): string {
        const syntaxDescription = typeof pathSegment === "string"
            ? this.syntaxDescriptionProvider.provideDescriptionForNameSelector(pathSegment)
            : this.syntaxDescriptionProvider.provideDescriptionForIndexSelector(pathSegment);
        return syntaxDescription.toMarkdown() + this.analysisDescriptionProvider.provideDescription(type, annotations);
    }

    private getIncomingType(segment: JSONPathSegment, queryArgumentType: DataType): DataType {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        return typeAnalyzer.getIncomingTypeToSegment(segment);
    }

    private getStringOrNumberExample(nodes: LocatedNode[], property: string): JSONPathJSONValue | undefined {
        for (const node of nodes) {
            const value = node.value;
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                const propertyValue = value[property];
                const propertyType = typeof propertyValue;
                if (propertyType === "number" || propertyType === "string")
                    return propertyValue;
            }
        }
        return undefined;
    }

    private getDistinctKeysAndTypes(nodes: LocatedNode[]): Map<string, Set<string>> {
        const keysAndTypes = new Map<string, Set<string>>();
        for (const node of nodes) {
            const value = node.value;
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                for (const [propertyName, propertyValue] of Object.entries(value)) {
                    const type = getJSONTypeName(propertyValue);
                    let types = keysAndTypes.get(propertyName);
                    if (types === undefined) {
                        types = new Set();
                        keysAndTypes.set(propertyName, types);
                    }
                    types.add(type)
                }
            }
        }
        return keysAndTypes;
    }

    private getAllNodesOutputtedFromSegment(queryArgument: JSONPathJSONValue, jsonPath: JSONPath, segment: JSONPathSegment): LocatedNode[] {
        const values: LocatedNode[] = [];
        const queryContext: JSONPathQueryContext = {
            rootNode: queryArgument,
            options: this.options,
            segmentInstrumentationCallback(s, i) {
                if (s === segment)
                    values.push(i);
            }
        };
        jsonPath.select(queryContext);
        return values;
    }

    private getAllLiteralsOutputtedFromExpression(queryArgument: JSONPathJSONValue, jsonPath: JSONPath, expression: JSONPathFilterExpression): Set<string | number | boolean | null> {
        const literals = new Set<string | number | boolean | null>();
        const queryContext: JSONPathQueryContext = {
            rootNode: queryArgument,
            options: this.options,
            filterExpressionInstrumentationCallback(fe, o) {
                if (fe === expression) {
                    const value = convertToValueType(o);
                    const type = typeof value;
                    if (type === "string" || type === "number" || type === "boolean" || value === null)
                        literals.add(value as string | number | boolean | null);
                }
            }
        };
        jsonPath.select(queryContext);
        return literals;
    }

    private isValidName(text: string): boolean {
        if (text.length === 0)
            return false;
        if (!JSONPathCharacters.isNameFirst(text[0]))
            return false;
        for (let i = 1; i < text.length; i++) {
            if (!JSONPathCharacters.isName(text[i]))
                return false;
        }
        return true;
    }
}

export class CompletionItem {
    constructor(
        readonly type: CompletionItemType,
        readonly text: string,
        readonly range: TextRange,
        readonly label: string = text,
        readonly detail?: string,
        readonly resolveDescription?: () => string,
        readonly textType: CompletionItemTextType = CompletionItemTextType.plain
    ) { }
}

export enum CompletionItemType {
    name,
    literal,
    function,
    syntax
}

export enum CompletionItemTextType {
    plain,
    snippet
}