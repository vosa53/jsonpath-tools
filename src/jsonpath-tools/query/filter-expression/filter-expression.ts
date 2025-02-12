import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathNode } from "../node";


export abstract class JSONPathFilterExpression extends JSONPathNode {
    abstract evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue;
}
