import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpression } from "./filter-expression";
import { JSONPathQuery } from "../query";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export class JSONPathFilterQueryExpression extends JSONPathFilterExpression {
    constructor(
        readonly query: JSONPathQuery
    ) {
        super([query]);
    }

    get type() { return JSONPathSyntaxTreeType.filterQueryExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return this.query.select(queryContext, filterExpressionContext);
    }
}
