import { QueryOptions } from "../options";
import { FunctionExpression } from "../query/filter-expression/function-expression";
import { Query } from "../query/query";
import { SyntaxTree } from "../query/syntax-tree";
import { TextRange } from "../text/text-range";

/**
 * Provides a signature for a called function.
 */
export class SignatureHelpService {
    constructor(
        /**
         * Query options.
         */
        private readonly options: QueryOptions
    ) { }

    /**
     * Provides a signature at the given caret position in the query text.
     * @param query Query.
     * @param position Caret position in the query text (starts with 0).
     */
    provideSignature(query: Query, position: number): Signature | null {
        const node = query.getContainingAtPosition(position);
        if (node === null)
            return null;

        let current: SyntaxTree | null = node;
        while (current !== null && !this.isCorrectFunction(current, position))
            current = current.parent;
        if (current === null) 
            return null;
        const functionExpression = current as FunctionExpression;
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
        return new Signature(text, parameters, parameterIndex, functionDefinition.description);
    }

    private isCorrectFunction(node: SyntaxTree, position: number): boolean {
        return node instanceof FunctionExpression && 
            node.openingParanthesisToken.position < position && 
            node.closingParanthesisToken.position >= position;
    }

    private getParameterIndex(node: FunctionExpression, position: number): number {
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