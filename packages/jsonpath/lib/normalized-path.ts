/**
 * JSONPath query syntactically constrained in a way that each node corresponds to exactly one normalized path, and each normalized path leads to at most one node.
 * 
 * Practically it is an array of string and number segments, respectively property names and indices.
 */
export type NormalizedPath = readonly NormalizedPathSegment[];

/**
 * Segment of {@link NormalizedPath}. Property name or index.
 */
export type NormalizedPathSegment = string | number;