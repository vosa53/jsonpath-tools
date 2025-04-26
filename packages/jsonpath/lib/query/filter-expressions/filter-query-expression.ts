import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SubQuery } from "../sub-query";
import { SyntaxTreeType } from "../syntax-tree-type";
import { FilterExpression } from "./filter-expression";

/**
 * Subquery in a filter expression.
 */
export class FilterQueryExpression extends FilterExpression {
    constructor(
        /**
         * Query.
         */
        readonly query: SubQuery
    ) {
        super([query]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.filterQueryExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.query.select(queryContext, filterExpressionContext);
    }
}
