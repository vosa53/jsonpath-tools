import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathStringLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: string
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.stringLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.value;
    }
}
