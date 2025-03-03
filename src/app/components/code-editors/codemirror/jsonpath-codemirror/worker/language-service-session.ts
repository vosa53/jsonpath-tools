import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-provider";
import { JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { CancellationToken } from "../cancellation-token";
import { GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse, GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse, GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse, GetSignatureLanguageServiceMessage, GetSignatureLanguageServiceMessageResponse, GetTooltipLanguageServiceMessage, GetTooltipLanguageServiceMessageResponse, SerializableJSONPathOptions, UpdateOptionsLanguageServiceMessage, UpdateQueryArgumentLanguageServiceMessage, UpdateQueryLanguageServiceMessage } from "./language-service-messages";
import { SimpleRPCTopic } from "./simple-rpc";
import { Signature } from "@/jsonpath-tools/editor-services/signature-provider";
import { Tooltip } from "@/jsonpath-tools/editor-services/tooltip-provider";


export class LanguageServiceSession {
    private cancellationToken = new CancellationToken();
    private taskQueue: Promise<any> = Promise.resolve();

    constructor(readonly rpcTopic: SimpleRPCTopic) { }

    updateOptions(newOptions: JSONPathOptions) {
        const serializableFunctions = Object.entries(newOptions.functions).map(([name, f]) => [
            name,
            {
                description: f.description,
                parameters: f.parameters,
                returnType: f.returnType
            }
        ]);
        const serializableNewOptions: SerializableJSONPathOptions = {
            functions: Object.fromEntries(serializableFunctions)
        };

        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateOptionsLanguageServiceMessage>("updateOptions", {
            newOptions: serializableNewOptions
        });
    }

    updateQuery(newQuery: string) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryLanguageServiceMessage>("updateQuery", {
            newQuery: newQuery
        });
    }

    updateQueryArgument(newQueryArgument: JSONPathJSONValue) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryArgumentLanguageServiceMessage>("updateQueryArgument", {
            newQueryArgument: newQueryArgument
        });
    }

    async getCompletions(position: number): Promise<readonly CompletionItem[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetCompletionsLanguageServiceMessage, GetCompletionsLanguageServiceMessageResponse>("getCompletions", {
            position: position
        }), this.cancellationToken);
        return response.completions;
    }

    async getSignature(position: number): Promise<Signature | null> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetSignatureLanguageServiceMessage, GetSignatureLanguageServiceMessageResponse>("getSignature", {
            position: position
        }), this.cancellationToken);
        return response.signature;
    }

    async getTooltip(position: number): Promise<Tooltip | null> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetTooltipLanguageServiceMessage, GetTooltipLanguageServiceMessageResponse>("getTooltip", {
            position: position
        }), this.cancellationToken);
        return response.tooltip;
    }

    async getDiagnostics(): Promise<readonly JSONPathDiagnostics[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetDiagnosticsLanguageServiceMessage, GetDiagnosticsLanguageServiceMessageResponse>("getDiagnostics", {
        }), this.cancellationToken);
        return response.diagnostics;
    }

    async getResult(): Promise<{ nodes: readonly JSONPathJSONValue[], paths: readonly (string | number)[][] }> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetResultLanguageServiceMessage, GetResultLanguageServiceMessageResponse>("getResult", {
        }), this.cancellationToken);
        return response;
    }

    dispose() {
        this.rpcTopic.sendNotification("disconnect", null);
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