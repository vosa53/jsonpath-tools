import { JSONPathOptions } from "../options";
import { JSONPathQueryContext } from "../query/evaluation";
import { JSONPath } from "../query/json-path";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue } from "../types";
import { DescriptionProvider } from "./description-provider";
import { LocatedNode } from "../query/located-node";
import { JsonSchema } from "./helpers/json-schema";
import { logPerformance } from "../utils";
import { TypeAnalyzer } from "./helpers/type-analyzer";
import { JSONPathQuery } from "../query/query";
import { TypeAnnotation, TypeUsageContext } from "./helpers/types";
import { schemaToTypeAnnotation } from "./helpers/type-schema-converter";

export class CompletionProvider {
    private readonly descriptionProvider: DescriptionProvider;

    constructor(
        private readonly options: JSONPathOptions
    ) {
        this.descriptionProvider = new DescriptionProvider(options);
    }

    provideCompletions(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentSchema: JsonSchema | undefined, position: number): CompletionItem[] {
        const completions: CompletionItem[] = [];
        const nodePaths = query.getTouchingAtPosition(position);
        for (const nodePath of nodePaths)
            this.provideCompletionsForNodePath(query, queryArgument, queryArgumentSchema, nodePath, completions);
        return completions;
    }

    private provideCompletionsForNodePath(query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentSchema: JsonSchema | undefined, nodePath: JSONPathSyntaxTree[], completions: CompletionItem[]) {
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
            this.completeSegment(completions, segment, query, queryArgument, queryArgumentSchema);
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

    private completeSegment(completions: CompletionItem[], segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue | undefined, queryArgumentSchema: JsonSchema | undefined) {
        if (queryArgument !== undefined)
            this.completeSegmentData(completions, segment, query, queryArgument, queryArgumentSchema);
        else if (queryArgumentSchema !== undefined)
            this.completeSegmentSchema(completions, segment, queryArgumentSchema);
    }

    private completeSegmentSchema(completions: CompletionItem[], segment: JSONPathSegment, queryArgumentSchema: JsonSchema) {
        const typeAnalyzer = new TypeAnalyzer(queryArgumentSchema.rootType);
        const query = segment.parent as JSONPathQuery;
        const segmentIndex = query.segments.indexOf(segment);
        const previous = segmentIndex === 0 ? query.identifierToken : query.segments[segmentIndex - 1];
        const previousType = typeAnalyzer.getType(previous);
        const pathsSegments = new Set<string | number>();
        previousType.collectKnownPathSegments(pathsSegments);
        for (const pathSegment of pathsSegments) {
            const pahtSegmentString = pathSegment.toString();
            const pathSegmentType = previousType.getTypeAtPathSegment(pathSegment, TypeUsageContext.query);
            const pathSegmentTypeString = pathSegmentType.toString();
            completions.push(new CompletionItem(CompletionItemType.name, pahtSegmentString, pathSegmentTypeString, () => {
                const annotations = new Set<TypeAnnotation>();
                pathSegmentType.collectAnnotations(annotations);
                return this.descriptionProvider.provideDescriptionForNameSelector(pahtSegmentString, pathSegmentTypeString, Array.from(annotations))
                    .toMarkdown();
            }));
        }
    }

    private completeSegmentData(completions: CompletionItem[], segment: JSONPathSegment, query: JSONPath, queryArgument: JSONPathJSONValue, queryArgumentSchema: JsonSchema | undefined) {
        const schemaCache = new Map<LocatedNode, JsonSchema | null>();
        const nodes = this.getAllNodesAtSegment(queryArgument, query, segment);
        const keysAndTypes = this.getDistinctKeysAndTypes(nodes);
        for (const [key, types] of keysAndTypes) {
            const typeText = Array.from(types).join(" | ");
            completions.push(new CompletionItem(CompletionItemType.name, key, typeText, () => {
                const schemas = logPerformance("Calculate schemas", () => this.getSchemas(nodes, key, schemaCache, queryArgumentSchema));
                
                const annotations: TypeAnnotation[] = [];
                for (const schema of schemas) {
                    const annotation = schemaToTypeAnnotation(schema);
                    if (annotation !== null)
                        annotations.push(annotation);
                }
                if (types.has("string") || types.has("number")) {
                    const example = this.getExample(nodes, key);
                    if (example !== undefined) {
                        const exampleAnnotation = new TypeAnnotation("", "", false, false, false, undefined, [example]);
                        annotations.push(exampleAnnotation);
                    }
                }

                return this.descriptionProvider.provideDescriptionForNameSelector(key, typeText, annotations).toMarkdown();
            }));
        }
    }

    private getExample(nodes: LocatedNode[], property: string): JSONPathJSONValue | undefined {
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

    private getSchemas(nodes: LocatedNode[], property: string, schemaCache: Map<LocatedNode, JsonSchema | null>, queryArgumentSchema: JsonSchema | undefined): JSONPathJSONValue[] {
        const schemas = new Set<JSONPathJSONValue>();
        for (const node of nodes) {
            const schema = this.getSchema(node, schemaCache, queryArgumentSchema);
            if (schema !== null) {
                const propertySchema = schema.step(property, node.value);
                const obj = propertySchema!.schema;
                schemas.add(obj);
            }
        }
        return [...schemas];
    }

    private getSchema(node: LocatedNode, schemaCache: Map<LocatedNode, JsonSchema | null>, queryArgumentSchema: JsonSchema | undefined): JsonSchema | null {
        const fromCache = schemaCache.get(node);
        if (fromCache !== undefined)
            return fromCache;

        let schema: JsonSchema | null;
        if (node.parent === null)
            schema = queryArgumentSchema === undefined ? null : queryArgumentSchema;
        else {
            const parentSchema = this.getSchema(node.parent, schemaCache, queryArgumentSchema);
            schema = parentSchema === null ? null : parentSchema.step(node.pathSegment, node.parent.value);
        }
        schemaCache.set(node, schema);
        return schema;
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

    private getDistinctKeysAndTypes(nodes: LocatedNode[]): Map<string, Set<string>> {
        const keysAndTypes = new Map<string, Set<string>>();
        for (const node of nodes) {
            const value = node.value;
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
