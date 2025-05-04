import { Diagnostics } from "@jsonpath-tools/jsonpath";
import { CompletionItem } from "@jsonpath-tools/jsonpath";
import { DocumentHighlight } from "@jsonpath-tools/jsonpath";
import { Signature } from "@jsonpath-tools/jsonpath";
import { Tooltip } from "@jsonpath-tools/jsonpath";
import { NormalizedPath } from "@jsonpath-tools/jsonpath";
import { QueryOptions } from "@jsonpath-tools/jsonpath";
import { Function, FunctionParameter } from "@jsonpath-tools/jsonpath";
import { TextChange } from "@jsonpath-tools/jsonpath";
import { JSONValue } from "@jsonpath-tools/jsonpath";

export enum LanguageServiceMessageID {
    updateQueryOptions = "updateQueryOptions",
    updateQuery = "updateQuery",
    updateQueryArgument = "updateQueryArgument",
    updateQueryArgumentType = "updateQueryArgumentType",
    getCompletions = "getCompletions",
    resolveCompletion = "resolveCompletion",
    getSignature = "getSignature",
    getDocumentHighlights = "getDocumentHighlights",
    getTooltip = "getTooltip",
    getDiagnostics = "getDiagnostics",
    getFormattingEdits = "getFormattingEdits",
    getResult = "getResult",
    disconnect = "disconnect"
}

export interface UpdateQueryOptionsLanguageServiceMessage {
    readonly newQueryOptions: SerializableQueryOptions;
}

export interface UpdateQueryLanguageServiceMessage {
    readonly queryTextChanges: readonly TextChange[];
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

export type GetDiagnosticsLanguageServiceMessage = object;

export interface GetDiagnosticsLanguageServiceMessageResponse {
    readonly diagnostics: readonly Diagnostics[];
}

export type GetFormattingEditsLanguageServiceMessage = object;

export interface GetFormattingEditsLanguageServiceMessageResponse {
    readonly formattingEdits: readonly TextChange[];
}

export type GetResultLanguageServiceMessage = object;

export interface GetResultLanguageServiceMessageResponse {
    readonly nodes: readonly JSONValue[];
    readonly paths: readonly NormalizedPath[];
}

export type DisconnectLanguageServiceMessage = object;

export type SerializableCompletionItem = Omit<CompletionItem, "resolveDescription">;

export type SerializableQueryOptions = Omit<QueryOptions, "functions"> & {
    readonly functions: { [name: string]: SerializableFunction };
}

export type SerializableFunction = Omit<Function, "parameters" | "returnDataType" | "handler"> & {
    readonly parameters: readonly SerializableFunctionParameter[];
    readonly returnDataType: any;
}

export type SerializableFunctionParameter = Omit<FunctionParameter, "dataType"> & {
    readonly dataType: any;
}
