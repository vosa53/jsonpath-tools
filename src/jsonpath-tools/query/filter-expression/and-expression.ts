import { JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../helpers";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathAndExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression; andToken: JSONPathToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.andToken]));
    }

    get type() { return JSONPathSyntaxTreeType.andExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === JSONPathLogicalFalse)
                return JSONPathLogicalFalse;
        }
        return JSONPathLogicalTrue;
    }
}
