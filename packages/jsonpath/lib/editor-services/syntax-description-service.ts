import { QueryOptions } from "../query-options";
import { Function } from "../functions/function";
import { BooleanLiteralExpression } from "../query/filter-expressions/boolean-literal-expression";
import { ComparisonExpression, ComparisonOperator } from "../query/filter-expressions/comparison-expression";
import { FunctionExpression } from "../query/filter-expressions/function-expression";
import { NumberLiteralExpression } from "../query/filter-expressions/number-literal-expression";
import { StringLiteralExpression } from "../query/filter-expressions/string-literal-expression";
import { QueryType, SubQuery } from "../query/sub-query";
import { Segment, SegmentType } from "../query/segment";
import { IndexSelector } from "../query/selectors/index-selector";
import { NameSelector } from "../query/selectors/name-selector";
import { SliceSelector } from "../query/selectors/slice-selector";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeType } from "../query/syntax-tree-type";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NullLiteralExpression } from "../query/filter-expressions/null-literal-expression";

/**
 * Provides a description for parts of a query syntax tree.
 */
export class SyntaxDescriptionService {
    private readonly descriptionProviders = new Map<SyntaxTreeType, (node: SyntaxTree) => SyntaxDescription>([
        [SyntaxTreeType.subQuery, n => {
            const query = n as SubQuery;
            return this.provideDescriptionForQuery(query.queryType);
        }],
        [SyntaxTreeType.segment, n => {
            const segment = n as Segment;
            if (segment.segmentType === SegmentType.child)
                return new SyntaxDescription("Child Segment", "Selects values with its selectors from the current value.");
            else
                return new SyntaxDescription("Descendant Segment", "Selects values with its selectors from the current value **and all its descendants**.");
        }],

        [SyntaxTreeType.filterSelector, n => this.provideDescriptionForFilterSelector()],
        [SyntaxTreeType.indexSelector, n => {
            const indexSelector = n as IndexSelector;
            return this.provideDescriptionForIndexSelector(indexSelector.index);
        }],
        [SyntaxTreeType.nameSelector, n => {
            const nameSelector = n as NameSelector;
            return this.provideDescriptionForNameSelector(nameSelector.name);
        }],
        [SyntaxTreeType.sliceSelector, n => {
            const sliceSelector = n as SliceSelector;
            return this.provideDescriptionForSliceSelector(sliceSelector.start, sliceSelector.end, sliceSelector.step);
        }],
        [SyntaxTreeType.wildcardSelector, n => this.provideDescriptionForWildcardSelector()],
        [SyntaxTreeType.missingSelector, n => this.provideDescriptionForMissingSelector()],

        [SyntaxTreeType.paranthesisExpression, n => new SyntaxDescription("Paranthesis", "Used to change logical operators priorities.")],
        [SyntaxTreeType.andExpression, n => new SyntaxDescription("Logical AND", "Realizes a logical operation AND.")],
        [SyntaxTreeType.orExpression, n => new SyntaxDescription("Logical OR", "Realizes a logical operation OR.")],
        [SyntaxTreeType.notExpression, n => new SyntaxDescription("Logical NOT", "Realizes a logical operation NOT.")],
        [SyntaxTreeType.comparisonExpression, n => {
            const comparisonExpression = n as ComparisonExpression;
            return this.provideDescriptionForComparisonExpression(comparisonExpression.operator);
        }],
        [SyntaxTreeType.filterQueryExpression, n => new SyntaxDescription("Filter Query", "Query in a filter expression. When used on its own it is considered an existence test.")],
        [SyntaxTreeType.functionExpression, n => {
            const functionExpression = n as FunctionExpression;
            return this.provideDescriptionForFunctionExpression(functionExpression.name, this.queryOptions.functions[functionExpression.name]);
        }],
        [SyntaxTreeType.stringLiteralExpression, n => {
            const stringLiteral = n as StringLiteralExpression;
            return this.provideDescriptionForStringLiteralExpression(stringLiteral.value);
        }],
        [SyntaxTreeType.numberLiteralExpression, n => {
            const numberLiteral = n as NumberLiteralExpression;
            return this.provideDescriptionForNumberLiteralExpression(numberLiteral.value);
        }],
        [SyntaxTreeType.booleanLiteralExpression, n => {
            const booleanLiteral = n as BooleanLiteralExpression;
            return this.provideDescriptionForBooleanLiteralExpression(booleanLiteral.value);
        }],
        [SyntaxTreeType.nullLiteralExpression, n => this.provideDescriptionForNullLiteralExpression()],
        [SyntaxTreeType.missingExpression, n => new SyntaxDescription("Missing Expression", "Represents a mising expression (syntax error).")],

        [SyntaxTreeType.dollarToken, n => this.provideDescriptionForDollarToken()],
        [SyntaxTreeType.atToken, n => this.provideDescriptionForAtToken()]
    ]);

