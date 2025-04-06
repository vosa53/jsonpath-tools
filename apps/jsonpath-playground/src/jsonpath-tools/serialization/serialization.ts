import { NormalizedPath } from "../normalized-path";

/**
 * Converts a string to a text representation.
 * @param value String value.
 * @param quotes Type of quotes that should be used.
 */
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

/**
 * Converts a number to a text representation.
 * @param value Number value.
 */
export function serializeNumber(value: number): string {
    return value.toString();
}

/**
 * Converts a boolean to a text representation.
 * @param value Boolean value.
 */
export function serializeBoolean(value: boolean) {
    return value ? "true" : "false";
}

/**
 * Converts a null to a text representation.
 */
export function serializeNull() {
    return "null";
}

/**
 * Converts a literal to a text representation.
 * @param value Literal value.
 * @param stringQuotes Type of string quotes that should be used.
 */
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

/**
 * Converts a normalized path to a text representation.
 * @param path Normalized path.
 */
export function serializedNormalizedPath(path: NormalizedPath): string {
    return "$" + path.map(ps => `[${serializeLiteral(ps, StringQuotes.single)}]`).join("");
}

/**
 * Type of string quotes.
 */
export enum StringQuotes {
    /**
     * Single.
     */
    single = "'",

    /**
     * Double.
     */
    double = "\""
}
