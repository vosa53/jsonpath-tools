export type JSONPathJSONValue = string | number | boolean | null | JSONPathJSONValue[] | { [key: string]: JSONPathJSONValue };
export const JSONPathNothing: unique symbol = Symbol("Nothing");

export const JSONPathLogicalTrue: unique symbol = Symbol("LogicalTrue");
export const JSONPathLogicalFalse: unique symbol = Symbol("LogicalFalse");

export class JSONPathNodeList {
    constructor(
        readonly nodes: JSONPathJSONValue[]
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