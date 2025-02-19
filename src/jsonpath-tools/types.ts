import { LocatedNode } from "./query/located-node";

export type JSONPathJSONValue = string | number | boolean | null | JSONPathJSONValue[] | { [key: string]: JSONPathJSONValue };
export const JSONPathNothing: unique symbol = Symbol("Nothing");

export const JSONPathLogicalTrue: unique symbol = Symbol("LogicalTrue");
export const JSONPathLogicalFalse: unique symbol = Symbol("LogicalFalse");

export class JSONPathNodeList {
    constructor(
        readonly nodes: LocatedNode[]
    ) { }

    static readonly empty = new JSONPathNodeList([]);
}

export type JSONPathValueType = JSONPathJSONValue | typeof JSONPathNothing;
export type JSONPathLogicalType = typeof JSONPathLogicalTrue | typeof JSONPathLogicalFalse;
export type JSONPathNodesType = JSONPathNodeList;

export type JSONPathFilterValue = JSONPathValueType | JSONPathLogicalType | JSONPathNodesType;

export function isValueType(value: JSONPathFilterValue): value is JSONPathValueType {
    return !isLogicalType(value) && !isNodesType(value);
}

export function isLogicalType(value: JSONPathFilterValue): value is JSONPathLogicalType {
    return value === JSONPathLogicalTrue || value === JSONPathLogicalFalse;
}

export function isNodesType(value: JSONPathFilterValue): value is JSONPathNodesType {
    return value instanceof JSONPathNodeList;
}

export function deepEquals(left: JSONPathJSONValue, right: JSONPathJSONValue): boolean {
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

function deepEqualsArrays(left: JSONPathJSONValue[], right: JSONPathJSONValue[]): boolean {
    if (left.length !== right.length)
        return false;
    for (let i = 0; i < left.length; i++) {
        if (!deepEquals(left[i], right[i]))
            return false;
    }
    return true;
}

function deepEqualsObjects(left: { [key: string]: JSONPathJSONValue; }, right: { [key: string]: JSONPathJSONValue; }): boolean {
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