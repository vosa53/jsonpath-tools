import { FilterValue, LogicalFalse, LogicalTrue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { evaluateAsLogicalType } from "../helpers";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../token";
import { FilterExpression } from "./filter-expression";


export class OrExpression extends FilterExpression {
    constructor(
        readonly expressions: { expression: FilterExpression; orToken: SyntaxTreeToken | null; }[]
    ) {
        super(expressions.flatMap(e => [e.expression, e.orToken]));
    }

    get type() { return SyntaxTreeType.orExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        for (const expression of this.expressions) {
            const result = evaluateAsLogicalType(expression.expression, queryContext, filterExpressionContext);
            if (result === LogicalTrue)
                return LogicalTrue;
        }
        return LogicalFalse;
    }
}
