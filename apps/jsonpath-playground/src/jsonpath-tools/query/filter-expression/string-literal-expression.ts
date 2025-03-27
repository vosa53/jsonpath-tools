import { FilterValue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class StringLiteralExpression extends FilterExpression {
    constructor(
        readonly valueToken: SyntaxTreeToken,

        readonly value: string
    ) {
        super([valueToken]);
    }

    get type() { return SyntaxTreeType.stringLiteral; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return this.value;
    }
}
