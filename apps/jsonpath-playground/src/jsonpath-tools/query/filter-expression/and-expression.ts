import { FilterValue, LogicalFalse, LogicalTrue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../helpers";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class AndExpression extends FilterExpression {
    constructor(
        readonly expressions: { expression: FilterExpression; andToken: SyntaxTreeToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.andToken]));
    }

    get type() { return SyntaxTreeType.andExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === LogicalFalse)
                return LogicalFalse;
        }
        return LogicalTrue;
    }
}
