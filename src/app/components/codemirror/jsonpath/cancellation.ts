export interface CancellationToken {
    readonly isCancelled: boolean;
    throwIfCancelled(): void;
    cancel(): void;
}

export class OperationCancelledError extends Error { 
    constructor(message = "Operation was cancelled.") {
        super(message);
    }
}