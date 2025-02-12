import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


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
