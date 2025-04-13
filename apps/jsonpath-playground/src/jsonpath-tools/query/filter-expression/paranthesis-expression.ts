import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";

export class ParanthesisExpression extends FilterExpression {
    constructor(
        readonly openingParanthesisToken: SyntaxTreeToken,
        readonly expression: FilterExpression,
        readonly closingParanthesisToken: SyntaxTreeToken
    ) {
        super([openingParanthesisToken, expression, closingParanthesisToken]);
    }

    get type() { return SyntaxTreeType.paranthesisExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.expression.evaluate(queryContext, filterExpressionContext);
    }
}
