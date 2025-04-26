import { JSONValue } from "@jsonpath-tools/jsonpath";

/**
 * Validator checking whether the given text is a valid JSON. Additionally it can check also its stucture using {@link dataValidator}.
 * @param value Text.
 * @param dataValidator Validator for the JSON structure.
 * @returns Error text or `null` when the text is valid.
 */
export function isJSONString(value: string, dataValidator?: (value: JSONValue) => string | null): string | null {
    try {
        const parsedJSON = JSON.parse(value);
        if (dataValidator === undefined)
            return null;
        return dataValidator(parsedJSON);
    }
    catch (e) {
        return "Invalid JSON: " + e;
    }
}