import { JSONValue } from "@/jsonpath-tools/types";

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