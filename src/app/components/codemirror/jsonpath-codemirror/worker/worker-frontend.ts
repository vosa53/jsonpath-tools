import { JSONPathDiagnostics } from "@/jsonpath-tools/diagnostics";
import { CompletionItem } from "@/jsonpath-tools/editor-services/completion-provider";
import { JSONPathOptions } from "@/jsonpath-tools/options";
import { JSONPathJSONValue } from "@/jsonpath-tools/types";
import { CancellationToken } from "../cancellation-token";
import { GetCompletionsWorkerMessage, GetCompletionsWorkerMessageResponse, GetDiagnosticsWorkerMessage, GetDiagnosticsWorkerMessageResponse, GetResultWorkerMessage, GetResultWorkerMessageResponse, UpdateOptionsWorkerMessage, UpdateQueryArgumentWorkerMessage, UpdateQueryWorkerMessage } from "./worker-messages";
import { WebWorkerRPCTopic, WorkerRPC } from "./worker-rpc";


export class WorkerFrontend {
    private static readonly worker = this.createWorker();
    private static readonly rpc = this.createRPC(this.worker);
    private cancellationToken = new CancellationToken();
    private taskQueue: Promise<any> = Promise.resolve();

    private constructor(private readonly rpcTopic: WebWorkerRPCTopic) { }

    static connectNew(): WorkerFrontend {
        return this.rpc.createHandler();
    }

    private static createWorker(): Worker {
        const worker = new Worker(new URL("./worker-script.ts", import.meta.url));
        return worker;
    }

    private static createRPC(worker: Worker): WorkerRPC<WorkerFrontend> {
        const rpc = new WorkerRPC<WorkerFrontend>(i => worker.postMessage(i), t => new WorkerFrontend(t));
        worker.addEventListener("message", e => rpc.receive(e.data));
        return rpc;
    }

    updateOption(newOptions: JSONPathOptions) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateOptionsWorkerMessage>("updateOptions", { 
            newOptions: newOptions 
        });
    }

    updateQuery(newQuery: string) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryWorkerMessage>("updateQuery", {
            newQuery: newQuery
        });
    }

    updateQueryArgument(newQueryArgument: JSONPathJSONValue) {
        this.cancelQueue();
        this.rpcTopic.sendNotification<UpdateQueryArgumentWorkerMessage>("updateQueryArgument", {
            newQueryArgument: newQueryArgument
        });
    }

    async getCompletions(position: number): Promise<readonly CompletionItem[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetCompletionsWorkerMessage, GetCompletionsWorkerMessageResponse>("getCompletions", {
            position: position
        }), this.cancellationToken);
        return response.completions;
    }

    async getDiagnostics(): Promise<readonly JSONPathDiagnostics[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetDiagnosticsWorkerMessage, GetDiagnosticsWorkerMessageResponse>("getDiagnostics", { 
        }), this.cancellationToken);
        return response.diagnostics;
    }

    async getResult(): Promise<readonly JSONPathJSONValue[]> {
        const response = await this.runInCancellableQueue(() => this.rpcTopic.sendRequest<GetResultWorkerMessage, GetResultWorkerMessageResponse>("getResult", {
        }), this.cancellationToken);
        return response.nodes;
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