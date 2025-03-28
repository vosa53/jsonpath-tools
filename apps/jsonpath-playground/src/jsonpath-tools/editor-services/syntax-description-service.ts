import { QueryOptions } from "../options";
import { Function } from "../functions/function";
import { BooleanLiteralExpression } from "../query/filter-expression/boolean-literal-expression";
import { ComparisonExpression, JSONPathComparisonOperator } from "../query/filter-expression/comparison-expression";
import { FunctionExpression } from "../query/filter-expression/function-expression";
import { NumberLiteralExpression } from "../query/filter-expression/number-literal-expression";
import { StringLiteralExpression } from "../query/filter-expression/string-literal-expression";
import { SubQuery } from "../query/sub-query";
import { Segment } from "../query/segment";
import { IndexSelector } from "../query/selectors/index-selector";
import { NameSelector } from "../query/selectors/name-selector";
import { SliceSelector } from "../query/selectors/slice-selector";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeType } from "../query/syntax-tree-type";

export class SyntaxDescriptionService {
    private readonly descriptionProviders = new Map<SyntaxTreeType, (node: SyntaxTree) => SyntaxDescription>([
        [SyntaxTreeType.subQuery, n => {
            const query = n as SubQuery;
            return this.provideDescriptionForQuery(query.isRelative);
        }],
        [SyntaxTreeType.segment, n => {
            const segment = n as Segment;
            if (segment.isDescendant)
                return new SyntaxDescription("Descendant Segment", "Selects values with its selectors from the current value **and all its descendants**.");
            else
                return new SyntaxDescription("Child Segment", "Selects values with its selectors from the current value.");
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
        [SyntaxTreeType.filterQueryExpression, n => new SyntaxDescription("Filter Query", "Query in filter expression. When used on its own it is considered an existence test.")],
        [SyntaxTreeType.functionExpression, n => {
            const functionExpression = n as FunctionExpression;
            return this.provideDescriptionForFunctionExpression(functionExpression.name, this.options.functions[functionExpression.name]);
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
        private readonly options: QueryOptions
    ) { }

    provideDescription(node: SyntaxTree): SyntaxDescription | null {
        const descriptionProvider = this.descriptionProviders.get(node.type);
        if (descriptionProvider !== undefined)
            return descriptionProvider(node);
        else
            return null;
    }

    provideDescriptionForQuery(isRelative: boolean): SyntaxDescription {
        return new SyntaxDescription(
            isRelative ? "Relative Query" : "Absolute Query",
            "A sequence of segments that consists of selectors to select or filter values from objects/arrays."
        );
    }

    provideDescriptionForFilterSelector(): SyntaxDescription {
        return new SyntaxDescription("Filter Selector", "Selects values from an array/object that satisfy a logical expression. Current tested value is represented with `@`.");
    }

    provideDescriptionForIndexSelector(index?: number): SyntaxDescription {
        if (index === undefined)
            return new SyntaxDescription("Index Selector", "Selects a value at the given index from an array.");
        else
            return new SyntaxDescription(`Index Selector \`${index}\``, `Selects a value at the index \`${index}\` from an array.`);
    }

    provideDescriptionForNameSelector(name?: string): SyntaxDescription {
        if (name === undefined)
            return new SyntaxDescription("Name Selector", "Selects a property from an object.");
        else
            return new SyntaxDescription(`Name Selector \`${name}\``, `Selects the property \`${name}\` from an object.`);
    }

    provideDescriptionForSliceSelector(start?: number | null, end?: number | null, step?: number | null): SyntaxDescription {
        if (start === undefined || end === undefined || step === undefined)
            return new SyntaxDescription("Slice Selector", "Selects values in the given range from an array.");
        else {
            const rangeText = `${start ?? ""}:${end ?? ""}:${step ?? ""}`;
            return new SyntaxDescription(`Slice Selector \`${rangeText}\``, `Selects values in the range \`${rangeText}\` from an array.`);
        }
    }

    provideDescriptionForWildcardSelector(): SyntaxDescription {
        return new SyntaxDescription("Wildcard Selector", "Selects all values from an array/object.");
    }

    provideDescriptionForMissingSelector(): SyntaxDescription {
        return new SyntaxDescription("Missing Selector", "Represents a mising selector (syntax error).");
    }

    provideDescriptionForComparisonExpression(operator: JSONPathComparisonOperator): SyntaxDescription {
        let operatorDescription;
        if (operator === JSONPathComparisonOperator.equals) operatorDescription = "Equality";
        else if (operator === JSONPathComparisonOperator.notEquals) operatorDescription = "Inequality";
        else if (operator === JSONPathComparisonOperator.lessThan) operatorDescription = "Less Than";
        else if (operator === JSONPathComparisonOperator.greaterThan) operatorDescription = "Greater Than";
        else if (operator === JSONPathComparisonOperator.lessThanEquals) operatorDescription = "Less Than Equals";
        else if (operator === JSONPathComparisonOperator.greaterThanEquals) operatorDescription = "Greater Than Equals";
        else throw new Error("Unknown operator.");
        return new SyntaxDescription(`${operatorDescription} Comparison`, "Compares left and right.");
    }

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

    provideDescriptionForStringLiteralExpression(value: string): SyntaxDescription {
        return this.createLiteralDescription("String Literal", value);
    }

    provideDescriptionForNumberLiteralExpression(value: number): SyntaxDescription {
        return this.createLiteralDescription("Number Literal", value);
    }

    provideDescriptionForBooleanLiteralExpression(value: boolean): SyntaxDescription {
        return this.createLiteralDescription("Boolean Literal", value);
    }

    provideDescriptionForNullLiteralExpression(): SyntaxDescription {
        return this.createLiteralDescription("Null Literal", null);
    }

    provideDescriptionForDollarToken(): SyntaxDescription {
        return new SyntaxDescription("Root Identifier", "Represents the root query argument.");
    }

    provideDescriptionForAtToken(): SyntaxDescription {
        return new SyntaxDescription("Current Identifier", "Represents the current value in the filter selector expression.");
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

export class SyntaxDescription {
    constructor(
        readonly title: string,
        readonly text: string
    ) { }

    toMarkdown(): string {
        return `#### ${this.title}\n${this.text}`;
    }
}