import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-provider";
import { DocumentHighlight } from "@/jsonpath-tools/editor-services/document-highlights-provider";
import { Signature } from "@/jsonpath-tools/editor-services/signature-provider";
import { Tooltip } from "@/jsonpath-tools/editor-services/tooltip-provider";
import { JSONPathFunction, JSONPathType } from "@/jsonpath-tools/options";
import { TextChange } from "@/jsonpath-tools/text-change";
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

export interface UpdateQueryArgumentSchemaLanguageServiceMessage {
    readonly newQueryArgumentSchema: JSONPathJSONValue | undefined;
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
    readonly diagnostics: readonly JSONPathDiagnostics[];
}

export interface GetFormattingEditsLanguageServiceMessage {

}

export interface GetFormattingEditsLanguageServiceMessageResponse {
    readonly formattingEdits: readonly TextChange[];
}

export interface GetResultLanguageServiceMessage {

}

export interface GetResultLanguageServiceMessageResponse {
    readonly nodes: readonly JSONPathJSONValue[];
    readonly paths: readonly (string | number)[][];
}

export interface DisconnectLanguageServiceMessage {

}

export type SerializableCompletionItem = Omit<CompletionItem, "resolveDescription">;

export interface SerializableJSONPathOptions {
    readonly functions: { [name: string]: SerializableJSONPathFunction };
}

export type SerializableJSONPathFunction = Omit<JSONPathFunction, "handler">;