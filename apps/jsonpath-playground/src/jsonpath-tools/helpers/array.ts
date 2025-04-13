/**
 * Array that can only be read and pushed into.
 */
export interface PushOnlyArray<T> {
    push(...value: T[]): void;
    readonly [index: number]: T;
    readonly length: number;
}

/**
 * Array that can only be read
 */
export interface IndexOnlyArray<T> {
    readonly [index: number]: T;
    readonly length: number;
}
