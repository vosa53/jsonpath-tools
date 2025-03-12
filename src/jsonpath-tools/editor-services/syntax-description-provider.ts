import { JSONPathFunction, JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathSegment } from "../query/segment";
import { JSONPathIndexSelector } from "../query/selectors/index-selector";
import { JSONPathNameSelector } from "../query/selectors/name-selector";
import { JSONPathSliceSelector } from "../query/selectors/slice-selector";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";

export class SyntaxDescriptionProvider {
    private readonly descriptionProviders = new Map<JSONPathSyntaxTreeType, (node: JSONPathSyntaxTree) => SyntaxDescription>([
        [JSONPathSyntaxTreeType.query, n => new SyntaxDescription("Query", "Selects particular children using a logical expression. Current child is represented with @.")],
        [JSONPathSyntaxTreeType.segment, n => {
            const segment = n as JSONPathSegment;
            if (segment.isRecursive)
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

        [JSONPathSyntaxTreeType.paranthesisExpression, n => new SyntaxDescription("Paranthesis", "Paranthesis.")],
        [JSONPathSyntaxTreeType.andExpression, n => new SyntaxDescription("Logical AND", "Realizes operator AND.")],
        [JSONPathSyntaxTreeType.orExpression, n => new SyntaxDescription("Logical OR", "Realizes operator OR.")],
        [JSONPathSyntaxTreeType.notExpression, n => new SyntaxDescription("Logical NOT", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.comparisonExpression, n => new SyntaxDescription("Comparison", "Compares left and right.")],
        [JSONPathSyntaxTreeType.functionExpression, n => {
            const functionExpression = n as JSONPathFunctionExpression;
            return this.provideDescriptionForFunction(functionExpression.name, this.options.functions[functionExpression.name]);
        }],
        [JSONPathSyntaxTreeType.stringLiteral, n => new SyntaxDescription("String Literal", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.numberLiteral, n => new SyntaxDescription("Number Literal", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.booleanLiteral, n => new SyntaxDescription("Boolean Literal", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.nullLiteral, n => new SyntaxDescription("Null Literal", "Realizes operator NOT.")],

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

    provideDescriptionForFunction(name: string, functionDefinition?: JSONPathFunction): SyntaxDescription {
        let text = "";
        if (functionDefinition !== undefined) {
            text += functionDefinition.description;
            text += "\n##### Parameters";
            for (const parameter of functionDefinition.parameters)
                text += `\n - \`${parameter.name}: ${parameter.type}\` ${parameter.description}`;
            text += "\n##### Return Type";
            text += `\n - \`${functionDefinition.returnType}\``;
        }
        return new SyntaxDescription(`Function ${name}`, text);
    }

    provideDescriptionForFilterSelector(): SyntaxDescription {
        return new SyntaxDescription("Filter Selector", "Selects particular children using a logical expression. Current child is represented with @.");
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

    provideDescriptionForDollarToken(): SyntaxDescription {
        return new SyntaxDescription("Root Identifier", "Identifies root object.");
    }

    provideDescriptionForAtToken(): SyntaxDescription {
        return new SyntaxDescription("Current Identifier", "Identifies current object.");
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