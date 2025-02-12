import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


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
