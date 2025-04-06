import { JSONValue } from "./json-types";

/**
 * Checks whether the two given JSON values are deeply equal.
 * @param first First JSON value.
 * @param second Second JSON value.
 */
export function jsonDeepEquals(first: JSONValue, second: JSONValue): boolean {
    if (typeof first === "number" && typeof second === "number")
        return first === second;
    if (typeof first === "string" && typeof second === "string")
        return first === second;
    if (typeof first === "boolean" && typeof second === "boolean")
        return first === second;
    if (first === null && second === null)
        return true;
    if (Array.isArray(first) && Array.isArray(second))
        return jsonDeepEqualsArrays(first, second);
    if (typeof first === "object" && first !== null && !Array.isArray(first) && typeof second === "object" && second !== null && !Array.isArray(second))
        return jsonDeepEqualsObjects(first, second);
    return false;
}

function jsonDeepEqualsArrays(first: JSONValue[], second: JSONValue[]): boolean {
    if (first.length !== second.length)
        return false;
    for (let i = 0; i < first.length; i++) {
        if (!jsonDeepEquals(first[i], second[i]))
            return false;
    }
    return true;
}

function jsonDeepEqualsObjects(first: { [key: string]: JSONValue; }, second: { [key: string]: JSONValue; }): boolean {
    const leftKeys = Object.keys(first);
    const rightKeys = Object.keys(second);
    if (leftKeys.length !== rightKeys.length)
        return false;
    for (const key of leftKeys) {
        if (!second.hasOwnProperty(key) || !jsonDeepEquals(first[key], second[key]))
            return false;
    }
    return true;
}
