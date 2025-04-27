import { logPerformance } from "../../../../shared/utils";

/**
 * Simple RPC intended primarily for web workers.
 */
export class SimpleRPC<THandler> {
    private readonly messageTypeToHandlerActions = new Map<string, (handler: THandler, data: any) => any>();
    private readonly messageIDToPromiseActions = new Map<string, { resolve: (data: any) => void, reject: (error: Error) => void }>();
    private readonly topicIDToHandlers = new Map<string, THandler>();

    /**
     * @param send Callback that sends a given data.
     * @param handlerFactory Callback that creates a new instance of the handler from the given topic.
     */
    constructor(
        private readonly send: (data: any) => void, 
        private readonly handlerFactory: (topic: SimpleRPCTopic) => THandler
    ) {
        this.send = (data: any) => logPerformance("Sending worker message: " + data.type, () => send(data));
    }

    /**
     * Registers the handler action for the given message ID.
     * @param messageID Message ID.
     * @param handler Handler action.
     */
    registerHandlerAction<TData, TResult>(messageID: string, handler: (handler: THandler, data: TData) => TResult) {
        this.messageTypeToHandlerActions.set(messageID, handler);
    }

    /** 
     * @internal 
     */
    disposeHandler(topicID: string) {
        this.topicIDToHandlers.delete(topicID);
    }

    /** 
     * @internal 
     */
    sendRequest<TData, TResponse>(type: string, topicID: string, data: TData): Promise<TResponse> {
        const message = this.sendMessage(type, topicID, data);
        return new Promise((resolve, reject) => {
            this.messageIDToPromiseActions.set(message.id, { resolve, reject});
        });
    }

    /** 
     * @internal 
     */
    sendNotification<TData>(type: string, topicID: string, data: TData): void {
        this.sendMessage(type, topicID, data);
    }

    private sendMessage(type: string, topicID: string, data: any): SimpleRPCMessage {
        const message: SimpleRPCMessage = {
            type: type,
            id: crypto.randomUUID(),
            topicID: topicID,
            data: data
        };
        this.send(message);
        return message;
    }

    private sendResponse(messageID: string, data: any) {
        const response: SimpleRPCMessageResponse = {
            id: messageID,
            data: data
        };
        this.send(response);
    }

    /**
     * Receives the given data.
     * @param data Data.
     */
    receive(data: any) {
        const message = data as SimpleRPCMessage | SimpleRPCMessageResponse;
        const isResponse = !("type" in message);
        if (isResponse) {
            const promiseActions = this.messageIDToPromiseActions.get(message.id);
            if (promiseActions === undefined) throw new Error(`Received response for message that was not send (message ID '${message.id}').`);
            this.messageIDToPromiseActions.delete(message.id);
            promiseActions.resolve(message.data);
        }
        else {
            const handler = this.getOrCreateHandler(message.topicID);
            const handlerAction = this.messageTypeToHandlerActions.get(message.type);
            if (handlerAction === undefined) throw new Error(`No handler action for message type '${message.type}' (message ID '${message.id}').`);
            const result = handlerAction(handler, message.data);
            if (result !== undefined)
                this.sendResponse(message.id, result);
        }
    }

    /**
     * Creates a new handler.
     */
    createHandler(): THandler {
        const uuid = crypto.randomUUID();
        return this.getOrCreateHandler(uuid);
    }

    private getOrCreateHandler(topicID: string): THandler {
        let handler = this.topicIDToHandlers.get(topicID);
        if (handler === undefined) {
            handler = this.handlerFactory(new SimpleRPCTopic(topicID, this));
            this.topicIDToHandlers.set(topicID, handler);
        }
        return handler;
    }
}

/**
 * Communication channel of the {@link SimpleRPC}.
 */
export class SimpleRPCTopic {
    /**
     * @param topicID ID of the topic. 
     * @param rpc Simple RPC instance containing this topic.
     */
    constructor(
        private readonly topicID: string, 
        private readonly rpc: SimpleRPC<any>
    ) { }

    /**
     * Sends a request (message expecting a response).
     * @param type Type.
     * @param data Data.
     * @returns Response.
     */
    sendRequest<TData, TResponse>(type: string, data: TData): Promise<TResponse> {
        return this.rpc.sendRequest(type, this.topicID, data);
    }

    /**
     * Sends a notification (message not expecting a response).
     * @param type Type.
     * @param data Data.
     */
    sendNotification<TData>(type: string, data: TData): void {
        this.rpc.sendNotification(type, this.topicID, data);
    }

    /**
     * Closes the topic.
     */
    dispose() {
        this.rpc.disposeHandler(this.topicID);
    }
}

interface SimpleRPCMessage {
    readonly type: string;
    readonly id: string;
    readonly topicID: string;
    readonly data: any;
}

interface SimpleRPCMessageResponse {
    readonly id: string;
    readonly data: any;
}