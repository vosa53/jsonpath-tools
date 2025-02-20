import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-provider";
import { JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";

export enum WorkerMessageType {
    updateOptions = "updateOptions",
    updateQuery = "updateQuery",
    updateQueryArgument = "updateQueryArgument",
    getCompletions = "getCompletions",
    getDiagnostics = "getDiagnostics",
    getResult = "getResult",
    disconnect = "disconnect"
}

export interface UpdateOptionsWorkerMessage {
    readonly newOptions: JSONPathOptions;
}

export interface UpdateQueryWorkerMessage {
    readonly newQuery: string;
}

export interface UpdateQueryArgumentWorkerMessage {
    readonly newQueryArgument: JSONPathJSONValue;
}

export interface GetCompletionsWorkerMessage {
    readonly position: number;
}

export interface GetCompletionsWorkerMessageResponse {
    readonly completions: readonly CompletionItem[];
}

export interface GetDiagnosticsWorkerMessage {

}

export interface GetDiagnosticsWorkerMessageResponse {
    readonly diagnostics: readonly JSONPathDiagnostics[];
}

export interface GetResultWorkerMessage {

}

export interface GetResultWorkerMessageResponse {
    readonly nodes: readonly JSONPathJSONValue[];
    readonly paths: readonly (string | number)[][];
}

export interface DisconnectWorkerMessage {

}