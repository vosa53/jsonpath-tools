import { JSONPathType } from "../options";
import { isLogicalType, isNodesType, isValueType, JSONPathFilterValue, JSONPathLogicalFalse, JSONPathLogicalTrue, JSONPathLogicalType, JSONPathNodeList, JSONPathNodesType, JSONPathNothing, JSONPathValueType } from "../types";
import { JSONPathFilterExpression } from "./filter-expression/filter-expression";
import { JSONPathQueryContext } from "./evaluation";
import { JSONPathFilterExpressionContext } from "./evaluation";

export function evaluateAsLogicalType(expression: JSONPathFilterExpression | null, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathLogicalType {
    const value = expression?.evaluate(queryContext, filterExpressionContext);
    if (value === undefined) return JSONPathLogicalFalse;
    if (isLogicalType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? JSONPathLogicalTrue : JSONPathLogicalFalse;

    return JSONPathLogicalFalse;
}

export function evaluateAsValueType(expression: JSONPathFilterExpression | null, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathValueType {
    const value = expression?.evaluate(queryContext, filterExpressionContext);
    if (value === undefined) return JSONPathNothing;
    if (isValueType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? value.nodes[0] : JSONPathNothing;

    return JSONPathNothing;
}

export function evaluateAsNodesType(expression: JSONPathFilterExpression | null, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathNodesType {
    const value = expression?.evaluate(queryContext, filterExpressionContext);
    if (value === undefined) return JSONPathNodeList.empty;
    if (isNodesType(value)) return value;

    return JSONPathNodeList.empty;
}

export function evaluateAs(expression: JSONPathFilterExpression | null, type: JSONPathType, queryContext: JSONPathQueryContext, filterExpressionContext: JSONPathFilterExpressionContext): JSONPathFilterValue {
    if (type === JSONPathType.logicalType)
        return evaluateAsLogicalType(expression, queryContext, filterExpressionContext);
    else if (type === JSONPathType.valueType)
        return evaluateAsValueType(expression, queryContext, filterExpressionContext);
    else
        return evaluateAsNodesType(expression, queryContext, filterExpressionContext);
}