    constructor(
        /**
         * Query options.
         */
        private readonly queryOptions: QueryOptions
    ) { }

    /**
     * Provides a description for the given part of a query syntax tree. When the part has no description available it returns `null`. 
     * @param tree Part of a query syntax tree.
     */
    provideDescription(tree: SyntaxTree): SyntaxDescription | null {
        const descriptionProvider = this.descriptionProviders.get(tree.type);
        if (descriptionProvider !== undefined)
            return descriptionProvider(tree);
        else
            return null;
    }

    /**
     * Provides a description for {@link SubQuery}.
     * @param queryType {@link SubQuery.queryType}.
     */
    provideDescriptionForQuery(queryType: QueryType): SyntaxDescription {
        return new SyntaxDescription(
            queryType === QueryType.absolute ? "Absolute Query" : "Relative Query",
            "A sequence of segments that consist of selectors to select or filter values from objects/arrays."
        );
    }

    /**
     * Provides a description for {@link FilterSelector}.
     */
    provideDescriptionForFilterSelector(): SyntaxDescription {
        return new SyntaxDescription("Filter Selector", "Selects values from an array/object that satisfy a logical expression. Current tested value is represented with `@`.");
    }

    /**
     * Provides a description for {@link IndexSelector}.
     * @param index {@link IndexSelector.index}.
     */
    provideDescriptionForIndexSelector(index?: number): SyntaxDescription {
        if (index === undefined)
            return new SyntaxDescription("Index Selector", "Selects a value at the given index from an array.");
        else
            return new SyntaxDescription(`Index Selector \`${index}\``, `Selects a value at the index \`${index}\` from an array.`);
    }

    /**
     * Provides a description for {@link NameSelector}.
     * @param name {@link NameSelector.name}.
     */
    provideDescriptionForNameSelector(name?: string): SyntaxDescription {
        if (name === undefined)
            return new SyntaxDescription("Name Selector", "Selects a property from an object.");
        else
            return new SyntaxDescription(`Name Selector \`${name}\``, `Selects the property \`${name}\` from an object.`);
    }

    /**
     * Provides a description for {@link SliceSelector}.
     * @param start {@link SliceSelector.start}.
     * @param end {@link SliceSelector.end}.
     * @param step {@link SliceSelector.step}.
     */
    provideDescriptionForSliceSelector(start?: number | null, end?: number | null, step?: number | null): SyntaxDescription {
        if (start === undefined || end === undefined || step === undefined)
            return new SyntaxDescription("Slice Selector", "Selects values in the given range from an array.");
        else {
            const rangeText = `${start ?? ""}:${end ?? ""}:${step ?? ""}`;
            return new SyntaxDescription(`Slice Selector \`${rangeText}\``, `Selects values in the range \`${rangeText}\` from an array.`);
        }
    }

    /**
     * Provides a description for {@link WildcardSelector}.
     */
    provideDescriptionForWildcardSelector(): SyntaxDescription {
        return new SyntaxDescription("Wildcard Selector", "Selects all values from an array/object.");
    }

    /**
     * Provides a description for {@link MissingSelector}.
     */
    provideDescriptionForMissingSelector(): SyntaxDescription {
        return new SyntaxDescription("Missing Selector", "Represents a mising selector (syntax error).");
    }

