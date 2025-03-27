import { NormalizedPath } from "./normalized-path";
import { JSONValue } from "./json/json-types";

export function replaceAtPaths(value: JSONValue, paths: readonly NormalizedPath[], replacer: (value: JSONValue) => JSONValue | undefined): JSONValue {
    return replaceOrRemoveAtPaths(value, paths, replacer) as JSONValue;
}

export function removeAtPaths(value: JSONValue, paths: readonly NormalizedPath[]): JSONValue | undefined {
    return replaceOrRemoveAtPaths(value, paths, () => undefined) as JSONValue;
}

function replaceOrRemoveAtPaths(value: JSONValue, paths: readonly NormalizedPath[], replacer: (value: JSONValue) => JSONValue | undefined): JSONValue | undefined {
    if (paths.length === 0)
        return value;
    const sortedPaths = paths.toSorted(compareNormalizedPaths);
    return replaceOrRemoveAtPathsRecursive(value, sortedPaths, replacer, 0, 0, sortedPaths.length);
}

function replaceOrRemoveAtPathsRecursive(
    value: JSONValue, 
    paths: readonly NormalizedPath[], 
    replacer: (value: JSONValue) => JSONValue | undefined, 
    level: number, 
    from: number, 
    to: number
): JSONValue | undefined {
    const replaceCurrent = paths[from].length === level;
    while (from < to && paths[from].length === level) from++;

    let newValue: JSONValue | undefined = value;
    if (value !== null && typeof value === "object") {
        newValue = Array.isArray(value) ? [...value] : { ...value };
        let removedIndexCount = 0;
        while (from < to) {
            const oldFrom = from;
            const propertyName = paths[from][level];
            while (from < to && paths[from][level] === propertyName)
                from++;
            if (Array.isArray(newValue)) {
                if (typeof propertyName === "number") {
                    const result = replaceOrRemoveAtPathsRecursive(newValue[propertyName], paths, replacer, level + 1, oldFrom, from);
                    if (result === undefined)
                        removedIndexCount++;
                    else
                        newValue[propertyName - removedIndexCount] = result;
                }
            }
            else {
                if (typeof propertyName === "string") {
                    const result = replaceOrRemoveAtPathsRecursive(newValue[propertyName], paths, replacer, level + 1, oldFrom, from);
                    if (result === undefined)
                        delete newValue[propertyName];
                    else
                        newValue[propertyName] = result;
                }
            }
            if (removedIndexCount > 0 && Array.isArray(newValue)) {
                const boundary = from < to ? paths[from][level] as number : newValue.length;
                for (let i = propertyName as number + 1; i < boundary; i++)
                    newValue[i - removedIndexCount] = newValue[i];
            }
        }
        if (Array.isArray(newValue))
            newValue.length -= removedIndexCount;
    }
    if (replaceCurrent)
        newValue = replacer(newValue);
    return newValue;
}

function compareNormalizedPaths(pathA: NormalizedPath, pathB: NormalizedPath): number {
    const minLength = Math.min(pathA.length, pathB.length);
    for (let i = 0; i < minLength; i++) {
        if (typeof pathA[i] === "string" && typeof pathB[i] === "number") return -1;
        if (typeof pathA[i] === "number" && typeof pathB[i] === "string") return 1;
        if (pathA[i] < pathB[i]) return -1;
        if (pathA[i] > pathB[i]) return 1;
    }
    return pathA.length < pathB.length ? -1 : (pathA.length > pathB.length ? 1 : 0);
}