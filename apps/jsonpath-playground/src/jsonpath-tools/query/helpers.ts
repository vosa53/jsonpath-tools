import { Type } from "../options";
import { isLogicalType, isNodesType, isValueType, FilterValue, LogicalFalse, LogicalTrue, LogicalType, NodeList, NodesType, Nothing, ValueType } from "../types";
import { FilterExpressionContext, QueryContext } from "./evaluation";
import { FilterExpression } from "./filter-expression/filter-expression";

export function evaluateAsLogicalType(expression: FilterExpression, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): LogicalType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    return convertToLogicalType(value);
}

export function evaluateAsValueType(expression: FilterExpression, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): ValueType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    return convertToValueType(value);

}

export function evaluateAsNodesType(expression: FilterExpression, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): NodesType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    return convertToNodesType(value);
}

export function evaluateAs(expression: FilterExpression, type: Type, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
    if (type === Type.logicalType)
        return evaluateAsLogicalType(expression, queryContext, filterExpressionContext);
    else if (type === Type.valueType)
        return evaluateAsValueType(expression, queryContext, filterExpressionContext);
    else
        return evaluateAsNodesType(expression, queryContext, filterExpressionContext);
}

export function convertToLogicalType(value: FilterValue): LogicalType {
    if (isLogicalType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? LogicalTrue : LogicalFalse;

    return LogicalFalse;
}

export function convertToValueType(value: FilterValue): ValueType {
    if (isValueType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? value.nodes[0].value : Nothing;

    return Nothing;
}

export function convertToNodesType(value: FilterValue): NodesType {
    if (isNodesType(value)) return value;

    return NodeList.empty;
}