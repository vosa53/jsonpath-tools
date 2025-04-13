import { NormalizedPath } from "@/jsonpath-tools/normalized-path";

/**
 * Converts the given normalized path to JSON Pointer ([RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901)).
 * @param path Normalized path.
 */
export function normalizedPathToJSONPointer(path: NormalizedPath): string {
    // Escaping according to the JSON Pointer specification.
    const escapedSegments = path.map(s => s.toString().replace("~", "~0").replace("/", "~1"));
    return "/" + escapedSegments.join("/");
}