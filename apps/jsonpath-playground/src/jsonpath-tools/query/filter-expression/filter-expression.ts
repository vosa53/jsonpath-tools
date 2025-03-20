import { JSONPathFilterValue } from "../../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "../evaluation";
import { JSONPathNode } from "../node";


export abstract class JSONPathFilterExpression extends JSONPathNode {
    evaluate(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
        const output = this.evaluateImplementation(queryContext, filterExpressionContext);
        queryContext.filterExpressionInstrumentationCallback?.(this, output);
        return output;
    }

    protected abstract evaluateImplementation(queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue;
}
