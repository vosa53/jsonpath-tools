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