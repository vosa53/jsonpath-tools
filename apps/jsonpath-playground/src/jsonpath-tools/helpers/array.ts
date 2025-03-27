export interface PushOnlyArray<T> {
    push(...value: T[]): void;
    readonly [index: number]: T;
    readonly length: number;
}

export interface IndexOnlyArray<T> {
    readonly [index: number]: T;
    readonly length: number;
}
