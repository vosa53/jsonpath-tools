import { JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../helpers";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathOrExpression extends JSONPathFilterExpression {
    constructor(
        readonly expressions: { expression: JSONPathFilterExpression; orToken: JSONPathToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.orToken]));
    }

    get type() { return JSONPathSyntaxTreeType.orExpression; }

    protected evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === JSONPathLogicalTrue)
                return JSONPathLogicalTrue;
        }
        return JSONPathLogicalFalse;
    }
}
