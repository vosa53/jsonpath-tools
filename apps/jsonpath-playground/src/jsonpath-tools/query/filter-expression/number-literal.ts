import { FilterValue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../token";
import { FilterExpression } from "./filter-expression";


export class NumberLiteralExpression extends FilterExpression {
    constructor(
        readonly valueToken: SyntaxTreeToken,

        readonly value: number
    ) {
        super([valueToken]);
    }

    get type() { return SyntaxTreeType.numberLiteral; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.value;
    }
}
