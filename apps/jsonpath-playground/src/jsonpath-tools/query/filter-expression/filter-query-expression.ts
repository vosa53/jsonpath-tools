import { FilterValue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SubQuery } from "../query";
import { SyntaxTreeType } from "../syntax-tree-type";
import { FilterExpression } from "./filter-expression";


export class FilterQueryExpression extends FilterExpression {
    constructor(
        readonly query: SubQuery
    ) {
        super([query]);
    }

    get type() { return SyntaxTreeType.filterQueryExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.query.select(queryContext, filterExpressionContext);
    }
}
