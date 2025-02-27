import { JSONPathJSONValue } from "@/jsonpath-tools/types";

export interface Operation {
    readonly type: OperationType;
    readonly replacement: ReplaceOperationReplacement;
}

export enum OperationType {
    select = "select",
    replace = "replace",
    delete = "delete"
}

export interface ReplaceOperationReplacement {
    readonly replacement: JSONPathJSONValue;
    readonly replacementText: string;
}