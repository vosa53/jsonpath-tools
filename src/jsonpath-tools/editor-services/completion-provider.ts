import { defaultJSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPath } from "../query/json-path";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue } from "../types";

export class CompletionProvider {
    static provideCompletions(jsonPath: JSONPath, position: number, value: JSONPathJSONValue): CompletionItem[] {
        if (position === 0) return [];
        const nodePath = jsonPath.getAtPosition(position - 1);
        if (nodePath.length === 0)
            return [];

        if (nodePath.length >= 2 && (nodePath[nodePath.length - 1].type === JSONPathSyntaxTreeType.nameToken || nodePath[nodePath.length - 1].type === JSONPathSyntaxTreeType.dotToken || nodePath[nodePath.length - 1].type === JSONPathSyntaxTreeType.doubleDotToken) && nodePath[nodePath.length - 2].type === JSONPathSyntaxTreeType.nameSelector) {
            const segment = nodePath[nodePath.length - 3] as JSONPathSegment;
            const values = getAllValuesAtSegment(value, jsonPath, segment);
            const propertyNames = getAllPropertyNames(values);
            return propertyNames.map(pn => new CompletionItem(pn, CompletionItemType.property));
        }
        return [];
    }
}

export class CompletionItem {
    constructor(
        readonly text: string,
        readonly type: CompletionItemType 
    ) { }
}

export enum CompletionItemType {
    property
}

function getAllPropertyNames(values: JSONPathJSONValue[]): string[] {
    const propertyNames = new Set<string>();
    for (const value of values) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            for (const propertyName of Object.keys(value))
                propertyNames.add(propertyName);
        }
    }
    return Array.from(propertyNames);
}

function getAllValuesAtSegment(value: JSONPathJSONValue, jsonPath: JSONPath, segment: JSONPathSegment): JSONPathJSONValue[] {
    const values: JSONPathJSONValue[] = [];
    const queryContext: JSONPathQueryContext = { rootNode: value, options: defaultJSONPathOptions, segmentInstrumentationCallback(s, i) {
        if (s === segment)
            values.push(i);
    }, };
    jsonPath.select(queryContext);
    return values;
}