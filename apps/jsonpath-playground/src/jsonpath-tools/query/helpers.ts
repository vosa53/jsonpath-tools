import { JSONPathType } from "../options";
import { isLogicalType, isNodesType, isValueType, JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathLogicalType, JSONPathNodeList, JSONPathNodesType, JSONPathNothing, JSONPathValueType } from "../types";
import { JSONPathFilterExpressionContext, JSONPathQueryContext } from "./evaluation";
import { JSONPathFilterExpression } from "./filter-expression/filter-expression";

export function evaluateAsLogicalType(expression: JSONPathFilterExpression, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathLogicalType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    if (isLogicalType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? JSONPathLogicalTrue : JSONPathLogicalFalse;

    return JSONPathLogicalFalse;
}

export function evaluateAsValueType(expression: JSONPathFilterExpression, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathValueType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    if (isValueType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? value.nodes[0].value : JSONPathNothing;

    return JSONPathNothing;
}

export function evaluateAsNodesType(expression: JSONPathFilterExpression, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathNodesType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    if (isNodesType(value)) return value;

    return JSONPathNodeList.empty;
}

export function evaluateAs(expression: JSONPathFilterExpression, type: JSONPathType, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
    if (type === JSONPathType.logicalType)
        return evaluateAsLogicalType(expression, queryContext, filterExpressionContext);
    else if (type === JSONPathType.valueType)
        return evaluateAsValueType(expression, queryContext, filterExpressionContext);
    else
        return evaluateAsNodesType(expression, queryContext, filterExpressionContext);
}
