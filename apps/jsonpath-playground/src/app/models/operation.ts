/**
 * Operation to be performed on the JSONPath query result.
 */
export interface Operation {
    /**
     * Type.
     */
    readonly type: OperationType;

    /**
     * How to replace values when {@link type} is {@link OperationType.replace}.
     */
    readonly replacement: OperationReplacement;
}

/**
 * Type of {@link Operation}.
 */
export enum OperationType {
    /**
     * Only select values.
     */
    select = "select",

    /**
     * Replace selected values.
     */
    replace = "replace",

    /**
     * Remove selected values.
     */
    delete = "delete"
}

/**
 * How to replace values.
 */
export interface OperationReplacement {
    /**
     * Type of replacing.
     */
    readonly type: OperationReplacementType;

    /**
     * Text of the JSON value used for the replacement when {@link type} is {@link OperationReplacementType.jsonValue}.
     */
    readonly jsonValueText: string;

    /**
     * Text of the JSON Patch used for the replacement when {@link type} is {@link OperationReplacementType.jsonPatch}.
     */
    readonly jsonPatchText: string;
}

/**
 * Logic used to replace values.
 */
export enum OperationReplacementType {
    /**
     * Replace a value with an another JSON value.
     */
    jsonValue = "jsonValue",

    /**
     * Replace a value using a JSON Patch ([RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902)) operations.
     */
    jsonPatch = "jsonPatch"
}