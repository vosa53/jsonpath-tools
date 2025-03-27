import { FilterValue } from "../../types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeNode } from "../node";


export abstract class FilterExpression extends SyntaxTreeNode {
    evaluate(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const output = this.evaluateImplementation(queryContext, filterExpressionContext);
        queryContext.filterExpressionInstrumentationCallback?.(this, output);
        return output;
    }

    protected abstract evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue;
}
