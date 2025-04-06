/**
 * Format for serialization of a path to text.
 */
export enum PathType {
    /**
     * JSONPath normalized path.
     */
    normalizedPath = "normalizedPath",

    /**
     * JSON Pointer ([RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901)).
     */
    jsonPointer = "jsonPointer",
}