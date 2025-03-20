export interface Operation {
    readonly type: OperationType;
    readonly replacement: OperationReplacement;
}

export enum OperationType {
    select = "select",
    replace = "replace",
    delete = "delete"
}

export interface OperationReplacement {
    readonly type: OperationReplacementType;
    readonly jsonValueText: string;
    readonly jsonPatchText: string;
}

export enum OperationReplacementType {
    jsonValue = "jsonValue",
    jsonPatch = "jsonPatch"
}