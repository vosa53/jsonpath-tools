import { Node } from "./query/located-node";

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export const Nothing: unique symbol = Symbol("Nothing");

export const LogicalTrue: unique symbol = Symbol("LogicalTrue");
export const LogicalFalse: unique symbol = Symbol("LogicalFalse");

export class NodeList {
    constructor(
        readonly nodes: readonly Node[]
    ) { }

    static readonly empty = new NodeList([]);
}

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

export function deepEquals(left: JSONValue, right: JSONValue): boolean {
    if (typeof left === "number" && typeof right === "number")
        return left === right;
    if (typeof left === "string" && typeof right === "string")
        return left === right;
    if (typeof left === "boolean" && typeof right === "boolean")
        return left === right;
    if (left === null && right === null)
        return true;
    if (Array.isArray(left) && Array.isArray(right))
        return deepEqualsArrays(left, right);
    if (typeof left === "object" && left !== null && !Array.isArray(left) && typeof right === "object" && right !== null && !Array.isArray(right))
        return deepEqualsObjects(left, right);
    return false;
}

function deepEqualsArrays(left: JSONValue[], right: JSONValue[]): boolean {
    if (left.length !== right.length)
        return false;
    for (let i = 0; i < left.length; i++) {
        if (!deepEquals(left[i], right[i]))
            return false;
    }
    return true;
}

function deepEqualsObjects(left: { [key: string]: JSONValue; }, right: { [key: string]: JSONValue; }): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length)
        return false;
    for (const key of leftKeys) {
        if (!right.hasOwnProperty(key) || !deepEquals(left[key], right[key]))
            return false;
    }
    return true;
}