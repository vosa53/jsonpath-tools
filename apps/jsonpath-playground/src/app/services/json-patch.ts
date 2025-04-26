import { JSONValue } from "@jsonpath-tools/jsonpath";
import { applyPatch, JsonPatchError, validate } from "fast-json-patch";

/**
 * Applies the given JSON Patch document to the given JSON data.
 * 
 * Does not throw any errors. In the case of an error the input data is returned unchanged.
 * @param data JSON data.
 * @param patch JSON Patch document.
 */
export function applyJSONPatch(data: JSONValue, patch: JSONPatch): JSONValue {
    try {
        return applyPatch(data, patch, true, false).newDocument;
    }
    catch (e) {
        if (e instanceof JsonPatchError)
            return data;
        else
            throw e;
    }
}

/**
 * Validates the given JSON Patch document.
 * @param patch JSON Patch document.
 * @returns Error text when the document is invalid or `null` when the document is valid.
 */
export function validateJSONPatch(patch: JSONValue): string | null {
    // @ts-ignore
    const error = validate(patch);
    return error === undefined ? null : error.message;
}

/**
 * JSON Patch document.
 */
export type JSONPatch =
    (
        { op: "add", path: string, value: JSONValue } |
        { op: "remove", path: string } |
        { op: "replace", path: string, value: JSONValue } |
        { op: "move", path: string, from: string } |
        { op: "copy", path: string, from: string } |
        { op: "test", path: string, value: JSONValue }
    )[]
