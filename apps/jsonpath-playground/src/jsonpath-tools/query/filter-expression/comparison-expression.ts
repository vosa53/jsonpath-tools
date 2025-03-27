import { deepEquals, FilterValue, LogicalFalse, LogicalTrue, Nothing, ValueType } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsValueType } from "../helpers";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

export class ComparisonExpression extends FilterExpression {
    constructor(
        readonly left: FilterExpression,
        readonly operatorToken: SyntaxTreeToken,
        readonly right: FilterExpression,

        readonly operator: JSONPathComparisonOperator
    ) {
        super([left, operatorToken, right]);
    }

    get type() { return SyntaxTreeType.comparisonExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const leftValue = evaluateAsValueType(this.left, queryContext, filterExpressionContext);
        const rightValue = evaluateAsValueType(this.right, queryContext, filterExpressionContext);

        let result: boolean;
        if (this.operator === JSONPathComparisonOperator.equals)
            result = this.isEqual(leftValue, rightValue);
        else if (this.operator === JSONPathComparisonOperator.notEquals)
            result = !this.isEqual(leftValue, rightValue);
        else if (this.operator === JSONPathComparisonOperator.lessThan)
            result = this.isLower(leftValue, rightValue);
        else if (this.operator === JSONPathComparisonOperator.greaterThan)
            result = this.isLower(rightValue, leftValue);
        else if (this.operator === JSONPathComparisonOperator.lessThanEquals)
            result = this.isLower(leftValue, rightValue) || this.isEqual(leftValue, rightValue);
        else if (this.operator === JSONPathComparisonOperator.greaterThanEquals)
            result = this.isLower(rightValue, leftValue) || this.isEqual(leftValue, rightValue);
        else
            throw new Error("Unknown operator.");
        return result ? LogicalTrue : LogicalFalse;
    }

    private isEqual(left: ValueType, right: ValueType): boolean {
        if (left === Nothing || right === Nothing)
            return left === Nothing && right === Nothing;

        return deepEquals(left, right);
    }

    private isLower(left: ValueType, right: ValueType): boolean {
        if (left === Nothing || right === Nothing)
            return false;
        if (typeof left === "number" && typeof right === "number")
            return left < right;
        if (typeof left === "string" && typeof right === "string")
            return left < right;
        return false;
    }
}

export enum JSONPathComparisonOperator {
    equals = "==",
    notEquals = "!=",
    lessThan = "<",
    greaterThan = ">",
    lessThanEquals = "<=",
    greaterThanEquals = ">="
}