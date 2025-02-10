import { TextRange } from "./text-range";

export class JSONPathDiagnostics {
    constructor(
        readonly type: JSONPathDiagnosticsType,
        readonly message: string,
        readonly textRange: TextRange
    ) { }
}

export enum JSONPathDiagnosticsType {
    warning = "Warning",
    error = "Error"
}