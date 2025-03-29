import { TextRange } from "./text/text-range";

export class Diagnostics {
    constructor(
        readonly type: DiagnosticsType,
        readonly message: string,
        readonly textRange: TextRange
    ) { }

    toString(): string {
        return `${this.message} at ${this.textRange.position}:${this.textRange.length}`;
    }
}

export enum DiagnosticsType {
    warning = "Warning",
    error = "Error"
}