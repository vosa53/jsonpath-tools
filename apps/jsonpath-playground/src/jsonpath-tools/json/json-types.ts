export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue; };

export function getJSONTypeName(value: JSONValue): string {
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

