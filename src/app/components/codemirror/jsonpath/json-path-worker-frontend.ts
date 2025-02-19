import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-provider";
import { WebWorkerRPC, WebWorkerRPCTopic } from "./web-worker-rpc";
import { JSONPathOptions } from "@/jsonpath-tools/options";
import { GetCompletionsWorkerMessage, GetCompletionsWorkerMessageResponse, GetDiagnosticsWorkerMessage, GetDiagnosticsWorkerMessageResponse, GetResultWorkerMessage, GetResultWorkerMessageResponse, UpdateOptionsWorkerMessage, UpdateQueryArgumentWorkerMessage, UpdateQueryWorkerMessage } from "./worker-messages";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { SharedArrayBufferCancellationToken } from "./shared-array-buffer-cancellation-token";

export class JSONPathWorkerFrontend {
    private static readonly worker = this.createWorker();
    private static readonly rpc = this.createRPC(this.worker);
    private cancellationToken = new SharedArrayBufferCancellationToken();

    private constructor(private readonly rpcTopic: WebWorkerRPCTopic) { }

    static connectNew(): JSONPathWorkerFrontend {
        return this.rpc.createHandler();
    }

    private static createWorker(): Worker {
        const worker = new Worker(new URL("./jsonpath-worker.ts", import.meta.url));
        return worker;
    }

    private static createRPC(worker: Worker): WebWorkerRPC<JSONPathWorkerFrontend> {
        const rpc = new WebWorkerRPC<JSONPathWorkerFrontend>(i => worker.postMessage(i), t => new JSONPathWorkerFrontend(t));
        worker.addEventListener("message", e => rpc.receive(e.data));
        return rpc;
    }

    updateOption(newOptions: JSONPathOptions) {
        this.rpcTopic.sendNotification<UpdateOptionsWorkerMessage>("updateOptions", { 
            newOptions: newOptions 
        });
    }

    updateQuery(newQuery: string) {
        this.cancellationToken.cancel();
        this.cancellationToken = new SharedArrayBufferCancellationToken();
        this.rpcTopic.sendNotification<UpdateQueryWorkerMessage>("updateQuery", {
            newQuery: newQuery
        });
    }

    updateQueryArgument(newQueryArgument: JSONPathJSONValue) {
        this.rpcTopic.sendNotification<UpdateQueryArgumentWorkerMessage>("updateQueryArgument", {
            newQueryArgument: newQueryArgument
        });
    }

    async getCompletions(position: number): Promise<readonly CompletionItem[]> {
        const response = await this.rpcTopic.sendRequest<GetCompletionsWorkerMessage, GetCompletionsWorkerMessageResponse>("getCompletions", {
            position: position
        }, this.cancellationToken);
        return response.completions;
    }

    async getDiagnostics(): Promise<readonly JSONPathDiagnostics[]> {
        const response = await this.rpcTopic.sendRequest<GetDiagnosticsWorkerMessage, GetDiagnosticsWorkerMessageResponse>("getDiagnostics", { 
        }, this.cancellationToken);
        return response.diagnostics;
    }

    async getResult(): Promise<readonly JSONPathJSONValue[]> {
        const response = await this.rpcTopic.sendRequest<GetResultWorkerMessage, GetResultWorkerMessageResponse>("getResult", {
        }, this.cancellationToken);
        return response.nodes;
    }

    dispose() {
        this.rpcTopic.sendNotification("disconnect", null);
        this.rpcTopic.dispose();
    }
}