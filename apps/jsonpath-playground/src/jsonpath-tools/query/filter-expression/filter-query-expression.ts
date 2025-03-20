import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathQuery } from "../query";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathFilterQueryExpression extends JSONPathFilterExpression {
    constructor(
        readonly query: JSONPathQuery
    ) {
        super([query]);
    }

    get type() { return JSONPathSyntaxTreeType.filterQueryExpression; }

    protected evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.query.select(queryContext, filterExpressionContext);
    }
}
