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
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue, JSONPathValueType } from "../types";
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

        if (
            (
                lastNode.type === JSONPathSyntaxTreeType.nameToken ||
                lastNode.type === JSONPathSyntaxTreeType.dotToken ||
                lastNode.type === JSONPathSyntaxTreeType.doubleDotToken
            ) &&
            lastButOneNode.type === JSONPathSyntaxTreeType.nameSelector ||
            lastButOneNode.type === JSONPathSyntaxTreeType.missingSelector
        ) {
            const segment = lastButOneNode.parent as JSONPathSegment;
            this.completeSegment(completions, segment, query, queryArgument, queryArgumentType);
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingSelector) {
            const segment = lastButOneNode.parent as JSONPathSegment;
            completions.push(new CompletionItem(CompletionItemType.syntax, "*", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForWildcardSelector().toMarkdown()));
            if (segment.openingBracketToken !== null) {
                completions.push(new CompletionItem(CompletionItemType.syntax, "?", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForFilterSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "::", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForSliceSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "${start}:${end}:${step}", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForSliceSelector().toMarkdown(), true));
            }
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingExpression) {
            completions.push(new CompletionItem(CompletionItemType.syntax, "@", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "$", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForDollarToken().toMarkdown()));
            this.completeFunctions(completions);
            if (lastButOneNode.parent instanceof JSONPathComparisonExpression) {
                const referenceExpression = lastButOneNode.parent.left === lastButOneNode
                    ? lastButOneNode.parent.right
                    : lastButOneNode.parent.left;
                this.completeValues(completions, referenceExpression, query, queryArgument, queryArgumentType);
            }
        }
        if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression)
            this.completeFunctions(completions);
    }

    private completeSegment(completions: CompletionItem[], segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType) {
        if (queryArgument !== undefined)
            this.completeSegmentData(completions, segment, query, queryArgument, queryArgumentType);
        else
            this.completeSegmentType(completions, segment, queryArgumentType);
    }

    private completeSegmentType(completions: CompletionItem[], segment: JSONPathSegment, queryArgumentType: DataType) {
        const previousType = this.getIncomingType(segment, queryArgumentType);
        const pathsSegments = previousType.collectKnownPathSegments();
        for (const pathSegment of pathsSegments) {
            const pahtSegmentString = pathSegment.toString();
            const pathSegmentType = previousType.getTypeAtPathSegment(pathSegment);
            const pathSegmentTypeStringSimplified = pathSegmentType.toString(true);
            completions.push(new CompletionItem(CompletionItemType.name, pahtSegmentString, pathSegmentTypeStringSimplified, () => {
                const pathSegmentTypeString = pathSegmentType.toString(false, true);
                const annotations = pathSegmentType.collectAnnotations();
                return this.syntaxDescriptionProvider.provideDescriptionForNameSelector(pahtSegmentString).toMarkdown() +
                    this.analysisDescriptionProvider.provideDescription(pathSegmentTypeString, Array.from(annotations));
            }));
        }
    }

    private completeSegmentData(completions: CompletionItem[], segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue, queryArgumentType: DataType) {
        let previousType: DataType;
        const nodes = this.getAllNodesOutputtedFromSegment(queryArgument, query, segment);
        const keysAndTypes = this.getDistinctKeysAndTypes(nodes);
        for (const [key, types] of keysAndTypes) {
            const typeText = Array.from(types).join(" | ");
            completions.push(new CompletionItem(CompletionItemType.name, key, typeText, () => {
                previousType ??= this.getIncomingType(segment, queryArgumentType);
                const annotations = previousType.getTypeAtPathSegment(key).collectAnnotations();
                if (types.has("string") || types.has("number")) {
                    const example = this.getStringOrNumberExample(nodes, key);
                    if (example !== undefined) {
                        const exampleAnnotation = new DataTypeAnnotation("", "", false, false, false, undefined, [example]);
                        annotations.add(exampleAnnotation);
                    }
                }

                return this.syntaxDescriptionProvider.provideDescriptionForNameSelector(key).toMarkdown() +
                    this.analysisDescriptionProvider.provideDescription(typeText, Array.from(annotations));
            }));
        }
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

    private completeFunctions(completions: CompletionItem[]) {
        for (const functionDefinition of Object.entries(this.options.functions)) {
            completions.push(new CompletionItem(
                CompletionItemType.function,
                functionDefinition[0],
                functionDefinition[1].returnType,
                () => this.syntaxDescriptionProvider.provideDescriptionForFunctionExpression(functionDefinition[0], functionDefinition[1]).toMarkdown()
            ));
        }
    }

    private completeValues(completions: CompletionItem[], reference: JSONPathFilterExpression, query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType) {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);

        const literals = queryArgument !== undefined
            ? this.getAllLiteralsOutputtedFromExpression(queryArgument, query, reference)
            : typeAnalyzer.getType(reference).collectKnownLiterals();
        for (const literal of literals) {
            completions.push(new CompletionItem(
                CompletionItemType.literal,
                JSON.stringify(literal),
                undefined,
                () => {
                    let description;
                    if (typeof literal === "string")
                        description = this.syntaxDescriptionProvider.provideDescriptionForStringLiteralExpression(literal);
                    else if (typeof literal === "number")
                        description = this.syntaxDescriptionProvider.provideDescriptionForNumberLiteralExpression(literal);
                    else if (typeof literal === "boolean")
                        description = this.syntaxDescriptionProvider.provideDescriptionForBooleanLiteralExpression(literal);
                    else if (literal === null)
                        description = this.syntaxDescriptionProvider.provideDescriptionForNullLiteralExpression();
                    else
                        throw new Error("Unsupported literal type.");
                    return description.toMarkdown();
                }
            ));
        }
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
}

export class CompletionItem {
    constructor(
        readonly type: CompletionItemType,
        readonly text: string,
        readonly detail?: string,
        readonly resolveDescription?: () => string,
        readonly isSnippet: boolean = false
    ) { }
}

export enum CompletionItemType {
    name,
    literal,
    function,
    syntax
}
