import { JSONPathFunction, JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathSegment } from "../query/segment";
import { JSONPathNameSelector } from "../query/selectors/name-selector";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { JSONPathJSONValue } from "../types";

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
        [JSONPathSyntaxTreeType.nameSelector, n => {
            const nameSelector = n as JSONPathNameSelector;
            return this.provideDescriptionForNameSelector(nameSelector.name);
        }],
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

    provideDescriptionForNameSelector(name: string, schemas?: JSONPathJSONValue[], types?: string[], example?: JSONPathJSONValue): Description {
        let text = `Selects a property \`${name}\` from the object.`;
        if (schemas !== undefined && schemas.length > 0) {
            text += "\n\n---\n";
            for (const schema of schemas) {
                if (typeof schema !== "object" || Array.isArray(schema) || schema === null) 
                    continue;
                if (Object.hasOwn(schema, "title"))
                    text += `\n##### ${schema.title}`;
                if (Object.hasOwn(schema, "description"))
                    text += `\n${schema.description}`;
            }
        }
        if (types !== undefined || example !== undefined) {
            text += "\n\n---\n";
            if (types !== undefined)
                text += `\n##### Type: \`${types.join(" | ")}\``;
            if (example !== undefined) {
                text += "\n##### Example\n";
                text += "```json\n";
                text += JSON.stringify(example, null, 4);
                text += "\n```";
            }
        }

        return new Description(`Name Selector \`${name}\``, text);
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