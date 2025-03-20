import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathNullLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nullLiteral; }

    protected evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return null;
    }
}
