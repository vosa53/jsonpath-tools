import { JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../helpers";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


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
