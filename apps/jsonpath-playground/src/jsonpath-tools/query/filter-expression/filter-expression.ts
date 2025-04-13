import { FilterValue } from "../../values/types";
import { FilterExpressionContext, QueryContext } from "../evaluation";
import { SyntaxTreeNode } from "../syntax-tree-node";

/**
 * Expression in a filter selector.
 */
export abstract class FilterExpression extends SyntaxTreeNode {
    /**
     * Evaluates the expression in the given context and returns its value.
     * @param queryContext Query context.
     * @param filterExpressionContext Filter expression context.
     */
    evaluate(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
        const output = this.evaluateImplementation(queryContext, filterExpressionContext);
        queryContext.filterExpressionInstrumentationCallback?.(this, output);
        return output;
    }

    /**
     * {@inheritDoc evaluate}
     */
    protected abstract evaluateImplementation(queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue;
}
