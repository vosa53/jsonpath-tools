import { FilterValue, Nothing } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Missing expression.
 */
export class MissingExpression extends FilterExpression {
    constructor(
        /**
         * Missing token.
         */
        readonly missingToken: SyntaxTreeToken
    ) {
        super([missingToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.missingExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return Nothing;
    }
}
