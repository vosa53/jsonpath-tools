import { OperationCancelledError } from "./cancellation";
import { SharedArrayBufferCancellationToken } from "./shared-array-buffer-cancellation-token";

export class WebWorkerRPC<THandler> {
    private readonly messageTypeToHandlerActions = new Map<string, (handler: THandler, data: any, cancellationToken: SharedArrayBufferCancellationToken | undefined) => any>();
    private readonly messageIDToPromiseActions = new Map<string, { resolve: (data: any) => void, reject: (error: Error) => void }>();
    private readonly topicIDToHandlers = new Map<string, THandler>();

    constructor(private readonly send: (input: any) => void, private readonly handlerFactory: (topic: WebWorkerRPCTopic) => THandler) {

    }

    addHandlerAction<TData, TResult>(messageID: string, handler: (handler: THandler, data: TData, cancellationToken: SharedArrayBufferCancellationToken | undefined) => TResult) {
        this.messageTypeToHandlerActions.set(messageID, handler);
    }

    disposeHandler(topicID: string) {
        this.topicIDToHandlers.delete(topicID);
    }

    sendRequest<TData, TResponse>(type: string, topicID: string, data: TData, cancellationToken?: SharedArrayBufferCancellationToken): Promise<TResponse> {
        const message = this.sendMessage(type, topicID, data, cancellationToken);
        return new Promise((resolve, reject) => {
            this.messageIDToPromiseActions.set(message.id, { resolve, reject});
        });
    }

    sendNotification<TData>(type: string, topicID: string, data: TData, cancellationToken?: SharedArrayBufferCancellationToken): void {
        this.sendMessage(type, topicID, data, cancellationToken);
    }

    private sendMessage(type: string, topicID: string, data: any, cancellationToken?: SharedArrayBufferCancellationToken): JSONPathWorkerMessage {
        const message: JSONPathWorkerMessage = {
            type: type,
            id: crypto.randomUUID(),
            topicID: topicID,
            data: data,
            cancellationToken: cancellationToken?.buffer
        };
        this.send(message);
        return message;
    }

    private sendResponse(messageID: string, data: any) {
        const response: JSONPathWorkerMessageResponse = {
            id: messageID,
            data: data
        };
        this.send(response);
    }

    private sendOperationCancelledErrorResponse(messageID: string) {
        const response: JSONPathWorkerMessageResponse = {
            id: messageID,
            data: null,
            isCancelled: true
        };
        this.send(response);
    }

    receive(input: any) {
        const message = input as JSONPathWorkerMessage | JSONPathWorkerMessageResponse;
        const isResponse = !("type" in message);
        if (isResponse) {
            const promiseActions = this.messageIDToPromiseActions.get(message.id);
            if (promiseActions === undefined) throw new Error(`Received response for message that was not send (message ID '${message.id}').`);
            this.messageIDToPromiseActions.delete(message.id);
            if (message.isCancelled === true)
                promiseActions.reject(new OperationCancelledError());
            else
                promiseActions.resolve(message.data);
        }
        else {
            const cancellationToken = message.cancellationToken === undefined ? undefined : new SharedArrayBufferCancellationToken(message.cancellationToken);
            const handler = this.getOrCreateHandler(message.topicID);
            const handlerAction = this.messageTypeToHandlerActions.get(message.type);
            if (handlerAction === undefined) throw new Error(`No handler action for message type '${message.type}' (message ID '${message.id}').`);
            try {
                const result = handlerAction(handler, message.data, cancellationToken);
                if (result !== undefined)
                    this.sendResponse(message.id, result);
            }
            catch (error) {
                if (error instanceof OperationCancelledError)
                    this.sendOperationCancelledErrorResponse(message.id);
            }
        }
    }

    createHandler(): THandler {
        const uuid = crypto.randomUUID();
        return this.getOrCreateHandler(uuid);
    }

    private getOrCreateHandler(topicID: string): THandler {
        let handler = this.topicIDToHandlers.get(topicID);
        if (handler === undefined) {
            handler = this.handlerFactory(new WebWorkerRPCTopic(topicID, this));
            this.topicIDToHandlers.set(topicID, handler);
        }
        return handler;
    }
}

export class WebWorkerRPCTopic {
    constructor(private readonly topicID: string, private readonly rpc: WebWorkerRPC<any>) {

    }

    sendRequest<TData, TResponse>(type: string, data: TData, cancellationToken?: SharedArrayBufferCancellationToken): Promise<TResponse> {
        return this.rpc.sendRequest(type, this.topicID, data, cancellationToken);
    }

    sendNotification<TData>(type: string, data: TData, cancellationToken?: SharedArrayBufferCancellationToken): void {
        this.rpc.sendNotification(type, this.topicID, data, cancellationToken);
    }

    dispose() {
        this.rpc.disposeHandler(this.topicID);
    }
}

interface JSONPathWorkerMessage {
    readonly type: string;
    readonly id: string;
    readonly topicID: string;
    readonly data: any;
    readonly cancellationToken?: SharedArrayBuffer;
}

interface JSONPathWorkerMessageResponse {
    readonly id: string;
    readonly data: any;
    readonly isCancelled?: boolean;
}