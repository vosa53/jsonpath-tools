import { NormalizedPath } from "../normalized-path";

export function serializeString(value: string): string {
    // JSON strings are equivivalent with JSONPath strings.
    return JSON.stringify(value);
}

export function serializeNumber(value: number): string {
    // JSON strings are equivivalent with JSONPath strings.
    return JSON.stringify(value);
}

export function serializeBoolean(value: boolean) {
    return JSON.stringify(value);
}

export function serializeLiteral(value: string | number | boolean | null) {
    return JSON.stringify(value);
}

export function serializedNormalizedPath(path: NormalizedPath): string {
    return "$" + path.map(ps => `[${JSON.stringify(ps)}]`).join("");
}
