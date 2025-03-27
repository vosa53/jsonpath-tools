import { Diagnostics } from "../diagnostics";
import { QueryOptions } from "../options";
import { FilterValue, isLogicalType, isNodesType, isValueType, LogicalFalse, LogicalTrue, LogicalType, NodesType, Nothing, Type, ValueType } from "../values/types";
import { JSONValue } from "../json/json-types";
import { FilterExpression } from "./filter-expression/filter-expression";
import { Node } from "../values/node";
import { SubQuery } from "./sub-query";
import { Segment } from "./segment";
import { Selector } from "./selectors/selector";
import { IndexOnlyArray } from "../helpers/array";
import { NodeList } from "../values/node-list";

export interface QueryContext {
    readonly rootNode: JSONValue;
    readonly options: QueryOptions;
    readonly queryInstrumentationCallback?: (query: SubQuery, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;
    readonly segmentInstrumentationCallback?: (segment: Segment, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;
    readonly selectorInstrumentationCallback?: (selector: Selector, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;
    readonly filterExpressionInstrumentationCallback?: (filterExpression: FilterExpression, output: FilterValue) => void;
    readonly reportDiagnosticsCallback?: (diagnostics: Diagnostics) => void;
}

export interface FilterExpressionContext {
    readonly currentNode: JSONValue;
}

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
