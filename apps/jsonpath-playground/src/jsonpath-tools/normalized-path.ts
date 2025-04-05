/**
 * JSONPath query syntactically constrained in a way that each node corresponds to exactly one normalized path, and each normalized path leads to at most one node
 */
export type NormalizedPath = readonly NormalizedPathSegment[];

/**
 * Segment of {@link NormalizedPath}.
 */
export type NormalizedPathSegment = string | number;