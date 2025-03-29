export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue; };

export function getJSONType(value: JSONValue): JSONType {
    const javaScriptType = typeof value;
    if (javaScriptType == "object") {
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

export enum JSONType {
    string = "string",
    number = "number",
    boolean = "boolean",
    null = "null",
    object = "object",
    array = "array"
}