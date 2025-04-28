import { Diagnostics } from "@jsonpath-tools/jsonpath";
import { QueryOptions } from "@jsonpath-tools/jsonpath";
import { JSONValue } from "@jsonpath-tools/jsonpath";
import { CancellationToken } from "../cancellation-token";
import { GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse, GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse, GetDocumentHighlightsLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessageResponse, GetFormattingEditsLanguageServiceMessage, GetFormattingEditsLanguageServiceMessageResponse, GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse, GetSignatureLanguageServiceMessage, GetSignatureLanguageServiceMessageResponse, GetTooltipLanguageServiceMessage, GetTooltipLanguageServiceMessageResponse, ResolveCompletionLanguageServiceMessage, ResolveCompletionLanguageServiceMessageResponse, SerializableCompletionItem, SerializableFunction, SerializableQueryOptions, UpdateQueryOptionsLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, UpdateQueryArgumentTypeLanguageServiceMessage as UpdateQueryArgumentTypeLanguageServiceMessage, UpdateQueryLanguageServiceMessage, LanguageServiceMessageID } from "./language-service-messages";
import { SimpleRPCTopic } from "./simple-rpc";
import { Signature } from "@jsonpath-tools/jsonpath";
import { Tooltip } from "@jsonpath-tools/jsonpath";
import { DocumentHighlight } from "@jsonpath-tools/jsonpath";
import { TextChange } from "@jsonpath-tools/jsonpath";
import { DataType } from "@jsonpath-tools/jsonpath";
import { serializeDataType } from "./data-type-serializer";
import { NormalizedPath } from "@jsonpath-tools/jsonpath";

/**
 * Language service frontend session related to one editor instance.
 */
export class LanguageServiceSession {
    private cancellationToken = new CancellationToken();
    private taskQueue: Promise<any> = Promise.resolve();

    constructor(readonly rpcTopic: SimpleRPCTopic) { }

    updateQueryOptions(newQueryOptions: QueryOptions) {
        const serializableFunctions: [string, SerializableFunction][] = Object.entries(newQueryOptions.functions).map(([name, f]) => [
            name,
            {
                description: f.description,
                parameters: f.parameters.map(p => ({
                    name: p.name,
                    description: p.description,
                    type: p.type,
                    dataType: serializeDataType(p.dataType)
                })),
                returnType: f.returnType,
                returnDataType: serializeDataType(f.returnDataType)
            }
        ]);
        const serializableNewOptions: SerializableQueryOptions = {
            functions: Object.fromEntries(serializableFunctions)
        };

        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryOptionsLanguageServiceMessage>(LanguageServiceMessageID.updateQueryOptions, {
            newQueryOptions: serializableNewOptions
        });
    }

    updateQuery(newQuery: string) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryLanguageServiceMessage>(LanguageServiceMessageID.updateQuery, {
            newQuery: newQuery
        });
    }

    updateQueryArgument(newQueryArgument: JSONValue | undefined) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryArgumentLanguageServiceMessage>(LanguageServiceMessageID.updateQueryArgument, {
            newQueryArgument: newQueryArgument
        });
    }

    updateQueryArgumentType(newQueryArgumentType: DataType) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryArgumentTypeLanguageServiceMessage>(LanguageServiceMessageID.updateQueryArgumentType, {
            newQueryArgumentTypeSerialized: serializeDataType(newQueryArgumentType)
        });
    }

    async getCompletions(position: number): Promise<readonly SerializableCompletionItem[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse>(LanguageServiceMessageID.getCompletions, {
            position: position
        }), this.cancellationToken);
        return response.completions;
    }

    async resolveCompletion(index: number): Promise<string> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<ResolveCompletionLanguageServiceMessage, ResolveCompletionLanguageServiceMessageResponse>(LanguageServiceMessageID.resolveCompletion, {
            index: index
        }), this.cancellationToken);
        return response.description;
    }

    async getSignature(position: number): Promise<Signature | null> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetSignatureLanguageServiceMessage, GetSignatureLanguageServiceMessageResponse>(LanguageServiceMessageID.getSignature, {
            position: position
        }), this.cancellationToken);
        return response.signature;
    }

    async getDocumentHighlights(position: number): Promise<DocumentHighlight[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetDocumentHighlightsLanguageServiceMessage, GetDocumentHighlightsLanguageServiceMessageResponse>(LanguageServiceMessageID.getDocumentHighlights, {
            position: position
        }), this.cancellationToken);
        return response.documentHighlights;
    }

    async getTooltip(position: number): Promise<Tooltip | null> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetTooltipLanguageServiceMessage, GetTooltipLanguageServiceMessageResponse>(LanguageServiceMessageID.getTooltip, {
            position: position
        }), this.cancellationToken);
        return response.tooltip;
    }

    async getDiagnostics(): Promise<readonly Diagnostics[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse>(LanguageServiceMessageID.getDiagnostics, {
        }), this.cancellationToken);
        return response.diagnostics;
    }

    async getFormattingEdits(): Promise<readonly TextChange[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetFormattingEditsLanguageServiceMessage, GetFormattingEditsLanguageServiceMessageResponse>(LanguageServiceMessageID.getFormattingEdits, {
        }), this.cancellationToken);
        return response.formattingEdits;
    }

    async getResult(): Promise<{ nodes: readonly JSONValue[], paths: readonly NormalizedPath[] }> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse>(LanguageServiceMessageID.getResult, {
        }), this.cancellationToken);
        return response;
    }

    dispose() {
        this.rpcTopic.sendNotification(LanguageServiceMessageID.disconnect, null);
        this.rpcTopic.dispose();
    }

    private cancelQueue() {
        this.cancellationToken.cancel();
        this.cancellationToken = new CancellationToken();
        this.taskQueue = Promise.resolve();
    }

    private runInCancellableQueue<TResult>(task: () => Promise<TResult>, cancellationToken: CancellationToken): Promise<TResult> {
        const nextPromise = this.taskQueue.then(async () => {
            cancellationToken.throwIfCancelled();
            const result = await task();
            cancellationToken.throwIfCancelled();
            if (this.taskQueue === nextPromise) this.taskQueue = Promise.resolve();
            return result;
        });
        this.taskQueue = nextPromise;
        return nextPromise;
    }
}