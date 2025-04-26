import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Number literal.
 */
export class NumberLiteralExpression extends FilterExpression {
    constructor(
        /**
         * Value token.
         */
        readonly valueToken: SyntaxTreeToken,

        /**
         * Value.
         */
        readonly value: number
    ) {
        super([valueToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.numberLiteralExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.value;
    }
}
