import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class BooleanLiteralExpression extends FilterExpression {
    constructor(
        readonly valueToken: SyntaxTreeToken,

        readonly value: boolean
    ) {
        super([valueToken]);
    }

    get type() { return SyntaxTreeType.booleanLiteral; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.value;
    }
}
