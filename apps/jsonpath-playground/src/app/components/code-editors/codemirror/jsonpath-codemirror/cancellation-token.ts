/**
 * Token to signal that an operation should be cancelled.
 */
export class CancellationToken {
    private _isCancelled = false;

    /**
     * Whether the cancellation is signalled.
     */
    get isCancelled() {
        return this._isCancelled;
    }

    /**
     * Throws {@link OperationCancelledError} when the cancellation is signalled.
     * @throws {@link OperationCancelledError} When the cancellation is signalled.
     */
    throwIfCancelled() {
        if (this.isCancelled)
            throw new OperationCancelledError();
    }

    /**
     * Signals the cancellation.
     */
    cancel() {
        this._isCancelled = true;
    }
}

/**
 * Error meaning that an operation was cancelled.
 */
export class OperationCancelledError extends Error { 
    constructor(message = "Operation was cancelled.") {
        super(message);
    }
}