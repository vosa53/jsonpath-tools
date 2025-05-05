/**
 * Any JSON value.
 */
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue; };

/**
 * Returns a type of the given JSON value.
 * @param value JSON value.
 */
export function getJSONType(value: JSONValue): JSONType {
    const javaScriptType = typeof value;
    if (javaScriptType === "object") {
        if (value === null)
            return JSONType.null;
        else if (Array.isArray(value))
            return JSONType.array;
        else
            return JSONType.object;
    }
    else
        return javaScriptType as JSONType;
}

/**
 * Type of a JSON value.
 */
export enum JSONType {
    string = "string",
    number = "number",
    boolean = "boolean",
    null = "null",
    object = "object",
    array = "array"
}