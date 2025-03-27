import { FilterValue, Nothing } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeType } from "../syntax-tree-type";
import { SyntaxTreeToken } from "../syntax-tree-token";
import { FilterExpression } from "./filter-expression";


export class MissingExpression extends FilterExpression {
    constructor(
        readonly missingToken: SyntaxTreeToken
    ) {
        super([missingToken]);
    }

    get type() { return SyntaxTreeType.missingExpression; }

    protected evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        return Nothing;
    }
}
