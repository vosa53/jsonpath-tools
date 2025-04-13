import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * String literal.
 */
export class StringLiteralExpression extends FilterExpression {
    constructor(
        /**
         * Value token.
         */
        readonly valueToken: SyntaxTreeToken,

        /**
         * Value.
         */
        readonly value: string
    ) {
        super([valueToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.stringLiteralExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.value;
    }
}
