import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathNullLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.nullLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return null;
    }
}