    /**
     * Provides a description for {@link ComparisonExpression}.
     * @param operator {@link ComparisonExpression.operator}.
     */
    provideDescriptionForComparisonExpression(operator: ComparisonOperator): SyntaxDescription {
        let operatorDescription;
        if (operator === ComparisonOperator.equals) operatorDescription = "Equality";
        else if (operator === ComparisonOperator.notEquals) operatorDescription = "Inequality";
        else if (operator === ComparisonOperator.lessThan) operatorDescription = "Less Than";
        else if (operator === ComparisonOperator.greaterThan) operatorDescription = "Greater Than";
        else if (operator === ComparisonOperator.lessThanEquals) operatorDescription = "Less Than Equals";
        else if (operator === ComparisonOperator.greaterThanEquals) operatorDescription = "Greater Than Equals";
        else throw new Error("Unknown operator.");
        return new SyntaxDescription(`${operatorDescription} Comparison`, "Compares the expression on the left with the expression on the right.");
    }

    /**
     * Provides a description for {@link FunctionExpression}.
     * @param name {@link FunctionExpression.name}.
     * @param functionDefinition Definition of the function.
     */
    provideDescriptionForFunctionExpression(name: string, functionDefinition?: Function): SyntaxDescription {
        let text = "";
        if (functionDefinition !== undefined) {
            text += functionDefinition.description;
            text += "\n##### Parameters";
            for (const parameter of functionDefinition.parameters)
                text += `\n - \`${parameter.name}: ${parameter.type}\` ${parameter.description}`;
            text += "\n##### Return Type";
            text += `\n - \`${functionDefinition.returnType}\``;
        }
        return new SyntaxDescription(`Function \`${name}\``, text);
    }

    /**
     * Provides a description for {@link StringLiteralExpression}.
     * @param value {@link StringLiteralExpression.value}.
     */
    provideDescriptionForStringLiteralExpression(value: string): SyntaxDescription {
        return this.createLiteralDescription("String Literal", value);
    }

    /**
     * Provides a description for {@link NumberLiteralExpression}.
     * @param value {@link NumberLiteralExpression.value}.
     */
    provideDescriptionForNumberLiteralExpression(value: number): SyntaxDescription {
        return this.createLiteralDescription("Number Literal", value);
    }

    /**
     * Provides a description for {@link BooleanLiteralExpression}.
     * @param value {@link BooleanLiteralExpression.value}.
     */
    provideDescriptionForBooleanLiteralExpression(value: boolean): SyntaxDescription {
        return this.createLiteralDescription("Boolean Literal", value);
    }

    /**
     * Provides a description for {@link NullLiteralExpression}.
     */
    provideDescriptionForNullLiteralExpression(): SyntaxDescription {
        return this.createLiteralDescription("Null Literal", null);
    }

    /**
     * Provides a description for {@link SyntaxTreeType.dollarToken}.
     */
    provideDescriptionForDollarToken(): SyntaxDescription {
        return new SyntaxDescription("Root Identifier", "Represents the root query argument.");
    }

    /**
     * Provides a description for {@link SyntaxTreeType.atToken}.
     */
    provideDescriptionForAtToken(): SyntaxDescription {
        return new SyntaxDescription("Current Identifier", "Represents the currently filtered value in the filter selector expression.");
    }

    private createLiteralDescription(title: string, value: string | number | boolean | null): SyntaxDescription {
        let text = "An expression with a constant value.\n\n"
        text += "##### Value\n\n";
        text += "```\n";
        text += value === null ? "null" : value.toString()
        text += "\n```";
        return new SyntaxDescription(title, text);
    }
}

/**
 * Description of a part of a query syntax tree.
 */
export class SyntaxDescription {
    constructor(
        /**
         * Title.
         */
        readonly title: string,

        /**
         * Text. In Markdown format.
         */
        readonly text: string
    ) { }

    /**
     * Converts the whole description to Markdown format.
     */
    toMarkdown(): string {
        return `#### ${this.title}\n${this.text}`;
    }
}