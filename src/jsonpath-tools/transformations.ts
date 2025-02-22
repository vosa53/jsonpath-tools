import { JSONPathJSONValue } from "./types";

type JSONPathNormalizedPath = (string | number)[];

export function replace(value: JSONPathJSONValue, paths: readonly JSONPathNormalizedPath[], replacement: JSONPathJSONValue): JSONPathJSONValue {
    if (paths.length === 0)
        return value;
    const sortedPaths = paths.toSorted(compareNormalizedPaths);
    return replaceRecursive(value, sortedPaths, replacement, 0, 0, sortedPaths.length);
}

function replaceRecursive(value: JSONPathJSONValue, paths: readonly JSONPathNormalizedPath[], replacement: JSONPathJSONValue, level: number, from: number, to: number): JSONPathJSONValue {
    if (paths[from].length === level)
        return replacement;
    else if (value !== null && typeof value === "object") {
        const newObject = Array.isArray(value) ? [...value] : { ...value };
        while (from < to) {
            const oldFrom = from;
            const propertyName = paths[from][level];
            while (from < to && paths[from][level] === propertyName)
                from++;
            if (Array.isArray(newObject)) {
                if (typeof propertyName === "number")
                    newObject[propertyName] = replaceRecursive(newObject[propertyName], paths, replacement, level + 1, oldFrom, from);
            }
            else {
                if (typeof propertyName === "string")
                    newObject[propertyName] = replaceRecursive(newObject[propertyName], paths, replacement, level + 1, oldFrom, from);
            }
        }
        return newObject;
    }
    else
        return value;
}

function compareNormalizedPaths(pathA: JSONPathNormalizedPath, pathB: JSONPathNormalizedPath): number {
    const minLength = Math.min(pathA.length, pathB.length);
    for (let i = 0; i < minLength; i++) {
        if (pathA[i] < pathB[i]) return -1;
        if (pathA[i] > pathB[i]) return 1;
    }
    return pathA.length < pathB.length ? -1 : (pathA.length > pathB.length ? 1 : 0);
}