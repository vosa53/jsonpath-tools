import { JSONValue } from "./json/json-types";
import { NodeList } from "./node-list";

export const Nothing: unique symbol = Symbol("Nothing");

export const LogicalTrue: unique symbol = Symbol("LogicalTrue");
export const LogicalFalse: unique symbol = Symbol("LogicalFalse");

export type ValueType = JSONValue | typeof Nothing;
export type LogicalType = typeof LogicalTrue | typeof LogicalFalse;
export type NodesType = NodeList;

export type FilterValue = ValueType | LogicalType | NodesType;

export function isValueType(value: FilterValue): value is ValueType {
    return !isLogicalType(value) && !isNodesType(value);
}

export function isLogicalType(value: FilterValue): value is LogicalType {
    return value === LogicalTrue || value === LogicalFalse;
}

export function isNodesType(value: FilterValue): value is NodesType {
    return value instanceof NodeList;
}
