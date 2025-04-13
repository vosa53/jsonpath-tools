import { FilterValue, LogicalFalse, LogicalTrue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Logical NOT.
 */
export class NotExpression extends FilterExpression {
    constructor(
        /**
         * Preceding exclamation mark token.
         */
        readonly exlamationMarkToken: SyntaxTreeToken,

        /**
         * Logical expression.
         */
        readonly expression: FilterExpression
    ) {
        super([exlamationMarkToken, expression]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.notExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const result = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
        return result === LogicalTrue ? LogicalFalse : LogicalTrue;
    }
}
