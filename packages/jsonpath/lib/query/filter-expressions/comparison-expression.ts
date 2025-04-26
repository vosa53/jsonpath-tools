import { FilterValue, LogicalFalse, LogicalTrue, Nothing, ValueType } from "../../values/types";
import { jsonDeepEquals } from "../../json/deep-equals";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsValueType } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Comparison.
 */
export class ComparisonExpression extends FilterExpression {
    constructor(
        /**
         * Left expression.
         */
        readonly left: FilterExpression,

        /**
         * Operator token.
         */
        readonly operatorToken: SyntaxTreeToken,

        /**
         * Right expression.
         */
        readonly right: FilterExpression,

        /**
         * Operator.
         */
        readonly operator: ComparisonOperator
    ) {
        super([left, operatorToken, right]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.comparisonExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const leftValue = evaluateAsValueType(this.left, queryContext, filterExpressionContext);
        const rightValue = evaluateAsValueType(this.right, queryContext, filterExpressionContext);

        let result: boolean;
        if (this.operator === ComparisonOperator.equals)
            result = this.isEqual(leftValue, rightValue);
        else if (this.operator === ComparisonOperator.notEquals)
            result = !this.isEqual(leftValue, rightValue);
        else if (this.operator === ComparisonOperator.lessThan)
            result = this.isLower(leftValue, rightValue);
        else if (this.operator === ComparisonOperator.greaterThan)
            result = this.isLower(rightValue, leftValue);
        else if (this.operator === ComparisonOperator.lessThanEquals)
            result = this.isLower(leftValue, rightValue) || this.isEqual(leftValue, rightValue);
        else if (this.operator === ComparisonOperator.greaterThanEquals)
            result = this.isLower(rightValue, leftValue) || this.isEqual(leftValue, rightValue);
        else
            throw new Error("Unknown operator.");
        return result ? LogicalTrue : LogicalFalse;
    }

    private isEqual(left: ValueType, right: ValueType): boolean {
        if (left === Nothing || right === Nothing)
            return left === Nothing && right === Nothing;

        return jsonDeepEquals(left, right);
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

/**
 * Comparison operator.
 */
export enum ComparisonOperator {
    /**
     * Equal.
     */
    equals = "==",

    /**
     * Not equal.
     */
    notEquals = "!=",

    /**
     * Less than.
     */
    lessThan = "<",

    /**
     * Greater than.
     */
    greaterThan = ">",

    /**
     * Less than or equal.
     */
    lessThanEquals = "<=",

    /**
     * Greater than or equal.
     */
    greaterThanEquals = ">="
}