import { JSONPathOptions } from "../options";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPath } from "../query/json-path";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathSyntaxTreeType } from "../query/syntax-tree-type";
import { TextRange } from "../text-range";

export class SignatureProvider {
    constructor(
        private readonly options: JSONPathOptions
    ) { }

    provideSignature(query: JSONPath, position: number): Signature | null {
        const nodePath = query.getContainingAtPosition(position);
        if (nodePath.length === 0)
            return null;
        while (nodePath.length !== 0 && !this.isCorrectFunction(nodePath[nodePath.length - 1], position))
            nodePath.pop();
        if (nodePath.length === 0) 
            return null;
        const functionExpression = nodePath[nodePath.length - 1] as JSONPathFunctionExpression;
        const functionDefinition = this.options.functions[functionExpression.name];
        if (functionDefinition === undefined)
            return null;
        
        let text = functionExpression.name + "(";
        const parameters: SignatureParameter[] = [];
        for (const parameter of functionDefinition.parameters) {
            if (parameters.length !== 0)
                text += ", ";
            const parameterText = `${parameter.name}: ${parameter.type}`;
            parameters.push(new SignatureParameter(new TextRange(text.length, parameterText.length), parameter.description));
            text += parameterText;
        }
        text += "): ";
        text += functionDefinition.returnType;
        const parameterIndex = this.getParameterIndex(functionExpression, position);
        return new Signature(text, parameters, parameterIndex, "");
    }

    private isCorrectFunction(node: JSONPathSyntaxTree, position: number): boolean {
        return node instanceof JSONPathFunctionExpression && 
            node.openingParanthesisToken.position < position && 
            node.closingParanthesisToken.position >= position;
    }

    private getParameterIndex(node: JSONPathFunctionExpression, position: number): number {
        let index = 0;
        while (index < node.args.length && node.args[index].commaToken !== null && node.args[index].commaToken!.position < position)
            index++;
        return index;
    }
}

export class Signature {
    constructor(
        readonly text: string,
        readonly parameters: readonly SignatureParameter[],
        readonly activeParameterIndex: number,
        readonly documentation: string
    ) { }
}

export class SignatureParameter {
    constructor(
        readonly rangeInSignatureText: TextRange,
        readonly documentation: string
    ) { }
}