import { FilterValue, LogicalFalse, LogicalTrue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../helpers";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class NotExpression extends FilterExpression {
    constructor(
        readonly exlamationMarkToken: SyntaxTreeToken,
        readonly expression: FilterExpression
    ) {
        super([exlamationMarkToken, expression]);
    }

    get type() { return SyntaxTreeType.notExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const result = evaluateAsLogicalType(this.expression, queryContext, filterExpressionContext);
        return result === LogicalTrue ? LogicalFalse : LogicalTrue;
    }
}
