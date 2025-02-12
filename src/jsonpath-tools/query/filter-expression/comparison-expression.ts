import { JSONPathFilterValue, JSONPathLogicalTrue, JSONPathLogicalFalse, JSONPathValueType, JSONPathNothing } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { evaluateAsValueType } from "../helpers";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathComparisonExpression extends JSONPathFilterExpression {
    constructor(
        readonly left: JSONPathFilterExpression | null,
        readonly operatorToken: JSONPathToken,
        readonly right: JSONPathFilterExpression | null,

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
            result = this.evaluateEquals(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.exclamationMarkEqualsToken)
            result = !this.evaluateEquals(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.lessThanToken)
            result = this.evaluateLower(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.greaterThanToken)
            result = this.evaluateLower(rightValue, leftValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.lessThanEqualsToken)
            result = this.evaluateLower(leftValue, rightValue) || this.evaluateEquals(leftValue, rightValue);
        else if (this.operatorToken.type === JSONPathSyntaxTreeType.greaterThanEqualsToken)
            result = this.evaluateLower(rightValue, leftValue) || this.evaluateEquals(leftValue, rightValue);

        else
            throw new Error("Unknown operator.");
        return result ? JSONPathLogicalTrue : JSONPathLogicalFalse;
    }

    private evaluateEquals(left: JSONPathValueType, right: JSONPathValueType): boolean {
        if (left === JSONPathNothing || right === JSONPathNothing)
            return left === JSONPathNothing && right === JSONPathNothing;

        if (typeof left === "number" && typeof right === "number")
            return left === right;
        if (typeof left === "string" && typeof right === "string")
            return left === right;
        if (typeof left === "boolean" && typeof right === "boolean")
            return left === right;
        if (left === null && right === null)
            return true;
        if (Array.isArray(left) && Array.isArray(right))
            return this.compareArrays(left, right);
        if (typeof left === "object" && left !== null && !Array.isArray(left) && typeof right === "object" && right !== null && !Array.isArray(right))
            return this.compareObjects(left, right);
        return false;
    }

    private evaluateLower(left: JSONPathValueType, right: JSONPathValueType): boolean {
        if (left === JSONPathNothing || right === JSONPathNothing)
            return false;
        if (typeof left === "number" && typeof right === "number")
            return left < right;
        if (typeof left === "string" && typeof right === "string")
            return left < right;
        return false;
    }

    private compareArrays(left: JSONPathValueType[], right: JSONPathValueType[]): boolean {
        if (left.length !== right.length)
            return false;
        for (let i = 0; i < left.length; i++) {
            if (!this.evaluateEquals(left[i], right[i]))
                return false;
        }
        return true;
    }

    private compareObjects(left: { [key: string]: JSONPathValueType; }, right: { [key: string]: JSONPathValueType; }): boolean {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length)
            return false;
        for (const key of leftKeys) {
            if (!right.hasOwnProperty(key) || !this.evaluateEquals(left[key], right[key]))
                return false;
        }
        return true;
    }
}
