import { JSONPathFilterValue, JSONPathLogicalTrue, JSONPathLogicalFalse } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { evaluateAsLogicalType } from "../helpers";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathNotExpression extends JSONPathFilterExpression {
    constructor(
        readonly exlamationMarkToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression | null
    ) {
        super([exlamationMarkToken, expression]);
    }

    get type() { return JSONPathSyntaxTreeType.notExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const result = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
        return result === JSONPathLogicalTrue ? JSONPathLogicalFalse : JSONPathLogicalTrue;
    }
}
