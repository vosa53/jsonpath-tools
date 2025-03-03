import { JSONPathFunction, JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathSegment } from "../query/segment";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";

export class DescriptionProvider {
    private readonly descriptionProviders = new Map<JSONPathSyntaxTreeType, (node: JSONPathSyntaxTree) => Description>([
        [JSONPathSyntaxTreeType.query, n => new Description("Query", "Selects particular children using a logical expression. Current child is represented with @.")],
        [JSONPathSyntaxTreeType.segment, n => {
            const segment = n as JSONPathSegment;
            if (segment.isRecursive)
                return new Description("Descendant Segment", "Selects an object at the given index from an array.");
            else
                return new Description("Child Segment", "Selects an object at the given index from an array.");
        }],

        [JSONPathSyntaxTreeType.filterSelector, n => this.provideDescriptionForFilterSelector()],
        [JSONPathSyntaxTreeType.indexSelector, n => this.provideDescriptionForIndexSelector()],
        [JSONPathSyntaxTreeType.nameSelector, n => this.provideDescriptionForNameSelector()],
        [JSONPathSyntaxTreeType.sliceSelector, n => this.provideDescriptionForSliceSelector()],
        [JSONPathSyntaxTreeType.wildcardSelector, n => this.provideDescriptionForWildcardSelector()],

        [JSONPathSyntaxTreeType.paranthesisExpression, n => new Description("Paranthesis", "Paranthesis.")],
        [JSONPathSyntaxTreeType.andExpression, n => new Description("Logical AND", "Realizes operator AND.")],
        [JSONPathSyntaxTreeType.orExpression, n => new Description("Logical OR", "Realizes operator OR.")],
        [JSONPathSyntaxTreeType.notExpression, n => new Description("Logical NOT", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.comparisonExpression, n => new Description("Comparison", "Compares left and right.")],
        [JSONPathSyntaxTreeType.functionExpression, n => {
            const functionExpression = n as JSONPathFunctionExpression;
            return this.provideDescriptionForFunction(functionExpression.name, this.options.functions[functionExpression.name]);
        }],
        [JSONPathSyntaxTreeType.stringLiteral, n => new Description("String Literal", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.numberLiteral, n => new Description("Number Literal", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.booleanLiteral, n => new Description("Boolean Literal", "Realizes operator NOT.")],
        [JSONPathSyntaxTreeType.nullLiteral, n => new Description("Null Literal", "Realizes operator NOT.")],

        [JSONPathSyntaxTreeType.dollarToken, n => this.provideDescriptionForDollarToken()],
        [JSONPathSyntaxTreeType.atToken, n => this.provideDescriptionForAtToken()]
    ]);

    constructor(
        private readonly options: JSONPathOptions
    ) { }

    provideDescription(node: JSONPathSyntaxTree): Description | null {
        const descriptionProvider = this.descriptionProviders.get(node.type);
        if (descriptionProvider !== undefined)
            return descriptionProvider(node);
        else
            return null;
    }

    provideDescriptionForFunction(name: string, functionDefinition?: JSONPathFunction): Description {
        let text = "";
        if (functionDefinition !== undefined) {
            text += functionDefinition.description;
            text += "\n##### Parameters";
            for (const parameter of functionDefinition.parameters)
                text += `\n - \`${parameter.name}: ${parameter.type}\` ${parameter.description}`;
            text += "\n##### Return Type";
            text += `\n - \`${functionDefinition.returnType}\``;
        }
        return new Description(`Function ${name}`, text);
    }

    provideDescriptionForFilterSelector(): Description {
        return new Description("Filter Selector", "Selects particular children using a logical expression. Current child is represented with @.");
    }

    provideDescriptionForIndexSelector(): Description {
        return new Description("Index Selector", "Selects an object at the given index from an array.");
    }

    provideDescriptionForNameSelector(): Description {
        return new Description("Name Selector", "Selects a property from the object.");
    }

    provideDescriptionForSliceSelector(): Description {
        return new Description("Slice Selector", "Selects a range from an array.");
    }

    provideDescriptionForWildcardSelector(): Description {
        return new Description("Wildcard Selector", "Selects all members from an object.");
    }

    provideDescriptionForDollarToken(): Description {
        return new Description("Root Identifier", "Identifies root object.");
    }

    provideDescriptionForAtToken(): Description {
        return new Description("Current Identifier", "Identifies current object.");
    }
}

export class Description {
    constructor(
        readonly title: string,
        readonly text: string
    ) { }

    toMarkdown(): string {
        return `#### ${this.title}\n${this.text}`;
    }
}