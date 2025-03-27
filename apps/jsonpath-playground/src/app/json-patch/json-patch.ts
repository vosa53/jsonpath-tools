import { JSONValue } from "@/jsonpath-tools/types";
import { applyPatch, JsonPatchError, validate } from "fast-json-patch";

export function applyJSONPatch(data: JSONValue, patch: JSONPatch): JSONValue {
    try {
        return applyPatch(data, patch, true).newDocument;
    }
    catch (e) {
        if (e instanceof JsonPatchError)
            return data;
        else
            throw e;
    }
}

export function validateJSONPatch(patch: JSONValue): string | null {
    // @ts-ignore
    const error = validate(patch);
    return error === undefined ? null : error.message;
}

export type JSONPatch =
    (
        { op: "add", path: string, value: JSONValue } |
        { op: "remove", path: string } |
        { op: "replace", path: string, value: JSONValue } |
        { op: "move", path: string, from: string } |
        { op: "copy", path: string, from: string } |
        { op: "test", path: string, value: JSONValue }
    )[]
