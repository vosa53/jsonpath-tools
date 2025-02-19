export class CancellationToken {
    private _isCancelled = false;

    get isCancelled() {
        return this._isCancelled;
    }

    throwIfCancelled() {
        if (this.isCancelled)
            throw new OperationCancelledError();
    }

    cancel() {
        this._isCancelled = true;
    }
}

export class OperationCancelledError extends Error { 
    constructor(message = "Operation was cancelled.") {
        super(message);
    }
}