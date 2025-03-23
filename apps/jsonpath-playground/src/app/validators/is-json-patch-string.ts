import { validateJSONPatch } from "../json-patch/json-patch";
import { isJSONString } from "./is-json-string";

export function isJSONPatchString(value: string): string | null {
    return isJSONString(value, v => {
        const error = validateJSONPatch(v);
        if (error === null)
            return null;
        else
            return "Invalid JSON Patch: " + error;
    });
}