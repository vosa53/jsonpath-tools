import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

/**
 * Paranthesis.
 */
export class ParanthesisExpression extends FilterExpression {
    constructor(
        /**
         * Opening paranthesis token.
         */
        readonly openingParanthesisToken: SyntaxTreeToken,

        /**
         * Expression.
         */
        readonly expression: FilterExpression,

        /**
         * Closing paranthesis token.
         */
        readonly closingParanthesisToken: SyntaxTreeToken
    ) {
        super([openingParanthesisToken, expression, closingParanthesisToken]);
    }

    /**
     * @inheritdoc
     */
    get type() { return SyntaxTreeType.paranthesisExpression; }

    /**
     * @inheritdoc
     */
    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.expression.evaluate(queryContext, filterExpressionContext);
    }
}
