import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-provider";
import { JSONPathOptions, JSONPathType } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";

export enum LanguageServiceMessageType {
    updateOptions = "updateOptions",
    updateQuery = "updateQuery",
    updateQueryArgument = "updateQueryArgument",
    getCompletions = "getCompletions",
    getDiagnostics = "getDiagnostics",
    getResult = "getResult",
    disconnect = "disconnect"
}

export interface UpdateOptionsLanguageServiceMessage {
    readonly newOptions: SerializableJSONPathOptions;
}

export interface UpdateQueryLanguageServiceMessage {
    readonly newQuery: string;
}

export interface UpdateQueryArgumentLanguageServiceMessage {
    readonly newQueryArgument: JSONPathJSONValue;
}

export interface GetCompletionsLanguageServiceMessage {
    readonly position: number;
}

export interface GetCompletionsLanguageServiceMessageResponse {
    readonly completions: readonly CompletionItem[];
}

export interface GetDiagnosticsLanguageServiceMessage {

}

export interface GetDiagnosticsLanguageServiceMessageResponse {
    readonly diagnostics: readonly JSONPathDiagnostics[];
}

export interface GetResultLanguageServiceMessage {

}

export interface GetResultLanguageServiceMessageResponse {
    readonly nodes: readonly JSONPathJSONValue[];
    readonly paths: readonly (string | number)[][];
}

export interface DisconnectLanguageServiceMessage {

}

export interface SerializableJSONPathOptions {
    readonly functions: { [name: string]: SerializableJSONPathFunction };
}

export interface SerializableJSONPathFunction {
    parameterTypes: readonly JSONPathType[];
    returnType: JSONPathType;
}