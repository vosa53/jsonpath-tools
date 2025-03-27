import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";
import { DataType, DataTypeAnnotation } from "../data-types/data-types";
import { getJSONTypeName } from "../json/json-types";
import { QueryOptions } from "../options";
import { QueryContext } from "../query/evaluation";
import { ComparisonExpression } from "../query/filter-expression/comparison-expression";
import { FilterExpression } from "../query/filter-expression/filter-expression";
import { convertToValueType } from "../query/evaluation";
import { Query } from "../query/query";
import { Node } from "../values/node";
import { Segment } from "../query/segment";
import { Selector } from "../query/selectors/selector";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeType } from "../query/syntax-tree-type";
import { serializeLiteral, serializeString } from "../serialization/serialization";
import { CharacterCategorizer } from "../syntax-analysis/character-categorizer";
import { TextRange } from "../text/text-range";
import { JSONValue } from "../json/json-types";
import { AnalysisDescriptionService } from "./analysis-description-service";
import { SyntaxDescriptionService } from "./syntax-description-service";
import { NormalizedPathSegment } from "../normalized-path";

export class CompletionProvider {
    private readonly syntaxDescriptionProvider: SyntaxDescriptionService;
    private readonly analysisDescriptionProvider: AnalysisDescriptionService;

    constructor(
        private readonly options: QueryOptions
    ) {
        this.syntaxDescriptionProvider = new SyntaxDescriptionService(options);
        this.analysisDescriptionProvider = new AnalysisDescriptionService();
    }

    provideCompletions(query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType, position: number): CompletionItem[] {
        const completions: CompletionItem[] = [];
        const touchingNodes = query.getTouchingAtPosition(position);
        for (const node of touchingNodes)
            this.provideCompletionsForNode(query, queryArgument, queryArgumentType, node, completions);
        return completions;
    }

