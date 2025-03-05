import { JSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPath } from "../query/json-path";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue } from "../types";
import { DescriptionProvider } from "./description-provider";

export class CompletionProvider {
    private readonly descriptionProvider: DescriptionProvider;

    constructor(
        private readonly options: JSONPathOptions
    ) {
        this.descriptionProvider = new DescriptionProvider(options);
    }

    provideCompletions(query: JSONPath, queryArgument: JSONPathJSONValue, position: number): CompletionItem[] {
        const completions: CompletionItem[] = [];
        const nodePaths = query.getTouchingAtPosition(position);
        for (const nodePath of nodePaths)
            this.provideCompletionsForNodePath(query, queryArgument, nodePath, completions);
        return completions;
    }

    private provideCompletionsForNodePath(query: JSONPath, queryArgument: JSONPathJSONValue, nodePath: JSONPathSyntaxTree[], completions: CompletionItem[]) {
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
            this.completeSegment(completions, segment, query, queryArgument);
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingSelector) {
            const segment = nodePath[nodePath.length - 3] as JSONPathSegment;
            completions.push(new CompletionItem(CompletionItemType.syntax, "*", undefined, () => this.descriptionProvider.provideDescriptionForWildcardSelector().toMarkdown()));
            if (segment.openingBracketToken !== null) {
                completions.push(new CompletionItem(CompletionItemType.syntax, "?", undefined, () => this.descriptionProvider.provideDescriptionForFilterSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "::", undefined, () => this.descriptionProvider.provideDescriptionForSliceSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "${start}:${end}:${step}", undefined, () => this.descriptionProvider.provideDescriptionForSliceSelector().toMarkdown(), true));
            }
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingExpression) {
            completions.push(new CompletionItem(CompletionItemType.syntax, "@", undefined, () => this.descriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "$", undefined, () => this.descriptionProvider.provideDescriptionForDollarToken().toMarkdown()));
            this.completeFunctions(completions);
        }
        if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression)
            this.completeFunctions(completions);
    }

    private completeSegment(completions: CompletionItem[], segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue) {
        const values = this.getAllValuesAtSegment(queryArgument, query, segment);
        const keysAndTypes = this.getDistinctKeysAndTypes(values);
        for (const [key, types] of keysAndTypes)
            completions.push(new CompletionItem(CompletionItemType.name, key, Array.from(types).join(" | ")));
    }

    private completeFunctions(completions: CompletionItem[]) {
        for (const functionDefinition of Object.entries(this.options.functions)) {
            completions.push(new CompletionItem(
                CompletionItemType.function, 
                functionDefinition[0], 
                functionDefinition[1].returnType,
                () => this.descriptionProvider.provideDescriptionForFunction(functionDefinition[0], functionDefinition[1]).toMarkdown()
            ));
        }
    }

    private getDistinctKeysAndTypes(values: JSONPathJSONValue[]): Map<string, Set<string>> {
        const keysAndTypes = new Map<string, Set<string>>();
        for (const value of values) {
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                for (const [propertyName, propertyValue] of Object.entries(value)) {
                    const type = this.getType(propertyValue);
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

    private getAllValuesAtSegment(value: JSONPathJSONValue, jsonPath: JSONPath, segment: JSONPathSegment): JSONPathJSONValue[] {
        const values: JSONPathJSONValue[] = [];
        const queryContext: JSONPathQueryContext = {
            rootNode: value,
            options: this.options,
            segmentInstrumentationCallback(s, i) {
                if (s === segment)
                    values.push(i.value);
            }
        };
        jsonPath.select(queryContext);
        return values;
    }

    private getType(value: JSONPathJSONValue): string {
        const javaScriptType = typeof value;
        if (javaScriptType == "object") {
            if (value === null)
                return "null";
            else if (Array.isArray(value))
                return "array";
            else
                return "object";
        }
        else
            return javaScriptType;
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
