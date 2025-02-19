import { CancellationToken, OperationCancelledError } from "./cancellation";

export class CancelToken implements CancellationToken {
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