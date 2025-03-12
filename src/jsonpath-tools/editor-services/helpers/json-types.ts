import { JSONPathJSONValue } from "@/jsonpath-tools/types";

export function getJSONTypeName(value: JSONPathJSONValue): string {
    const javaScriptType = typeof value;
    if (javaScriptType == "object") {
        if (value === null)
            return "null";
        else if (Array.isArray(value))
            return "array";
        else
            return "object";
    }
    else
        return javaScriptType;
}