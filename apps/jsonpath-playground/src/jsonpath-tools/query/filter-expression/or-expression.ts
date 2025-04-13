import { FilterValue, LogicalFalse, LogicalTrue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Logical OR.
 */
export class OrExpression extends FilterExpression {
    constructor(
        /**
         * Logical expressions.
         */
        readonly expressions: { expression: FilterExpression; orToken: SyntaxTreeToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.orToken]));
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.orExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === LogicalTrue)
                return LogicalTrue;
        }
        return LogicalFalse;
    }
}
