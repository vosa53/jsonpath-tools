import { JSONValue } from "./json-types";

/**
 * Checks whether the two given JSON values are deeply equal.
 * @param valueA JSON value A.
 * @param valueB JSON value B.
 */
export function jsonDeepEquals(valueA: JSONValue, valueB: JSONValue): boolean {
    if (typeof valueA === "number" && typeof valueB === "number")
        return valueA === valueB;
    if (typeof valueA === "string" && typeof valueB === "string")
        return valueA === valueB;
    if (typeof valueA === "boolean" && typeof valueB === "boolean")
        return valueA === valueB;
    if (valueA === null && valueB === null)
        return true;
    if (Array.isArray(valueA) && Array.isArray(valueB))
        return jsonDeepEqualsArrays(valueA, valueB);
    if (typeof valueA === "object" && valueA !== null && !Array.isArray(valueA) && typeof valueB === "object" && valueB !== null && !Array.isArray(valueB))
        return jsonDeepEqualsObjects(valueA, valueB);
    return false;
}

function jsonDeepEqualsArrays(valueA: JSONValue[], valueB: JSONValue[]): boolean {
    if (valueA.length !== valueB.length)
        return false;
    for (let i = 0; i < valueA.length; i++) {
        if (!jsonDeepEquals(valueA[i], valueB[i]))
            return false;
    }
    return true;
}

function jsonDeepEqualsObjects(valueA: { [key: string]: JSONValue; }, valueB: { [key: string]: JSONValue; }): boolean {
    const leftKeys = Object.keys(valueA);
    const rightKeys = Object.keys(valueB);
    if (leftKeys.length !== rightKeys.length)
        return false;
    for (const key of leftKeys) {
        if (!valueB.hasOwnProperty(key) || !jsonDeepEquals(valueA[key], valueB[key]))
            return false;
    }
    return true;
}
