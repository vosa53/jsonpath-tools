import { Diagnostics } from "../diagnostics";
import { QueryOptions } from "../options";
import { FilterValue, isLogicalType, isNodesType, isValueType, LogicalFalse, LogicalTrue, LogicalType, NodesType, Nothing, Type, ValueType } from "../values/types";
import { JSONValue } from "../json/json-types";
import { FilterExpression } from "./filter-expressions/filter-expression";
import { Node } from "../values/node";
import { SubQuery } from "./sub-query";
import { Segment } from "./segment";
import { Selector } from "./selectors/selector";
import { IndexOnlyArray } from "../helpers/array";
import { NodeList } from "../values/node-list";

/**
 * Context of a query evaluation.
 */
export interface QueryContext {
    /**
     * Query argument.
     */
    readonly argument: JSONValue;

    /**
     * Query options.
     */
    readonly options: QueryOptions;

    /**
     * Callback called every time a {@link SubQuery} is evaluated.
     * @param query Query.
     * @param input Input node.
     * @param outputArray Output nodes array. **It can also contain unrelated nodes, refer to {@link outputStartIndex} and {@link outputLength}.**
     * @param outputStartIndex Start index of the relevant part in {@link outputArray}.
     * @param outputLength Length of the relevant part in {@link outputArray}.
     */
    readonly queryInstrumentationCallback?: (query: SubQuery, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;

    /**
     * Callback called every time a {@link Segment} is evaluated.
     * @param segment Segment.
     * @param input Input node.
     * @param outputArray Output nodes array. **It can also contain unrelated nodes, refer to {@link outputStartIndex} and {@link outputLength}.**
     * @param outputStartIndex Start index of the relevant part in {@link outputArray}.
     * @param outputLength Length of the relevant part in {@link outputArray}.
     */
    readonly segmentInstrumentationCallback?: (segment: Segment, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;

    /**
     * Callback called every time a {@link Selector} is evaluated.
     * @param selector Selector.
     * @param input Input node.
     * @param outputArray Output nodes array. **It can also contain unrelated nodes, refer to {@link outputStartIndex} and {@link outputLength}.**
     * @param outputStartIndex Start index of the relevant part in {@link outputArray}.
     * @param outputLength Length of the relevant part in {@link outputArray}.
     */
    readonly selectorInstrumentationCallback?: (selector: Selector, input: Node, outputArray: IndexOnlyArray<Node>, outputStartIndex: number, outputLength: number) => void;

    /**
     * Callback called every time a {@link FilterExpression} is evaluated.
     * @param filterExpression Filter expression.
     * @param output Output value.
     */
    readonly filterExpressionInstrumentationCallback?: (filterExpression: FilterExpression, output: FilterValue) => void;

    /**
     * Callback called every time a runtime diagnostics is reported.
     * @param diagnostics Diagnostics.
     */
    readonly reportDiagnosticsCallback?: (diagnostics: Diagnostics) => void;
}

/**
 * Context of a query filter selector filter expression evaluation.
 */
export interface FilterExpressionContext {
    /**
     * Current tested value.
     */
    readonly current: JSONValue;
}

/**
 * Evaluates the given expression as a {@link LogicalType} and returns its result.
 * @param expression Expression.
 * @param queryContext Query context.
 * @param filterExpressionContext Filter expression context.
 */
export function evaluateAsLogicalType(expression: FilterExpression, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): LogicalType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    return convertToLogicalType(value);
}

/**
 * Evaluates the given expression as a {@link ValueType} and returns its result.
 * @param expression Expression.
 * @param queryContext Query context.
 * @param filterExpressionContext Filter expression context.
 */
export function evaluateAsValueType(expression: FilterExpression, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): ValueType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    return convertToValueType(value);
}

/**
 * Evaluates the given expression as a {@link NodesType} and returns its result.
 * @param expression Expression.
 * @param queryContext Query context.
 * @param filterExpressionContext Filter expression context.
 */
export function evaluateAsNodesType(expression: FilterExpression, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): NodesType {
    const value = expression.evaluate(queryContext, filterExpressionContext);
    return convertToNodesType(value);
}

/**
 * Evaluates the given expression as a {@link type} and returns its result.
 * @param expression Expression.
 * @param type Type.
 * @param queryContext Query context.
 * @param filterExpressionContext Filter expression context.
 */
export function evaluateAs(expression: FilterExpression, type: Type, queryContext: QueryContext, filterExpressionContext: FilterExpressionContext): FilterValue {
    if (type === Type.logicalType)
        return evaluateAsLogicalType(expression, queryContext, filterExpressionContext);
    else if (type === Type.valueType)
        return evaluateAsValueType(expression, queryContext, filterExpressionContext);

    else
        return evaluateAsNodesType(expression, queryContext, filterExpressionContext);
}

/**
 * Converts the given value to {@link LogicalType}.
 * @param value Value.
 */
export function convertToLogicalType(value: FilterValue): LogicalType {
    if (isLogicalType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? LogicalTrue : LogicalFalse;

    return LogicalFalse;
}

/**
 * Converts the given value to {@link ValueType}.
 * @param value Value.
 */
export function convertToValueType(value: FilterValue): ValueType {
    if (isValueType(value)) return value;

    // Implicit conversion.
    if (isNodesType(value))
        return value.nodes.length !== 0 ? value.nodes[0].value : Nothing;

    return Nothing;
}

/**
 * Converts the given value to {@link NodesType}.
 * @param value Value.
 */
export function convertToNodesType(value: FilterValue): NodesType {
    if (isNodesType(value)) return value;

    return NodeList.empty;
}
