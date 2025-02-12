import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathNumberLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: number
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.numberLiteral; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.value;
    }
}
