import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathBooleanLiteral extends JSONPathFilterExpression {
    constructor(
        readonly valueToken: JSONPathToken,

        readonly value: boolean
    ) {
        super([valueToken]);
    }

    get type() { return JSONPathSyntaxTreeType.booleanLiteral; }

    protected evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.value;
    }
}
