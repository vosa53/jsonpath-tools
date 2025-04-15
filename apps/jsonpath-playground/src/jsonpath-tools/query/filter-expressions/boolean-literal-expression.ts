import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Boolean literal.
 */
export class BooleanLiteralExpression extends FilterExpression {
    constructor(
        /**
         * Value token.
         */
        readonly valueToken: SyntaxTreeToken,

        /**
         * Value.
         */
        readonly value: boolean
    ) {
        super([valueToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.booleanLiteralExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.value;
    }
}
