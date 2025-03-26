import { JSONPathFunction, JSONPathOptions } from "../options";
import { JSONPathBooleanLiteral } from "../query/filter-expression/boolean-literal";
import { JSONPathComparisonExpression, JSONPathComparisonOperator } from "../query/filter-expression/comparison-expression";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathNumberLiteral } from "../query/filter-expression/number-literal";
import { JSONPathStringLiteral } from "../query/filter-expression/string-literal";
import { JSONPathQuery } from "../query/query";
import { JSONPathSegment } from "../query/segment";
import { JSONPathIndexSelector } from "../query/selectors/index-selector";
import { JSONPathNameSelector } from "../query/selectors/name-selector";
import { JSONPathSliceSelector } from "../query/selectors/slice-selector";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";

export class SyntaxDescriptionService {
    private readonly descriptionProviders = new Map<JSONPathSyntaxTreeType, (node: JSONPathSyntaxTree) => SyntaxDescription>([
        [JSONPathSyntaxTreeType.query, n => {
            const query = n as JSONPathQuery;
            return this.provideDescriptionForQuery(query.isRelative);
        }],
        [JSONPathSyntaxTreeType.segment, n => {
            const segment = n as JSONPathSegment;
            if (segment.isDescendant)
                return new SyntaxDescription("Descendant Segment", "Selects an object at the given index from an array.");
            else
                return new SyntaxDescription("Child Segment", "Selects an object at the given index from an array.");
        }],

        [JSONPathSyntaxTreeType.filterSelector, n => this.provideDescriptionForFilterSelector()],
        [JSONPathSyntaxTreeType.indexSelector, n => {
            const indexSelector = n as JSONPathIndexSelector;
            return this.provideDescriptionForIndexSelector(indexSelector.index);
        }],
        [JSONPathSyntaxTreeType.nameSelector, n => {
            const nameSelector = n as JSONPathNameSelector;
            return this.provideDescriptionForNameSelector(nameSelector.name);
        }],
        [JSONPathSyntaxTreeType.sliceSelector, n => {
            const sliceSelector = n as JSONPathSliceSelector;
            return this.provideDescriptionForSliceSelector(sliceSelector.start, sliceSelector.end, sliceSelector.step);
        }],
        [JSONPathSyntaxTreeType.wildcardSelector, n => this.provideDescriptionForWildcardSelector()],
        [JSONPathSyntaxTreeType.missingSelector, n => this.provideDescriptionForMissingSelector()],

        [JSONPathSyntaxTreeType.paranthesisExpression, n => new SyntaxDescription("Paranthesis", "Paranthesis.")],
        [JSONPathSyntaxTreeType.andExpression, n => new SyntaxDescription("Logical AND", "Realizes operator AND.")],
        [JSONPathSyntaxTreeType.orExpression, n => new SyntaxDescription("Logical OR", "Realizes operator OR.")],
        [JSONPathSyntaxTreeType.notExpression, n => new SyntaxDescription("Logical NOT", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.comparisonExpression, n => {
            const comparisonExpression = n as JSONPathComparisonExpression;
            return this.provideDescriptionForComparisonExpression(comparisonExpression.operator);
        }],
        [JSONPathSyntaxTreeType.filterQueryExpression, n => new SyntaxDescription("Filter Query", "Query in filter expression.")],
        [JSONPathSyntaxTreeType.functionExpression, n => {
            const functionExpression = n as JSONPathFunctionExpression;
            return this.provideDescriptionForFunctionExpression(functionExpression.name, this.options.functions[functionExpression.name]);
        }],
        [JSONPathSyntaxTreeType.stringLiteral, n => {
            const stringLiteral = n as JSONPathStringLiteral;
            return this.provideDescriptionForStringLiteralExpression(stringLiteral.value);
        }],
        [JSONPathSyntaxTreeType.numberLiteral, n => {
            const numberLiteral = n as JSONPathNumberLiteral;
            return this.provideDescriptionForNumberLiteralExpression(numberLiteral.value);
        }],
        [JSONPathSyntaxTreeType.booleanLiteral, n => {
            const booleanLiteral = n as JSONPathBooleanLiteral;
            return this.provideDescriptionForBooleanLiteralExpression(booleanLiteral.value);
        }],
        [JSONPathSyntaxTreeType.nullLiteral, n => this.provideDescriptionForNullLiteralExpression()],
        [JSONPathSyntaxTreeType.missingExpression, n => new SyntaxDescription("Missing Expression", "Missing Expression.")],

        [JSONPathSyntaxTreeType.dollarToken, n => this.provideDescriptionForDollarToken()],
        [JSONPathSyntaxTreeType.atToken, n => this.provideDescriptionForAtToken()]
    ]);

    constructor(
        private readonly options: JSONPathOptions
    ) { }

    provideDescription(node: JSONPathSyntaxTree): SyntaxDescription | null {
        const descriptionProvider = this.descriptionProviders.get(node.type);
        if (descriptionProvider !== undefined)
            return descriptionProvider(node);
        else
            return null;
    }

    provideDescriptionForQuery(isRelative: boolean): SyntaxDescription {
        return new SyntaxDescription(
            isRelative ? "Relative Query" : "Absolute Query",
            "Selects particular children using a logical expression. Current child is represented with @."
        );
    }

    provideDescriptionForFilterSelector(): SyntaxDescription {
        return new SyntaxDescription("Filter Selector", "Selects particular children using a logical expression. Current child is represented with `@`.");
    }

    provideDescriptionForIndexSelector(index?: number): SyntaxDescription {
        if (index === undefined)
            return new SyntaxDescription("Index Selector", "Selects an object at the given index from an array.");
        else
            return new SyntaxDescription(`Index Selector \`${index}\``, `Selects an object at the index \`${index}\` from an array.`)
    }

    provideDescriptionForNameSelector(name?: string): SyntaxDescription {
        if (name === undefined)
            return new SyntaxDescription("Name Selector", "Selects a property from the object.");
        else
            return new SyntaxDescription(`Name Selector \`${name}\``, `Selects a property \`${name}\` from the object.`);
    }

    provideDescriptionForSliceSelector(start?: number | null, end?: number | null, step?: number | null): SyntaxDescription {
        if (start === undefined || end === undefined || step === undefined)
            return new SyntaxDescription("Slice Selector", "Selects a range from an array.");
        else {
            const rangeText = `${start ?? ""}:${end ?? ""}:${step ?? ""}`;
            return new SyntaxDescription(`Slice Selector \`${rangeText}\``, `Selects a range \`${rangeText}\` from an array.`);
        }
    }

    provideDescriptionForWildcardSelector(): SyntaxDescription {
        return new SyntaxDescription("Wildcard Selector", "Selects all members from an object.");
    }

    provideDescriptionForMissingSelector(): SyntaxDescription {
        return new SyntaxDescription("Missing Selector", "Missing selector.");
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

    provideDescriptionForFunctionExpression(name: string, functionDefinition?: JSONPathFunction): SyntaxDescription {
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
        return new SyntaxDescription("Root Identifier", "Identifies root object.");
    }

    provideDescriptionForAtToken(): SyntaxDescription {
        return new SyntaxDescription("Current Identifier", "Identifies current object.");
    }

    private createLiteralDescription(title: string, value: string | number | boolean | null): SyntaxDescription {
        let text = "##### Value\n\n";
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