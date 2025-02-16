import { JSONPathFilterValue, JSONPathLogicalFalse } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathParanthesisExpression extends JSONPathFilterExpression {
    constructor(
        readonly openingParanthesisToken: JSONPathToken,
        readonly expression: JSONPathFilterExpression,
        readonly closingParanthesisToken: JSONPathToken | null
    ) {
        super([openingParanthesisToken, expression, closingParanthesisToken]);
    }

    get type() { return JSONPathSyntaxTreeType.paranthesisExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        if (this.expression === null)
            return JSONPathLogicalFalse;
        return this.expression.evaluate(queryContext, filterExpressionContext);
    }
}
