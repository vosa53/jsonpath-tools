import { TextRange } from "./text/text-range";

export class Diagnostics {
    constructor(
        readonly severity: DiagnosticsSeverity,
        readonly message: string,
        readonly textRange: TextRange
    ) { }

    toString(): string {
        return `${this.severity} ${this.message} at ${this.textRange.position}:${this.textRange.length}`;
    }
}

export enum DiagnosticsSeverity {
    warning = "Warning",
    error = "Error"
}