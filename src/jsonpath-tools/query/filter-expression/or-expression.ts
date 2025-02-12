import { JSONPathFilterValue, JSONPathLogicalTrue, JSONPathLogicalFalse } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { evaluateAsLogicalType } from "../helpers";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathOrExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression | null; orToken: JSONPathToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.orToken]));
    }

    get type() { return JSONPathSyntaxTreeType.orExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === JSONPathLogicalTrue)
                return JSONPathLogicalTrue;
        }
        return JSONPathLogicalFalse;
    }
}