    private provideCompletionsForNode(query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType, node: SyntaxTree, completions: CompletionItem[]) {
        const lastNode = node;
        const lastButOneNode = node.parent!;

        if (lastButOneNode instanceof Selector) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            const segment = lastButOneNode.parent as Segment;
            this.completeSelector(completions, lastButOneNode, segment, query, queryArgument, queryArgumentType);
            completions.push(new CompletionItem(CompletionItemType.syntax, "*", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForWildcardSelector().toMarkdown()));
            if (segment.usesBracketNotation) {
                completions.push(new CompletionItem(CompletionItemType.syntax, "?", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForFilterSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "::", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForSliceSelector().toMarkdown()));
                completions.push(new CompletionItem(CompletionItemType.syntax, "${start}:${end}:${step}", range, "start:end:step", undefined, () => this.syntaxDescriptionProvider.provideDescriptionForSliceSelector().toMarkdown(), CompletionItemTextType.snippet));
            }
        }
        if (lastButOneNode.type === SyntaxTreeType.missingExpression) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            completions.push(new CompletionItem(CompletionItemType.syntax, "@", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "$", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForDollarToken().toMarkdown()));
        }
        if (
            lastButOneNode.type === SyntaxTreeType.missingExpression ||
            lastButOneNode.type === SyntaxTreeType.stringLiteral ||
            lastButOneNode.type === SyntaxTreeType.numberLiteral ||
            lastButOneNode.type === SyntaxTreeType.booleanLiteral ||
            lastButOneNode.type === SyntaxTreeType.nullLiteral
        ) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            if (lastButOneNode.parent instanceof ComparisonExpression) {
                const referenceExpression = lastButOneNode.parent.left === lastButOneNode
                    ? lastButOneNode.parent.right
                    : lastButOneNode.parent.left;
                this.completeValues(completions, range, referenceExpression, query, queryArgument, queryArgumentType);
            }
        }
        if (lastButOneNode.type === SyntaxTreeType.missingExpression ||
            lastNode.type === SyntaxTreeType.nameToken && (
                lastButOneNode.type === SyntaxTreeType.functionExpression ||
                lastButOneNode.type === SyntaxTreeType.booleanLiteral ||
                lastButOneNode.type === SyntaxTreeType.nullLiteral
            )) {
            const range = lastButOneNode.textRangeWithoutSkipped;
            this.completeFunctions(completions, lastNode.textRangeWithoutSkipped);
            completions.push(new CompletionItem(CompletionItemType.syntax, "true", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "false", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
            completions.push(new CompletionItem(CompletionItemType.syntax, "null", range, undefined, undefined, () => this.syntaxDescriptionProvider.provideDescriptionForAtToken().toMarkdown()));
        }
    }

    private completeSelector(completions: CompletionItem[], selector: Selector, segment: Segment, query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType) {
        if (queryArgument !== undefined)
            this.completeSelectorData(completions, selector, segment, query, queryArgument, queryArgumentType);
        else
            this.completeSelectorType(completions, selector, segment, queryArgumentType);
    }

    private completeSelectorType(completions: CompletionItem[], selector: Selector, segment: Segment, queryArgumentType: DataType) {
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

    private completeSelectorData(completions: CompletionItem[], selector: Selector, segment: Segment, query: Query, queryArgument: JSONValue, queryArgumentType: DataType) {
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

    private completeValues(completions: CompletionItem[], range: TextRange, reference: FilterExpression, query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType) {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);

        const literals = queryArgument !== undefined
            ? this.getAllLiteralsOutputtedFromExpression(queryArgument, query, reference)
            : typeAnalyzer.getType(reference).collectKnownLiterals();
        for (const literal of literals) {
            const literalType = typeof literal;
            completions.push(new CompletionItem(
                CompletionItemType.literal,
                serializeLiteral(literal),
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

    private createSelectorCompletionItem(selector: Selector, segment: Segment, pathSegment: NormalizedPathSegment, typeText: string, resolveDescription: () => string): CompletionItem {
        const isValidName = typeof pathSegment === "string" && this.isValidName(pathSegment);
        const useBracketNotation = !isValidName || segment.usesBracketNotation;
        const willUseBracketNotation = useBracketNotation && !segment.usesBracketNotation;
        const range = willUseBracketNotation && !segment.isDescendant
            ? segment.textRangeWithoutSkipped
            : selector.textRangeWithoutSkipped;
        let text = typeof pathSegment === "number"
            ? pathSegment.toString()
            : (
                useBracketNotation ? serializeString(pathSegment) : pathSegment
            );
        if (willUseBracketNotation)
            text = `[${text}]`;
        const label = !segment.usesBracketNotation && typeof pathSegment === "string" ? pathSegment : text;
        return new CompletionItem(CompletionItemType.name, text, range, label, typeText, resolveDescription);
    }

    private createSelectorCompletionItemDescription(pathSegment: NormalizedPathSegment, type: string, annotations: DataTypeAnnotation[]): string {
        const syntaxDescription = typeof pathSegment === "string"
            ? this.syntaxDescriptionProvider.provideDescriptionForNameSelector(pathSegment)
            : this.syntaxDescriptionProvider.provideDescriptionForIndexSelector(pathSegment);
        return syntaxDescription.toMarkdown() + this.analysisDescriptionProvider.provideDescription(type, annotations);
    }

    private getIncomingType(segment: Segment, queryArgumentType: DataType): DataType {
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.options);
        return typeAnalyzer.getIncomingTypeToSegment(segment);
    }

    private getStringOrNumberExample(nodes: Node[], property: string): JSONValue | undefined {
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

    private getDistinctKeysAndTypes(nodes: Node[]): Map<string, Set<string>> {
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

    private getAllNodesOutputtedFromSegment(queryArgument: JSONValue, jsonPath: Query, segment: Segment): Node[] {
        const values: Node[] = [];
        const queryContext: QueryContext = {
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

    private getAllLiteralsOutputtedFromExpression(queryArgument: JSONValue, jsonPath: Query, expression: FilterExpression): Set<string | number | boolean | null> {
        const literals = new Set<string | number | boolean | null>();
        const queryContext: QueryContext = {
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
        if (!CharacterCategorizer.isNameFirst(text[0]))
            return false;
        for (let i = 1; i < text.length; i++) {
            if (!CharacterCategorizer.isName(text[i]))
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