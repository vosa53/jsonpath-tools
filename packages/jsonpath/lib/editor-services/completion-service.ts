import { DataTypeAnalyzer } from "../data-types/data-type-analyzer";
import { DataType, DataTypeAnnotation } from "../data-types/data-types";
import { getJSONType } from "../json/json-types";
import { QueryOptions } from "../query-options";
import { QueryContext } from "../query/evaluation";
import { ComparisonExpression } from "../query/filter-expressions/comparison-expression";
import { FilterExpression } from "../query/filter-expressions/filter-expression";
import { convertToValueType } from "../query/evaluation";
import { Query } from "../query/query";
import { Node } from "../values/node";
import { Segment, SegmentType } from "../query/segment";
import { Selector } from "../query/selectors/selector";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeType } from "../query/syntax-tree-type";
import { serializeLiteral, serializeNumber, serializeString, StringQuotes } from "../serialization/serialization";
import { CharacterCategorizer } from "../syntax-analysis/character-categorizer";
import { TextRange } from "../text/text-range";
import { JSONValue } from "../json/json-types";
import { AnalysisDescriptionService } from "./analysis-description-service";
import { SyntaxDescriptionService } from "./syntax-description-service";
import { NormalizedPathSegment } from "../normalized-path";
import { FilterValue } from "../values/types";
import { NameSelector } from "../query/selectors/name-selector";
import { StringLiteralExpression } from "../query/filter-expressions/string-literal-expression";

/**
 * Provides completion items.
 */
export class CompletionService {
    private readonly syntaxDescriptionProvider: SyntaxDescriptionService;
    private readonly analysisDescriptionProvider: AnalysisDescriptionService;

    constructor(
        /**
         * Query options.
         */
        private readonly queryOptions: QueryOptions
    ) {
        this.syntaxDescriptionProvider = new SyntaxDescriptionService(queryOptions);
        this.analysisDescriptionProvider = new AnalysisDescriptionService();
    }

    /**
     * Provides completion items at the given caret position in the query text.
     * @param query Query.
     * @param queryArgument Query argument.
     * @param queryArgumentType Query argument type.
     * @param position Caret position in the query text (starts with 0).
     */
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
            lastButOneNode.type === SyntaxTreeType.stringLiteralExpression ||
            lastButOneNode.type === SyntaxTreeType.numberLiteralExpression ||
            lastButOneNode.type === SyntaxTreeType.booleanLiteralExpression ||
            lastButOneNode.type === SyntaxTreeType.nullLiteralExpression
        ) {
            if (lastButOneNode.parent instanceof ComparisonExpression) {
                let expression = lastButOneNode.parent.right;
                let reference = lastButOneNode.parent.left;
                if (lastButOneNode.parent.left === lastButOneNode)
                    [expression, reference] = [reference, expression];
                this.completeValues(completions, expression, reference, query, queryArgument, queryArgumentType);
            }
        }
        if (lastButOneNode.type === SyntaxTreeType.missingExpression ||
            lastNode.type === SyntaxTreeType.nameToken && (
                lastButOneNode.type === SyntaxTreeType.functionExpression ||
                lastButOneNode.type === SyntaxTreeType.booleanLiteralExpression ||
                lastButOneNode.type === SyntaxTreeType.nullLiteralExpression
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
        for (const functionDefinition of Object.entries(this.queryOptions.functions)) {
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

    private completeValues(completions: CompletionItem[], expression: FilterExpression, reference: FilterExpression, query: Query, queryArgument: JSONValue | undefined, queryArgumentType: DataType) {
        const range = expression.textRangeWithoutSkipped;
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.queryOptions);
        const literals = queryArgument !== undefined
            ? this.getAllLiteralsOutputtedFromExpression(queryArgument, query, reference)
            : this.getAllLiteralsFromExpressionType(typeAnalyzer.getType(reference));
        for (const literal of literals) {
            const literalType = typeof literal;
            completions.push(new CompletionItem(
                CompletionItemType.literal,
                serializeLiteral(literal, expression instanceof StringLiteralExpression && expression.valueToken.text.startsWith("'") ? StringQuotes.single : StringQuotes.double),
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
        const range = willUseBracketNotation && segment.segmentType === SegmentType.child
            ? segment.textRangeWithoutSkipped
            : selector.textRangeWithoutSkipped;
        let text = typeof pathSegment === "number"
            ? serializeNumber(pathSegment)
            : (
                useBracketNotation 
                    ? serializeString(pathSegment, selector instanceof NameSelector && selector.nameToken.text.startsWith("'") ? StringQuotes.single : StringQuotes.double) 
                    : pathSegment
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
        const typeAnalyzer = new DataTypeAnalyzer(queryArgumentType, this.queryOptions);
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
                    const type = getJSONType(propertyValue);
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
            argument: queryArgument,
            options: this.queryOptions,
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
            argument: queryArgument,
            options: this.queryOptions,
            filterExpressionInstrumentationCallback: (fe, o) => {
                if (fe === expression) {
                    const value = convertToValueType(o);
                    if (this.isLiteral(value))
                        literals.add(value);
                }
            }
        };
        jsonPath.select(queryContext);
        return literals;
    }

    private getAllLiteralsFromExpressionType(type: DataType): Set<string | number | boolean | null> {
        const literals = type.collectKnownLiterals();
        const annotations = type.collectAnnotations();
        for (const annotation of annotations) {
            if (annotation.defaultValue !== undefined && this.isLiteral(annotation.defaultValue))
                literals.add(annotation.defaultValue);
            for (const example of annotation.exampleValues) {
                if (this.isLiteral(example))
                    literals.add(example);
            }
        }
        return literals;
    }

    private isLiteral(value: FilterValue): value is string | number | boolean | null {
        const type = typeof value;
        return type === "string" || type === "number" || type === "boolean" || value === null;
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

/**
 * Completion item.
 */
export class CompletionItem {
    constructor(
        /**
         * Type.
         */
        readonly type: CompletionItemType,

        /**
         * Text to be inserted instead of {@link range}.
         * 
         * When {@link textType} is {@link CompletionItemTextType.snippet} it should be inserted as a snippet. 
         * Snippet parts are defined using `${}`, for example `${start}:${end}:${step}`.
         */
        readonly text: string,

        /**
         * Text range to be replaced with {@link text}.
         */
        readonly range: TextRange,

        /**
         * Text to display in user interface.
         */
        readonly label: string = text,

        /**
         * Additional text to show next to {@link label} in user interface. For example a type.
         */
        readonly detail?: string,

        /**
         * Function that computes the long description. In Markdown format.
         */
        readonly resolveDescription?: () => string,

        /**
         * Whether the {@link text} should be inserted as is or as a snippet.
         */
        readonly textType: CompletionItemTextType = CompletionItemTextType.plain
    ) { }
}

/**
 * Type of a completion item.
 */
export enum CompletionItemType {
    /**
     * Object property name.
     */
    name,

    /**
     * Literal value. For example some concrete string or a number.
     */
    literal,

    /**
     * Function.
     */
    function,

    /**
     * Other syntax parts.
     */
    syntax
}

/**
 * Type of a completion item text.
 */
export enum CompletionItemTextType {
    /**
     * Insert the text as is.
     */
    plain,

    /**
     * Insert the text as a snippet.
     */
    snippet
}