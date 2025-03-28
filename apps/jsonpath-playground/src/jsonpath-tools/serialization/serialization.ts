import { NormalizedPath } from "../normalized-path";

export function serializeString(value: string, quotes = StringQuotes.double): string {
    let serialized = "";
    serialized += quotes;
    for (const character of value) {
        if (character === "\\" || character === quotes) serialized += "\\" + character;
        else if (character < "\u0020") {
            if (character === "\b") serialized += "\\b";
            else if (character === "\f") serialized += "\\f";
            else if (character === "\n") serialized += "\\n";
            else if (character === "\r") serialized += "\\r";
            else if (character === "\t") serialized += "\\t";
            else serialized += "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0");
        }
        else serialized += character;
    }
    serialized += quotes;
    return serialized;
}

export function serializeNumber(value: number): string {
    return value.toString();
}

export function serializeBoolean(value: boolean) {
    return value ? "true" : "false";
}

export function serializeNull() {
    return "null";
}

export function serializeLiteral(value: string | number | boolean | null, stringQuotes = StringQuotes.double) {
    if (typeof value === "string")
        return serializeString(value, stringQuotes);
    else if (typeof value === "number")
        return serializeNumber(value);
    else if (typeof value === "boolean")
        return serializeBoolean(value);
    else
        return serializeNull();
}

export function serializedNormalizedPath(path: NormalizedPath): string {
    return "$" + path.map(ps => `[${serializeLiteral(ps, StringQuotes.single)}]`).join("");
}

export enum StringQuotes {
    single = "'",
    double = "\""
}
