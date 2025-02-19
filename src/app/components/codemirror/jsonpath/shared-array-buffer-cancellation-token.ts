import { CancellationToken, OperationCancelledError } from "./cancellation";

export class SharedArrayBufferCancellationToken implements CancellationToken {
    private readonly array: Int32Array;

    constructor(readonly buffer: SharedArrayBuffer = new SharedArrayBuffer(4)) {
        this.array = new Int32Array(buffer);
    }

    get isCancelled(): boolean {
        return Atomics.load(this.array, 0) === 1;
    }

    throwIfCancelled() {
        if (this.isCancelled)
            throw new OperationCancelledError();
    }

    cancel() {
        Atomics.store(this.array, 0, 1);
    }
}
