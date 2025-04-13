import { Diagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-service";
import { DocumentHighlight } from "@/jsonpath-tools/editor-services/document-highlights-service";
import { Signature } from "@/jsonpath-tools/editor-services/signature-help-service";
import { Tooltip } from "@/jsonpath-tools/editor-services/tooltip-service";
import { NormalizedPath } from "@/jsonpath-tools/normalized-path";
import { QueryOptions } from "@/jsonpath-tools/options";
import { Function, FunctionParameter } from "@/jsonpath-tools/functions/function";
import { TextChange } from "@/jsonpath-tools/text/text-change";
import { JSONValue } from "@/jsonpath-tools/json/json-types";

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
    readonly newQueryArgument: JSONValue | undefined;
}

export interface UpdateQueryArgumentTypeLanguageServiceMessage {
    readonly newQueryArgumentTypeSerialized: any;
}

export interface GetCompletionsLanguageServiceMessage {
    readonly position: number;
}

export interface GetCompletionsLanguageServiceMessageResponse {
    readonly completions: readonly SerializableCompletionItem[];
}

export interface ResolveCompletionLanguageServiceMessage {
    readonly index: number;
}

export interface ResolveCompletionLanguageServiceMessageResponse {
    readonly description: string;
}

export interface GetSignatureLanguageServiceMessage {
    readonly position: number;
}

export interface GetSignatureLanguageServiceMessageResponse {
    readonly signature: Signature | null;
}

export interface GetDocumentHighlightsLanguageServiceMessage {
    readonly position: number;
}

export interface GetDocumentHighlightsLanguageServiceMessageResponse {
    readonly documentHighlights: DocumentHighlight[];
}

export interface GetTooltipLanguageServiceMessage {
    readonly position: number;
}

export interface GetTooltipLanguageServiceMessageResponse {
    readonly tooltip: Tooltip | null;
}

export interface GetDiagnosticsLanguageServiceMessage {

}

export interface GetDiagnosticsLanguageServiceMessageResponse {
    readonly diagnostics: readonly Diagnostics[];
}

export interface GetFormattingEditsLanguageServiceMessage {

}

export interface GetFormattingEditsLanguageServiceMessageResponse {
    readonly formattingEdits: readonly TextChange[];
}

export interface GetResultLanguageServiceMessage {

}

export interface GetResultLanguageServiceMessageResponse {
    readonly nodes: readonly JSONValue[];
    readonly paths: readonly NormalizedPath[];
}

export interface DisconnectLanguageServiceMessage {

}

export type SerializableCompletionItem = Omit<CompletionItem, "resolveDescription">;

export type SerializableJSONPathOptions = Omit<QueryOptions, "functions"> & {
    readonly functions: { [name: string]: SerializableJSONPathFunction };
}

export type SerializableJSONPathFunction = Omit<Function, "parameters" | "returnDataType" | "handler"> & {
    readonly parameters: readonly SerializableJSONPathFunctionParameter[];
    readonly returnDataType: any;
}

export type SerializableJSONPathFunctionParameter = Omit<FunctionParameter, "dataType"> & {
    readonly dataType: any;
}
