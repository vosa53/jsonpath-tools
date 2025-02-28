import { JSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPath } from "../query/json-path";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue } from "../types";

export class CompletionProvider {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

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
            const values = this.getAllValuesAtSegment(queryArgument, query, segment);
            const propertyNames = this.getDistinctKeys(values);
            for (const propertyName of propertyNames)
                completions.push(new CompletionItem(propertyName, CompletionItemType.name));
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingSelector) {
            const segment = nodePath[nodePath.length - 3] as JSONPathSegment;
            completions.push(new CompletionItem("*", CompletionItemType.syntax));
            if (segment.openingBracketToken !== null) {
                completions.push(new CompletionItem("?", CompletionItemType.syntax));
                completions.push(new CompletionItem("::", CompletionItemType.syntax));
            }
        }
        if (lastButOneNode.type === JSONPathSyntaxTreeType.missingExpression) {
            completions.push(new CompletionItem("@", CompletionItemType.syntax));
            completions.push(new CompletionItem("$", CompletionItemType.syntax));
            for (const functionDefinition of Object.entries(this.options.functions))
                completions.push(new CompletionItem(functionDefinition[0], CompletionItemType.function));
        }
        if (lastNode.type === JSONPathSyntaxTreeType.nameToken && lastButOneNode.type === JSONPathSyntaxTreeType.functionExpression) {
            for (const functionDefinition of Object.entries(this.options.functions))
                completions.push(new CompletionItem(functionDefinition[0], CompletionItemType.function));
        }
    }

    private getDistinctKeys(values: JSONPathJSONValue[]): string[] {
        const propertyNames = new Set<string>();
        for (const value of values) {
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                for (const propertyName of Object.keys(value))
                    propertyNames.add(propertyName);
            }
        }
        return Array.from(propertyNames);
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
}

export class CompletionItem {
    constructor(
        readonly text: string,
        readonly type: CompletionItemType
    ) { }
}

export enum CompletionItemType {
    name,
    literal,
    function,
    syntax
}
