import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class NullLiteralExpression extends FilterExpression {
    constructor(
        readonly valueToken: SyntaxTreeToken
    ) {
        super([valueToken]);
    }

    get type() { return SyntaxTreeType.nullLiteral; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return null;
    }
}
