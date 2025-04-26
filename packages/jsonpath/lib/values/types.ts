import { JSONValue } from "../json/json-types";
import { NodeList } from "./node-list";

/**
 * Represents the absence of a JSON value.
 */
export const Nothing: unique symbol = Symbol("Nothing");

/**
 * Represents a truthy value in filter expressions.
 */
export const LogicalTrue: unique symbol = Symbol("LogicalTrue");

/**
 * Represents a falsy value in filter expressions.
 */
export const LogicalFalse: unique symbol = Symbol("LogicalFalse");

/**
 * {@link JSONValue} or {@link Nothing}.
 */
export type ValueType = JSONValue | typeof Nothing;

/**
 * {@link LogicalTrue} or {@link LogicalFalse}.
 */
export type LogicalType = typeof LogicalTrue | typeof LogicalFalse;

/**
 * {@link NodeList}.
 */
export type NodesType = NodeList;

/**
 * Value in filter expressions.
 */
export type FilterValue = ValueType | LogicalType | NodesType;

/**
 * Checks whether the given filter value is an instance of {@link ValueType}.
 * @param value Value.
 */
export function isValueType(value: FilterValue): value is ValueType {
    return !isLogicalType(value) && !isNodesType(value);
}

/**
 * Checks whether the given filter value is an instance of {@link LogicalType}.
 * @param value Value.
 */
export function isLogicalType(value: FilterValue): value is LogicalType {
    return value === LogicalTrue || value === LogicalFalse;
}

/**
 * Checks whether the given filter value is an instance of {@link NodesType}.
 * @param value Value.
 */
export function isNodesType(value: FilterValue): value is NodesType {
    return value instanceof NodeList;
}

/**
 * Type from the JSONPath type system.
 */
export enum Type {
    /**
     * {@inheritDoc ValueType}
     */
    valueType = "ValueType",

    /**
     * {@inheritDoc LogicalType}
     */
    logicalType = "LogicalType",

    /**
     * {@inheritDoc NodesType}
     */
    nodesType = "NodesType"
}
