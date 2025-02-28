import { JSONPathDiagnostics, JSONPathDiagnosticsType } from "../diagnostics";
import { JSONPathOptions, JSONPathType } from "../options";
import { JSONPathAndExpression } from "../query/filter-expression/and-expression";
import { JSONPathBooleanLiteral } from "../query/filter-expression/boolean-literal";
import { JSONPathComparisonExpression } from "../query/filter-expression/comparison-expression";
import { JSONPathFilterExpression } from "../query/filter-expression/filter-expression";
import { JSONPathFilterQueryExpression } from "../query/filter-expression/filter-query-expression";
import { JSONPathFunctionExpression } from "../query/filter-expression/function-expression";
import { JSONPathMissingExpression } from "../query/filter-expression/missing-expression";
import { JSONPathNotExpression } from "../query/filter-expression/not-expression";
import { JSONPathNullLiteral } from "../query/filter-expression/null-literal";
import { JSONPathNumberLiteral } from "../query/filter-expression/number-literal";
import { JSONPathOrExpression } from "../query/filter-expression/or-expression";
import { JSONPathParanthesisExpression } from "../query/filter-expression/paranthesis-expression";
import { JSONPathStringLiteral } from "../query/filter-expression/string-literal";
import { JSONPath } from "../query/json-path";
import { JSONPathNode } from "../query/node";
import { JSONPathIndexSelector } from "../query/selectors/index-selector";
import { JSONPathSliceSelector } from "../query/selectors/slice-selector";
import { JSONPathSyntaxTree } from "../query/syntax-tree";
import { JSONPathToken } from "../query/token";
import { TextRange } from "../text-range";

export class TypeChecker {
    constructor (private readonly options: JSONPathOptions) {

    }

    check(query: JSONPath): readonly JSONPathDiagnostics[] {
        const context = new TypeCheckerContext();
        this.checkRecursive(query, null, context);
        return context.diagnostics;
    }

    private checkRecursive(tree: JSONPathNode, parent: JSONPathSyntaxTree | null, context: TypeCheckerContext) {
        if (tree instanceof JSONPathFunctionExpression) {
            const functionDefinition = this.options.functions[tree.name];
            if (functionDefinition === undefined)
                context.addError(`Function '${tree.name}' is not defined.`, tree.nameToken.textRange);
            else {
                if (parent instanceof JSONPathComparisonExpression) this.checkType(tree, JSONPathType.valueType, context);
                else if (parent instanceof JSONPathFunctionExpression) { }
                else this.checkType(tree, JSONPathType.logicalType, context);

                if (functionDefinition.parameterTypes.length !== tree.args.length)
                    context.addError(`Function '${tree.name}' expects ${functionDefinition.parameterTypes.length} parameter/s but ${tree.args.length} was/were provided.`, tree.nameToken.textRange);

                for (let i = 0; i < Math.min(tree.args.length, functionDefinition.parameterTypes.length); i++) {
                    const parameterType = functionDefinition.parameterTypes[i];
                    const arg = tree.args[i].arg;
                    if (arg != null) this.checkType(arg, parameterType, context);
                }
            }
        }
        if (tree instanceof JSONPathIndexSelector)
            this.checkIntegerRange(tree.index, tree.indexToken, context);
        if (tree instanceof JSONPathSliceSelector) {
            if (tree.start !== null && tree.startToken !== null) this.checkIntegerRange(tree.start, tree.startToken, context);
            if (tree.end !== null && tree.endToken !== null) this.checkIntegerRange(tree.end, tree.endToken, context);
            if (tree.step !== null && tree.stepToken !== null) this.checkIntegerRange(tree.step, tree.stepToken, context);
        }

        for (const child of tree.children) {
            if (child instanceof JSONPathNode) this.checkRecursive(child, tree, context);
        }
    }

    private checkType(expression: JSONPathFilterExpression, targetType: JSONPathType, context: TypeCheckerContext) {
        const expressionType = this.getType(targetType, expression, context);
        if (expressionType === null) return;
        const isAssignable = this.isAssignableTo(expressionType, targetType);
        if (!isAssignable)
            context.addError(`Type '${expressionType}' can not be used in the context where is expected '${targetType}'.`, expression.textRange);
    }

    private getType(targetType: JSONPathType | null, expression: JSONPathFilterExpression, context: TypeCheckerContext): JSONPathType | null {
        if (expression instanceof JSONPathFunctionExpression) {
            const functionDefinition = this.options.functions[expression.name];
            if (functionDefinition === undefined) return null;
            else return functionDefinition.returnType;
        }
        else if (expression instanceof JSONPathFilterQueryExpression) {
            if (targetType === JSONPathType.valueType && expression.query.isSingular) return JSONPathType.valueType;
            else return JSONPathType.nodesType;
        }
        else if (expression instanceof JSONPathComparisonExpression) return JSONPathType.logicalType;
        else if (expression instanceof JSONPathOrExpression) return JSONPathType.logicalType;
        else if (expression instanceof JSONPathAndExpression) return JSONPathType.logicalType;
        else if (expression instanceof JSONPathNotExpression) return JSONPathType.logicalType;
        else if (expression instanceof JSONPathParanthesisExpression) return JSONPathType.logicalType;
        else if (expression instanceof JSONPathBooleanLiteral) return JSONPathType.valueType;
        else if (expression instanceof JSONPathStringLiteral) return JSONPathType.valueType;
        else if (expression instanceof JSONPathNumberLiteral) return JSONPathType.valueType;
        else if (expression instanceof JSONPathNullLiteral) return JSONPathType.valueType;
        else if (expression instanceof JSONPathMissingExpression) return null;
        throw new Error("Unknown filter expression type.");
    }

    private isAssignableTo(typeFrom: JSONPathType, typeTo: JSONPathType) {
        return typeFrom === typeTo || 
            typeFrom === JSONPathType.nodesType && typeTo === JSONPathType.logicalType; // Implicit conversion.
    }

    private checkIntegerRange(number: number, numberToken: JSONPathToken, context: TypeCheckerContext) {
        if (!Number.isSafeInteger(number))
            context.addError("Integer has to be within interval [-(2^53)+1, (2^53)-1].", numberToken.textRange);
    }
}

class TypeCheckerContext {
    private _diagnostics: JSONPathDiagnostics[] = [];

    addError(message: string, textRange: TextRange) {
        const diagnostics: JSONPathDiagnostics = { type: JSONPathDiagnosticsType.error, message, textRange };
        this._diagnostics.push(diagnostics);
    }

    get diagnostics(): readonly JSONPathDiagnostics[] {
        return this._diagnostics;
    }
}