import { deepEquals, JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathNothing, JSONPathValueType } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { evaluateAsValueType } from "../helpers";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathComparisonExpression extends JSONPathFilterExpression {
    constructor(
        readonly left: JSONPathFilterExpression,
        readonly operatorToken: JSONPathToken,
        readonly right: JSONPathFilterExpression,

        readonly operator: string
    ) {
        super([left, operatorToken, right]);
    }

    get type() { return JSONPathSyntaxTreeType.comparisonExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const leftValue = evaluateAsValueType(this.left, queryContext, filterExpressionContext);
        const rightValue = evaluateAsValueType(this.right, queryContext, filterExpressionContext);

        let result: boolean;
        if (this.operatorToken.type === JSONPathSyntaxTreeType.doubleEqualsToken)
            result = this.isEqual(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.exclamationMarkEqualsToken)
            result = !this.isEqual(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.lessThanToken)
            result = this.isLower(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.greaterThanToken)
            result = this.isLower(rightValue, leftValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.lessThanEqualsToken)
            result = this.isLower(leftValue, rightValue) || this.isEqual(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.greaterThanEqualsToken)
            result = this.isLower(rightValue, leftValue) || this.isEqual(leftValue, rightValue);
        else
            throw new Error("Unknown operator.");
        return result ? JSONPathLogicalTrue : JSONPathLogicalFalse;
    }

    private isEqual(left: JSONPathValueType, right: JSONPathValueType): boolean {
        if (left === JSONPathNothing || right === JSONPathNothing)
            return left === JSONPathNothing && right === JSONPathNothing;

        return deepEquals(left, right);
    }

    private isLower(left: JSONPathValueType, right: JSONPathValueType): boolean {
        if (left === JSONPathNothing || right === JSONPathNothing)
            return false;
        if (typeof left === "number" && typeof right === "number")
            return left < right;
        if (typeof left === "string" && typeof right === "string")
            return left < right;
        return false;
    }
}
