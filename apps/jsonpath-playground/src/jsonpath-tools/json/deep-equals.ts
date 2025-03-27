import { JSONValue } from "./json-types";

export function jsonDeepEquals(left: JSONValue, right: JSONValue): boolean {
    if (typeof left === "number" && typeof right === "number")
        return left === right;
    if (typeof left === "string" && typeof right === "string")
        return left === right;
    if (typeof left === "boolean" && typeof right === "boolean")
        return left === right;
    if (left === null && right === null)
        return true;
    if (Array.isArray(left) && Array.isArray(right))
        return jsonDeepEqualsArrays(left, right);
    if (typeof left === "object" && left !== null && !Array.isArray(left) && typeof right === "object" && right !== null && !Array.isArray(right))
        return jsonDeepEqualsObjects(left, right);
    return false;
}

function jsonDeepEqualsArrays(left: JSONValue[], right: JSONValue[]): boolean {
    if (left.length !== right.length)
        return false;
    for (let i = 0; i < left.length; i++) {
        if (!jsonDeepEquals(left[i], right[i]))
            return false;
    }
    return true;
}

function jsonDeepEqualsObjects(left: { [key: string]: JSONValue; }, right: { [key: string]: JSONValue; }): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length)
        return false;
    for (const key of leftKeys) {
        if (!right.hasOwnProperty(key) || !jsonDeepEquals(left[key], right[key]))
            return false;
    }
    return true;
}
