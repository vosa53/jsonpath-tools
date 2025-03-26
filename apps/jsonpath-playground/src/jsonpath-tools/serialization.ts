export function serializeJSONPathString(value: string): string {
    // JSON strings are equivivalent with JSONPath strings.
    return JSON.stringify(value);
}

export function serializeJSONPathNumber(value: number): string {
    // JSON strings are equivivalent with JSONPath strings.
    return JSON.stringify(value);
}

export function serializeJSONPathBoolean(value: boolean) {
    return JSON.stringify(value);
}

export function serializeJSONPathLiteral(value: string | number | boolean | null) {
    return JSON.stringify(value);
}