import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Null literal.
 */
export class NullLiteralExpression extends FilterExpression {
    constructor(
        /**
         * Value token.
         */
        readonly valueToken: SyntaxTreeToken
    ) {
        super([valueToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.nullLiteralExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return null;
    }
}
