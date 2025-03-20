import { JSONPathFilterValue, JSONPathNothing } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathToken } from "../token";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathMissingExpression extends JSONPathFilterExpression {
    constructor(
        readonly missingToken: JSONPathToken
    ) {
        super([missingToken]);
    }

    get type() { return JSONPathSyntaxTreeType.missingExpression; }

    protected evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return JSONPathNothing;
    }
}
