import { Diagnostics, DiagnosticsSeverity } from "../diagnostics";
import { QueryOptions } from "../query-options";
import { Type } from "../values/types";
import { AndExpression } from "../query/filter-expressions/and-expression";
import { BooleanLiteralExpression } from "../query/filter-expressions/boolean-literal-expression";
import { ComparisonExpression } from "../query/filter-expressions/comparison-expression";
import { FilterExpression } from "../query/filter-expressions/filter-expression";
import { FilterQueryExpression } from "../query/filter-expressions/filter-query-expression";
import { FunctionExpression } from "../query/filter-expressions/function-expression";
import { MissingExpression } from "../query/filter-expressions/missing-expression";
import { NotExpression } from "../query/filter-expressions/not-expression";
import { NullLiteralExpression } from "../query/filter-expressions/null-literal-expression";
import { NumberLiteralExpression } from "../query/filter-expressions/number-literal-expression";
import { OrExpression } from "../query/filter-expressions/or-expression";
import { ParanthesisExpression } from "../query/filter-expressions/paranthesis-expression";
import { StringLiteralExpression } from "../query/filter-expressions/string-literal-expression";
import { Query } from "../query/query";
import { SyntaxTreeNode } from "../query/syntax-tree-node";
import { IndexSelector } from "../query/selectors/index-selector";
import { SliceSelector } from "../query/selectors/slice-selector";
import { SyntaxTree } from "../query/syntax-tree";
import { SyntaxTreeToken } from "../query/syntax-tree-token";
import { TextRange } from "../text/text-range";

/**
 * JSONPath query checker.
 */
export class Checker {
    constructor (
        /**
         * Query options.
         */
        private readonly queryOptions: QueryOptions
    ) { }

    /**
     * Checks whether the query is valid and returns diagnostics. The query is valid if and only if the returned diagnostics contains no errors.
     * @param query Query.
     */
    check(query: Query): readonly Diagnostics[] {
        const context = new CheckerContext();
        this.checkRecursive(query, null, context);
        return context.diagnostics;
    }

    private checkRecursive(tree: SyntaxTreeNode, parent: SyntaxTree | null, context: CheckerContext) {
        if (tree instanceof FunctionExpression) {
            const functionDefinition = this.queryOptions.functions[tree.name];
            if (functionDefinition === undefined)
                context.addError(`Function '${tree.name}' is not defined.`, tree.nameToken.textRangeWithoutSkipped);
            else {
                if (parent instanceof ComparisonExpression) this.checkType(tree, Type.valueType, context);
                else if (!(parent instanceof FunctionExpression)) this.checkType(tree, Type.logicalType, context);

                if (functionDefinition.parameters.length !== tree.args.length)
                    context.addError(`Function '${tree.name}' expects ${functionDefinition.parameters.length} parameter/s but ${tree.args.length} was/were provided.`, tree.nameToken.textRangeWithoutSkipped);

                for (let i = 0; i < Math.min(tree.args.length, functionDefinition.parameters.length); i++) {
                    const parameterType = functionDefinition.parameters[i].type;
                    const arg = tree.args[i].arg;
                    this.checkType(arg, parameterType, context);
                }
            }
        }
        if (tree instanceof IndexSelector)
            this.checkIntegerRange(tree.index, tree.indexToken, context);
        if (tree instanceof SliceSelector) {
            if (tree.start !== null && tree.startToken !== null) this.checkIntegerRange(tree.start, tree.startToken, context);
            if (tree.end !== null && tree.endToken !== null) this.checkIntegerRange(tree.end, tree.endToken, context);
            if (tree.step !== null && tree.stepToken !== null) this.checkIntegerRange(tree.step, tree.stepToken, context);
        }

        for (const child of tree.children) {
            if (child instanceof SyntaxTreeNode) this.checkRecursive(child, tree, context);
        }
    }

    private checkType(expression: FilterExpression, targetType: Type, context: CheckerContext) {
        const expressionType = this.getType(targetType, expression, context);
        if (expressionType === null) return;
        const isAssignable = this.isAssignableTo(expressionType, targetType);
        if (!isAssignable)
            context.addError(`Type '${expressionType}' can not be used in the context where is expected '${targetType}'.`, expression.textRangeWithoutSkipped);
    }

    private getType(targetType: Type | null, expression: FilterExpression, context: CheckerContext): Type | null {
        if (expression instanceof FunctionExpression) {
            const functionDefinition = this.queryOptions.functions[expression.name];
            if (functionDefinition === undefined) return null;
            else return functionDefinition.returnType;
        }
        else if (expression instanceof FilterQueryExpression) {
            if (targetType === Type.valueType && expression.query.isSingular) return Type.valueType;
            else return Type.nodesType;
        }
        else if (expression instanceof ComparisonExpression) return Type.logicalType;
        else if (expression instanceof OrExpression) return Type.logicalType;
        else if (expression instanceof AndExpression) return Type.logicalType;
        else if (expression instanceof NotExpression) return Type.logicalType;
        else if (expression instanceof ParanthesisExpression) return Type.logicalType;
        else if (expression instanceof BooleanLiteralExpression) return Type.valueType;
        else if (expression instanceof StringLiteralExpression) return Type.valueType;
        else if (expression instanceof NumberLiteralExpression) return Type.valueType;
        else if (expression instanceof NullLiteralExpression) return Type.valueType;
        else if (expression instanceof MissingExpression) return null;
        throw new Error("Unknown filter expression type.");
    }

    private isAssignableTo(typeFrom: Type, typeTo: Type) {
        return typeFrom === typeTo || 
            typeFrom === Type.nodesType && typeTo === Type.logicalType; // Implicit conversion.
    }

    private checkIntegerRange(number: number, numberToken: SyntaxTreeToken, context: CheckerContext) {
        if (!Number.isSafeInteger(number))
            context.addError("Integer has to be within the interval [-(2^53)+1, (2^53)-1].", numberToken.textRangeWithoutSkipped);
    }
}

class CheckerContext {
    private readonly _diagnostics: Diagnostics[] = [];

    addError(message: string, textRange: TextRange) {
        const diagnostics = new Diagnostics(DiagnosticsSeverity.error, message, textRange);
        this._diagnostics.push(diagnostics);
    }

    get diagnostics(): readonly Diagnostics[] {
        return this._diagnostics;
    }
}