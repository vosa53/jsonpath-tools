import { JSONPathFilterValue } from "../../types";
import { JSONPathNode } from "../node";
import { JSONPathFilterExpressionContext } from "../evaluation";
import { JSONPathQueryContext } from "../evaluation";


export abstract class JSONPathFilterExpression extends JSONPathNode {
    abstract evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue;
}
