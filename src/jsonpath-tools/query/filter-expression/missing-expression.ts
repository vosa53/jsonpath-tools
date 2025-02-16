import { JSONPathFilterValue, JSONPathNothing } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathSyntaxTreeType } from "../syntax-tree-type";
import { JSONPathFilterExpression } from "./filter-expression";


export class JSONPathMissingExpression extends JSONPathFilterExpression {
    constructor(position: number) {
        super([], position);
    }

    get type() { return JSONPathSyntaxTreeType.notExpression; }

    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        return JSONPathNothing;
    }
}
