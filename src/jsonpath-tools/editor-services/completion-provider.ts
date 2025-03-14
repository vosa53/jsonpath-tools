import { getJSONTypeName } from "../data-types/json-types";
import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";
import { DataType, DataTypeAnnotation } from "../data-types/data-types";
import { JSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPath } from "../query/json-path";
import { LocatedNode } from "../query/located-node";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue } from "../types";
import { AnalysisDescriptionProvider } from "./analysis-description-provider";
import { SyntaxDescriptionProvider } from "./syntax-description-provider";

export class CompletionProvider {
    private readonly syntaxDescriptionProvider: SyntaxDescriptionProvider;
    private readonly analysisDescriptionProvider: AnalysisDescriptionProvider;

    constructor(
        private readonly options: JSONPathOptions
    ) {
        this.syntaxDescriptionProvider = new SyntaxDescriptionProvider(options);
        this.analysisDescriptionProvider = new AnalysisDescriptionProvider();
    }

    provideCompletions(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType, position: number): CompletionItem[] {
        const completions: CompletionItem[] = [];
        const nodePaths = query.getTouchingAtPosition(position);
        for (const nodePath of nodePaths)
            this.provideCompletionsForNodePath(query, queryArgument, queryArgumentType, nodePath, completions);
        return completions;
    }

    private provideCompletionsForNodePath(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentType: DataType, nodePath: JSONPathSyntaxTree[], completions: CompletionItem[]) {
        const lastNode = nodePath[nodePath.length - 1];
        const lastButOneNode = nodePath[nodePath.length - 2];

        if (
            (
                lastNode.type === JSONPathSyntaxTreeType.nameToken ||
                lastNode.type === JSONPathSyntaxTreeType.dotToken ||
                lastNode.type === JSONPathSyntaxTreeType.doubleDotToken
            ) &&
            lastButOneNode.type === JSONPathSyntaxTreeType.nameSelector ||
            lastButOneNode.type === JSONPathSyntaxTreeType.missingSelector
        ) {
            const segment = nodePath[nodePath.length - 3] as JSONPathSegment;
            this.completeSegment(completions, segment, query, queryArgument, queryArgumentType);
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingSelector) {
            const segment = nodePath[nodePath.length - 3] as JSONPathSegment;
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
            const pathSegmentTypeString = pathSegmentType.toString();
            completions.push(new CompletionItem(CompletionItemType.name, pahtSegmentString, pathSegmentTypeString, () => {
                const annotations = pathSegmentType.collectAnnotations();
                return this.syntaxDescriptionProvider.provideDescriptionForNameSelector(pahtSegmentString).toMarkdown() +
                    this.analysisDescriptionProvider.provideDescription(pathSegmentTypeString, Array.from(annotations));
            }));
        }
    }

    private completeSegmentData(completions: CompletionItem[], segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue, queryArgumentType: DataType) {
        let previousType: DataType;
        const nodes = this.getAllNodesAtSegment(queryArgument, query, segment);
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
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType);
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
                () => this.syntaxDescriptionProvider.provideDescriptionForFunction(functionDefinition[0], functionDefinition[1]).toMarkdown()
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

    private getAllNodesAtSegment(value: JSONPathJSONValue, jsonPath: JSONPath, segment: JSONPathSegment): LocatedNode[] {
        const values: LocatedNode[] = [];
        const queryContext: JSONPathQueryContext = {
            rootNode: value,
            options: this.options,
            segmentInstrumentationCallback(s, i) {
                if (s === segment)
                    values.push(i);
            }
        };
        jsonPath.select(queryContext);
        return values;
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
