import { FilterValue, LogicalFalse, LogicalTrue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Logical AND.
 */
export class AndExpression extends FilterExpression {
    constructor(
        /**
         * Logical expressions.
         */
        readonly expressions: { expression: FilterExpression; andToken: SyntaxTreeToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.andToken]));
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.andExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === LogicalFalse)
                return LogicalFalse;
        }
        return LogicalTrue;
    }
}
