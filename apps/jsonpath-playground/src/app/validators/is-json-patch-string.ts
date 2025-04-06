import { validateJSONPatch } from "../services/json-patch";
import { isJSONString } from "./is-json-string";

/**
 * Validator checking whether the given text is a valid JSON Patch.
 * @param value Text.
 * @returns Error text or `null` when the text is valid.
 */
export function isJSONPatchString(value: string): string | null {
    return isJSONString(value, v => {
        const error = validateJSONPatch(v);
        if (error === null)
            return null;
        else
            return "Invalid JSON Patch: " + error;
    });
}